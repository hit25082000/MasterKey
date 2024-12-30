import { LoadingService } from './../../../../shared/services/loading.service';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemLogService } from '../../../../core/services/system-log.service';
import { StudentService } from '../../services/student.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { SearchBarComponent } from "../../../../shared/components/search-bar/search-bar.component";
import { Student } from '../../../../core/models/student.model';

interface StudentAttendance {
  student: Student;
  dates: { [date: string]: boolean };
}

interface WeekGroup {
  weekNumber: number;
  days: Date[];
}

@Component({
  selector: 'app-student-login-list',
  standalone: true,
  imports: [CommonModule, SearchBarComponent],
  templateUrl: './student-login-list.component.html',
  styleUrls: ['./student-login-list.component.scss'],
})
export class StudentLoginListComponent implements OnInit {
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private studentService = inject(StudentService);
  private systemLogService = inject(SystemLogService);

  // Mapeamento de meses em português
  private monthsInPortuguese: { [key: string]: string } = {
    'January': 'Janeiro',
    'February': 'Fevereiro',
    'March': 'Março',
    'April': 'Abril',
    'May': 'Maio',
    'June': 'Junho',
    'July': 'Julho',
    'August': 'Agosto',
    'September': 'Setembro',
    'October': 'Outubro',
    'November': 'Novembro',
    'December': 'Dezembro'
  };

  // Signals
  currentMonth = signal<Date>(new Date());
  today = signal<Date>(new Date());
  studentAttendance = signal<StudentAttendance[]>([]);
  isLoading = signal<boolean>(false);

  // Computed para o mês atual em português
  formattedMonth = computed(() => {
    const date = this.currentMonth();
    const monthInEnglish = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${this.monthsInPortuguese[monthInEnglish]} ${year}`;
  });

  // Computed para dias do mês agrupados por semana (excluindo domingos)
  daysInMonth = computed(() => {
    const date = this.currentMonth();
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = Array.from(
      { length: daysInMonth },
      (_, i) => new Date(year, month, i + 1)
    ).filter(date => date.getDay() !== 0); // Exclui domingos

    // Agrupa os dias por semana
    const weeks: WeekGroup[] = [];
    let currentWeek: Date[] = [];
    let currentWeekNumber = 0;

    days.forEach((day) => {
      // Se é segunda-feira (1) ou é o primeiro dia
      if (day.getDay() === 1 || currentWeek.length === 0) {
        if (currentWeek.length > 0) {
          weeks.push({ weekNumber: currentWeekNumber++, days: [...currentWeek] });
          currentWeek = [];
        }
      }
      currentWeek.push(day);
    });

    // Adiciona a última semana se houver dias restantes
    if (currentWeek.length > 0) {
      weeks.push({ weekNumber: currentWeekNumber, days: currentWeek });
    }

    return weeks;
  });

  // Verifica se é domingo
  isSunday(date: Date): boolean {
    return date.getDay() === 0;
  }

  // Verifica se é o primeiro dia da semana (segunda-feira)
  isFirstDayOfWeek(date: Date): boolean {
    return date.getDay() === 1;
  }

  async ngOnInit(): Promise<void> {
    await this.loadAttendanceData();
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
          const student = await this.studentService.selectStudent(studentId);
          attendanceMap[studentId] = {
            student: student(),
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

  // Métodos de navegação
  previousMonth(): void {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    this.loadAttendanceData();
  }

  nextMonth(): void {
    const current = this.currentMonth();
    const nextDate = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    if (nextDate <= this.today()) {
      this.currentMonth.set(nextDate);
      this.loadAttendanceData();
    }
  }

  // Verifica se uma data é futura
  isFutureDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  }

  // Verifica se é o mês atual
  isCurrentMonth = computed(() => {
    const current = this.currentMonth();
    const today = this.today();
    return current.getMonth() === today.getMonth() &&
           current.getFullYear() === today.getFullYear();
  });
}
