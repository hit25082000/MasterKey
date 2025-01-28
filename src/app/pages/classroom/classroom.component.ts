import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatModalComponent } from '../../features/chat/components/chat-modal/chat-modal.component';
import { StudentNavComponent } from './student-nav/student-nav.component';

@Component({
  selector: 'app-classroom',
  standalone: true,
  imports: [RouterOutlet, StudentNavComponent,ChatModalComponent],
  templateUrl: './classroom.component.html',
  styleUrls: ['./classroom.component.scss']
})
export class ClassroomComponent {}
