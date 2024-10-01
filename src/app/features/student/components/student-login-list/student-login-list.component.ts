import { Component, OnInit, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { SystemLogService } from '../../../../core/services/system-log.service';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../services/student.service';
import { Student } from '../../../../core/models/student.model';

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
  studentAttendance$!: Observable<StudentAttendance[]>;
  currentMonth: Date = new Date();
  daysInMonth: Date[] = [];
  studentService = inject(StudentService);

  constructor(private systemLogService: SystemLogService) {}

  ngOnInit(): void {
    this.updateCalendar();

    this.loadAttendanceData();
  }

  updateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    this.daysInMonth = Array.from(
      { length: daysInMonth },
      (_, i) => new Date(year, month, i + 1)
    );
  }

  loadAttendanceData(): void {
    this.studentAttendance$ = this.systemLogService.getStudentLoginLogs().pipe(
      // Usamos switchMap para lidar com as operações assíncronas
      switchMap(async (logs) => {
        const attendanceMap: {
          [studentId: string]: {
            student: any;
            dates: { [date: string]: boolean };
          };
        } = {};

        // Usamos um loop for...of para poder usar await
        for (const log of logs) {
          const studentId = log.details.studentId;
          const date = new Date(log.timestamp).toISOString().split('T')[0];
          if (!attendanceMap[studentId]) {
            attendanceMap[studentId] = {
              student: await this.studentService.getById(studentId),
              dates: {},
            };
          }
          attendanceMap[studentId].dates[date] = true;
        }

        return Object.values(attendanceMap);
      }),
      // Convertemos o resultado de volta para um Observable
      map((attendanceArray) => attendanceArray)
    );
  }

  previousMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
      1
    );
    this.updateCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1
    );
    this.updateCalendar();
  }
}
