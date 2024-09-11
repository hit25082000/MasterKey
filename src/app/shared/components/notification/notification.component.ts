import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" class="notification" [ngClass]="type">
      <p>{{ message }}</p>
      <button (click)="close()">Fechar</button>
    </div>
  `,
  styles: [`
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px;
      border-radius: 5px;
      color: white;
      max-width: 300px;
    }
    .success { background-color: #4CAF50; }
    .error { background-color: #f44336; }
    .info { background-color: #2196F3; }
  `]
})
export class NotificationComponent {
  @Input() message: string = '';
  @Input() type: 'success' | 'error' | 'info' = 'info';
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  close() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }
}
