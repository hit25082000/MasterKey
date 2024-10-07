import { Component, OnInit, viewChild, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PackageManagementService } from '../../services/package-management.service';
import { Package } from '../../../../core/models/package.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { CourseSelectorComponent } from '../../../course/components/course-selector/course-selector.component';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';

@Component({
  selector: 'app-package-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    ModalComponent,
    CourseSelectorComponent,
  ],
  templateUrl: './package-register.component.html',
  styleUrls: ['./package-register.component.scss'],
})
export class PackageRegisterComponent implements OnInit {
  courseSelector = viewChild(CourseSelectorComponent);
  packageForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private packageManagementService: PackageManagementService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.packageForm = this.fb.group({
      name: ['', Validators.required], // Campo nome, obrigatório
      price: ['', Validators.required], // Campo nome, obrigatório
      description: ['', Validators.required], // Campo nome, obrigatório
      workHours: ['', Validators.required], // Campo nome, obrigatório
      courses: [[]], // Inicializa como array vazio
    });
  }

  onSubmit() {
    if (this.packageForm.valid) {
      const newPackage = this.packageForm.value as Package;

      newPackage.courses = Array.from(
        this.courseSelector()!.selectedCourseIds()
      );

      this.packageManagementService.create(newPackage).subscribe({
        next: (response) => {
          this.notificationService.showNotification(
            'Pacote criado com sucesso!',
            NotificationType.SUCCESS
          );
          this.router.navigate(['/admin/package-list']);
        },
        error: (error) => {
          this.notificationService.showNotification(
            'Erro ao criar o pacote. Por favor, tente novamente.',
            NotificationType.ERROR
          );
        }
      });
    } else {
      this.notificationService.showNotification(
        'Por favor, preencha todos os campos obrigatórios.',
        NotificationType.ERROR
      );
    }
  }
}
