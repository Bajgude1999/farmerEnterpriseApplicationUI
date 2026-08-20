import { Component, OnInit, ViewChild, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslatePipe } from '@ngx-translate/core';
import { AppNotification, NotificationCategory } from '../../../core/models/notification.model';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';
import { NotificationWebSocketService }from '../../../core/services/notification-websocket.service';
import {
  MatSnackBar,
  MatSnackBarModule
} from '@angular/material/snack-bar';
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatMenuModule, MatBadgeModule, MatTabsModule, TranslatePipe,MatSnackBarModule],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
    encapsulation: ViewEncapsulation.None,

})
export class NotificationBell implements OnInit {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
private notificationWebSocketService =
  inject(NotificationWebSocketService);
  private snackBar = inject(MatSnackBar);
  notifications = signal<AppNotification[]>([]);
  activeTab = signal<'ALL' | NotificationCategory>('ALL');

  unreadCount = computed(() => this.notifications().filter((n) => !n.isRead).length);
  userCd:any;
  filtered = computed(() => {
    const tab = this.activeTab();
    if (tab === 'ALL') return this.notifications();
    return this.notifications().filter((n) => n.category === tab);
  });

  ngOnInit(): void {
    this.load();
      this.connectWebSocket();
      this.requestNotificationPermission();

  }
  private showNotificationPopup(
  notification: AppNotification
): void {

  this.snackBar.open(
    notification.message,
    'VIEW',
    {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    }
  );
    this.showBrowserNotification(notification);

}
  private connectWebSocket(): void {

  const userJson =
    localStorage.getItem('fp_auth_user');

  if (!userJson) {

    console.warn(
      'fp_auth_user not found'
    );

    return;
  }

  try {

    const user = JSON.parse(userJson);

    const userCd = Number(user.userId);
    const roleCd = Number(user.roleCd);

    console.log(
      'Logged-in user:',
      user
    );

    console.log(
      'userCd:',
      userCd,
      'roleCd:',
      roleCd
    );

    if (!userCd || !roleCd) {

      console.error(
        'Invalid userCd or roleCd'
      );

      return;
    }

    this.userCd = userCd;

    this.notificationWebSocketService.connect(
      userCd,
      roleCd,
      (notification: AppNotification) => {

        console.log(
          'NEW REAL-TIME NOTIFICATION:',
          notification
        );

        // Add notification at top
        this.notifications.update(
          list => [
            notification,
            ...list
          ]
        );
         // Show popup
        this.showNotificationPopup(
          notification
        );
     //   this.showBrowserNotification(notification);

      }
    );

  } catch (error) {

    console.error(
      'Invalid fp_auth_user:',
      error
    );

  }
}
private showBrowserNotification(
  notification: AppNotification
): void {

  if (!('Notification' in window)) {
    console.log('Browser notifications are not supported');
    return;
  }

  if (Notification.permission === 'granted') {

    const browserNotification = new Notification(
      notification.title,
      {
        body: notification.message,
        icon: '/assets/icons/notification.png',
        tag: `notification-${notification.notiRecipientId}`
      }
    );

    browserNotification.onclick = () => {

      window.focus();

      this.router.navigateByUrl(
        notification.routeLink
      );

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
  event.stopPropagation(); // prevent triggering onNotificationClick's mark-read/navigate

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

  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'default') {

    Notification.requestPermission().then(permission => {

      console.log(
        'Notification permission:',
        permission
      );

    });

  }
}
load(): void {
  const userJson = localStorage.getItem('fp_auth_user');
    this.notifications.set([]);
  if (!userJson) {
    this.notifications.set([]);
    return;
  }

  try {
    const user = JSON.parse(userJson);
    this.userCd=user.userId;
    this.notificationService.getAll(user.userId, user.roleCd).subscribe({
  next: (list) => this.notifications.set(list),
  error: (err) => {
    console.error('Failed to load notifications', err);
    this.notifications.set([]);
  }
});

  } catch (err) {
    console.error('Invalid fp_auth_user data', err);
    this.notifications.set([]);
  }
}
  setTab(tab: 'ALL' | NotificationCategory): void {
    this.activeTab.set(tab);
  }

 markRead(notification: AppNotification): void {
  console.log('CLICKED NOTIFICATION:', notification);

  if (notification.isRead) {
    return;
  }

  const userJson = localStorage.getItem('fp_auth_user');

  if (!userJson) {
    return;
  }

  const user = JSON.parse(userJson);

  this.notificationService
    .markRead(
      notification.notiRecipientId    )
    .subscribe({
      next: () => {

        this.notifications.update((list) =>
          list.map((n) =>
            n.notiRecipientId === notification.notiRecipientId
              ? {
                  ...n,
                  isRead: true
                }
              : n
          )
        );

      },

      error: (err) => {
        console.error(
          'Failed to mark notification as read',
          err
        );
      }
    });
}
  iconFor(category: NotificationCategory): string {
    return category === 'ORDER' ? 'lens' : 'lens';
  }

  dotClassFor(notification: AppNotification): string {
    // Blue for "confirmed/updated" style events, green for "new" events — matches the mockup.
    return notification.title.toLowerCase().includes('new') ? 'notification-bell__dot--green' : 'notification-bell__dot--blue';
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
  @ViewChild(MatMenuTrigger)
menuTrigger!: MatMenuTrigger;
  onNotificationClick(notification: AppNotification): void {

  if (!notification.isRead) {

    this.notificationService
      .markRead(
        notification.notiRecipientId
      )
      .subscribe({
        next: () => {

          this.notifications.update((list) =>
          list.map((n) =>
            n.notiRecipientId === notification.notiRecipientId
              ? {
                  ...n,
                  isRead: true
                }
              : n
          )
        );
           // Hide/remove notification immediately
        this.notifications.update(list =>
          list.filter(
            n => n.notiRecipientId !== notification.notiRecipientId
          )
        );
         // Close notification popup first
    this.menuTrigger.closeMenu();

          this.router.navigateByUrl(
            notification.routeLink
          );
        },
        error: (err) => {
          console.error(
            'Failed to mark notification as read',
            err
          );
        }
      });

  } else {

    this.router.navigateByUrl(
      notification.routeLink
    );
  }
 }
}