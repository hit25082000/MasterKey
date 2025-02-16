import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatModalComponent } from '../../features/chat/components/chat-modal/chat-modal.component';
import { StudentNavComponent } from './student-nav/student-nav.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-classroom',
  standalone: true,
  imports: [RouterOutlet, StudentNavComponent, ChatModalComponent, CommonModule],
  templateUrl: './classroom.component.html',
  styleUrls: ['./classroom.component.scss']
})
export class ClassroomComponent {
  isNavExpanded = signal<boolean>(window.innerWidth >= 1024);

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isNavExpanded.set(window.innerWidth >= 1024);
  }

  toggleNav() {
    this.isNavExpanded.update(value => !value);
  }
}
