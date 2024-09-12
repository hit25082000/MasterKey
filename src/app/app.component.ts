import { Component } from '@angular/core';
import { NotificationService } from './shared/components/notification/notification.service';
import { NotificationComponent } from './shared/components/notification/notification.component';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { NotificationType } from './shared/components/notification/notifications-enum';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NotificationComponent, RouterOutlet, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [NotificationService],
})
export class AppComponent {
  notificationVisible = false;

  constructor(public notificationService: NotificationService) {
    this.notificationService.notification$.subscribe(
      (notification: unknown) => {
        this.notificationVisible = !!notification;
      }
    );

    this.notificationService.showNotification(
      'Sistema iniciado com sucesso!',
      NotificationType.SUCCESS
    );
  }
}
