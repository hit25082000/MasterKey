import { Component } from '@angular/core';
import { SidenavComponent } from '../../shared/components/sidenav/sidenav.component';
import { RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { WhatsAppMessageComponent } from '../../features/chat/components/whats-app-message/whats-app-message.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ChatModalComponent } from '../../features/chat/components/chat-modal/chat-modal.component';
import { AdminHeaderComponent } from '../../shared/components/admin-header/admin-header.component';
import { WhatsAppStatusWidgetComponent } from '../../features/chat/components/whats-app-status-widget/whats-app-status-widget.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    SidenavComponent,
    RouterOutlet,
    NgClass,
    ChatModalComponent,
    WhatsAppMessageComponent,
    ModalComponent,
    AdminHeaderComponent,
    WhatsAppStatusWidgetComponent
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent {
  expanded = false;

  expandSidenav(expand: boolean) {
    this.expanded = expand;
  }
}
