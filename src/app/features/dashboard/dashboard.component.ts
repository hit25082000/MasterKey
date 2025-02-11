import { Component, OnInit, computed, effect, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseService } from '../../features/course/services/course.service';
import { PaymentService } from '../../shared/services/payment.service';
import { StudentService } from '../../features/student/services/student.service';
import { FirestorePayment } from '../../shared/models/asaas.model';
import { Course } from '../../core/models/course.model';
import { Student } from '../../core/models/student.model';
import { SystemLogService, LogCategory } from '../../core/services/system-log.service';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { PaymentTransaction } from '../../core/interfaces/payment.interface';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard.component.html', 
  styleUrl: './dashboard.component.scss' 
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('registrationsChart') registrationsChart!: ElementRef;
  @ViewChild('studentStatusChart') studentStatusChart!: ElementRef;

  private courseService = inject(CourseService);
  private paymentService = inject(PaymentService);
  private studentService = inject(StudentService);
  private systemLogService = inject(SystemLogService);

  private _courses = signal<Course[]>([]);
  private _students = this.studentService.students;
  private _payments = signal<PaymentTransaction[]>([]);
  private _registrations = signal<{ currentMonth: number; previousMonth: number }>({ currentMonth: 0, previousMonth: 0 });

  readonly totalStudents = computed(() => this._students().length);
  readonly totalCourses = computed(() => this._courses().length);
  readonly totalRevenue = computed(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return this._payments()
      .filter(p => {
        const paymentDate = new Date(p.createdAt);
        return (p.status === 'CONFIRMED' || p.status === 'RECEIVED') &&
               paymentDate >= firstDayOfMonth;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);
  });

  readonly recentPayments = computed(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return this._payments()
      .filter(payment => new Date(payment.createdAt) >= firstDayOfMonth)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  displayedColumns = ['date', 'description', 'value', 'status'];

  constructor() {
    effect(() => {
      this.loadData();
    });
  }

  ngOnInit() {
    this.loadRegistrationData();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  private async loadData() {
    const courses = await this.courseService.getAll();
    const payments = await firstValueFrom(this.paymentService.getAllTransactions());

    console.log(payments)

    this._courses.set(courses);
    this._payments.set(payments);
  }

  private async loadRegistrationData() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth - 1;
    const previousYear = previousMonth < 0 ? currentYear - 1 : currentYear;

    const startCurrentMonth = new Date(currentYear, currentMonth, 1);
    const startPreviousMonth = new Date(previousYear, previousMonth < 0 ? 11 : previousMonth, 1);
    const endCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
    const endPreviousMonth = new Date(previousYear, previousMonth < 0 ? 12 : previousMonth + 1, 0);

    const currentMonthLogs = await firstValueFrom(
      this.systemLogService.getLogsByDateRange(
        LogCategory.USER_REGISTRATION,
        'Registro',
        startCurrentMonth,
        endCurrentMonth
      )
    );

    const previousMonthLogs = await firstValueFrom(
      this.systemLogService.getLogsByDateRange(
        LogCategory.USER_REGISTRATION,
        'Registro',
        startPreviousMonth,
        endPreviousMonth
      )
    );

    this._registrations.set({
      currentMonth: currentMonthLogs.length,
      previousMonth: previousMonthLogs.length
    });

    this.initializeCharts();
  }

  private initializeCharts() {
    if (this.registrationsChart && this.studentStatusChart) {
      const registrationsCtx = this.registrationsChart.nativeElement.getContext('2d');
      const statusCtx = this.studentStatusChart.nativeElement.getContext('2d');

      // Destruir gráficos existentes se houver
      Chart.getChart(this.registrationsChart.nativeElement)?.destroy();
      Chart.getChart(this.studentStatusChart.nativeElement)?.destroy();

      // Gráfico de Matrículas
      new Chart(registrationsCtx, {
        type: 'bar',
        data: {
          labels: ['Mês Anterior', 'Mês Atual'],
          datasets: [{
            label: 'Matrículas',
            data: [this._registrations().previousMonth, this._registrations().currentMonth],
            backgroundColor: ['#FF9800', '#2196F3']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });

      // Gráfico de Status dos Alunos
      const activeStudents = this._students().filter(student => student.active).length;
      const inactiveStudents = this._students().length - activeStudents;

      new Chart(statusCtx, {
        type: 'pie',
        data: {
          labels: ['Ativos', 'Inativos'],
          datasets: [{
            data: [activeStudents, inactiveStudents],
            backgroundColor: ['#4CAF50', '#F44336']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            }
          }
        }
      });
    }
  }
}
