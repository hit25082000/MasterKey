import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PaymentComponent } from '../../../../shared/components/payment/payment.component';
import { CourseService } from '../../../course/services/course.service';
import { Course } from '../../../../core/models/course.model';
import { StudentService } from '../../../student/services/student.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-payment-create',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    PaymentComponent
  ],
  templateUrl: './payment-create.component.html',
  styleUrls: ['./payment-create.component.scss']
})
export class PaymentCreateComponent {
    courseService = inject(CourseService);
    studentService = inject(StudentService);
    authService = inject(AuthService);
    snackBar = inject(MatSnackBar);
    
    courses = signal<Course[]>([]);
    availableCourses = signal<Course[]>([]);
    selectedCourseId = signal<string>('');
    course = signal<Course | undefined>(undefined);
    studentCourses = signal<string[]>([]);

  onCourseSelect(courseId: string) {
    this.selectedCourseId.set(courseId);
    this.course.set(this.availableCourses().find(c => c.id === courseId));
  }

  ngOnInit() {
    this.loadCourses();
  }

  private async loadCourses() {
    try {
      // Obter o ID do usuário atual
      const userId = this.authService.getCurrentUserId();
      if (!userId) {
        this.snackBar.open('Usuário não autenticado', 'Fechar', { duration: 3000 });
        return;
      }

      // Carregar todos os cursos
      const allCourses = await this.courseService.getAll();
      this.courses.set(allCourses);

      // Carregar os cursos que o aluno já possui
      const studentCourses = await this.studentService.getCourses(userId);
      this.studentCourses.set(studentCourses);

      // Filtrar para mostrar apenas os cursos que o aluno ainda não possui
      const availableCourses = allCourses.filter(course => !studentCourses.includes(course.id));
      this.availableCourses.set(availableCourses);

      if (availableCourses.length === 0) {
        this.snackBar.open('Você já possui todos os cursos disponíveis', 'Fechar', { duration: 3000 });
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      this.snackBar.open('Erro ao carregar cursos', 'Fechar', { duration: 3000 });
    }
  }
} 