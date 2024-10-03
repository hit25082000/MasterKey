import { Component } from '@angular/core';
import { SidenavComponent } from '../../shared/components/sidenav/sidenav.component';
import { RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { ChatComponent } from '../../features/chat/chat.component';
import { WhatsAppMessageComponent } from '../../features/chat/whats-app-message/whats-app-message.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [SidenavComponent, RouterOutlet, NgClass, ChatComponent, WhatsAppMessageComponent, ModalComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent {
  expanded = false;

  expandSidenav(expand: boolean) {
    this.expanded = expand;
  }
}
