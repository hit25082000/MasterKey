import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeesManagementService } from '../../services/employees-management.service';
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
  selector: 'app-employees-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './employees-register.component.html',
  styleUrls: ['./employees-register.component.scss']
})
export class EmployeesRegisterComponent implements OnInit {
  employeesForm!: FormGroup;
  selectedFile: File | null = null;

  constructor(
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private employeesManagement: EmployeesManagementService,
    private router: Router,
    private systemLogService: SystemLogService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.employeesForm = this.fb.group({
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
      role: ['employee']
    }, { validators: passwordMatchValidator });
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onSubmit() {
    if (this.employeesForm.valid) {
      const newEmployee: Employee = this.employeesForm.value;

      this.employeesManagement.create(newEmployee, this.selectedFile)
        .then((createdEmployees) => {
          this.notificationService.showNotification('Funcionario cadastrado com sucesso!', NotificationType.SUCCESS);
          this.logSuccessfulRegistration(createdEmployees);
          this.router.navigate(['/admin/employees-list']);
        })
        .catch((error) => {
            this.notificationService.showNotification('Erro ao cadastrar funcionario. Por favor, tente novamente: ' + error, NotificationType.ERROR);
        });
    } else {
      this.notificationService.showNotification('Por favor, preencha todos os campos obrigatórios corretamente.', NotificationType.ERROR);
    }
  }

  private logSuccessfulRegistration(employee: Employee) {
    const currentUser = this.authService.getCurrentUser();
    const logDetails = `Usuário ${currentUser?.displayName} (ID: ${currentUser?.uid}) cadastrou o funcionario ${employee.name} (ID: ${employee.id}) em ${new Date().toLocaleString()}`;

    this.systemLogService.logUserRegistration(employee.id, logDetails).subscribe({
      next: () => this.notificationService.showNotification('Log de cadastro salvo com sucesso', NotificationType.SUCCESS),
      error: (error) => this.notificationService.showNotification('Erro ao salvar log de cadastro:' + error, NotificationType.ERROR)
    });
  }
}
