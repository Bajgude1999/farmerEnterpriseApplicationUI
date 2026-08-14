export type NotificationCategory = 'ORDER' | 'STOCK';

export interface AppNotification {
  notificationId: number;
  category: NotificationCategory;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  notiRecipientId:number;
  routeLink:string;
}