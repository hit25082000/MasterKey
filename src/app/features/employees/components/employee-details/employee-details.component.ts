import { NotificationService } from './../../../../shared/components/notification/notification.service';
import { NotificationComponent } from './../../../../shared/components/notification/notification.component';
import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { EmployeeManagementService } from '../../services/employee-management.service';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../services/employee.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ClassSelectorComponent } from '../../../class/components/class-selector/class-selector.component';
import { CourseSelectorComponent } from '../../../course/components/course-selector/course-selector.component';
import { PackageSelectorComponent } from '../../../package/components/package-selector/package-selector.component';
import { PackageService } from '../../../package/services/package.service';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';
import {Employee} from '../../../../core/models/employee.model';
import { Role } from '../../../../core/models/role.model';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    CourseSelectorComponent,
    PackageSelectorComponent,
    ReactiveFormsModule,
    ModalComponent,
    ClassSelectorComponent,
  ],
  templateUrl: './employee-details.component.html',
  styleUrls: ['./employee-details.component.scss'],
})
export class EmployeeDetailsComponent implements OnInit {
  employeeForm!: FormGroup;
  employeeId!: string;
  loading: boolean = true;
  error: string = '';
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private employeeService: EmployeeService,
    private employeeManagementService: EmployeeManagementService,
    private packageService: PackageService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.employeeId = this.route.snapshot.paramMap.get('id')!;

    if (!this.employeeId) {
      this.notificationService.showNotification(
        'Funcionario não encontrado',
        NotificationType.ERROR
      );
      this.loading = false;
      return;
    }

    try {
      const employee = await this.employeeService.getById(this.employeeId);

      this.employeeForm = this.fb.group({
        id: [employee.id],
        name: [employee?.name || '', Validators.required],
        phone1: [employee?.phone1 || ''],
        phone2: [employee?.phone2 || ''],
        email: [employee?.email || '', [Validators.required, Validators.email]],
        cpf: [employee?.cpf || '', Validators.required],
        rg: [employee?.rg || ''],
        cep: [employee?.cep || ''],
        street: [employee?.street || ''],
        neighborhood: [employee?.neighborhood || ''],
        city: [employee?.city || ''],
        state: [employee?.state || ''],
        number: [employee?.number || ''],
        birthday: [employee?.birthday || ''],
        yearsOld: [employee?.yearsOld || ''],
        password: [employee?.password || '', Validators.required],
        profilePic: [null],
        sex: [employee?.sex || 'masculino', Validators.required],
        polo: [employee?.polo || ''],
        description: [employee?.description || ''],
      });

      this.loading = false;
    } catch (error) {
      this.notificationService.showNotification(
        'Erro ao consultar dados do estudante: ' + error,
        NotificationType.ERROR
      );
      this.loading = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.employeeForm.valid && this.employeeForm.dirty) {
      const employee: Employee = this.employeeForm.value as Employee;
      try {
        await this.employeeManagementService.update(
          employee,
          this.selectedFile
        );
        this.notificationService.showNotification(
          'Funcionário editado com sucesso!',
          NotificationType.SUCCESS
        );
        this.router.navigate(['/admin/employee-list']);
      } catch (error) {
        this.notificationService.showNotification(
          'Erro ao editar funcionário: ' + error,
          NotificationType.ERROR
        );
      }
    } else {
      this.notificationService.showNotification(
        'Por favor, preencha todos os campos obrigatórios corretamente.',
        NotificationType.ERROR
      );
    }
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }
}
