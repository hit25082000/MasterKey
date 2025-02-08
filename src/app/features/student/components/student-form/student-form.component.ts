import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Validators } from '@angular/forms';
import { StudentManagementService } from '../../services/student-management.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ValidatorCpf } from '../../../../shared/Validators/cpf.validator';
import { passwordMatchValidator } from '../../../../shared/Validators/password-math.validator';
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
export class StudentFormComponent implements OnInit {
  notificationService = inject(NotificationService)
  studentManagement = inject(StudentManagementService)
  studentService = inject(StudentService)
  loadingService = inject(LoadingService)
  router = inject(Router)
  route = inject(ActivatedRoute)
  classManagementService = inject(ClassManagementService)
  classService = inject(ClassService)

  isLoading = this.loadingService.isLoading;
  studentId = signal<string | null>(null);
  isEditMode = computed(() => !!this.studentId());
  formConfig = signal<FormFieldConfig[]>([]);
  selectedFile = signal<File | null>(null);
  submitButtonText = computed(() => this.isEditMode() ? 'Atualizar' : 'Cadastrar');
  currentImage = signal<string>('');

  constructor(
  ) {
    this.initFormConfig();
  }

  initFormConfig() {
    this.formConfig.set([
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
    ]);
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        this.notificationService.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      // Validar tamanho (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.notificationService.error('A imagem deve ter no máximo 5MB');
        return;
      }

      this.selectedFile.set(file);

      // Criar preview
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
  }

  async ngOnInit() {
    this.loadingService.show();
    this.studentId.set(this.route.snapshot.paramMap.get('id'));

    if (this.isEditMode() && this.studentId() != null) {
      try {
        await this.studentService.selectStudent(this.studentId()!);
        const student = this.studentService.selectedStudent;

        if(student() == undefined){
          this.notificationService.error(
            'Estudante não encontrado',
            5000
          );
          this.loadingService.hide();
          return;
        }

        // Atualiza a imagem atual
        if (student()?.profilePic) {
          this.currentImage.set(student()?.profilePic!);
        }

        this.formConfig.set(this.formConfig().map(field => ({
          ...field,
          value: student()![field.name as keyof Student]
        })));
      } catch (error) {
        this.notificationService.error(
          'Erro ao consultar dados do estudante: ' + error,
          5000
        );
      }
    }
    this.loadingService.hide();
  }

  private generateRA(): string {
    const year = new Date().getFullYear();
    const randomNumbers = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${year}${randomNumbers}`;
  }

  onSubmit(formData: any) {
    this.loadingService.show();
    const studentData: Student = formData;
    studentData.id = this.studentId() || '';
    studentData.role = 'student';
    
    // Gerar RA apenas para novos estudantes
    if (!this.isEditMode()) {
      studentData.ra = this.generateRA();
    }

    const operation = this.isEditMode()
      ? this.studentManagement.update(studentData, this.selectedFile())
      : this.studentManagement.create(studentData, this.selectedFile());

    operation
      .then((success) => {
        this.notificationService.success(success, 1);
        setTimeout(() => {
          this.loadingService.hide();
          this.router.navigate(['/admin/student-list']);
        }, 1000);
      })
      .catch((error) => {
        this.notificationService.error(
          `Erro ao ${this.isEditMode() ? 'editar' : 'cadastrar'} estudante: ${error.message}`,
          5000
        );
        this.loadingService.hide();
      });
  }

  getImageUrl(url: string): string {
    if (!url) return 'assets/images/default-profile.png';

    // Se for uma URL base64 (preview local), retorna diretamente
    if (url.startsWith('data:image')) {
      return url;
    }

    // Para URLs do Storage, adiciona timestamp para evitar cache
    if (url.includes('storage.googleapis.com')) {
      const baseUrl = url.split('?')[0]; // Remove parâmetros existentes
      return `${baseUrl}?t=${Date.now()}`; // Adiciona novo timestamp
    }

    // Para outras URLs
    return `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
  }

  async updateStudentClasses(selectedClassIds: string[]) {
    try {
      // Busca todas as turmas atuais do estudante
      const currentClasses = await this.classService.getStudentClasses(this.studentId()!);
      
      // Classes para adicionar (estão em selectedClassIds mas não em currentClasses)
      const classesToAdd = selectedClassIds.filter(id => !currentClasses.includes(id));
      
      // Classes para remover (estão em currentClasses mas não em selectedClassIds)
      const classesToRemove = currentClasses.filter(id => !selectedClassIds.includes(id));

      // Adiciona o estudante nas novas turmas
      for (const classId of classesToAdd) {
        const classStudents = await this.classService.getClassStudents(classId);
        await this.classManagementService.updateClass(
          classId,
          {},
          [...classStudents, this.studentId()!]
        );
      }

      // Remove o estudante das turmas não selecionadas
      for (const classId of classesToRemove) {
        const classStudents = await this.classService.getClassStudents(classId);
        await this.classManagementService.updateClass(
          classId,
          {},
          classStudents.filter(id => id !== this.studentId()!)
        );
      }

      this.notificationService.success('Turmas atualizadas com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar turmas:', error);
      this.notificationService.error('Erro ao atualizar turmas');
    }
  }
}
