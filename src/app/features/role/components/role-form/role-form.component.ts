import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RoutePermission } from '../permission-select/permission.enum';
import { Role } from '../../../../core/models/role.model';
import { RoleManagementService } from '../../service/role-management.service';
import { RoleService } from '../../service/role.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';
import { InputComponent } from '../../../../shared/components/input/input.component';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, InputComponent],
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.scss']
})
export class RoleFormComponent implements OnInit {
  roleForm!: FormGroup;
  permissionsList = Object.values(RoutePermission);
  roleId: string | null = null;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private roleManagementService: RoleManagementService,
    private roleService: RoleService,
    private loadingService: LoadingService,
    private notificationService: NotificationService
  ) {}

  async ngOnInit(): Promise<void> {
    this.loadingService.show();
    this.roleId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.roleId;

    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      permissions: new FormControl([], Validators.required)
    });

    if (this.isEditMode) {
      try {
        const role = await this.roleService.getById(this.roleId!);
        this.roleForm.patchValue({
          name: role.name,
          permissions: role.permissions
        });
      } catch (error) {
        this.notificationService.showNotification(
          'Erro ao carregar os dados da função',
          NotificationType.ERROR
        );
        console.error(error);
      }
    }

    this.loadingService.hide();
  }

  onSubmit() {
    this.loadingService.show();
    if (this.roleForm.valid) {
      const roleData: Role = this.roleForm.value;
      const operation = this.isEditMode
        ? this.roleManagementService.update(this.roleId!, roleData)
        : this.roleManagementService.create(roleData);

      operation
        .then((success) => {
          this.notificationService.showNotification(
            `Função ${this.isEditMode ? 'atualizada' : 'criada'} com sucesso`,
            NotificationType.SUCCESS
          );
          this.router.navigate(['/admin/role-list']);
        })
        .catch((error) => {
          this.notificationService.showNotification(
            `Erro ao ${this.isEditMode ? 'atualizar' : 'criar'} função: ${error.message}`,
            NotificationType.ERROR
          );
        })
        .finally(() => {
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
