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
import { Class } from '../../../../core/models/class.model';
import { Student } from '../../../../core/models/student.model';
import { Attendance } from '../../../../core/models/attendance.model';
import { firstValueFrom } from 'rxjs';
import { provideNativeDateAdapter } from '@angular/material/core';

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
      <h2>Lista de Presença - {{ currentClass()?.name }}</h2>

      <div class="date-filters">
        <mat-form-field>
          <mat-label>Data</mat-label>
          <input matInput [matDatepicker]="picker" [(ngModel)]="selectedDate" (dateChange)="onDateChange($event)">
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
      </div>

      <div class="students-list">
        @for (student of studentsList(); track student.id) {
          <div class="student-card" [class.present]="isStudentPresent(student.id)">
            <div class="student-info">
              <span class="student-name">{{ student.name }}</span>
            </div>
            <button mat-icon-button 
                    [color]="isStudentPresent(student.id) ? 'primary' : ''" 
                    (click)="toggleAttendance(student.id)">
              <mat-icon>{{ isStudentPresent(student.id) ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
            </button>
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
        <p>Presentes: {{ presentCount() }}</p>
        <p>Ausentes: {{ studentsList().length - presentCount() }}</p>
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

    .students-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }

    .student-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background-color: #f5f5f5;
      border-radius: 8px;
      transition: all 0.3s ease;

      &.present {
        background-color: #e8f5e9;
        border-left: 4px solid #4caf50;
      }

      .student-info {
        .student-name {
          font-size: 1rem;
          font-weight: 500;
        }
      }

      button {
        transition: transform 0.2s ease;
        
        &:hover {
          transform: scale(1.1);
        }
      }
    }

    .no-students {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      background-color: #f5f5f5;
      border-radius: 8px;
      
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
  `]
})
export class ClassAttendanceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private classService = inject(ClassManagementService);
  private studentService = inject(StudentService);
  private notificationService = inject(NotificationService);

  currentClass = signal<Class | null>(null);
  attendanceData = signal<Attendance[]>([]);
  selectedDate = signal(new Date());

  // Computed signal para mapear os estudantes
  students = computed(() => {
    const currentClassValue = this.currentClass();
    const allStudents = this.studentService.students();
    
    if (!currentClassValue?.studentIds?.length || !allStudents.length) {
      return {};
    }

    const studentsMap: Record<string, Student> = {};
    currentClassValue.studentIds.forEach(studentId => {
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

  presentCount = computed(() => {
    return this.attendanceData()
      .filter(a => this.isSameDay(new Date(a.date), this.selectedDate()))
      .filter(a => a.present).length;
  });

  constructor() {
    effect(() => {
      if (this.currentClass()) {
        this.loadAttendanceData();
      }
    });

    // Efeito para recarregar dados quando a data mudar
    effect(() => {
      this.selectedDate(); // Dependência explícita
      if (this.currentClass()) {
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

  private loadClassData(classId: string) {
    this.classService.getClass(classId).subscribe({
      next: (classData) => {
        if (classData) {
          this.currentClass.set(classData);
        } else {
          this.notificationService.error('Turma não encontrada');
        }
      },
      error: (error) => {
        console.error('Erro ao carregar turma:', error);
        this.notificationService.error('Erro ao carregar dados da turma');
      }
    });
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private loadAttendanceData() {
    if (!this.currentClass()) return;

    const startDate = new Date(this.selectedDate());
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(this.selectedDate());
    endDate.setUTCHours(23, 59, 59, 999);

    this.classService.getClassAttendance(
      this.currentClass()!.id!,
      startDate,
      endDate
    ).subscribe({
      next: (attendance) => {
        if (attendance) {
          // Removendo duplicatas usando o ID do estudante como chave e a data específica
          const uniqueAttendance = attendance.reduce((acc, curr) => {
            if (curr.date) {
              // Usando a data específica para a chave
              const currDate = new Date(curr.date);
              currDate.setUTCHours(0, 0, 0, 0);
              const key = `${curr.studentId}_${currDate.toISOString()}`;
              
              const existingEntry = acc[key];
              if (!existingEntry || (curr.createdAt && existingEntry.createdAt && 
                  new Date(curr.createdAt) > new Date(existingEntry.createdAt))) {
                acc[key] = curr;
              }
            }
            return acc;
          }, {} as Record<string, Attendance>);

          this.attendanceData.set(Object.values(uniqueAttendance));
        }
      },
      error: (error) => {
        console.error('Erro ao carregar presenças:', error);
        this.notificationService.error('Erro ao carregar presenças');
      }
    });
  }

  onDateChange(event: any) {
    if (!event.value) return;
    
    const newDate = new Date(event.value);
    newDate.setUTCHours(12, 0, 0, 0);
    this.selectedDate.set(newDate);
  }

  isStudentPresent(studentId: string): boolean {
    const selectedDate = new Date(this.selectedDate());
    selectedDate.setUTCHours(0, 0, 0, 0);
    
    const attendances = this.attendanceData().filter(a => {
      const attendanceDate = new Date(a.date);
      attendanceDate.setUTCHours(0, 0, 0, 0);
      return a.studentId === studentId && 
             attendanceDate.getTime() === selectedDate.getTime();
    });

    if (attendances.length > 0) {
      return attendances[attendances.length - 1].present;
    }
    
    return false;
  }

  async toggleAttendance(studentId: string) {
    if (!this.currentClass()) return;

    const selectedDate = new Date(this.selectedDate());
    selectedDate.setUTCHours(12, 0, 0, 0);
    
    const currentAttendance = this.attendanceData()
      .find(a => {
        const attendanceDate = new Date(a.date);
        attendanceDate.setUTCHours(0, 0, 0, 0);
        const compareDate = new Date(selectedDate);
        compareDate.setUTCHours(0, 0, 0, 0);
        return a.studentId === studentId && 
               attendanceDate.getTime() === compareDate.getTime();
      });

    const newAttendance: Attendance = {
      id: currentAttendance?.id || crypto.randomUUID(),
      classId: this.currentClass()!.id!,
      studentId: studentId,
      date: selectedDate,
      present: !currentAttendance?.present,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      await firstValueFrom(this.classService.updateAttendance(newAttendance));
      
      this.attendanceData.update(data => {
        const filtered = data.filter(a => {
          const attendanceDate = new Date(a.date);
          attendanceDate.setUTCHours(0, 0, 0, 0);
          const compareDate = new Date(selectedDate);
          compareDate.setUTCHours(0, 0, 0, 0);
          return !(a.studentId === studentId && 
                  attendanceDate.getTime() === compareDate.getTime());
        });
        return [...filtered, newAttendance];
      });
      
      this.notificationService.success('Presença atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar presença:', error);
      this.notificationService.error('Erro ao atualizar presença');
    }
  }
}
