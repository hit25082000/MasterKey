import { Component, OnInit, viewChild, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { PackageManagementService } from '../../services/package-management.service';
import { PackageService } from '../../services/package.service';
import { Package } from '../../../../core/models/package.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { CourseSelectorComponent } from '../../../course/components/course-selector/course-selector.component';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { GenericFormComponent } from '../../../../shared/components/generic-form/generic-form.component';
import { FormFieldConfig } from '../../../../shared/models/form-field-config';
import { LoadingOverlayComponent } from "../../../../shared/components/loading-overlay/loading-overlay.component";

@Component({
  selector: 'app-package-form',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    CourseSelectorComponent,
    GenericFormComponent
  ],
  templateUrl: './package-form.component.html',
  styleUrls: ['./package-form.component.scss'],
})
export class PackageFormComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private packageManagement = inject(PackageManagementService);
  private packageService = inject(PackageService);
  private loadingService = inject(LoadingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  courseSelector = viewChild(CourseSelectorComponent);
  isLoading = this.loadingService.isLoading;
  packageId = signal<string | null>(null);
  isEditMode = computed(() => !!this.packageId());
  formConfig = signal<FormFieldConfig[]>([]);
  submitButtonText = computed(() => this.isEditMode() ? 'Atualizar' : 'Cadastrar');

  constructor() {
    this.initFormConfig();
  }

  initFormConfig() {
    this.formConfig.set([
      {
        name: 'name',
        label: 'Nome',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessages: {required: 'Nome é obrigatório'}
      },
      {
        name: 'price',
        label: 'Preço',
        type: 'number',
        value: '',
        validators: [Validators.required],
        errorMessages: {required:'Preço é obrigatório'}
      },
      {
        name: 'workHours',
        label: 'Carga Horária',
        type: 'number',
        value: '',
        validators: [Validators.required],
        errorMessages: {
          required:'Carga horária é obrigatória'
        }
      },
      {
        name: 'description',
        label: 'Descrição',
        type: 'textarea',
        value: '',
        validators: [Validators.required],
        errorMessages: { required:'Descrição é obrigatória'}
      },
    ]);
  }

  async ngOnInit() {
    this.loadingService.show();
    this.packageId.set(this.route.snapshot.paramMap.get('id'));

    if (this.isEditMode() && this.packageId() != null) {
      try {
        const packageItem = await this.packageService.selectPackage(this.packageId()!);

        if(packageItem() === undefined) {
          throw new Error('Pacote não encontrado');
        }

        this.formConfig.set(this.formConfig().map(field => ({
          ...field,
          value: packageItem()![field.name as keyof Package]
        })));

        this.courseSelector()?.selectedCourseIds.set(new Set(packageItem()!.courses));
      } catch (error) {
        this.notificationService.error(
          'Erro ao carregar os dados do pacote: ' + error,
          5000
        );
      }
    }
    this.loadingService.hide();
  }

  onCoursesChanged() {
    // Lógica adicional se necessário
  }

  onSubmit(formData: any) {
    this.loadingService.show();
    const packageData: Package = {
      ...formData,
      courses: Array.from(this.courseSelector()?.selectedCourseIds() || [])
    };

    const operation = this.isEditMode()
      ? this.packageManagement.update(this.packageId()!, packageData)
      : this.packageManagement.create(packageData);

    operation.subscribe({
      next: () => {
        this.notificationService.success(
          `Pacote ${this.isEditMode() ? 'atualizado' : 'criado'} com sucesso!`,
          5000
        );
        this.router.navigate(['/admin/package-list']);
      },
      error: (error) => {
        this.notificationService.error(
          `Erro ao ${this.isEditMode() ? 'atualizar' : 'criar'} o pacote: ${error}`,
          5000
        );
        this.loadingService.hide();
      },
      complete: () => {
        this.loadingService.hide();
      }
    });
  }
}
