import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseService } from '../course/services/course.service';
import { StudentService } from '../student/services/student.service';
import { EmployeeService } from '../employees/services/employee.service';
import { SystemLogService } from '../../core/services/system-log.service';
import { PaymentService } from '../../core/services/payment.service';
import { firstValueFrom } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

interface StudentActivity {
  studentId: string;
  lastLoginDate: Date;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private studentService = inject(StudentService);
  private courseService = inject(CourseService);
  private employeeService = inject(EmployeeService);
  private systemLogService = inject(SystemLogService);
  private paymentService = inject(PaymentService);

  isLoading = signal<boolean>(true);
  chartsReady = signal<boolean>(false);

  // Signals para armazenar dados de atividade
  private studentActivityMap = signal<Map<string, Date>>(new Map());

  // Dados dos estudantes
  studentsData = computed(() => {
    const students = this.studentService.students();
    return {
      total: students.length,
      active: this.activeStudentsCount(),
      inactive: this.inactiveStudentsCount()
    };
  });

  // Contadores computados
  activeStudentsCount = computed(() => {
    return this.getActiveStudentsCount();
  });

  inactiveStudentsCount = computed(() => {
    return this.studentService.students().length - this.activeStudentsCount();
  });

  // Dados dos cursos
  coursesCount = signal<{ total: number; active: number }>({ total: 0, active: 0 });
  teachersCount = signal<number>(0);

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

  salesData = signal<{
    totalSales: number;
    monthlyData: number[];
    courseData: { name: string; sales: number }[];
    totalRevenue: number;
  }>({
    totalSales: 0,
    monthlyData: [],
    courseData: [],
    totalRevenue: 0
  });

  // Configurações dos gráficos
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

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    await this.loadDashboardData();
    
    // Aguarda o próximo ciclo de renderização antes de atualizar os gráficos
    setTimeout(() => {
      this.updateCharts();
      this.chartsReady.set(true);
      this.isLoading.set(false);
    }, 0);
  }

  async loadDashboardData(): Promise<void> {
    try {
      await Promise.all([
        this.loadStudentActivity(),
        this.loadCourseData(),
        this.loadTeacherData(),
        this.loadSalesData()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  }

  private async loadStudentActivity(): Promise<void> {
    try {
      const loginLogs = await firstValueFrom(this.systemLogService.getStudentLoginLogs());
      const activityMap = new Map<string, Date>();

      // Processa os logs para encontrar o último login de cada estudante
      loginLogs.forEach(log => {
        const studentId = log.details.studentId;
        const loginDate = new Date(log.timestamp);

        const currentLastLogin = activityMap.get(studentId);
        if (!currentLastLogin || loginDate > currentLastLogin) {
          activityMap.set(studentId, loginDate);
        }
      });

      this.studentActivityMap.set(activityMap);
    } catch (error) {
      console.error('Erro ao carregar atividade dos estudantes:', error);
      // Em caso de erro, mantém o mapa vazio
      this.studentActivityMap.set(new Map());
    }
  }

  private getActiveStudentsCount(): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activityMap = this.studentActivityMap();

    return this.studentService.students().filter(student => {
      const lastLogin = activityMap.get(student.id);
      return lastLogin && lastLogin > thirtyDaysAgo;
    }).length;
  }

  private async loadCourseData(): Promise<void> {
    try {
      const courses = await this.courseService.getAll();
      this.coursesCount.set({
        total: courses.length,
        active: courses.filter(course => course.active).length
      });
    } catch (error) {
      console.error('Erro ao carregar dados dos cursos:', error);
      this.coursesCount.set({ total: 0, active: 0 });
    }
  }

  private async loadTeacherData(): Promise<void> {
    try {
      const teachers = await this.employeeService.getAllTeachers();
      this.teachersCount.set(teachers.length);
    } catch (error) {
      console.error('Erro ao carregar dados dos professores:', error);
      this.teachersCount.set(0);
    }
  }

  private async loadSalesData(): Promise<void> {
    try {
      const summary = await this.paymentService.getSalesSummary();
      const courseNames = await this.getCourseNames(Object.keys(summary.salesByCourse));

      const courseData = Object.entries(summary.salesByCourse).map(([courseId, sales]) => ({
        name: courseNames[courseId] || 'Curso Desconhecido',
        sales
      }));

      this.salesData.set({
        totalSales: summary.totalSales,
        monthlyData: Object.values(summary.salesByMonth),
        courseData,
        totalRevenue: summary.totalRevenue
      });

      this.updateSalesCharts();
    } catch (error) {
      console.error('Erro ao carregar dados de vendas:', error);
    }
  }

  private async getCourseNames(courseIds: string[]): Promise<{ [key: string]: string }> {
    const courseNames: { [key: string]: string } = {};
    for (const id of courseIds) {
      try {
        const course = await this.courseService.getById(id);
        courseNames[id] = course.name;
      } catch (error) {
        console.error(`Erro ao buscar nome do curso ${id}:`, error);
      }
    }
    return courseNames;
  }

  private updateSalesCharts(): void {
    const salesData = this.salesData();

    // Atualiza gráfico de vendas mensais
    this.monthlyChartData.labels = Object.keys(salesData.monthlyData);
    this.monthlyChartData.datasets[0].data = salesData.monthlyData;

    // Atualiza gráfico de vendas por curso
    this.coursesSalesChartData.labels = salesData.courseData.map(d => d.name);
    this.coursesSalesChartData.datasets[0].data = salesData.courseData.map(d => d.sales);
  }

  private updateCharts(): void {
    // Atualiza gráfico de estudantes
    this.studentsChartData = {
      ...this.studentsChartData,
      datasets: [{
        ...this.studentsChartData.datasets[0],
        data: [this.studentsData().active, this.studentsData().inactive]
      }]
    };

    // Atualiza gráfico de cursos
    this.coursesChartData = {
      ...this.coursesChartData,
      datasets: [{
        ...this.coursesChartData.datasets[0],
        data: [this.coursesCount().active, this.coursesCount().total - this.coursesCount().active]
      }]
    };
  }
}
