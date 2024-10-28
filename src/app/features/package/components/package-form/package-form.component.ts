import { Component, OnInit, viewChild, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PackageManagementService } from '../../services/package-management.service';
import { PackageService } from '../../services/package.service';
import { Package } from '../../../../core/models/package.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { CourseSelectorComponent } from '../../../course/components/course-selector/course-selector.component';
import { NotificationType } from '../../../../shared/models/notifications-enum';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-package-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    ModalComponent,
    CourseSelectorComponent,
  ],
  templateUrl: './package-form.component.html',
  styleUrls: ['./package-form.component.scss'],
})
export class PackageFormComponent implements OnInit {
  courseSelector = viewChild(CourseSelectorComponent);
  packageForm!: FormGroup;
  packageId: string | null = null;
  isEditMode = computed(() => !!this.packageId);
  isFormDirty = signal(false);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private packageManagementService: PackageManagementService,
    private packageService: PackageService,
    private notificationService: NotificationService,
    private router: Router,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadingService.show();
    this.packageId = this.route.snapshot.paramMap.get('id');

    this.initForm();

    if (this.isEditMode()) {
      this.loadPackageData();
    } else {
      this.loadingService.hide();
    }
  }

  initForm(): void {
    this.packageForm = this.fb.group({
      name: ['', Validators.required],
      price: ['', Validators.required],
      description: ['', Validators.required],
      workHours: ['', Validators.required],
      courses: [[]],
    });

    this.packageForm.valueChanges.subscribe(() => {
      this.isFormDirty.set(true);
    });
  }

  async loadPackageData() {
    try {
      const packageItem = await this.packageService.getById(this.packageId!);
      this.packageForm.patchValue(packageItem);
      this.courseSelector()?.selectedCourseIds.set(new Set(packageItem.courses));
      this.isFormDirty.set(false);
    } catch (err) {
      this.notificationService.success(
        'Erro ao carregar os dados do pacote',
        1
      );
    } finally {
      this.loadingService.hide();
    }
  }

  onCoursesChanged() {
    this.isFormDirty.set(true);
  }

  onSubmit() {
    this.loadingService.show();
    if (this.packageForm.valid) {
      const packageData: Package = this.packageForm.value;
      packageData.courses = Array.from(this.courseSelector()!.selectedCourseIds());

      const operation = this.isEditMode()
        ? this.packageManagementService.update(this.packageId!, packageData)
        : this.packageManagementService.create(packageData);

      operation.subscribe({
        next: () => {
          this.notificationService.success(
            `Pacote ${this.isEditMode() ? 'atualizado' : 'criado'} com sucesso!`,
            1
          );
          this.router.navigate(['/admin/package-list']);
        },
        error: (error) => {
          this.notificationService.success(
            `Erro ao ${this.isEditMode() ? 'atualizar' : 'criar'} o pacote. Por favor, tente novamente.`,
            1
          );
        },
        complete: () => {
          this.loadingService.hide();
        }
      });
    } else {
      this.notificationService.success(
        'Por favor, preencha todos os campos obrigatórios.',
        1
      );
      this.loadingService.hide();
    }
  }
}
