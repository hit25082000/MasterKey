import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Validators } from '@angular/forms';
import { StudentManagementService } from '../../services/student-management.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ValidatorCpf } from '../../../../shared/Validators/cpf.validator';
import { passwordMatchValidator } from '../../../../shared/Validators/password-math.validator';
import { Student } from '../../../../core/models/student.model';
import { NotificationType } from '../../../../shared/models/notifications-enum';
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

  isLoading = this.loadingService.isLoading;
  studentId = signal<string | null>(null);
  isEditMode = computed(() => !!this.studentId());
  formConfig = signal<FormFieldConfig[]>([]);
  selectedFile = signal<File | null>(null);
  submitButtonText = computed(() => this.isEditMode() ? 'Atualizar' : 'Cadastrar');

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
        errorMessage: 'Nome é obrigatório e deve ter no mínimo 3 caracteres'
      },
      {
        name: 'phone1',
        label: 'Fone 1',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessage: 'Fone 1 é obrigatório'
      },
      {
        name: 'phone2',
        label: 'Fone 2',
        type: 'text',
        value: ''
      },
      {
        name: 'email',
        label: 'E-mail',
        type: 'email',
        value: '',
        validators: [Validators.required, Validators.email],
        errorMessage: 'E-mail inválido'
      },
      {
        name: 'cpf',
        label: 'CPF',
        type: 'text',
        value: '',
        validators: [Validators.required, ValidatorCpf],
        errorMessage: 'CPF inválido'
      },
      {
        name: 'rg',
        label: 'RG',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessage: 'RG é obrigatório'
      },
      {
        name: 'cep',
        label: 'CEP',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessage: 'CEP é obrigatório'
      },
      {
        name: 'street',
        label: 'Rua',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessage: 'Rua é obrigatória'
      },
      {
        name: 'neighborhood',
        label: 'Bairro',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessage: 'Bairro é obrigatório'
      },
      {
        name: 'city',
        label: 'Cidade',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessage: 'Cidade é obrigatória'
      },
      {
        name: 'state',
        label: 'Estado',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessage: 'Estado é obrigatório'
      },
      {
        name: 'number',
        label: 'Número',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessage: 'Número é obrigatório'
      },
      {
        name: 'birthday',
        label: 'Data de Nascimento',
        type: 'date',
        value: '',
        validators: [Validators.required],
        errorMessage: 'Data de nascimento é obrigatória'
      },
      {
        name: 'yearsOld',
        label: 'Idade',
        type: 'number',
        value: '',
        validators: [Validators.required, Validators.min(0)],
        errorMessage: 'Idade é obrigatória e deve ser maior que zero'
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
        errorMessage: 'CPF do responsável inválido'
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
        validators: [Validators.required]
      },
      {
        name: 'polo',
        label: 'Polo',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessage: 'Polo é obrigatório'
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
        validators: [Validators.required, Validators.minLength(6)],
        errorMessage: 'Senha é obrigatória e deve ter pelo menos 6 caracteres'
      },
      {
        name: 'confirmPassword',
        label: 'Confirmar Senha',
        type: 'password',
        value: '',
        validators: [Validators.required],
        errorMessage: 'Confirmação de senha é obrigatória'
      }
    ]);
  }

  onFileChange(event: any) {
    this.selectedFile.set(event.target.files[0]);
  }

  async ngOnInit() {
    this.loadingService.show();
    this.studentId.set(this.route.snapshot.paramMap.get('id'));

    if (this.isEditMode() && this.studentId() != null) {
      try {
        await this.studentService.selectStudent(this.studentId()!);
        const student = this.studentService.selectedStudent

        if(student() == undefined){
          this.notificationService.error(
            'Estudante não encontrado',
            5000
          );
          this.loadingService.hide();

          return;
        }
        this.formConfig.set(this.formConfig().map(field => ({
          ...field,
          value: student()![field.name as keyof Student]
        })));
      } catch (error) {
        this.notificationService.success(
          'Erro ao consultar dados do estudante: ' + error,
          5000
        );
      }
    }

    this.loadingService.hide();
  }

  onSubmit(formData: any) {
    this.loadingService.show();
    const studentData: Student = formData;

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
        this.notificationService.success(
          `Erro ao ${this.isEditMode() ? 'editar' : 'cadastrar'} estudante: ${error.message}`,
          1
        );
        this.loadingService.hide();
      });
  }
}
