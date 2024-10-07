import { Component, OnInit, viewChild, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PackageManagementService } from '../../services/package-management.service';
import { PackageService } from '../../services/package.service';
import { Package } from '../../../../core/models/package.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { CourseSelectorComponent } from '../../../course/components/course-selector/course-selector.component';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';

@Component({
  selector: 'app-package-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CourseSelectorComponent,
    ModalComponent,
  ],
  templateUrl: './package-details.component.html',
  styleUrls: ['./package-details.component.scss'],
})
export class PackageDetailsComponent implements OnInit {
  courseSelector = viewChild(CourseSelectorComponent);
  packageForm!: FormGroup;
  packageId!: string;
  loading = signal(true);
  error = signal('');
  isFormDirty = signal(false);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private packageManagementService: PackageManagementService,
    private packageService: PackageService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.packageId = this.route.snapshot.paramMap.get('id')!;

    if (!this.packageId) {
      this.error.set('ID do pacote não encontrado.');
      this.loading.set(false);
      return;
    }

    this.loadPackageData();
  }

  async loadPackageData() {
    try {
      const packageItem = await this.packageService.getById(this.packageId);

      this.packageForm = this.fb.group({
        id: [{ value: packageItem.id, disabled: true }, Validators.required],
        name: [packageItem.name, Validators.required],
        price: [packageItem.price, Validators.required],
        workHours: [packageItem.workHours, Validators.required],
        description: [packageItem.description, Validators.required],
        courses: [packageItem.courses],
      });

      this.courseSelector()?.selectedCourseIds.set(new Set(packageItem.courses));

      this.loading.set(false);
      this.packageForm.valueChanges.subscribe(() => {
        this.isFormDirty.set(true);
      });
    } catch (err) {
      this.error.set('Erro ao carregar os dados do pacote');
      this.loading.set(false);
    }
  }

  onCoursesChanged() {
    this.isFormDirty.set(true);
  }

  onSubmit() {
    if (this.packageForm.valid && this.isFormDirty()) {
      const updatedPackage = this.packageForm.value as Package;
      updatedPackage.courses = Array.from(this.courseSelector()!.selectedCourseIds());

      this.packageManagementService.update(this.packageId, updatedPackage).subscribe({
        next: () => {
          this.notificationService.showNotification(
            'Pacote atualizado com sucesso!',
            NotificationType.SUCCESS
          );
          this.router.navigate(['/admin/package-list']);
        },
        error: (error) => {
          this.notificationService.showNotification(
            'Erro ao atualizar o pacote. Por favor, tente novamente.',
            NotificationType.ERROR
          );
        }
      });
    } else if (!this.isFormDirty()) {
      this.notificationService.showNotification(
        'Nenhuma alteração foi feita.',
        NotificationType.INFO
      );
    } else {
      this.notificationService.showNotification(
        'Por favor, preencha todos os campos obrigatórios.',
        NotificationType.ERROR
      );
    }
  }
}
