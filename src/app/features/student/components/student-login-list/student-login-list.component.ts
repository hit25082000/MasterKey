import { LoadingService } from './../../../../shared/services/loading.service';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemLogService } from '../../../../core/services/system-log.service';
import { StudentService } from '../../services/student.service';
import { NotificationService } from '../../../../shared/services/notification.service';

interface StudentAttendance {
  student: any; // Alterado de studentName para student
  dates: { [date: string]: boolean };
}

@Component({
  selector: 'app-student-login-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-login-list.component.html',
  styleUrls: ['./student-login-list.component.scss'],
})
export class StudentLoginListComponent implements OnInit {
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private studentService = inject(StudentService);
  private systemLogService = inject(SystemLogService);

  // Signals
  currentMonth = signal<Date>(new Date());
  daysInMonth = computed(() => {
    const date = this.currentMonth();
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from(
      { length: daysInMonth },
      (_, i) => new Date(year, month, i + 1)
    );
  });

  studentAttendance = signal<StudentAttendance[]>([]);

  ngOnInit(): void {
    this.loadAttendanceData();
  }

  async loadAttendanceData(): Promise<void> {
    try {
      this.loadingService.show();

      const logs = await this.systemLogService.getStudentLoginLogs().toPromise();
      const attendanceMap: {
        [studentId: string]: {
          student: any;
          dates: { [date: string]: boolean };
        };
      } = {};

      for (const log of logs!) {
        const studentId = log.details.studentId;
        const date = new Date(log.timestamp).toISOString().split('T')[0];

        if (!attendanceMap[studentId]) {
          attendanceMap[studentId] = {
            student: await this.studentService.selectStudent(studentId),
            dates: {},
          };
        }
        attendanceMap[studentId].dates[date] = true;
      }

      this.studentAttendance.set(Object.values(attendanceMap));
      this.notificationService.success('Dados de presença carregados com sucesso');
    } catch (error) {
      this.notificationService.error('Erro ao carregar dados de presença');
      console.error(error);
    } finally {
      this.loadingService.hide();
    }
  }

  previousMonth(): void {
    this.currentMonth.update(date =>
      new Date(date.getFullYear(), date.getMonth() - 1, 1)
    );
    this.loadAttendanceData();
  }

  nextMonth(): void {
    this.currentMonth.update(date =>
      new Date(date.getFullYear(), date.getMonth() + 1, 1)
    );
    this.loadAttendanceData();
  }
}
