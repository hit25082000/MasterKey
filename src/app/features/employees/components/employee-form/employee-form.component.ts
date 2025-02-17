import { Component, inject, Inject, OnInit, signal } from '@angular/core';
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
import { RoleService } from '../../../role/service/role.service';
import { Role } from '../../../../core/models/role.model';
import { LoadingService } from '../../../../shared/services/loading.service';
import { ValidatorPassword } from '../../../../shared/Validators/password.validator';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, GenericFormComponent],
  template: `
    @if (!loadingService.isLoading()) {      
      <div class="employee-form-container">
        <!-- Formulário -->
        <div class="form-container">
          <app-generic-form
            [config]="formConfig()"
            [submitButtonText]="isEditMode() ? 'Atualizar Funcionário' : 'Criar Funcionário'"
            (formSubmit)="onSubmit($event)"
            [formTitle]="isEditMode() ? 'Editar Funcionário' : 'Novo Funcionário'"
          >
          </app-generic-form>
        </div>

        <!-- Preview da imagem -->
        <div class="image-preview-section">
          <div class="image-preview-container" [class.has-image]="currentImage()">
            <div class="image-preview">
              <img
                [src]="currentImage() || 'assets/images/default-profile.png'"
                alt="Foto do funcionário"
                class="profile-image"
                (error)="currentImage.set('')"
              >
              @if (currentImage()) {
                <button type="button" class="clear-image" (click)="currentImage.set('')">
                  <i class="fas fa-times"></i>
                </button>
              }
            </div>
            <span class="image-label">Foto do Funcionário</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .employee-form-container {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 2rem;
      padding: 1rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .form-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 1rem;
    }

    .image-preview-section {
      position: sticky;
      top: 1rem;
      height: fit-content;
    }

    .image-preview-container {
      width: 250px;
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.3s ease;

      &.has-image {
        border: 2px solid #4CAF50;
      }
    }

    .image-preview {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      background: #fff;
    }

    .profile-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.05);
      }
    }

    .clear-image {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: rgba(255, 0, 0, 0.7);
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.3s ease;

      &:hover {
        background: rgba(255, 0, 0, 0.9);
      }
    }

    .image-label {
      display: block;
      text-align: center;
      margin-top: 0.5rem;
      color: #666;
      font-size: 0.875rem;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #666;
    }

    @media (max-width: 1200px) {
      .employee-form-container {
        grid-template-columns: 1fr;
      }

      .image-preview-section {
        position: relative;
        top: 0;
      }

      .image-preview-container {
        width: 200px;
        margin: 0 auto;
      }
    }
  `]
})
export class EmployeeFormComponent implements OnInit {
  formConfig = signal<FormFieldConfig[]>([]);
  currentImage = signal<string>('');
  selectedFile: File | null = null;
  employeeId = signal<string | null>(null);
  roles = signal<Role[]>([]);
  loadingService = inject(LoadingService)
  isLoading = this.loadingService.isLoading;

  constructor(
    private employeeManagementService: EmployeeManagementService,
    private employeeService: EmployeeService,
    private roleService: RoleService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    try {
      this.loadingService.show();
      const allRoles = await this.roleService.getAll();
      const filteredRoles = allRoles.filter(role => role.name.toLowerCase() !== 'student');
      this.roles.set(filteredRoles);

      const id = this.route.snapshot.paramMap.get('id');
      this.employeeId.set(id);

      if (this.isEditMode()) {
        await this.loadEmployee();
      } else {
        this.initNewEmployee();
      }
    } catch (error) {
      this.loadingService.hide();

      this.notificationService.error('Erro ao carregar dados');
    }finally{
      this.loadingService.hide();
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
      },
      {
        type: 'select',
        label: 'Cargo',
        name: 'role',
        options: this.roles().map(role => ({
          value: role.name,
          label: role.name
        })),
        validators: [Validators.required],
        value: employee?.role || ''
      },
      {
        name: 'password',
        label: 'Senha',
        type: 'password',
        value: employee?.password || '',
        validators: [Validators.required, ValidatorPassword],
        errorMessages: {
          required: 'Senha é obrigatória',
          minLength: 'A senha deve ter no mínimo 8 caracteres',
          noUpperCase: 'A senha deve conter pelo menos uma letra maiúscula',
          noLowerCase: 'A senha deve conter pelo menos uma letra minúscula',
          noNumber: 'A senha deve conter pelo menos um número',
          noSpecialChar: 'A senha deve conter pelo menos um caractere especial'
        }
      },
      {
        name: 'confirmPassword',
        label: 'Confirmar Senha',
        type: 'password',
        value: '',
        validators: [Validators.required],
        errorMessages: {
          required: 'Confirmação de senha é obrigatória',
          passwordMismatch: 'As senhas não coincidem'
        }
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
      this.loadingService.show();
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
      
      this.loadingService.hide();
      this.router.navigate(['/admin/employee-list']);
    } catch (error) {
      this.notificationService.error(
        this.isEditMode()
          ? 'Erro ao atualizar funcionário'
          : 'Erro ao criar funcionário'
      );
      console.error(error);
      this.loadingService.hide();
    }finally{
      this.loadingService.hide();
    }
  }

  isEditMode(): boolean {
    return !!this.employeeId();
  }
}
