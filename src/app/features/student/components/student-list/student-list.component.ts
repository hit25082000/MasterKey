import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Student } from '../../../../core/models/student.model';
import { StudentManagementService } from '../../services/student-management.service';
import { Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { NotificationType } from '../../../../shared/models/notifications-enum';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { LoadingService } from '../../../../shared/services/loading.service';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.scss',
})
export class StudentListComponent implements OnInit {
  loadingService = inject(LoadingService);
  studentService = inject(StudentService);
  studentManagementService = inject(StudentManagementService);
  router = inject(Router);
  notificationService = inject(NotificationService);

  students = signal<Student[]>([]);
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  error = signal<string>('');

  displayedStudents = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return this.students().slice(startIndex, endIndex);
  });

  async ngOnInit(): Promise<void> {
    this.loadingService.show();
    try {
      this.students = this.studentService.students
    } catch (error: any) {
      this.error.set(error);
      this.notificationService.success(
        'Erro ao consultar estudantes: ' + error,
        1
      );
    } finally {
      this.loadingService.hide();
    }
  }

  onPageChange(page: number): void {
    this.currentPage.set(Number(page));
  }

  deleteStudent(id: string) {
    this.studentManagementService
      .delete(id)
      .then((success) => {
        this.students.update(students =>
          students.filter(student => student.id !== id)
        );
        this.notificationService.success(success, 1);
      })
      .catch((error) => {
        console.log(error);
        this.notificationService.success(error, 1);
      });
  }

  editStudent(id: string) {
    this.router.navigate(['/admin/student-register', id]);
  }
}
