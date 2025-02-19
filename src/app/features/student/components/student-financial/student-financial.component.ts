import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { PaymentService } from '../../../../shared/services/payment.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, map, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CourseService } from '../../../course/services/course.service';
import { Course } from '../../../../core/models/course.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { StudentService } from '../../services/student.service';
import { ActivatedRoute } from '@angular/router';
import { PaymentHistoryComponent } from "../../../../shared/components/payment-history/payment-history.component";
import { PaymentComponent } from '../../../../shared/components/payment/payment.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-financial',
  standalone: true,
  imports: [
    CommonModule,
    PaymentHistoryComponent,
    PaymentComponent,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './student-financial.component.html',
  styleUrls: ['./student-financial.component.scss']
})
export class StudentFinancialComponent implements OnInit {
  private courseService = inject(CourseService);
  
  courses = signal<Course[]>([]);
  selectedCourseId = signal<string>('');
  course = signal<Course | null>(null);

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

  onCourseSelect(courseId: string) {
    this.selectedCourseId.set(courseId);
    const selectedCourse = this.courses().find(c => c.id === courseId);
    this.course.set(selectedCourse || null);
  }
} 