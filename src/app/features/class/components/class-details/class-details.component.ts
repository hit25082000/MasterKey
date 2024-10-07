import { PackageService } from '../../../package/services/package.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Course } from '../../../../core/models/course.model';
import { ClassManagementService } from '../../services/class-management.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ClassSelectorComponent } from '../class-selector/class-selector.component';
import { StudentsSelectorComponent } from './../../../student/components/students-selector/students-selector.component';
import { TeacherSelectorComponent } from '../../../employees/components/teacher-selector/teacher-selector.component';
import { Student } from '../../../../core/models/student.model';
import { ClassService } from '../../services/class.service';
import { DayWeekSelectorComponent } from '../day-week-selector/day-week-selector.component';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';

@Component({
  selector: 'app-class-detail',
  standalone: true,
  imports: [
    CommonModule,
    DayWeekSelectorComponent,
    StudentsSelectorComponent,
    TeacherSelectorComponent,
    ReactiveFormsModule,
    ModalComponent,
    ClassSelectorComponent,
  ],
  templateUrl: './class-details.component.html',
  styleUrls: ['./class-details.component.scss'],
})
export class ClassDetailsComponent implements OnInit {
  classForm!: FormGroup;
  classId!: string;
  loading: boolean = true;
  error: string = '';
  studentList: string[] = [];
  teacherId: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private classManagementService: ClassManagementService,
    private classService: ClassService,
    private notificationService: NotificationService
  ) {}

  async ngOnInit() {
    this.classId = this.route.snapshot.paramMap.get('id')!;

    if (!this.classId) {
      this.handleError('ID da turma não encontrada.');
      return;
    }

    try {
      const classItem = await this.classService.getById(this.classId);
      this.initializeForm(classItem);
      this.loading = false;
    } catch (err) {
      this.handleError('Erro ao carregar os dados da turma');
    }
  }

  private initializeForm(classItem: any): void {
    this.teacherId = classItem.teacher;
    this.classForm = this.fb.group({
      id: [classItem.id],
      name: [classItem.name, Validators.required],
      time: [classItem.time, Validators.required],
      dayWeek: [classItem.dayWeek, Validators.required],
      startDate: [classItem.startDate, Validators.required],
      finishDate: [classItem.finishDate, Validators.required],
      status: [true],
      room: [classItem.room, Validators.required],
      teacher: [classItem.teacher, Validators.required],
      students: [[], Validators.required],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.classForm.invalid) {
      this.notificationService.showNotification('Formulário inválido. Por favor, preencha todos os campos obrigatórios.', NotificationType.ERROR);
      return;
    }

    try {
      await this.classManagementService.update(this.classForm.value);
      this.notificationService.showNotification('Turma atualizada com sucesso!', NotificationType.SUCCESS);
      this.router.navigate(['/admin/class-list']);
    } catch (error) {
      this.handleError('Erro ao atualizar turma', error);
    }
  }

  private handleError(message: string, error?: any): void {
    this.error = message;
    this.loading = false;
    this.notificationService.showNotification(this.error, NotificationType.ERROR);
    if (error) console.error(error);
  }
}
