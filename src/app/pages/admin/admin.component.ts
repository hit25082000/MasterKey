import { Component } from '@angular/core';
import { SidenavComponent } from '../../shared/components/sidenav/sidenav.component';
import { RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { ChatComponent } from '../../features/chat/chat.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [SidenavComponent, RouterOutlet, NgClass, ChatComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent {
  expanded = false;

  expandSidenav(expand: boolean) {
    this.expanded = expand;
  }
}
