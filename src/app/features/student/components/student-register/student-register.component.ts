import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { StudentManagementService } from '../../services/student-management.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { SystemLogService } from '../../../../core/services/system-log.service';
import { ValidatorCpf } from '../../../../shared/Validators/cpf.validator';
import { passwordMatchValidator } from '../../../../shared/Validators/password-math.validator';
import { AuthService } from '../../../../core/services/auth.service';
import { Student } from '../../../../core/models/student.model';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-student-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, LoadingOverlayComponent],
  templateUrl: './student-register.component.html',
  styleUrls: ['./student-register.component.scss'],
})
export class StudentRegisterComponent implements OnInit {
  studentForm!: FormGroup;
  selectedFile: File | null = null;
  loading: boolean = false;

  constructor(
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private studentManagement: StudentManagementService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.studentForm = this.fb.group(
      {
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

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onSubmit() {
    this.loading = true;
    if (this.studentForm.valid) {
      const newStudent: Student = this.studentForm.value;

      this.studentManagement
        .create(newStudent, this.selectedFile)
        .then((success) => {
          this.notificationService.showNotification(
            success,
            NotificationType.SUCCESS
          );
          setTimeout(() => {
            this.loading = false;
            this.router.navigate(['/admin/student-list']);
          }, 1000);
        })
        .catch((error) => {
          this.notificationService.showNotification(
            'Erro ao cadastrar estudante. Por favor, tente novamente: ' +
              error.message,
            NotificationType.ERROR
          );
          this.loading = false;
        });
    } else {
      this.notificationService.showNotification(
        'Por favor, preencha todos os campos obrigatórios corretamente.',
        NotificationType.ERROR
      );
      this.loading = false;
    }
  }
}
