import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Student } from '../../../../core/models/student.model';
import { StudentManagementService } from '../../services/student-management.service';
import { Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { StudentCertificateComponent } from '../student-certificate/student-certificate.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [
    CommonModule, 
    PaginationComponent, 
    SearchBarComponent, 
    ModalComponent, 
    StudentCertificateComponent,
    ConfirmationDialogComponent
  ],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.scss',
})
export class StudentListComponent implements OnInit {
  private loadingService = inject(LoadingService);
  private studentService = inject(StudentService);
  private studentManagementService = inject(StudentManagementService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);

  students = signal<Student[]>([]);
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  error = signal<string>('');
  selectedStudentId = signal<string>('');

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
      this.notificationService.error('Erro ao consultar estudantes: ' + error);
    } finally {
      this.loadingService.hide();
    }
  }

  onPageChange(page: number): void {
    this.currentPage.set(Number(page));
  }

  deleteStudent(student: Student) {
    this.confirmationService.confirm({
      message: `Tem certeza que deseja excluir o estudante "${student.name}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          this.loadingService.show();
          await this.studentManagementService.delete(student.id);
          
          // Atualiza a lista de estudantes apenas após a exclusão bem-sucedida
          this.students.update(students => 
            students.filter(s => s.id !== student.id)
          );
          this.notificationService.success('Estudante excluído com sucesso');
        } catch (error: any) {
          console.error('Erro ao excluir estudante:', error);
          this.notificationService.error(error.message || 'Erro ao excluir estudante');
        } finally {
          this.loadingService.hide();
        }
      }
    });
  }

  editStudent(id: string) {
    this.router.navigate(['/admin/student-register', id]);
  }

  openCertificateModal(studentId: string) {
    this.selectedStudentId.set(studentId);
  }

  getImageUrl(url: string | undefined): string {
    if (!url) return 'assets/images/default-profile.png';
    return `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
  }

  formatCpf(cpf: string | undefined): string {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}
