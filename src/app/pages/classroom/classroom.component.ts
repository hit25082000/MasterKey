import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StudentNavComponent } from "../../shared/components/student-nav/student-nav.component";
import { ChatModalComponent } from '../../features/chat/components/chat-modal/chat-modal.component';

@Component({
  selector: 'app-classroom',
  standalone: true,
  imports: [RouterOutlet, StudentNavComponent,ChatModalComponent],
  templateUrl: './classroom.component.html',
  styleUrls: ['./classroom.component.scss']
})
export class ClassroomComponent {}
