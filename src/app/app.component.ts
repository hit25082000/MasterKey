import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingOverlayComponent } from '../app/shared/components/loading-overlay/loading-overlay.component';
import { ChatComponent } from './features/chat/components/chat-modal/chat.component';
import { NotificationService, NotificationType } from './shared/services/notification.service';
import { NotificationsComponent } from './shared/components/notification/notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    LoadingOverlayComponent,
    ChatComponent,
    NotificationsComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  notificationService = inject(NotificationService)

  constructor() {
    this.notificationService.success('Operação realizada com sucesso!');
    this.notificationService.error('Ocorreu um erro!');
    this.notificationService.info('Informação importante');

    // Método personalizado
    this.notificationService.show(
      'Mensagem personalizada',
      NotificationType.SUCCESS,
      8000 // duração em ms
    );
  }
}
