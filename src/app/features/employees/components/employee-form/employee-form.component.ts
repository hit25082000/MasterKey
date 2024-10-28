import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EmployeeManagementService } from '../../services/employee-management.service';
import { EmployeeService } from '../../services/employee.service';
import { ValidatorCpf } from '../../../../shared/Validators/cpf.validator';
import { passwordMatchValidator } from '../../../../shared/Validators/password-math.validator';
import { Employee } from '../../../../core/models/employee.model';
import { NotificationType } from '../../../../shared/models/notifications-enum';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.scss'],
})
export class EmployeeFormComponent implements OnInit {
  employeeForm!: FormGroup;
  selectedFile: File | null = null;
  employeeId: string | null = null;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private employeeManagementService: EmployeeManagementService,
    private employeeService: EmployeeService,
    private notificationService: NotificationService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadingService.show();
    this.employeeId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.employeeId;

    this.initForm();

    if (this.isEditMode) {
      this.loadEmployeeData();
    } else {
      this.loadingService.hide();
    }
  }

  initForm(): void {
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

  async loadEmployeeData() {
    try {
      const employee = await this.employeeService.getById(this.employeeId!);
      this.employeeForm.patchValue(employee);
      this.employeeForm.get('password')?.clearValidators();
      this.employeeForm.get('confirmPassword')?.clearValidators();
      this.employeeForm.updateValueAndValidity();
    } catch (error) {
      this.notificationService.success(
        'Erro ao carregar os dados do funcionário',
        1
      );
      console.error(error);
    } finally {
      this.loadingService.hide();
    }
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onSubmit() {
    this.loadingService.show();
    if (this.employeeForm.valid) {
      const employeeData: Employee = this.employeeForm.value;
      const operation = this.isEditMode
        ? this.employeeManagementService.update(employeeData, this.selectedFile)
        : this.employeeManagementService.create(employeeData, this.selectedFile);

      operation
        .then((success) => {
          this.notificationService.success(
            `Funcionário ${this.isEditMode ? 'atualizado' : 'cadastrado'} com sucesso`,
            1
          );
          this.router.navigate(['/admin/employee-list']);
        })
        .catch((error) => {
          this.notificationService.success(
            `Erro ao ${this.isEditMode ? 'atualizar' : 'cadastrar'} funcionário: ${error.message}`,
            1
          );
        })
        .finally(() => {
          this.loadingService.hide();
        });
    } else {
      this.notificationService.success(
        'Por favor, preencha todos os campos obrigatórios corretamente.',
        1
      );
      this.loadingService.hide();
    }
  }
}
