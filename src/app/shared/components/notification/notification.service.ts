import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NotificationType } from './notifications-enum';

interface Notification {
  message: string;
  type: NotificationType;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<Notification | null>(null);
  notification$ = this.notificationSubject.asObservable();

  showNotification(
    message: string,
    type: NotificationType = NotificationType.INFO
  ) {
    this.notificationSubject.next({ message, type });

    // Esconde a notificação após 5 segundos
    setTimeout(() => {
      this.hideNotification();
    }, 5000);
  }

  hideNotification() {
    this.notificationSubject.next(null);
  }
}
