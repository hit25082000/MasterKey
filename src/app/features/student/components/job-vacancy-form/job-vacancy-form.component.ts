import { Component, OnInit, signal } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { JobVacancyService } from '../../services/job-vacancy.service';
import { CommonModule } from '@angular/common';
import { GenericFormComponent } from '../../../../shared/components/generic-form/generic-form.component';
import { FormFieldConfig } from '../../../../shared/models/form-field-config';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-job-vacancy-form',
  standalone: true,
  imports: [CommonModule, GenericFormComponent],
  templateUrl: './job-vacancy-form.component.html',
  styleUrls: ['./job-vacancy-form.component.scss'],
})
export class JobVacancyFormComponent implements OnInit {
  formConfig = signal<FormFieldConfig[]>([]);
  isEditMode = false;
  vacancyId = '';

  constructor(
    private jobVacancyService: JobVacancyService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.initFormConfig();
  }

  initFormConfig() {
    this.formConfig.set([
      {
        name: 'titulo',
        label: 'Título da Vaga',
        type: 'text',
        value: '',
        validators: [Validators.required, Validators.minLength(3)],
        errorMessages: {
          required: 'Título é obrigatório',
          minlength: 'Título deve ter pelo menos 3 caracteres'
        }
      },
      {
        name: 'empresa',
        label: 'Empresa',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessages: {
          required: 'Empresa é obrigatória'
        }
      },
      {
        name: 'salario',
        label: 'Salário',
        type: 'number',
        value: '',
        validators: [Validators.required, Validators.min(0)],
        errorMessages: {
          required: 'Salário é obrigatório',
          min: 'Salário deve ser maior que zero'
        }
      },
      {
        name: 'localizacao',
        label: 'Localização',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessages: {
          required: 'Localização é obrigatória'
        }
      },
      {
        name: 'dataPublicacao',
        label: 'Data de Publicação',
        type: 'date',
        value: new Date().toISOString().split('T')[0],
        validators: [Validators.required],
        errorMessages: {
          required: 'Data de publicação é obrigatória'
        }
      },
      {
        name: 'descricao',
        label: 'Descrição da Vaga',
        type: 'textarea',
        value: '',
        validators: [Validators.required, Validators.minLength(10)],
        errorMessages: {
          required: 'Descrição é obrigatória',
          minlength: 'Descrição deve ter pelo menos 10 caracteres'
        }
      }
    ]);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.vacancyId = id;
      this.isEditMode = true;
      this.loadVacancy();
    }
  }

  async loadVacancy(): Promise<void> {
    try {
      const vacancy = await this.jobVacancyService.getVacancy(this.vacancyId);
      this.formConfig.set(this.formConfig().map(field => ({
        ...field,
        value: vacancy[field.name as keyof typeof vacancy] || field.value
      })));
    } catch (error) {
      this.notificationService.error('Erro ao carregar vaga');
    }
  }

  async onSubmit(formData: any): Promise<void> {
    try {
      if (this.isEditMode) {
        await this.jobVacancyService.updateVacancy(this.vacancyId, formData);
        this.notificationService.success('Vaga atualizada com sucesso');
      } else {
        await this.jobVacancyService.createVacancy(formData);
        this.notificationService.success('Vaga criada com sucesso');
      }
      this.router.navigate(['/admin/job-vacancy']);
    } catch (error) {
      this.notificationService.error('Erro ao salvar vaga');
    }
  }
}
