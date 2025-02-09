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
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatIconModule],
  template: `
    <div class="dashboard-container">
      <!-- Cards de Resumo -->
      <div class="summary-cards">
        <mat-card class="summary-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>people</mat-icon>
            <mat-card-title>Total de Alunos</mat-card-title>
            <mat-card-subtitle>{{ totalStudents() }}</mat-card-subtitle>
          </mat-card-header>
        </mat-card>

        <mat-card class="summary-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>school</mat-icon>
            <mat-card-title>Total de Cursos</mat-card-title>
            <mat-card-subtitle>{{ totalCourses() }}</mat-card-subtitle>
          </mat-card-header>
        </mat-card>

        <mat-card class="summary-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>payments</mat-icon>
            <mat-card-title>Receita Total Este Mês</mat-card-title>
            <mat-card-subtitle>R$ {{ totalRevenue() | number:'1.2-2' }}</mat-card-subtitle>
          </mat-card-header>
        </mat-card>
      </div>

      <!-- Gráficos -->
      <div class="charts-container">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Matrículas por Mês</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-wrapper">
              <canvas #registrationsChart></canvas>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Status dos Alunos</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-wrapper">
              <canvas #studentStatusChart></canvas>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Tabela de Pagamentos do Mês -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>Pagamentos do Mês</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="recentPayments()" class="payments-table">
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Data</th>
              <td mat-cell *matCellDef="let payment">
                {{ payment.paymentDetails.dateCreated | date:'dd/MM/yyyy' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Descrição</th>
              <td mat-cell *matCellDef="let payment">
                {{ payment.paymentDetails.description }}
              </td>
            </ng-container>

            <ng-container matColumnDef="value">
              <th mat-header-cell *matHeaderCellDef>Valor</th>
              <td mat-cell *matCellDef="let payment">
                R$ {{ payment.paymentDetails.value | number:'1.2-2' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let payment">
                {{ payment.paymentDetails.status }}
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .summary-card {
      padding: 16px;
    }

    .charts-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .chart-wrapper {
      position: relative;
      height: 300px;
      width: 100%;
    }

    .chart-card {
      padding: 16px;
      margin-bottom: 20px;
    }

    .chart-card mat-card-content {
      padding: 16px;
    }

    .table-card {
      margin-top: 20px;
    }

    .payments-table {
      width: 100%;
    }

    mat-card-subtitle {
      font-size: 1.5em;
      color: #2196F3;
    }
  `]
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
  private _payments = signal<FirestorePayment[]>([]);
  private _registrations = signal<{ currentMonth: number; previousMonth: number }>({ currentMonth: 0, previousMonth: 0 });

  readonly totalStudents = computed(() => this._students().length);
  readonly totalCourses = computed(() => this._courses().length);
  readonly totalRevenue = computed(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return this._payments()
      .filter(p => {
        const paymentDate = new Date(p.paymentDetails.dateCreated);
        return (p.paymentDetails.status === 'CONFIRMED' || p.paymentDetails.status === 'RECEIVED') &&
               paymentDate >= firstDayOfMonth;
      })
      .reduce((acc, curr) => acc + curr.paymentDetails.value, 0);
  });

  readonly recentPayments = computed(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return this._payments()
      .filter(payment => new Date(payment.paymentDetails.dateCreated) >= firstDayOfMonth)
      .sort((a, b) => new Date(b.paymentDetails.dateCreated).getTime() - new Date(a.paymentDetails.dateCreated).getTime());
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
    const payments = this.paymentService.payments();

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
