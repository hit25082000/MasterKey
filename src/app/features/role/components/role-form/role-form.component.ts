import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormFieldConfig } from '../../../../shared/models/form-field-config';
import { RoleManagementService } from '../../service/role-management.service';
import { RoleService } from '../../service/role.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Router, ActivatedRoute } from '@angular/router';
import { GenericFormComponent } from '../../../../shared/components/generic-form/generic-form.component';
import { Validators } from '@angular/forms';
import { RoutePermission } from '../permission-select/permission.enum';
import { Role } from '../../../../core/models/role.model';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, GenericFormComponent],
  template: `
    @if (loading()) {
      <div class="loading">Carregando...</div>
    } @else {
      <app-generic-form
        [config]="formConfig()"
        [submitButtonText]="isEditMode() ? 'Atualizar Função' : 'Criar Função'"
        (formSubmit)="onSubmit($event)"
        [formTitle]="isEditMode() ? 'Editar Função' : 'Nova Função'"
      >
        <div class="permissions-section">
          <h3>Permissões</h3>

          <!-- Admin -->
          <div class="permission-group admin">
            <h4><i class="fas fa-shield-alt"></i> Admin</h4>
            <div class="permissions-list">
              @for (permission of getPermissionsByGroup('ADMIN'); track permission) {
                <label class="permission-item">
                  <input
                    type="checkbox"
                    [checked]="selectedPermissions().includes(permission)"
                    (change)="togglePermission(permission)"
                  >
                  <span>{{ formatPermissionName(permission) }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Estudantes -->
          <div class="permission-group students">
            <h4><i class="fas fa-user-graduate"></i> Estudantes</h4>
            <div class="permissions-list">
              @for (permission of getPermissionsByGroup('STUDENT'); track permission) {
                <label class="permission-item">
                  <input
                    type="checkbox"
                    [checked]="selectedPermissions().includes(permission)"
                    (change)="togglePermission(permission)"
                  >
                  <span>{{ formatPermissionName(permission) }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Cursos -->
          <div class="permission-group courses">
            <h4><i class="fas fa-book"></i> Cursos</h4>
            <div class="permissions-list">
              @for (permission of getPermissionsByGroup('COURSE'); track permission) {
                <label class="permission-item">
                  <input
                    type="checkbox"
                    [checked]="selectedPermissions().includes(permission)"
                    (change)="togglePermission(permission)"
                  >
                  <span>{{ formatPermissionName(permission) }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Pacotes -->
          <div class="permission-group packages">
            <h4><i class="fas fa-box"></i> Pacotes</h4>
            <div class="permissions-list">
              @for (permission of getPermissionsByGroup('PACKAGE'); track permission) {
                <label class="permission-item">
                  <input
                    type="checkbox"
                    [checked]="selectedPermissions().includes(permission)"
                    (change)="togglePermission(permission)"
                  >
                  <span>{{ formatPermissionName(permission) }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Categorias -->
          <div class="permission-group categories">
            <h4><i class="fas fa-tags"></i> Categorias</h4>
            <div class="permissions-list">
              @for (permission of getPermissionsByGroup('CATEGORY'); track permission) {
                <label class="permission-item">
                  <input
                    type="checkbox"
                    [checked]="selectedPermissions().includes(permission)"
                    (change)="togglePermission(permission)"
                  >
                  <span>{{ formatPermissionName(permission) }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Turmas -->
          <div class="permission-group classes">
            <h4><i class="fas fa-users"></i> Turmas</h4>
            <div class="permissions-list">
              @for (permission of getPermissionsByGroup('CLASS'); track permission) {
                <label class="permission-item">
                  <input
                    type="checkbox"
                    [checked]="selectedPermissions().includes(permission)"
                    (change)="togglePermission(permission)"
                  >
                  <span>{{ formatPermissionName(permission) }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Funcionários -->
          <div class="permission-group employees">
            <h4><i class="fas fa-user-tie"></i> Funcionários</h4>
            <div class="permissions-list">
              @for (permission of getPermissionsByGroup('EMPLOYEE'); track permission) {
                <label class="permission-item">
                  <input
                    type="checkbox"
                    [checked]="selectedPermissions().includes(permission)"
                    (change)="togglePermission(permission)"
                  >
                  <span>{{ formatPermissionName(permission) }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Funções -->
          <div class="permission-group roles">
            <h4><i class="fas fa-lock"></i> Funções</h4>
            <div class="permissions-list">
              @for (permission of getPermissionsByGroup('ROLE'); track permission) {
                <label class="permission-item">
                  <input
                    type="checkbox"
                    [checked]="selectedPermissions().includes(permission)"
                    (change)="togglePermission(permission)"
                  >
                  <span>{{ formatPermissionName(permission) }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Outros -->
          <div class="permission-group others">
            <h4><i class="fas fa-ellipsis-h"></i> Outros</h4>
            <div class="permissions-list">
              @for (permission of getOtherPermissions(); track permission) {
                <label class="permission-item">
                  <input
                    type="checkbox"
                    [checked]="selectedPermissions().includes(permission)"
                    (change)="togglePermission(permission)"
                  >
                  <span>{{ formatPermissionName(permission) }}</span>
                </label>
              }
            </div>
          </div>
        </div>
      </app-generic-form>
    }
  `,
  styleUrls: ['./role-form.component.scss']
})
export class RoleFormComponent implements OnInit {
  formConfig = signal<FormFieldConfig[]>([]);
  loading = signal(true);
  roleId = signal<string | null>(null);
  permissionsList = Object.values(RoutePermission);
  selectedPermissions = signal<string[]>([]);

