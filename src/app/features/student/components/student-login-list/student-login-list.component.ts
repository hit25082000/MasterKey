import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemLogService } from '../../../../core/services/system-log.service';
import { StudentService } from '../../services/student.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { SearchBarComponent } from "../../../../shared/components/search-bar/search-bar.component";
import { Student } from '../../../../core/models/student.model';
import { Class, ClassAttendance } from '../../../../core/models/class.model';
import { LoadingService } from '../../../../shared/services/loading.service';
import { FormsModule } from '@angular/forms';
import { ClassService } from '../../../class/services/class.service';
import { firstValueFrom } from 'rxjs';

interface ClassWithAttendance extends Class {
  attendance: {
    [date: string]: {
      [studentId: string]: boolean;
    };
  };
}

@Component({
  selector: 'app-student-login-list',
  standalone: true,
  imports: [CommonModule, SearchBarComponent, FormsModule],
  template: `
    <div class="attendance-container">
      <header class="attendance-header">
        <h2>Lista de Presença</h2>
        <div class="month-navigation">
          <button (click)="previousMonth()">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span>{{ formatMonth(currentMonth()) }}</span>
          <button (click)="nextMonth()">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Carregando lista de presença...</p>
        </div>
      } @else {
        @for (classGroup of classes(); track classGroup.id) {
          <div class="class-attendance-card">
            <div class="class-header">
              <h3>{{ classGroup.name }}</h3>
              <div class="class-info">
                <span><i class="fas fa-clock"></i> {{ classGroup.time }}</span>
                <span><i class="fas fa-door-open"></i> {{ classGroup.room }}</span>
              </div>
            </div>

            <div class="attendance-table">
              <table>
                <thead>
                  <tr>
                    <th class="student-col">Aluno</th>
                    @for (day of getDaysInMonth(); track day) {
                      <th class="date-col" [class.today]="isToday(day)">
                        {{ formatDay(day) }}
                      </th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (studentId of classGroup.studentIds; track studentId) {
                    @if (classGroup.students[studentId]) {
                      <tr>
                        <td class="student-col">{{ classGroup.students[studentId].name }}</td>
                        @for (day of getDaysInMonth(); track day) {
                          <td class="attendance-col"
                              [class.present]="isPresent(classGroup.id!, studentId, day)"
                              [class.absent]="!isPresent(classGroup.id!, studentId, day)"
                              (click)="toggleAttendance(classGroup.id!, studentId, day)">
                            <i class="fas" 
                               [class.fa-check]="isPresent(classGroup.id!, studentId, day)"
                               [class.fa-times]="!isPresent(classGroup.id!, studentId, day)">
                            </i>
                          </td>
                        }
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `,
  styleUrls: ['./student-login-list.component.scss']
})
export class StudentLoginListComponent implements OnInit {
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private studentService = inject(StudentService);
  private classService = inject(ClassService);
  private systemLogService = inject(SystemLogService);

  // Signals
  currentMonth = signal<Date>(new Date());
  classes = signal<ClassWithAttendance[]>([]);
  loading = signal<boolean>(true);

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

  async ngOnInit() {
    await this.loadClasses();
    await this.loadAttendance();
  }

  private async loadClasses() {
    this.loading.set(true);
    try {
      const classes = await this.classService.classes;
      if (!classes) {
        throw new Error('Nenhuma turma encontrada');
      }

      const classesWithAttendance: ClassWithAttendance[] = classes().map(classData => ({
        ...classData,
        students: {},
        attendance: {}
      }));

      // Carrega os dados dos estudantes para cada turma
      for (const classData of classesWithAttendance) {
        await this.loadStudentsForClass(classData);
      }

      this.classes.set(classesWithAttendance);
    } catch (error) {
      this.notificationService.error('Erro ao carregar as turmas');
      console.error('Erro ao carregar as turmas:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadAttendance() {
    try {
      const logs = await firstValueFrom(this.systemLogService.getStudentLoginLogs());
      const updatedClasses = this.classes().map(classData => {
        const classAttendance = { ...classData.attendance };
        
        logs.forEach(log => {
          if (log.details.classId === classData.id) {
            const date = new Date(log.timestamp);
            const dateStr = date.toISOString().split('T')[0];
            const studentId = log.details.studentId;
            
            if (!classAttendance[dateStr]) {
              classAttendance[dateStr] = {};
            }
            classAttendance[dateStr][studentId] = true;
          }
        });

        return {
          ...classData,
          attendance: classAttendance
        };
      });

      this.classes.set(updatedClasses);
    } catch (error) {
      console.error('Erro ao carregar presenças:', error);
      this.notificationService.error('Erro ao carregar presenças');
    }
  }

  private async loadStudentsForClass(classData: ClassWithAttendance) {
    try {
      for (const studentId of classData.studentIds) {
        const student = await this.studentService.selectStudent(studentId);
        if (student) {
          classData.students[studentId] = student()!;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estudantes da turma:', error);
    }
  }

  getStudentsFromClass(classGroup: ClassWithAttendance): Student[] {
    return Object.values(classGroup.students);
  }

  getDaysInMonth(): Date[] {
    const year = this.currentMonth().getFullYear();
    const month = this.currentMonth().getMonth();
    const days: Date[] = [];
    const lastDay = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= lastDay; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }

  formatMonth(date: Date): string {
    const monthName = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${this.monthsInPortuguese[monthName]} ${year}`;
  }

  formatDay(date: Date): string {
    return date.getDate().toString().padStart(2, '0');
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  previousMonth() {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() - 1));
  }

  nextMonth() {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() + 1));
  }

  isPresent(classId: string, studentId: string, date: Date): boolean {
    const classData = this.classes().find(c => c.id === classId);
    if (!classData) return false;

    const dateStr = date.toISOString().split('T')[0];
    return classData.attendance[dateStr]?.[studentId] ?? false;
  }

  async toggleAttendance(classId: string, studentId: string, date: Date) {
    const dateStr = date.toISOString().split('T')[0];
    const updatedClasses = this.classes().map(classData => {
      if (classData.id !== classId) return classData;

      if (!classData.attendance[dateStr]) {
        classData.attendance[dateStr] = {};
      }

      classData.attendance[dateStr][studentId] = !classData.attendance[dateStr][studentId];
      return classData;
    });

    this.classes.set(updatedClasses);

    try {
      const isPresent = this.isPresent(classId, studentId, date);
      
      if (isPresent) {
        // Registra a presença
        await firstValueFrom(this.systemLogService.logStudentLogin(studentId));
      } else {
        // Remove a presença (registra uma ação de remoção)
        await firstValueFrom(this.systemLogService.logStudentAction(studentId, 'attendance_removed', {
          classId,
          date: dateStr
        }));
      }

      this.notificationService.success('Presença atualizada com sucesso');
    } catch (error) {
      this.notificationService.error('Erro ao salvar presença');
      console.error('Erro ao salvar presença:', error);
    }
  }
}
