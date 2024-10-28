import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Student } from '../../../../core/models/student.model';
import { StudentManagementService } from '../../services/student-management.service';
import { Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { NotificationType } from '../../../../shared/models/notifications-enum';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.scss',
})
export class StudentListComponent implements OnInit {
  students: Student[] = [];
  displayedStudents: Student[] = [];
  error: string = '';
  loading: boolean = true;
  currentPage: number = 1;
  pageSize: number = 10;

  constructor(
    private studentService: StudentService,
    private studentManagementService: StudentManagementService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.students = await this.studentService.getAll();
      this.updateDisplayedStudents();
    } catch (error: any) {
      this.notificationService.success(
        'Erro ao consultar estudantes: ' + error,
        1
      );
    } finally {
      this.loading = false;
    }
  }

  updateDisplayedStudents(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedStudents = this.students.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = Number(page);
    this.updateDisplayedStudents();
  }

  deleteStudent(id: string) {
    this.studentManagementService
      .delete(id)
      .then((success) => {
        this.students = this.students.filter((student) => student.id !== id);
        this.notificationService.success(
          success,
          1
        );
      })
      .catch((error) => {
        console.log(error);
        this.notificationService.success(
          error,
          1
        );
      });
  }

  editStudent(id: string) {
    this.router.navigate(['/admin/student-register', id]);
  }
}
