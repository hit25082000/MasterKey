import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseService } from '../../features/course/services/course.service';
import { PaymentService } from '../../shared/services/payment.service';
import { StudentService } from '../../features/student/services/student.service';
import { FirestorePayment } from '../../shared/models/asaas.model';
import { Course } from '../../core/models/course.model';
import { Student } from '../../core/models/student.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private courseService = inject(CourseService);
  private paymentService = inject(PaymentService);
  private studentService = inject(StudentService);

  private _courses = signal<Course[]>([]);
  private _students = this.studentService.students;
  private _payments = signal<FirestorePayment[]>([]);

  readonly totalStudents = computed(() => this._students().length);
  readonly totalCourses = computed(() => this._courses().length);
  readonly totalRevenue = computed(() => 
    this._payments()
      .filter(p => p.paymentDetails.status === 'CONFIRMED' || p.paymentDetails.status === 'RECEIVED')
      .reduce((acc, curr) => acc + curr.paymentDetails.value, 0)
  );

  readonly recentTransactions = computed(() => 
    [...this._payments()]
      .sort((a, b) => new Date(b.paymentDetails.dateCreated).getTime() - new Date(a.paymentDetails.dateCreated).getTime())
      .slice(0, 5)
  );

  constructor() {
    effect(() => {
      this.loadData();
    });
  }

  private async loadData() {
    const courses = await this.courseService.getAll();
    const payments = this.paymentService.payments();

    this._courses.set(courses);
    this._payments.set(payments);
  }

  ngOnInit() {}
}
