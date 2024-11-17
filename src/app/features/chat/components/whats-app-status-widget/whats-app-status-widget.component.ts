import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WhatsAppStatusService } from '../../services/whats-app-status.service';

@Component({
  selector: 'app-whats-app-status-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="whatsapp-widget top-right" *ngIf="statusService.isVisible()" [class.minimized]="statusService.isMinimized()">
      <div class="widget-header" (click)="statusService.toggleMinimize()">
        <div class="header-content">
          <i class="fab fa-whatsapp"></i>
          <span>Envio de Mensagens</span>
          <div class="status-count">
            {{ statusService.getSuccessCount() }}/{{ statusService.messageStatuses().length }}
          </div>
        </div>
        <div class="header-actions">
          <button
            class="close-button"
            *ngIf="allCompleted()"
            (click)="closeWidget($event)"
            title="Fechar"
          >
            <i class="fas fa-times"></i>
          </button>
          <button class="minimize-button">
            <i [class]="statusService.isMinimized() ? 'fas fa-chevron-down' : 'fas fa-chevron-up'"></i>
          </button>
        </div>
      </div>

      <div class="widget-content" *ngIf="!statusService.isMinimized()">
        <ul class="status-list">
          @for (status of statusService.messageStatuses(); track status.userId) {
            <li [class]="status.status">
              <span class="user-name">{{ status.userName }}</span>
              <span class="status-icon">
                @if (status.status === 'pending') {
                  <i class="fas fa-spinner fa-spin"></i>
                } @else if (status.status === 'success') {
                  <i class="fas fa-check"></i>
                } @else {
                  <i class="fas fa-times"></i>
                }
              </span>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .whatsapp-widget {
      position: fixed;
      width: 300px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      overflow: hidden;
      transition: all 0.3s ease;

      &.top-right {
        top: 20px;
        right: 20px;
        margin-top: 60px; // Espaço para notificações
      }

      &.minimized {
        height: 50px;
      }
    }

    .widget-header {
      padding: 12px;
      background: #25D366;
      color: white;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-content {
        display: flex;
        align-items: center;
        gap: 8px;

        i {
          font-size: 1.2rem;
        }
      }

      .status-count {
        margin-left: 8px;
        padding: 2px 6px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        font-size: 0.8rem;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .close-button,
      .minimize-button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }

      .close-button {
        &:hover {
          background: rgba(255, 0, 0, 0.2);
        }
      }
    }

    .widget-content {
      max-height: 300px;
      overflow-y: auto;

      .status-list {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          padding: 10px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f0f0f0;
          font-size: 0.9rem;

          &.pending {
            background: #fff8dc;
            color: #856404;
          }

          &.success {
            background: #d4edda;
            color: #155724;
          }

          &.error {
            background: #f8d7da;
            color: #721c24;
          }

          .status-icon {
            width: 20px;
            text-align: center;
          }
        }
      }
    }

    // Animações
    @keyframes slideIn {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .whatsapp-widget {
      animation: slideIn 0.3s ease-out;
    }
  `]
})
export class WhatsAppStatusWidgetComponent {
  statusService = inject(WhatsAppStatusService);

  allCompleted(): boolean {
    const statuses = this.statusService.messageStatuses();
    return statuses.length > 0 &&
           statuses.every(status => status.status === 'success' || status.status === 'error');
  }

  closeWidget(event: Event): void {
    event.stopPropagation(); // Previne que o evento chegue ao header e minimize o widget
    this.statusService.clear();
  }
}
