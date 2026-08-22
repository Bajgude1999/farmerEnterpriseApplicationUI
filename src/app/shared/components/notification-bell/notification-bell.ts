import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslatePipe } from '@ngx-translate/core';
import { AppNotification, NotificationCategory } from '../../../core/models/notification.model';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';
import { NotificationWebSocketService } from '../../../core/services/notification-websocket.service';
import { AuthService } from '../../../core/services/ auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatMenuModule, MatBadgeModule, MatTabsModule, TranslatePipe],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
  encapsulation: ViewEncapsulation.None,
})
export class NotificationBell implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationWebSocketService = inject(NotificationWebSocketService);
  private toastService = inject(ToastService);

  notifications = signal<AppNotification[]>([]);
  activeTab = signal<'ALL' | NotificationCategory>('ALL');

  unreadCount = computed(() => this.notifications().filter((n) => !n.isRead).length);
  userCd: number | null = null;

  filtered = computed(() => {
    const tab = this.activeTab();
    if (tab === 'ALL') return this.notifications();
    return this.notifications().filter((n) => n.category === tab);
  });

  @ViewChild(MatMenuTrigger)
  menuTrigger!: MatMenuTrigger;

  ngOnInit(): void {
    if (this.authService.hasValidSession()) {
      this.load();
      this.connectWebSocket();
      this.requestNotificationPermission();
    } else {
      this.notifications.set([]);
      this.notificationWebSocketService.disconnect();
    }
  }

  ngOnDestroy(): void {
    this.notificationWebSocketService.disconnect();
  }

  private showNotificationPopup(notification: AppNotification): void {
    this.toastService.info(notification.message);
    this.showBrowserNotification(notification);
  }

  private connectWebSocket(): void {
    if (!this.authService.hasValidSession()) {
      return;
    }

    const user = this.authService.currentUser();
    if (!user) {
      return;
    }

    const userCd = Number(user.userCd);
    const roleCd = Number(user.roleCd);

    if (!userCd || !roleCd) {
      return;
    }

    this.userCd = userCd;

    this.notificationWebSocketService.connect(userCd, roleCd, (notification: AppNotification) => {
      this.notifications.update((list) => [notification, ...list]);
      this.showNotificationPopup(notification);
    });
  }

  private showBrowserNotification(notification: AppNotification): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/icons/notification.png',
        tag: `notification-${notification.notiRecipientId}`,
      });

      browserNotification.onclick = () => {
        window.focus();
        if (notification.routeLink) {
          this.router.navigateByUrl(notification.routeLink);
        }
        browserNotification.close();
      };
    }
  }

  markAllRead(): void {
    if (!this.userCd) return;

    this.notificationService.markAllRead(this.userCd).subscribe({
      next: () => {
        this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
        this.notifications.set([]);
      },
      error: (err) => console.error('Failed to mark all as read', err),
    });
  }

  priorityClassFor(notification: AppNotification): string {
    switch (notification.priority) {
      case 'HIGH':
        return 'notification-bell__priority--high';
      case 'MEDIUM':
        return 'notification-bell__priority--medium';
      default:
        return 'notification-bell__priority--low';
    }
  }

  deleteNotification(notification: AppNotification, event: Event): void {
    event.stopPropagation();

    this.notificationService.delete(notification.notiRecipientId).subscribe({
      next: () => {
        this.notifications.update((list) =>
          list.filter((n) => n.notiRecipientId !== notification.notiRecipientId)
        );
      },
      error: (err) => console.error('Failed to delete notification', err),
    });
  }

  deleteAll(): void {
    if (!this.userCd) return;

    this.notificationService.deleteAll(this.userCd).subscribe({
      next: () => {
        this.notifications.set([]);
      },
      error: (err) => console.error('Failed to delete all notifications', err),
    });
  }

  private requestNotificationPermission(): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  load(): void {
    if (!this.authService.hasValidSession()) {
      this.notifications.set([]);
      return;
    }

    const user = this.authService.currentUser();
    if (!user) {
      this.notifications.set([]);
      return;
    }

    const userCd = Number(user.userCd);
    const roleCd = Number(user.roleCd);

    if (!userCd || !roleCd) {
      this.notifications.set([]);
      return;
    }

    this.userCd = userCd;

    this.notificationService.getAll(userCd, roleCd).subscribe({
      next: (list) => {
        this.notifications.set(list || []);
      },
      error: (err) => {
        console.error('Failed to load notifications', err);
        this.notifications.set([]);
      },
    });
  }

  setTab(tab: 'ALL' | NotificationCategory): void {
    this.activeTab.set(tab);
  }

  markRead(notification: AppNotification): void {
    if (notification.isRead) {
      return;
    }

    this.notificationService.markRead(notification.notiRecipientId).subscribe({
      next: () => {
        this.notifications.update((list) =>
          list.map((n) =>
            n.notiRecipientId === notification.notiRecipientId
              ? { ...n, isRead: true }
              : n
          )
        );
      },
      error: (err) => {
        console.error('Failed to mark notification as read', err);
      },
    });
  }

  timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    return `${Math.floor(diffHr / 24)} day ago`;
  }

  onNotificationClick(notification: AppNotification): void {
    if (!notification.isRead) {
      this.notificationService.markRead(notification.notiRecipientId).subscribe({
        next: () => {
          this.notifications.update((list) =>
            list.filter((n) => n.notiRecipientId !== notification.notiRecipientId)
          );
          if (this.menuTrigger) {
            this.menuTrigger.closeMenu();
          }
          if (notification.routeLink) {
            this.router.navigateByUrl(notification.routeLink);
          }
        },
        error: (err) => {
          console.error('Failed to mark notification as read', err);
        },
      });
    } else {
      if (this.menuTrigger) {
        this.menuTrigger.closeMenu();
      }
      if (notification.routeLink) {
        this.router.navigateByUrl(notification.routeLink);
      }
    }
  }
}