  private readonly resourceMap: { [key: string]: { text: string; group: string } } = {
    'STUDENTS': { text: 'Alunos', group: 'STUDENT' },
    'STUDENT': { text: 'Aluno', group: 'STUDENT' },
    'COURSES': { text: 'Cursos', group: 'COURSE' },
    'COURSE': { text: 'Curso', group: 'COURSE' },
    'PACKAGES': { text: 'Pacotes', group: 'PACKAGE' },
    'PACKAGE': { text: 'Pacote', group: 'PACKAGE' },
    'CATEGORIES': { text: 'Categorias', group: 'CATEGORY' },
    'CATEGORY': { text: 'Categoria', group: 'CATEGORY' },
    'CLASSES': { text: 'Turmas', group: 'CLASS' },
    'CLASS': { text: 'Turma', group: 'CLASS' },
    'EMPLOYEES': { text: 'Funcionários', group: 'EMPLOYEE' },
    'EMPLOYEE': { text: 'Funcionário', group: 'EMPLOYEE' },
    'ROLES': { text: 'Funções', group: 'ROLE' },
    'ROLE': { text: 'Função', group: 'ROLE' },
    'JOBS': { text: 'Vagas', group: 'JOB' },
    'JOB': { text: 'Vaga', group: 'JOB' },
    'EXAMS': { text: 'Exames', group: 'EXAM' },
    'EXAM': { text: 'Exame', group: 'EXAM' },
    'LIBRARY': { text: 'Biblioteca', group: 'LIBRARY' },
    'MEETINGS': { text: 'Aulas ao Vivo', group: 'MEETING' },
    'MEETING': { text: 'Aula ao Vivo', group: 'MEETING' },
    'STUDENT_LOGIN': { text: 'Lista de Presença', group: 'STUDENT' }
  };

  constructor(
    private roleManagementService: RoleManagementService,
    private roleService: RoleService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.roleId.set(id);

    if (this.isEditMode()) {
      await this.loadRole();
    } else {
      this.initNewRole();
    }
  }

