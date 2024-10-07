import { Component, inject } from '@angular/core';
import { SystemLogService } from '../../core/services/system-log.service';
import { AuthService } from '../../core/services/auth.service';
import { RouterOutlet } from '@angular/router';
import { StudentNavComponent } from "../../shared/components/student-nav/student-nav.component";

@Component({
  selector: 'app-classroom',
  standalone: true,
  imports: [RouterOutlet, StudentNavComponent],
  templateUrl: './classroom.component.html',
  styleUrl: './classroom.component.scss',
})
export class ClassroomComponent {}
