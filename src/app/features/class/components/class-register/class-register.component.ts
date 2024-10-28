import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClassManagementService } from '../../services/class-management.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DayWeekSelectorComponent } from '../day-week-selector/day-week-selector.component';
import { StudentsSelectorComponent } from './../../../student/components/students-selector/students-selector.component';
import { TeacherSelectorComponent } from '../../../employees/components/teacher-selector/teacher-selector.component';
import { NotificationType } from '../../../../shared/models/notifications-enum';
import { LoadingService } from '../../../../shared/services/loading.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-class-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DayWeekSelectorComponent,
    ModalComponent,
    StudentsSelectorComponent,
    CommonModule,
    TeacherSelectorComponent,
    ModalComponent,
  ],
  templateUrl: './class-register.component.html',
  styleUrls: ['./class-register.component.scss'],
})
export class ClassRegisterComponent implements OnInit {
  classForm!: FormGroup;
  router = inject(Router);

  constructor(
    private fb: FormBuilder,
    private classManagementService: ClassManagementService,
    private notificationService: NotificationService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.classForm = this.fb.group({
      name: ['', Validators.required],
      time: ['', Validators.required],
      dayWeek: [[], Validators.required],
      startDate: ['', Validators.required],
      finishDate: ['', Validators.required],
      status: [false, Validators.required],
      room: ['', Validators.required],
      teacher: ['', Validators.required],
      students: [[], Validators.required],
    });
  }

  onSubmit() {
    if (this.classForm.valid) {
      this.loadingService.show();
      this.classManagementService.create(this.classForm.value).subscribe(
        (response) => {
          this.loadingService.hide();
          this.notificationService.success(
            'Turma criada com sucesso!',
          1
          );
          this.router.navigate(['/admin/class-list']);
        },
        (error) => {
          this.loadingService.hide();
          this.notificationService.success(
            'Erro ao criar turma. Por favor, tente novamente.',
            1
          );
          console.error('Erro ao criar turma:', error);
        }
      );
    } else {
      this.notificationService.success(
        'Por favor, preencha todos os campos obrigatórios.',
        1
      );
    }
  }
}
