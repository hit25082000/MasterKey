import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { EmployeeManagementService } from '../../services/employee-management.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { SystemLogService } from '../../../../core/services/system-log.service';
import { ValidatorCpf } from '../../../../shared/Validators/cpf.validator';
import { passwordMatchValidator } from '../../../../shared/Validators/password-math.validator';
import { AuthService } from '../../../../core/services/auth.service';
import Employee from '../../../../core/models/employee.model';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';

@Component({
  selector: 'app-employee-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './employee-register.component.html',
  styleUrls: ['./employee-register.component.scss'],
})
export class EmployeeRegisterComponent implements OnInit {
  employeeForm!: FormGroup;
  selectedFile: File | null = null;

  constructor(
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private employeeManagement: EmployeeManagementService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.employeeForm = this.fb.group(
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
        profilePic: [null],
        sex: ['masculino', Validators.required],
        polo: ['', Validators.required],
        description: [''],
        role: ['employee'],
      },
      { validators: passwordMatchValidator }
    );
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onSubmit() {
    if (this.employeeForm.valid) {
      delete this.employeeForm.value.confirmPassword;
      const newEmployee: Employee = this.employeeForm.value;

      this.employeeManagement
        .create(newEmployee, this.selectedFile)
        .then(() => {
          this.notificationService.showNotification(
            'Funcionario cadastrado com sucesso!',
            NotificationType.SUCCESS
          );
          this.router.navigate(['/admin/employee-list']);
        })
        .catch((error) => {
          this.notificationService.showNotification(
            'Erro ao cadastrar funcionario. Por favor, tente novamente: ' +
              { error },
            NotificationType.ERROR
          );
        });
    } else {
      this.notificationService.showNotification(
        'Por favor, preencha todos os campos obrigatórios corretamente.',
        NotificationType.ERROR
      );
    }
  }
}
