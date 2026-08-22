import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { AppNotification } from '../models/notification.model';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class NotificationWebSocketService {

  private client: Client | null = null;

  connect(
    userCd: number,
    roleCd: number,
    onNotification: (notification: AppNotification) => void
  ): void {

    // Prevent multiple connections
    if (this.client?.active) {
      return;
    }

    const destination =
      roleCd === 5
        ? `/topic/notification/farmer/${userCd}`
        : roleCd === 2
          ? `/topic/notification/admin/${roleCd}`
          : null;

    if (!destination) {
      console.error('Unsupported role:', roleCd);
      return;
    }

    this.client = new Client({

      brokerURL: environment.brokerURL,

      reconnectDelay: 5000,

      debug: (message) => {
        console.log('[STOMP]', message);
      }
    });

    this.client.onConnect = () => {

      console.log(
        'WebSocket connected:',
        destination
      );

      this.client?.subscribe(
        destination,
        (message: IMessage) => {

          console.log(
            'WebSocket notification received:',
            message.body
          );

          try {

            const notification =
              JSON.parse(message.body) as AppNotification;

            onNotification(notification);

          } catch (error) {

            console.error(
              'Invalid notification JSON:',
              error
            );

          }
        }
      );
    };

    this.client.onStompError = (frame) => {

      console.error(
        'STOMP error:',
        frame.headers['message'],
        frame.body
      );
    };

    this.client.onWebSocketError = (error) => {

      console.error(
        'WebSocket error:',
        error
      );
    };

    this.client.onDisconnect = () => {

      console.log(
        'WebSocket disconnected'
      );
    };

    this.client.activate();
  }

  disconnect(): void {

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }
}