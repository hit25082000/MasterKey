import { Component, inject } from '@angular/core';
import { SystemLogService } from '../../core/services/system-log.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-classroom',
  standalone: true,
  imports: [],
  templateUrl: './classroom.component.html',
  styleUrl: './classroom.component.scss',
})
export class ClassroomComponent {}