  private async loadRole() {
    try {
      const role = await this.roleService.getById(this.roleId()!);
      this.selectedPermissions.set(role.permissions || []);
      this.initFormConfig(role);
    } catch (error) {
      this.notificationService.error('Erro ao carregar função');
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  private initFormConfig(role?: Role) {
    const config: FormFieldConfig[] = [
      {
        name: 'name',
        label: 'Nome da Função',
        type: 'text',
        value: role?.name || '',
        validators: [Validators.required],
        errorMessages: {
          required: 'Nome é obrigatório'
        }
      }
    ];

    this.formConfig.set(config);
  }

  private initNewRole() {
    this.initFormConfig();
    this.loading.set(false);
  }

  togglePermission(permission: string) {
    const currentPermissions = this.selectedPermissions();
    const index = currentPermissions.indexOf(permission);

    if (index === -1) {
      this.selectedPermissions.set([...currentPermissions, permission]);
    } else {
      this.selectedPermissions.set(
        currentPermissions.filter(p => p !== permission)
      );
    }
  }

  async onSubmit(formData: any) {
    try {
      const roleData: Role = {
        ...formData,
        permissions: this.selectedPermissions()
      };

      if (this.isEditMode()) {
        await this.roleManagementService.update(this.roleId()!, roleData);
        this.notificationService.success('Função atualizada com sucesso');
      } else {
        await this.roleManagementService.create(roleData);
        this.notificationService.success('Função criada com sucesso');
      }

      this.router.navigate(['/admin/role-list']);
    } catch (error) {
      this.notificationService.error(
        this.isEditMode()
          ? 'Erro ao atualizar função'
          : 'Erro ao criar função'
      );
      console.error(error);
    }
  }

  isEditMode(): boolean {
    return !!this.roleId();
  }

  getPermissionsByGroup(group: string): string[] {
    return this.permissionsList.filter(p => {
      const parts = p.split('_');
      if (parts.length <= 1) return p === group;

      const resource = parts[1];
      return this.resourceMap[resource]?.group === group;
    });
  }

  getOtherPermissions(): string[] {
    const mainGroups = ['ADMIN', 'STUDENT', 'COURSE', 'PACKAGE', 'CATEGORY', 'CLASS', 'EMPLOYEE', 'ROLE'];
    return this.permissionsList.filter(p => !mainGroups.some(group => p.includes(group)));
  }

  formatPermissionName(permission: string): string {
    // Remove o prefixo do grupo e formata o texto
    const parts = permission.split('_');

    // Se não tiver partes suficientes, retorna o original
    if (parts.length <= 1) return permission;

    // Remove o primeiro elemento (prefixo do grupo)
    const action = parts[0];
    const resource = parts.slice(1).join(' ');

    // Mapeia as ações para textos em português
    const actionMap: { [key: string]: string } = {
      'VIEW': 'Visualizar',
      'CREATE': 'Criar',
      'EDIT': 'Editar',
      'DELETE': 'Excluir',
      'MANAGE': 'Gerenciar',
      'ADMIN': 'Administrador'
    };

    // Mapeia os recursos para textos em português e seus grupos
    const resourceMap: { [key: string]: { text: string; group: string } } = {
      'STUDENTS': { text: 'Alunos', group: 'STUDENT' },
      'STUDENT': { text: 'Aluno', group: 'STUDENT' },
      'COURSES': { text: 'Cursos', group: 'COURSE' },
      'COURSE': { text: 'Curso', group: 'COURSE' },
      'PACKAGES': { text: 'Pacotes', group: 'PACKAGE' },
      'PACKAGE': { text: 'Pacote', group: 'PACKAGE' },
      'CATEGORIES': { text: 'Categorias', group: 'CATEGORY' },
      'CATEGORY': { text: 'Categoria', group: 'CATEGORY' },
      'CLASSES': { text: 'Turmas', group: 'CLASS' },
      'CLASS': { text: 'Turma', group: 'CLASS' },
      'EMPLOYEES': { text: 'Funcionários', group: 'EMPLOYEE' },
      'EMPLOYEE': { text: 'Funcionário', group: 'EMPLOYEE' },
      'ROLES': { text: 'Funções', group: 'ROLE' },
      'ROLE': { text: 'Função', group: 'ROLE' },
      'JOBS': { text: 'Vagas', group: 'JOB' },
      'JOB': { text: 'Vaga', group: 'JOB' },
      'EXAMS': { text: 'Exames', group: 'EXAM' },
      'EXAM': { text: 'Exame', group: 'EXAM' },
      'LIBRARY': { text: 'Biblioteca', group: 'LIBRARY' },
      'MEETINGS': { text: 'Aulas ao Vivo', group: 'MEETING' },
      'MEETING': { text: 'Aula ao Vivo', group: 'MEETING' },
      'STUDENT_LOGIN': { text: 'Lista de Presença', group: 'STUDENT' }
    };

    // Se for permissão de admin, retorna apenas "Administrador"
    if (permission === 'ADMIN') {
      return 'Administrador do Sistema';
    }

    // Traduz o recurso
    const resourceInfo = resource.split(' ').map(word => resourceMap[word]?.text || word).join(' ');

    // Retorna a ação traduzida + o recurso traduzido
    return `${actionMap[action] || action} ${resourceInfo}`;
  }
}
