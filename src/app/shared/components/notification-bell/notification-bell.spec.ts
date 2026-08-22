import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { NotificationBell } from './notification-bell';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationWebSocketService } from '../../../core/services/notification-websocket.service';
import { AuthService } from '../../../core/services/ auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('NotificationBell', () => {
  let component: NotificationBell;
  let notificationServiceMock: {
    getAll: ReturnType<typeof vi.fn>;
    markRead: ReturnType<typeof vi.fn>;
    markAllRead: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    deleteAll: ReturnType<typeof vi.fn>;
  };
  let notificationWebSocketServiceMock: {
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };
  let authServiceMock: {
    hasValidSession: ReturnType<typeof vi.fn>;
    currentUser: ReturnType<typeof vi.fn>;
  };
  let toastServiceMock: {
    info: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    navigateByUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    notificationServiceMock = {
      getAll: vi.fn().mockReturnValue(
        of([
          {
            notiRecipientId: 1,
            title: 'Order Confirmed',
            message: 'Your order #ORD-123 is confirmed',
            priority: 'HIGH',
            category: 'ORDER',
            isRead: false,
            createdAt: '2026-08-21T12:00:00Z',
          },
        ])
      ),
      markRead: vi.fn().mockReturnValue(of({})),
      markAllRead: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({})),
      deleteAll: vi.fn().mockReturnValue(of({})),
    };
    notificationWebSocketServiceMock = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    authServiceMock = {
      hasValidSession: vi.fn().mockReturnValue(true),
      currentUser: vi.fn().mockReturnValue({
        userCd: 55,
        fullName: 'Ramesh Patil',
        roleCd: 5,
      }),
    };
    toastServiceMock = {
      info: vi.fn(),
    };
    routerMock = {
      navigateByUrl: vi.fn(),
    };

    const injector = Injector.create({
      providers: [
        { provide: NotificationBell, useClass: NotificationBell },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: NotificationWebSocketService, useValue: notificationWebSocketServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    component = injector.get(NotificationBell);
  });

  it('should load notifications and connect WebSocket for authenticated user', () => {
    component.ngOnInit();

    expect(notificationServiceMock.getAll).toHaveBeenCalledWith(55, 5);
    expect(notificationWebSocketServiceMock.connect).toHaveBeenCalledWith(55, 5, expect.any(Function));
    expect(component.unreadCount()).toBe(1);
  });

  it('should not call notification APIs or connect WebSocket for guest user', () => {
    authServiceMock.hasValidSession.mockReturnValue(false);
    authServiceMock.currentUser.mockReturnValue(null);

    component.ngOnInit();

    expect(notificationServiceMock.getAll).not.toHaveBeenCalled();
    expect(notificationWebSocketServiceMock.connect).not.toHaveBeenCalled();
    expect(notificationWebSocketServiceMock.disconnect).toHaveBeenCalled();
    expect(component.unreadCount()).toBe(0);
  });
});
