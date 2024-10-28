import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      @for (notification of notificationService.activeNotifications(); track notification.id) {
        <div
          class="notification"
          [class]="notification.type"
          [@slideIn]
          (@slideIn.done)="onAnimationDone($event, notification.id)">
          <div class="notification-content">
            <span class="message">{{ notification.message }}</span>
            <button class="close-btn" (click)="notificationService.hide(notification.id)">
              ✕
            </button>
          </div>
          <div class="progress-bar" [style.animation-duration]="notification.duration + 'ms'"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    }

    .notification {
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      color: white;
      position: relative;
      overflow: hidden;
    }

    .notification-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
      opacity: 0.7;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
      }
    }

    .progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: rgba(255, 255, 255, 0.7);
      width: 100%;
      animation: progress linear;
    }

    .success {
      background-color: #10B981;
    }

    .error {
      background-color: #EF4444;
    }

    .info {
      background-color: #3B82F6;
    }

    @keyframes progress {
      from { width: 100%; }
      to { width: 0%; }
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('150ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class NotificationsComponent {
  protected notificationService = inject(NotificationService);

  onAnimationDone(event: any, id: string) {
    if (event.toState === 'void') {
      this.notificationService.hide(id);
    }
  }
}
