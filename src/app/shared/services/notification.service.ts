import { Injectable, signal } from '@angular/core';

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info'
}

export interface NotificationMessage {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = signal<NotificationMessage[]>([]);
  public activeNotifications = this.notifications.asReadonly();

  show(message: string, type: NotificationType = NotificationType.INFO, duration: number = 5000) {
    const notification: NotificationMessage = {
      id: crypto.randomUUID(),
      message,
      type,
      duration
    };

    this.notifications.update(notifications => [...notifications, notification]);

    if (duration > 0) {
      setTimeout(() => this.hide(notification.id), duration);
    }
  }

  hide(id: string) {
    this.notifications.update(notifications =>
      notifications.filter(notification => notification.id !== id)
    );
  }

  success(message: string, duration?: number) {
    this.show(message, NotificationType.SUCCESS, duration);
  }

  error(message: string, duration?: number) {
    this.show(message, NotificationType.ERROR, duration);
  }

  info(message: string, duration?: number) {
    this.show(message, NotificationType.INFO, duration);
  }
}
