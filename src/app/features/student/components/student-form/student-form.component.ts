import { Component, computed, inject, signal } from '@angular/core';
import { Validators } from '@angular/forms';
import { StudentManagementService } from '../../services/student-management.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ValidatorCpf } from '../../../../shared/Validators/cpf.validator';
import { Student } from '../../../../core/models/student.model';
import { StudentService } from '../../services/student.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ClassSelectorComponent } from '../../../class/components/class-selector/class-selector.component';
import { CourseSelectorComponent } from '../../../course/components/course-selector/course-selector.component';
import { PackageSelectorComponent } from '../../../package/components/package-selector/package-selector.component';
import { LoadingService } from '../../../../shared/services/loading.service';
import { GenericFormComponent } from '../../../../shared/components/generic-form/generic-form.component';
import { FormFieldConfig } from '../../../../shared/models/form-field-config';
import { NotificationService } from '../../../../shared/services/notification.service';
import { LoadingOverlayComponent } from "../../../../shared/components/loading-overlay/loading-overlay.component";
import { ClassManagementService } from '../../../class/services/class-management.service';
import { ClassService } from '../../../class/services/class.service';

@Component({
  selector: 'app-student-register',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    ClassSelectorComponent,
    CourseSelectorComponent,
    PackageSelectorComponent,
    GenericFormComponent,
    LoadingOverlayComponent
  ],
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.scss'],
})
export class StudentFormComponent {
  // Injeção de dependências usando inject()
  private readonly notificationService = inject(NotificationService);
  private readonly studentManagement = inject(StudentManagementService);
  private readonly studentService = inject(StudentService);
  readonly loadingService = inject(LoadingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly classManagementService = inject(ClassManagementService);
  private readonly classService = inject(ClassService);

  // Signals
  readonly isLoading = this.loadingService.isLoading;
  readonly studentId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  readonly isEditMode = computed(() => !!this.studentId());
  readonly formConfig = signal<FormFieldConfig[]>(this.initFormConfig());
  readonly selectedFile = signal<File | null>(null);
  readonly submitButtonText = computed(() => this.isEditMode() ? 'Atualizar' : 'Cadastrar');
  readonly currentImage = signal<string>('');

  // Inicialização do formulário
  private initFormConfig(): FormFieldConfig[] {
    return [
      {
        name: 'name',
        label: 'Nome',
        type: 'text',
        value: '',
        validators: [Validators.required, Validators.minLength(3)],
        errorMessages: {
          required: 'Nome é obrigatório',
          minlength: 'Nome deve ter pelo menos 3 caracteres'
        }
      },
      {
        name: 'email',
        label: 'E-mail',
        type: 'text',
        value: '',
        validators: [Validators.required, Validators.email],
        errorMessages: {
          required: 'E-mail é obrigatório',
          email: 'E-mail inválido'
        }
      },
      {
        name: 'phone1',
        label: 'Fone 1',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessages: {
          required: 'Fone 1 é obrigatório'
        }
      },
      {
        name: 'phone2',
        label: 'Fone 2',
        type: 'text',
        value: ''
      },
      {
        name: 'cpf',
        label: 'CPF',
        type: 'text',
        value: '',
        validators: [Validators.required, ValidatorCpf],
        errorMessages: {
          required: 'CPF é obrigatório',
          cpfInvalid: 'CPF inválido'
        }
      },
      {
        name: 'rg',
        label: 'RG',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessages: {
          required: 'RG é obrigatório'
        }
      },
      {
        name: 'cep',
        label: 'CEP',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessages: {
          required: 'CEP é obrigatório'
        }
      },
      {
        name: 'street',
        label: 'Rua',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessages: {
          required: 'Rua é obrigatória'
        }
      },
      {
        name: 'neighborhood',
        label: 'Bairro',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessages: {
          required: 'Bairro é obrigatório'
        }
      },
      {
        name: 'city',
        label: 'Cidade',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessages: {
          required: 'Cidade é obrigatória'
        }
      },
      {
        name: 'state',
        label: 'Estado',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessages: {
          required: 'Estado é obrigatório'
        }
      },
      {
        name: 'number',
        label: 'Número',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessages: {
          required: 'Número é obrigatório'
        }
      },
      {
        name: 'birthday',
        label: 'Data de Nascimento',
        type: 'date',
        value: null,
        validators: [Validators.required],
        errorMessages: {
          required: 'Data de nascimento é obrigatória'
        }
      },
      {
        name: 'yearsOld',
        label: 'Idade',
        type: 'number',
        value: '',
        validators: [Validators.required, Validators.min(0)],
        errorMessages: {
          required: 'Idade é obrigatória',
          min: 'Idade deve ser maior que zero'
        }
      },
      {
        name: 'responsible',
        label: 'Responsável',
        type: 'text',
        value: ''
      },
      {
        name: 'responsibleRg',
        label: 'RG do Responsável',
        type: 'text',
        value: ''
      },
      {
        name: 'responsibleCpf',
        label: 'CPF do Responsável',
        type: 'text',
        value: '',
        validators: [ValidatorCpf],
        errorMessages: {
          cpfInvalid: 'CPF do responsável inválido'
        }
      },
      {
        name: 'profilePic',
        label: 'Foto de Perfil',
        type: 'file',
        value: null,
        onFileChange: (event: any) => this.onFileChange(event)
      },
      {
        name: 'sex',
        label: 'Sexo',
        type: 'select',
        value: 'masculino',
        options: [
          { value: 'masculino', label: 'Masculino' },
          { value: 'feminino', label: 'Feminino' }
        ],
        validators: [Validators.required],
        errorMessages: {
          required: 'Sexo é obrigatório'
        }
      },
      {
        name: 'polo',
        label: 'Polo',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessages: {
          required: 'Polo é obrigatório'
        }
      },
      {
        name: 'description',
        label: 'Observações',
        type: 'textarea',
        value: ''
      },
      {
        name: 'password',
        label: 'Senha',
        type: 'password',
        value: '',
        validators: [Validators.required],
        errorMessages: {
          required: 'Senha é obrigatória',
          passwordMismatch: 'As senhas não coincidem'
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
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.notificationService.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.notificationService.error('A imagem deve ter no máximo 5MB');
        return;
      }

      this.selectedFile.set(file);
      this.createImagePreview(file);
    }
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        this.currentImage.set(reader.result as string);
      }
    };
    reader.onerror = () => {
      this.notificationService.error('Erro ao carregar a imagem');
      this.currentImage.set('');
    };
    reader.readAsDataURL(file);
  }

