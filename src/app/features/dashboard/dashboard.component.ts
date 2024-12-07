import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseService } from '../course/services/course.service';
import { StudentService } from '../student/services/student.service';
import { EmployeeService } from '../employees/services/employee.service';
import { SystemLogService } from '../../core/services/system-log.service';
import { firstValueFrom } from 'rxjs';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private studentService = inject(StudentService);
  private courseService = inject(CourseService);
  private employeeService = inject(EmployeeService);
  private systemLogService = inject(SystemLogService);

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

  ngOnInit(): void {
    this.loadDashboardData();
  }

  async loadDashboardData(): Promise<void> {
    await this.loadStudentActivity();
    await this.loadCourseData();
    await this.loadTeacherData();
    this.updateCharts();
  }

  private async loadStudentActivity(): Promise<void> {
    const loginLogs = await firstValueFrom(this.systemLogService.getStudentLoginLogs());
    const lastLoginMap = new Map<string, Date>();

    loginLogs.forEach(log => {
      const studentId = log.details.studentId;
      const loginDate = new Date(log.timestamp);

      if (!lastLoginMap.has(studentId) || loginDate > lastLoginMap.get(studentId)!) {
        lastLoginMap.set(studentId, loginDate);
      }
    });
  }

  private getActiveStudentsCount(): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.studentService.students().filter(student => {
      // Lógica para verificar se o estudante está ativo
      return student.lastLogin && new Date(student.lastLogin) > thirtyDaysAgo;
    }).length;
  }

  private async loadCourseData(): Promise<void> {
    const courses = await this.courseService.getAll();
    this.coursesCount.set({
      total: courses.length,
      active: courses.filter(course => course.isActive).length
    });
  }

  private async loadTeacherData(): Promise<void> {
    const teachers = await this.employeeService.getAllTeachers();
    this.teachersCount.set(teachers.length);
  }

  private updateCharts(): void {
    // Atualiza gráfico de estudantes
    this.studentsChartData.datasets[0].data = [
      this.activeStudentsCount(),
      this.inactiveStudentsCount()
    ];

    // Atualiza gráfico de cursos
    const courseData = this.coursesCount();
    this.coursesChartData.datasets[0].data = [
      courseData.active,
      courseData.total - courseData.active
    ];
  }
}
