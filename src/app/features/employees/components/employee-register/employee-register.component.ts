import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeManagementService } from '../../services/employee-management.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { ValidatorCpf } from '../../../../shared/Validators/cpf.validator';
import { passwordMatchValidator } from '../../../../shared/Validators/password-math.validator';
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
  loading: boolean = false;

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
    this.loading = true;
    if (this.employeeForm.valid) {
      const newEmployee: Employee = this.employeeForm.value;

      this.employeeManagement
        .create(newEmployee, this.selectedFile)
        .then((success) => {
          this.notificationService.showNotification(
            success,
            NotificationType.SUCCESS
          );
          setTimeout(() => {
            this.loading = false;
          }, 1000);
        })
        .catch((error) => {
          this.notificationService.showNotification(
            'Erro ao cadastrar funcionario. Por favor, tente novamente: ' +
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
