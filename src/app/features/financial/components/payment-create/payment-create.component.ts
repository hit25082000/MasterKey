import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PaymentComponent } from '../../../../shared/components/payment/payment.component';
import { CourseService } from '../../../course/services/course.service';

interface Course {
  id: string;
  name: string;
  price: number;
  portionCount: number;
}

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
    courseService = inject(CourseService)
    courses = signal<Course[]>([]);
    selectedCourseId = signal<string>('');
    course = signal<Course | undefined>(undefined);

  onCourseSelect(courseId: string) {
    this.selectedCourseId.set(courseId);
    this.course.set(this.courses().find(c => c.id === courseId));
  }

  ngOnInit() {
    this.loadCourses();
  }

  private async loadCourses() {
    try {
      const courses = await this.courseService.getAll();
      this.courses.set(courses);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    }
  }
} 