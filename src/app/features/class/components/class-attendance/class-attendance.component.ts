import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ClassManagementService } from '../../services/class-management.service';
import { StudentService } from '../../../student/services/student.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { Class } from '../../../../core/models/class.model';
import { Student } from '../../../../core/models/student.model';
import { Attendance } from '../../../../core/models/attendance.model';
import { firstValueFrom } from 'rxjs';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ClassService } from '../../services/class.service';

@Component({
  selector: 'app-class-attendance',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <div class="attendance-container">
      <div class="header-actions">
        <h2>Lista de Presença - {{ currentClass()?.name }}</h2>
        <button mat-raised-button color="primary" (click)="printAttendanceReport()">
          <mat-icon>print</mat-icon>
          Imprimir Relatório
        </button>
      </div>

      <div class="date-filters">
        <mat-form-field>
          <mat-label>Mês</mat-label>
          <input matInput [matDatepicker]="picker" [(ngModel)]="selectedDate" (dateChange)="onDateChange($event)">
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker 
                         startView="year" 
                         [startAt]="selectedDate()"
                         (monthSelected)="onMonthSelected($event)"
                         >
          </mat-datepicker>
        </mat-form-field>
      </div>

      <div class="attendance-table">
        <div class="header-row">
          <div class="student-name-header">Nome</div>
          @for (day of daysInMonth(); track day) {
            <div class="day-header" [class.week-start]="isWeekStart(day)">{{ day }}</div>
          }
        </div>

        @for (student of studentsList(); track student.id) {
          <div class="student-row">
            <div class="student-name">{{ student.name }}</div>
            @for (day of daysInMonth(); track day) {
              <div class="day-cell" [class.week-start]="isWeekStart(day)">
                <button mat-icon-button 
                        [color]="isStudentPresentOnDay(student.id, day) ? 'primary' : ''" 
                        (click)="toggleAttendance(student.id, day)">
                  <mat-icon>{{ isStudentPresentOnDay(student.id, day) ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                </button>
              </div>
            }
          </div>
        }

        @if (studentsList().length === 0) {
          <div class="no-students">
            <mat-icon>warning</mat-icon>
            <p>Nenhum aluno encontrado nesta turma</p>
          </div>
        }
      </div>

      <div class="summary">
        <p>Total de Alunos: {{ studentsList().length }}</p>
        <p>Média de Presenças: {{ averageMonthlyPresence() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .attendance-container {
      padding: 2rem;
      
      h2 {
        margin-bottom: 2rem;
        color: #333;
      }
    }

    .date-filters {
      margin-bottom: 2rem;
      
      mat-form-field {
        width: 200px;
      }
    }

    .attendance-table {
      position: relative;
      display: block;
      overflow-x: auto;
      white-space: nowrap;
      margin-bottom: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .header-row, .student-row {
      display: flex;
      min-width: max-content;
    }

    .student-name-header, .day-header,
    .student-name, .day-cell {
      flex: 0 0 auto;
      padding: 1rem;
      text-align: center;
      vertical-align: middle;
      border-bottom: 1px solid #eee;
    }

    .student-name-header, .student-name {
      position: sticky;
      left: 0;
      background: white;
      z-index: 1;
      width: 100px;
      text-align: left;
      border-right: 2px solid #e0e0e0;
    }

    .day-header, .day-cell {
      width: 50px;
    }

    .header-row {
      background: #f5f5f5;
      font-weight: 500;
      position: sticky;
      top: 0;
      z-index: 2;

      .student-name-header {
        z-index: 3;
      }
    }

    .day-cell {
      button {
        transform: scale(0.8);
      }
    }

    .week-start {
      border-left: 2px solid #e0e0e0;
    }

    .no-students {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      
      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 1rem;
        color: #ff9800;
      }
      
      p {
        color: #666;
      }
    }

    .summary {
      display: flex;
      gap: 2rem;
      padding: 1rem;
      background-color: #f5f5f5;
      border-radius: 8px;
      
      p {
        margin: 0;
        font-weight: 500;
      }
    }

    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
  `]
})
export class ClassAttendanceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private classService = inject(ClassService);
  private classManagementService = inject(ClassManagementService);
  private studentService = inject(StudentService);
  private notificationService = inject(NotificationService);
  public loadingService = inject(LoadingService);

  currentClass = signal<Class | null>(null);
  classStudents = signal<string[]>([]);
  attendanceData = signal<Attendance[]>([]);
  selectedDate = signal(new Date());

  // Computed signal para mapear os estudantes
  students = computed(() => {
    const allStudents = this.studentService.students();
    const classStudentsIds = this.classStudents();
    
    if (!classStudentsIds?.length || !allStudents.length) {
      return {};
    }

    const studentsMap: Record<string, Student> = {};
    classStudentsIds.forEach(studentId => {
      const student = allStudents.find(s => s.id === studentId);
      if (student) {
        studentsMap[student.id] = student;
      }
    });

    return studentsMap;
  });

  studentsList = computed(() => {
    return Object.values(this.students());
  });

  daysInMonth = computed(() => {
    const date = this.selectedDate();
    const totalDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  });

  isWeekStart(day: number): boolean {
    const date = this.selectedDate();
    const checkDate = new Date(date.getFullYear(), date.getMonth(), day);
    return checkDate.getDay() === 0; // Domingo é início da semana
  }

  constructor() {
    effect(() => {
      const currentClassValue = this.currentClass();
      if (currentClassValue) {
        this.loadAttendanceData();
      }
    });

    // Efeito para recarregar dados quando a data mudar
    effect(() => {
      const currentDate = this.selectedDate(); // Dependência explícita
      const currentClassValue = this.currentClass();
      if (currentClassValue) {
        this.loadAttendanceData();
      }
    });
  }

  ngOnInit() {
    const classId = this.route.snapshot.paramMap.get('id');
    if (classId) {
      this.loadClassData(classId);
    }
  }

  private async loadClassData(classId: string) {
    this.loadingService.show();
    this.classManagementService.getClass(classId).subscribe({
      next: (classData) => {
        if (classData) {
          this.currentClass.set(classData);
        } else {
          this.notificationService.error('Turma não encontrada');
        }
        this.loadingService.hide();
      },
      error: (error) => {
        console.error('Erro ao carregar turma:', error);
        this.notificationService.error('Erro ao carregar dados da turma');
        this.loadingService.hide();
      }
    });

    this.classStudents.set(await this.classService.getClassStudents(classId))
  }

  private loadAttendanceData() {
    if (!this.currentClass()) return;

    const date = new Date(this.selectedDate());
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    this.loadingService.show();
    this.classManagementService.getClassAttendance(
      this.currentClass()!.id!,
      startDate,
      endDate
    ).subscribe({
      next: (attendance) => {
        if (attendance) {
          this.attendanceData.set(attendance);
        }
        this.loadingService.hide();
      },
      error: (error) => {
        console.error('Erro ao carregar presenças:', error);
        this.notificationService.error('Erro ao carregar presenças');
        this.loadingService.hide();
      }
    });
  }

  onMonthSelected(event: Date) {
    this.selectedDate.set(event);
  }

  onDateChange(event: any) {
    if (!event.value) return;
    const newDate = new Date(event.value);
    this.selectedDate.set(newDate);
  }

  isStudentPresentOnDay(studentId: string, day: number): boolean {
    const selectedDate = this.selectedDate();
    const checkDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    
    return this.attendanceData().some(a => {
      const attendanceDate = new Date(a.date);
      return a.studentId === studentId && 
             a.present &&
             attendanceDate.getFullYear() === checkDate.getFullYear() &&
             attendanceDate.getMonth() === checkDate.getMonth() &&
             attendanceDate.getDate() === checkDate.getDate();
    });
  }

  async toggleAttendance(studentId: string, day: number) {
    if (!this.currentClass()) return;

    const selectedDate = this.selectedDate();
    const toggleDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day, 12);
    
    const currentAttendance = this.attendanceData()
      .find(a => {
        const attendanceDate = new Date(a.date);
        return a.studentId === studentId && 
               attendanceDate.getFullYear() === toggleDate.getFullYear() &&
               attendanceDate.getMonth() === toggleDate.getMonth() &&
               attendanceDate.getDate() === toggleDate.getDate();
      });

    const newAttendance: Attendance = {
      id: currentAttendance?.id || crypto.randomUUID(),
      classId: this.currentClass()!.id!,
      studentId: studentId,
      date: toggleDate,
      present: !currentAttendance?.present,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.loadingService.show();
    try {
      await firstValueFrom(this.classManagementService.updateAttendance(newAttendance));
      
      this.attendanceData.update(data => {
        const filtered = data.filter(a => {
          const attendanceDate = new Date(a.date);
          return !(a.studentId === studentId && 
                  attendanceDate.getFullYear() === toggleDate.getFullYear() &&
                  attendanceDate.getMonth() === toggleDate.getMonth() &&
                  attendanceDate.getDate() === toggleDate.getDate());
        });
        return [...filtered, newAttendance];
      });
      
      this.notificationService.success('Presença atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar presença:', error);
      this.notificationService.error('Erro ao atualizar presença');
    } finally {
      this.loadingService.hide();
    }
  }

  getMonthlyPresenceCount(studentId: string): number {
    const selectedMonth = this.selectedDate().getMonth();
    const selectedYear = this.selectedDate().getFullYear();
    
    return this.attendanceData()
      .filter(a => {
        const attendanceDate = new Date(a.date);
        return a.studentId === studentId && 
               a.present &&
               attendanceDate.getMonth() === selectedMonth &&
               attendanceDate.getFullYear() === selectedYear;
      }).length;
  }

  averageMonthlyPresence(): string {
    const totalStudents = this.studentsList().length;
    if (totalStudents === 0) return '0';

    const totalPresences = this.studentsList()
      .reduce((sum, student) => sum + this.getMonthlyPresenceCount(student.id), 0);

    return (totalPresences / totalStudents).toFixed(1);
  }

  printAttendanceReport() {
    const selectedMonth = this.selectedDate();
    const monthName = selectedMonth.toLocaleString('pt-BR', { month: 'long' });
    const year = selectedMonth.getFullYear();
    const days = this.daysInMonth();

    // Criar o conteúdo do relatório
    let reportContent = `
      <html>
        <head>
          <title>Relatório de Presenças - ${monthName} ${year}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f5f5f5; }
            .header { margin-bottom: 20px; }
            .presence-count { margin-top: 20px; }
            .day-cell { width: 30px; }
            .name-cell { text-align: left; min-width: 200px; }
            .present { color: green; font-weight: bold; }
            .absent { color: red; font-weight: bold; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Relatório de Presenças - ${this.currentClass()?.name}</h2>
            <p>Mês: ${monthName} ${year}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th class="name-cell">Aluno</th>
                ${days.map(day => `<th class="day-cell">${day}</th>`).join('')}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
    `;

    // Adicionar dados de cada aluno
    this.studentsList().forEach(student => {
      const presenceCount = this.getMonthlyPresenceCount(student.id);
      
      reportContent += `
        <tr>
          <td class="name-cell">${student.name}</td>
          ${days.map(day => {
            const isPresent = this.isStudentPresentOnDay(student.id, day);
            return `<td class="day-cell ${isPresent ? 'present' : 'absent'}">${isPresent ? 'P' : 'F'}</td>`;
          }).join('')}
          <td>${presenceCount}</td>
        </tr>
      `;
    });

    // Adicionar resumo
    reportContent += `
            </tbody>
          </table>

          <div class="presence-count">
            <p>Total de Alunos: ${this.studentsList().length}</p>
            <p>Média de Presenças: ${this.averageMonthlyPresence()}</p>
            <p>Legenda: P = Presente, F = Falta</p>
          </div>
        </body>
      </html>
    `;

    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();

      // Aguardar o carregamento do conteúdo e imprimir
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      this.notificationService.error('Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está ativado.');
    }
  }
}
