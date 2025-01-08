import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (confirmationService.visible()) {
      <div class="confirmation-overlay" (click)="confirmationService.reject()">
        <div class="confirmation-dialog" (click)="$event.stopPropagation()">
          <div class="confirmation-header">
            <h3>{{ confirmationService.options()?.header || 'Confirmação' }}</h3>
            @if (confirmationService.options()?.icon) {
              <i [class]="confirmationService.options()?.icon"></i>
            }
          </div>
          <div class="confirmation-content">
            <p>{{ confirmationService.options()?.message }}</p>
          </div>
          <div class="confirmation-actions">
            <button class="btn-secondary" (click)="confirmationService.reject()">Cancelar</button>
            <button class="btn-primary" (click)="confirmationService.accept()">Confirmar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .confirmation-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .confirmation-dialog {
      background: var(--surface-card);
      border-radius: 8px;
      padding: 1.5rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .confirmation-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;

      h3 {
        margin: 0;
        color: var(--text-color);
        font-size: 1.25rem;
      }

      i {
        color: var(--primary-color);
        font-size: 1.25rem;
      }
    }

    .confirmation-content {
      margin-bottom: 1.5rem;

      p {
        margin: 0;
        color: var(--text-color-secondary);
        line-height: 1.5;
      }
    }

    .confirmation-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;

      button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;

        &.btn-primary {
          background: var(--primary-color);
          color: var(--primary-color-text);

          &:hover {
            background: var(--primary-600);
          }
        }

        &.btn-secondary {
          background: var(--surface-hover);
          color: var(--text-color);

          &:hover {
            background: var(--surface-ground);
          }
        }
      }
    }
  `]
})
export class ConfirmationDialogComponent {
  confirmationService = inject(ConfirmationService);
}
