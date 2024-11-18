import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormFieldConfig } from '../../../../shared/models/form-field-config';
import { EmployeeManagementService } from '../../services/employee-management.service';
import { EmployeeService } from '../../services/employee.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Router, ActivatedRoute } from '@angular/router';
import { GenericFormComponent } from '../../../../shared/components/generic-form/generic-form.component';
import { Validators } from '@angular/forms';
import { ValidatorCpf } from '../../../../shared/Validators/cpf.validator';
import { Employee } from '../../../../core/models/employee.model';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, GenericFormComponent],
  template: `
    @if (loading()) {
      <div class="loading">Carregando...</div>
    } @else {
      <app-generic-form
        [config]="formConfig()"
        [submitButtonText]="isEditMode() ? 'Atualizar Funcionário' : 'Criar Funcionário'"
        (formSubmit)="onSubmit($event)"
        [formTitle]="isEditMode() ? 'Editar Funcionário' : 'Novo Funcionário'"
      >
        @if (currentImage()) {
          <div class="current-image">
            <img [src]="currentImage()" alt="Foto do funcionário" class="profile-image">
          </div>
        }
      </app-generic-form>
    }
  `,
  styleUrls: ['./employee-form.component.scss']
})
export class EmployeeFormComponent implements OnInit {
  formConfig = signal<FormFieldConfig[]>([]);
  currentImage = signal<string>('');
  loading = signal(true);
  selectedFile: File | null = null;
  employeeId = signal<string | null>(null);

  constructor(
    private employeeManagementService: EmployeeManagementService,
    private employeeService: EmployeeService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.employeeId.set(id);

    if (this.isEditMode()) {
      await this.loadEmployee();
    } else {
      this.initNewEmployee();
    }
  }

  private async loadEmployee() {
    try {
      const employee = await this.employeeService.getById(this.employeeId()!);
      if (employee.profilePic) {
        this.currentImage.set(employee.profilePic);
      }
      this.initFormConfig(employee);
    } catch (error) {
      this.notificationService.error('Erro ao carregar funcionário');
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  private initFormConfig(employee?: Employee) {
    const config: FormFieldConfig[] = [
      {
        name: 'name',
        label: 'Nome',
        type: 'text',
        value: employee?.name || '',
        validators: [Validators.required, Validators.minLength(3)],
        errorMessages: {
          required: 'Nome é obrigatório',
          minlength: 'Nome deve ter no mínimo 3 caracteres'
        }
      },
      {
        name: 'phone1',
        label: 'Telefone 1',
        type: 'text',
        value: employee?.phone1 || '',
        validators: [Validators.required],
        errorMessages: { required: 'Telefone é obrigatório' }
      },
      {
        name: 'phone2',
        label: 'Telefone 2',
        type: 'text',
        value: employee?.phone2 || ''
      },
      {
        name: 'email',
        label: 'E-mail',
        type: 'email',
        value: employee?.email || '',
        validators: [Validators.required, Validators.email],
        errorMessages: {
          required: 'E-mail é obrigatório',
          email: 'E-mail inválido'
        }
      },
      {
        name: 'cpf',
        label: 'CPF',
        type: 'text',
        value: employee?.cpf || '',
        validators: [Validators.required, ValidatorCpf],
        errorMessages: {
          required: 'CPF é obrigatório',
          cpf: 'CPF inválido'
        }
      },
      {
        name: 'rg',
        label: 'RG',
        type: 'text',
        value: employee?.rg || '',
        validators: [Validators.required],
        errorMessages: { required: 'RG é obrigatório' }
      },
      {
        name: 'cep',
        label: 'CEP',
        type: 'text',
        value: employee?.cep || '',
        validators: [Validators.required],
        errorMessages: { required: 'CEP é obrigatório' }
      },
      {
        name: 'street',
        label: 'Rua',
        type: 'text',
        value: employee?.street || '',
        validators: [Validators.required],
        errorMessages: { required: 'Rua é obrigatória' }
      },
      {
        name: 'neighborhood',
        label: 'Bairro',
        type: 'text',
        value: employee?.neighborhood || '',
        validators: [Validators.required],
        errorMessages: { required: 'Bairro é obrigatório' }
      },
      {
        name: 'city',
        label: 'Cidade',
        type: 'text',
        value: employee?.city || '',
        validators: [Validators.required],
        errorMessages: { required: 'Cidade é obrigatória' }
      },
      {
        name: 'state',
        label: 'Estado',
        type: 'text',
        value: employee?.state || '',
        validators: [Validators.required],
        errorMessages: { required: 'Estado é obrigatório' }
      },
      {
        name: 'number',
        label: 'Número',
        type: 'text',
        value: employee?.number || '',
        validators: [Validators.required],
        errorMessages: { required: 'Número é obrigatório' }
      },
      {
        name: 'birthday',
        label: 'Data de Nascimento',
        type: 'date',
        value: employee?.birthday || '',
        validators: [Validators.required],
        errorMessages: { required: 'Data de nascimento é obrigatória' }
      },
      {
        name: 'yearsOld',
        label: 'Idade',
        type: 'number',
        value: employee?.yearsOld || '',
        validators: [Validators.required, Validators.min(0)],
        errorMessages: {
          required: 'Idade é obrigatória',
          min: 'Idade deve ser maior que 0'
        }
      },
      {
        name: 'sex',
        label: 'Sexo',
        type: 'select',
        value: employee?.sex || 'masculino',
        validators: [Validators.required],
        options: [
          { value: 'masculino', label: 'Masculino' },
          { value: 'feminino', label: 'Feminino' }
        ]
      },
      {
        name: 'polo',
        label: 'Polo',
        type: 'text',
        value: employee?.polo || '',
        validators: [Validators.required],
        errorMessages: { required: 'Polo é obrigatório' }
      },
      {
        name: 'description',
        label: 'Observações',
        type: 'textarea',
        value: employee?.description || ''
      },
      {
        name: 'profilePic',
        label: 'Foto de Perfil',
        type: 'file',
        value: employee?.profilePic || '',
        onFileChange: (event: Event) => this.onFileChange(event)
      }
    ];

    // Adiciona campos de senha apenas para novo funcionário
    if (!this.isEditMode()) {
      config.push(
        {
          name: 'password',
          label: 'Senha',
          type: 'password',
          value: '',
          validators: [Validators.required, Validators.minLength(6)],
          errorMessages: {
            required: 'Senha é obrigatória',
            minlength: 'Senha deve ter no mínimo 6 caracteres'
          }
        },
        {
          name: 'confirmPassword',
          label: 'Confirmar Senha',
          type: 'password',
          value: '',
          validators: [Validators.required],
          errorMessages: { required: 'Confirmação de senha é obrigatória' }
        }
      );
    }

    this.formConfig.set(config);
  }

  private initNewEmployee() {
    this.initFormConfig();
    this.loading.set(false);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.currentImage.set(e.target.result);
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  async onSubmit(formData: any) {
    try {
      if (this.isEditMode()) {
        await this.employeeManagementService.update({
          ...formData,
          id: this.employeeId()
        }, this.selectedFile);
        this.notificationService.success('Funcionário atualizado com sucesso');
      } else {
        await this.employeeManagementService.create(formData, this.selectedFile);
        this.notificationService.success('Funcionário criado com sucesso');
      }

      this.router.navigate(['/admin/employee-list']);
    } catch (error) {
      this.notificationService.error(
        this.isEditMode()
          ? 'Erro ao atualizar funcionário'
          : 'Erro ao criar funcionário'
      );
      console.error(error);
    }
  }

  isEditMode(): boolean {
    return !!this.employeeId();
  }
}
