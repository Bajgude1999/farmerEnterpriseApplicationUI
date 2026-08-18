export type NotificationCategory = 'ORDER' | 'STOCK';
export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AppNotification {
  notiId: number;
  notiRecipientId: number;
  category: string;
  transactionName?: string;
  notificationType?: string;
  title: string;
  message: string;
  remark?: string;
  routeLink: string;
  primaryKey?: number;
  farmerCd?: number;
  status?: string;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string;
  completedAt?: string;
}