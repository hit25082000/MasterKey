import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { StudentManagementService } from '../../services/student-management.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { ValidatorCpf } from '../../../../shared/Validators/cpf.validator';
import { passwordMatchValidator } from '../../../../shared/Validators/password-math.validator';
import { Student } from '../../../../core/models/student.model';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';
import { StudentService } from '../../services/student.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ClassSelectorComponent } from '../../../class/components/class-selector/class-selector.component';
import { CourseSelectorComponent } from '../../../course/components/course-selector/course-selector.component';
import { PackageSelectorComponent } from '../../../package/components/package-selector/package-selector.component';
import { LoadingService } from '../../../../shared/services/loading.service';
import { InputComponent } from '../../../../shared/components/input/input.component';

@Component({
  selector: 'app-student-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    ModalComponent,
    ClassSelectorComponent,
    CourseSelectorComponent,
    PackageSelectorComponent,
    InputComponent
  ],
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.scss'],
})
export class StudentFormComponent implements OnInit {
  studentForm!: FormGroup;
  selectedFile: File | null = null;
  studentId = signal<string | null>(null);
  isEditMode = computed(() => !!this.studentId);

  constructor(
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private studentManagement: StudentManagementService,
    private router: Router,
    private studentService: StudentService,
    public loadingService: LoadingService
  ) {
    this.studentForm = this.fb.group(
      {
        id: [null],
        name: ['', [Validators.required, Validators.minLength(3)]],
        phone1: ['', Validators.required],
        phone2: [''],
        email: ['', [Validators.required, Validators.email]],
        cpf: ['', [Validators.required, ValidatorCpf]],
        rg: ['', Validators.required],
        cep: ['', Validators.required],
        street: ['', Validators.required],
        neighborhood: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        number: ['', Validators.required],
        birthday: ['', Validators.required],
        yearsOld: ['', [Validators.required, Validators.min(0)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
        status: ['ativo', Validators.required],
        responsible: [''],
        responsibleRg: [''],
        responsibleCpf: ['', ValidatorCpf],
        profilePic: [null],
        sex: ['masculino', Validators.required],
        polo: ['', Validators.required],
        description: [''],
        role: ['student'],
      },
      { validators: passwordMatchValidator }
    );
  }

  async ngOnInit() {
    this.loadingService.show();
    this.studentId.set(this.route.snapshot.paramMap.get('id'));
    console.log(this.isEditMode())
    if (this.isEditMode()) {
      try {
        const student = await this.studentService.getById(this.studentId()!);
        this.studentForm.patchValue(student);
        this.studentForm.get('password')?.clearValidators();
        this.studentForm.get('confirmPassword')?.clearValidators();
        this.studentForm.updateValueAndValidity();
      } catch (error) {
        this.notificationService.showNotification(
          'Erro ao consultar dados do estudante: ' + error,
          NotificationType.ERROR
        );
      }
    }

    this.loadingService.hide();
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onSubmit() {
    this.loadingService.show();
    if (this.studentForm.valid) {
      const studentData: Student = this.studentForm.value;
      const operation = this.isEditMode()
        ? this.studentManagement.update(studentData, this.selectedFile)
        : this.studentManagement.create(studentData, this.selectedFile);

      operation
        .then((success) => {
          this.notificationService.showNotification(
            success,
            NotificationType.SUCCESS
          );
          setTimeout(() => {
            this.loadingService.hide();
            this.router.navigate(['/admin/student-list']);
          }, 1000);
        })
        .catch((error) => {
          this.notificationService.showNotification(
            `Erro ao ${this.isEditMode() ? 'editar' : 'cadastrar'} estudante. Por favor, tente novamente: ${error.message}`,
            NotificationType.ERROR
          );
          this.loadingService.hide();
        });
    } else {
      this.notificationService.showNotification(
        'Por favor, preencha todos os campos obrigatórios corretamente.',
        NotificationType.ERROR
      );
      this.loadingService.hide();
    }
  }
}
