import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourseService } from '../course/services/course.service';
import { LoadingService } from '../../shared/services/loading.service';
import { NotificationService } from '../../shared/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import { Course } from '../../core/models/course.model';
import { firstValueFrom } from 'rxjs';
import { StudentService } from '../student/services/student.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

interface Transaction {
  id: string;
  status: 'CONFIRMED' | 'PENDING' | 'OVERDUE';
  amount: number;
  courseId: string;
  courseName: string;
  createdAt: number;
  date: Date;
}

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalRevenue: number;
  recentTransactions: Transaction[];
  salesByMonth: { [key: string]: number };
  salesByCourse: { [key: string]: { count: number; revenue: number } };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective],
  template: `
    <div class="dashboard-container">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon students">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-info">
            <h3>Total de Alunos</h3>
            <p class="stat-value">{{ stats().totalStudents }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon courses">
            <i class="fas fa-book"></i>
          </div>
          <div class="stat-info">
            <h3>Total de Cursos</h3>
            <p class="stat-value">{{ stats().totalCourses }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon revenue">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="stat-info">
            <h3>Receita Total</h3>
            <p class="stat-value">R$ {{ stats().totalRevenue | number:'1.2-2' }}</p>
          </div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <h3>Alunos Ativos/Inativos</h3>
          <div class="chart-container">
            <canvas baseChart
              [type]="'pie'"
              [data]="studentsChartData"
              [options]="chartOptions">
            </canvas>
          </div>
        </div>

        <div class="chart-card">
          <h3>Cursos Ativos/Inativos</h3>
          <div class="chart-container">
            <canvas baseChart
              [type]="'pie'"
              [data]="coursesChartData"
              [options]="chartOptions">
            </canvas>
          </div>
        </div>

        <div class="chart-card">
          <h3>Vendas por Mês</h3>
          <div class="chart-container">
            <canvas baseChart
              [type]="'line'"
              [data]="monthlyChartData"
              [options]="lineChartOptions">
            </canvas>
          </div>
        </div>

        <div class="chart-card">
          <h3>Vendas por Curso</h3>
          <div class="chart-container">
            <canvas baseChart
              [type]="'pie'"
              [data]="coursesSalesChartData"
              [options]="pieChartOptions">
            </canvas>
          </div>
        </div>
      </div>

      <div class="transactions-card">
        <h3>Transações Recentes</h3>
        <div class="transactions-list">
          @for (transaction of stats().recentTransactions; track transaction.id) {
            <div class="transaction-item">
              <div class="transaction-info">
                <p class="transaction-course">{{ transaction.courseName }}</p>
                <p class="transaction-date">{{ transaction.date | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
              <div class="transaction-status" [class]="transaction.status">
                {{ getStatusLabel(transaction.status) }}
              </div>
              <div class="transaction-amount">
                R$ {{ transaction.amount | number:'1.2-2' }}
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 1.5rem;

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: white;

        &.students { background: #384A87; }
        &.courses { background: #32BCAD; }
        &.revenue { background: #6C757D; }
      }

      .stat-info {
        h3 {
          margin: 0;
          color: #666;
          font-size: 1rem;
        }

        .stat-value {
          margin: 0;
          font-size: 1.5rem;
          font-weight: bold;
          color: #333;
        }
      }
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .chart-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);

      h3 {
        margin: 0 0 1.5rem;
        color: #333;
      }

      .chart-container {
        height: 300px;
        position: relative;
      }
    }

    .transactions-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);

      h3 {
        margin: 0 0 1.5rem;
        color: #333;
      }

      .transactions-list {
        .transaction-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid #eee;

          &:last-child {
            border-bottom: none;
          }

          .transaction-info {
            .transaction-course {
              margin: 0;
              color: #333;
              font-weight: 500;
            }

            .transaction-date {
              margin: 0.25rem 0 0;
              color: #666;
              font-size: 0.9rem;
            }
          }

          .transaction-status {
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.9rem;

            &.CONFIRMED {
              background: #d4edda;
              color: #155724;
            }

            &.PENDING {
              background: #fff3cd;
              color: #856404;
            }

            &.OVERDUE {
              background: #f8d7da;
              color: #721c24;
            }
          }

          .transaction-amount {
            font-weight: bold;
            color: #384A87;
          }
        }
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .charts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private courseService = inject(CourseService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private studentService = inject(StudentService);
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);

  stats = signal<DashboardStats>({
    totalStudents: 0,
    totalCourses: 0,
    totalRevenue: 0,
    recentTransactions: [],
    salesByMonth: {},
    salesByCourse: {}
  });

  // Configurações dos gráficos
  studentsChartData: ChartData = {
    labels: ['Ativos', 'Inativos'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#4CAF50', '#FF5252']
    }]
  };

  coursesChartData: ChartData = {
    labels: ['Ativos', 'Inativos'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#2196F3', '#FF9800']
    }]
  };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      }
    }
  };

  monthlyChartData: ChartData = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Vendas Mensais',
      backgroundColor: '#4CAF50',
      borderColor: '#2E7D32',
      fill: true,
    }]
  };

  coursesSalesChartData: ChartData = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF'
      ]
    }]
  };

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  };

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right'
      }
    }
  };

  async ngOnInit() {
    this.loadingService.show();

    try {
      const [transactions, courses] = await Promise.all([
        this.firestoreService.getCollection('transactions') as Promise<Transaction[]>,
        this.courseService.getAll()
      ]);

      const stats: DashboardStats = {
        totalStudents: await this.getTotalStudents(),
        totalCourses: courses.length,
        totalRevenue: 0,
        recentTransactions: [],
        salesByMonth: {},
        salesByCourse: {}
      };

      // Processar transações
      transactions.forEach((transaction: Transaction) => {
        // Calcular receita total
        if (transaction.status === 'CONFIRMED') {
          stats.totalRevenue += transaction.amount;

          // Vendas por mês
          const date = new Date(transaction.createdAt);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          stats.salesByMonth[monthKey] = (stats.salesByMonth[monthKey] || 0) + 1;

          // Vendas por curso
          if (!stats.salesByCourse[transaction.courseId]) {
            stats.salesByCourse[transaction.courseId] = { count: 0, revenue: 0 };
          }
          stats.salesByCourse[transaction.courseId].count += 1;
          stats.salesByCourse[transaction.courseId].revenue += transaction.amount;
        }
      });

      // Últimas 10 transações
      stats.recentTransactions = transactions
        .sort((a: Transaction, b: Transaction) => b.createdAt - a.createdAt)
        .slice(0, 10)
        .map(t => ({
          ...t,
          date: new Date(t.createdAt)
        }));

      this.stats.set(stats);
      this.updateCharts(courses);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      this.notificationService.error('Erro ao carregar dados do dashboard');
    } finally {
      this.loadingService.hide();
    }
  }

  private updateCharts(courses: Course[]) {
    const stats = this.stats();
    
    // Atualiza gráfico de vendas mensais
    const months = Object.keys(stats.salesByMonth).sort();
    this.monthlyChartData = {
      labels: months.map(this.formatMonth),
      datasets: [{
        data: months.map(m => stats.salesByMonth[m]),
        label: 'Vendas Mensais',
        backgroundColor: '#4CAF50',
        borderColor: '#2E7D32',
        fill: true,
      }]
    };

    // Atualiza gráfico de vendas por curso
    const courseSales = this.getCourseSales(courses);
    this.coursesSalesChartData = {
      labels: courseSales.map(c => c.name),
      datasets: [{
        data: courseSales.map(c => c.count),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ]
      }]
    };

    // Atualiza gráfico de alunos ativos/inativos
    const students = this.studentService.students();
    const activeStudents = students.filter(user => user.active === true).length;
    const inactiveStudents = students.length - activeStudents;
    this.studentsChartData = {
      labels: ['Ativos', 'Inativos'],
      datasets: [{
        data: [activeStudents, inactiveStudents],
        backgroundColor: ['#4CAF50', '#FF5252']
      }]
    };

    // Atualiza gráfico de cursos ativos/inativos
    const activeCourses = courses.filter(course => course.active === true).length;
    const inactiveCourses = courses.length - activeCourses;
    this.coursesChartData = {
      labels: ['Ativos', 'Inativos'],
      datasets: [{
        data: [activeCourses, inactiveCourses],
        backgroundColor: ['#2196F3', '#FF9800']
      }]
    };
  }

  private async getTotalStudents(): Promise<number> {
    const students = this.studentService.students;
    return students().filter(user => user.role === 'student').length;
  }

  getMonths(): string[] {
    return Object.keys(this.stats().salesByMonth).sort();
  }

  formatMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short' });
  }

  getCourseSales(courses: Course[]) {
    return Object.entries(this.stats().salesByCourse).map(([id, data]) => ({
      id,
      name: courses.find(course => course.id === id)?.name || id, // Idealmente, buscar o nome do curso
      count: data.count,
      revenue: data.revenue
    }));
  }

  getStatusLabel(status: string): string {
    const labels = {
      'CONFIRMED': 'Confirmado',
      'PENDING': 'Pendente',
      'OVERDUE': 'Atrasado'
    };
    return labels[status as keyof typeof labels] || status;
  }
}
