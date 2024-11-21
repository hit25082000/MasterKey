import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingOverlayComponent } from '../app/shared/components/loading-overlay/loading-overlay.component';
import { NotificationService } from './shared/services/notification.service';
import { NotificationsComponent } from './shared/components/notification/notification.component';
import { WhatsAppStatusWidgetComponent } from './features/chat/components/whats-app-status-widget/whats-app-status-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    LoadingOverlayComponent,
    NotificationsComponent,
    WhatsAppStatusWidgetComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  notificationService = inject(NotificationService)
  title = 'master-key'
  constructor() {
  }
}
