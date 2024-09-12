import { routes } from './../../../../app.routes';
import { Component, OnInit } from '@angular/core';
import { Student } from '../../../../core/models/student.model';
import { StudentManagementService } from '../../services/student-management.service';
import { Router, Routes } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.scss',
})
export class StudentListComponent implements OnInit {
  students: Student[] = [];

  constructor(
    private studentService: StudentService,
    private studentManagementService: StudentManagementService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.students = await this.studentService.getAll();
    } catch (err: any) {
      //this.error = 'Erro ao carregar os alunos';
      console.error(err.status);
    } finally {
      //this.loading = false;
    }
  }

  deleteStudent(id: string) {
    this.studentManagementService
      .delete(id)
      .then((success) => {
        this.students = this.students.filter((student) => student.id !== id);
        this.notificationService.showNotification(
          success,
          NotificationType.SUCCESS
        );
      })
      .catch((error) => {
        console.log(error);
        this.notificationService.showNotification(
          error,
          NotificationType.ERROR
        );
      });
  }

  editStudent(id: string) {
    this.router.navigate(['/admin/student-detail', id]);
  }
}