  async ngOnInit(): Promise<void> {
    this.loadingService.show();

    if (this.isEditMode()) {
      await this.loadStudentData();
    }

    this.loadingService.hide();
  }

  private async loadStudentData(): Promise<void> {
    try {
      await this.studentService.selectStudent(this.studentId()!);
      const student = this.studentService.selectedStudent;

      if (!student()) {
        this.notificationService.error('Estudante não encontrado', 5000);
        return;
      }

      if (student()?.profilePic) {
        this.currentImage.set(student()?.profilePic!);
      }

      this.formConfig.update(config => 
        config.map(field => ({
          ...field,
          value: student()![field.name as keyof Student]
        }))
      );
    } catch (error) {
      this.notificationService.error(
        'Erro ao consultar dados do estudante: ' + error,
        5000
      );
    }
  }

  private generateRA(): string {
    const year = new Date().getFullYear();
    const randomNumbers = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${year}${randomNumbers}`;
  }

  async onSubmit(formData: any): Promise<void> {
    this.loadingService.show();
    
    try {
      const studentData: Student = {
        ...formData,
        id: this.studentId() || '',
        role: 'student',
        ra: this.isEditMode() ? formData.ra : this.generateRA()
      };

      const operation = this.isEditMode()
        ? this.studentManagement.update(studentData, this.selectedFile())
        : this.studentManagement.create(studentData, this.selectedFile());

      await operation;
      
      this.notificationService.success(
        `Estudante ${this.isEditMode() ? 'atualizado' : 'cadastrado'} com sucesso`,
        1000
      );

      setTimeout(() => {
        this.router.navigate(['/admin/student-list']);
      }, 1000);
    } catch (error: any) {
      this.notificationService.error(
        `Erro ao ${this.isEditMode() ? 'editar' : 'cadastrar'} estudante: ${error.message}`,
        5000
      );
    } finally {
      this.loadingService.hide();
    }
  }

  getImageUrl(url: string): string {
    if (!url) return 'assets/images/default-profile.png';
    if (url.startsWith('data:image')) return url;

    const baseUrl = url.includes('storage.googleapis.com') 
      ? url.split('?')[0]
      : url;

    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
  }

  async updateStudentClasses(selectedClassIds: string[]): Promise<void> {
    try {
      const currentClasses = await this.classService.getStudentClasses(this.studentId()!);
      const classesToAdd = selectedClassIds.filter(id => !currentClasses.includes(id));
      const classesToRemove = currentClasses.filter(id => !selectedClassIds.includes(id));

      await Promise.all([
        ...classesToAdd.map(async classId => {
          const classStudents = await this.classService.getClassStudents(classId);
          return this.classManagementService.updateClass(
            classId,
            {},
            [...classStudents, this.studentId()!]
          );
        }),
        ...classesToRemove.map(async classId => {
          const classStudents = await this.classService.getClassStudents(classId);
          return this.classManagementService.updateClass(
            classId,
            {},
            classStudents.filter(id => id !== this.studentId()!)
          );
        })
      ]);

      this.notificationService.success('Turmas atualizadas com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar turmas:', error);
      this.notificationService.error('Erro ao atualizar turmas');
    }
  }
}
