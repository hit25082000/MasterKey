import { Component, inject, OnInit } from '@angular/core';
import { Student } from '../../../../core/models/student.model';
import { Router, Routes } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { RoleManagementService } from '../../service/role-management.service';
import { RoleService } from '../../service/role.service';
import { Role } from '../../../../core/models/role.model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="role-list-container">
      <div class="list-header">
        <h2>Lista de Funções</h2>
        <button class="btn-add" (click)="router.navigate(['/admin/role-form'])">
          <i class="fas fa-plus"></i>
          Nova Função
        </button>
      </div>

      <div class="role-grid">
        @for (role of roles; track role.id) {
          <div class="role-card">
            <div class="role-content">
              <h3>{{ role.name }}</h3>

              <div class="permissions-groups">
                <!-- Admin -->
                @if (hasPermissionInGroup(role.permissions, 'ADMIN')) {
                  <div class="permission-group admin">
                    <h4><i class="fas fa-shield-alt"></i> Admin</h4>
                    <div class="permissions-list">
                      @for (permission of getPermissionsInGroup(role.permissions, 'ADMIN'); track permission) {
                        <span class="permission-badge">{{ permission }}</span>
                      }
                    </div>
                  </div>
                }

                <!-- Estudantes -->
                @if (hasPermissionInGroup(role.permissions, 'STUDENT')) {
                  <div class="permission-group students">
                    <h4><i class="fas fa-user-graduate"></i> Estudantes</h4>
                    <div class="permissions-list">
                      @for (permission of getPermissionsInGroup(role.permissions, 'STUDENT'); track permission) {
                        <span class="permission-badge">{{ formatPermissionName(permission) }}</span>
                      }
                    </div>
                  </div>
                }

                <!-- Cursos -->
                @if (hasPermissionInGroup(role.permissions, 'COURSE')) {
                  <div class="permission-group courses">
                    <h4><i class="fas fa-book"></i> Cursos</h4>
                    <div class="permissions-list">
                      @for (permission of getPermissionsInGroup(role.permissions, 'COURSE'); track permission) {
                        <span class="permission-badge">{{ formatPermissionName(permission) }}</span>
                      }
                    </div>
                  </div>
                }

                <!-- Pacotes -->
                @if (hasPermissionInGroup(role.permissions, 'PACKAGE')) {
                  <div class="permission-group packages">
                    <h4><i class="fas fa-box"></i> Pacotes</h4>
                    <div class="permissions-list">
                      @for (permission of getPermissionsInGroup(role.permissions, 'PACKAGE'); track permission) {
                        <span class="permission-badge">{{ formatPermissionName(permission) }}</span>
                      }
                    </div>
                  </div>
                }

                <!-- Categorias -->
                @if (hasPermissionInGroup(role.permissions, 'CATEGORY')) {
                  <div class="permission-group categories">
                    <h4><i class="fas fa-tags"></i> Categorias</h4>
                    <div class="permissions-list">
                      @for (permission of getPermissionsInGroup(role.permissions, 'CATEGORY'); track permission) {
                        <span class="permission-badge">{{ formatPermissionName(permission) }}</span>
                      }
                    </div>
                  </div>
                }

                <!-- Turmas -->
                @if (hasPermissionInGroup(role.permissions, 'CLASS')) {
                  <div class="permission-group classes">
                    <h4><i class="fas fa-users"></i> Turmas</h4>
                    <div class="permissions-list">
                      @for (permission of getPermissionsInGroup(role.permissions, 'CLASS'); track permission) {
                        <span class="permission-badge">{{ formatPermissionName(permission) }}</span>
                      }
                    </div>
                  </div>
                }

                <!-- Funcionários -->
                @if (hasPermissionInGroup(role.permissions, 'EMPLOYEE')) {
                  <div class="permission-group employees">
                    <h4><i class="fas fa-user-tie"></i> Funcionários</h4>
                    <div class="permissions-list">
                      @for (permission of getPermissionsInGroup(role.permissions, 'EMPLOYEE'); track permission) {
                        <span class="permission-badge">{{ formatPermissionName(permission) }}</span>
                      }
                    </div>
                  </div>
                }

                <!-- Funções -->
                @if (hasPermissionInGroup(role.permissions, 'ROLE')) {
                  <div class="permission-group roles">
                    <h4><i class="fas fa-lock"></i> Funções</h4>
                    <div class="permissions-list">
                      @for (permission of getPermissionsInGroup(role.permissions, 'ROLE'); track permission) {
                        <span class="permission-badge">{{ formatPermissionName(permission) }}</span>
                      }
                    </div>
                  </div>
                }

                <!-- Outros -->
                @if (hasOtherPermissions(role.permissions)) {
                  <div class="permission-group others">
                    <h4><i class="fas fa-ellipsis-h"></i> Outros</h4>
                    <div class="permissions-list">
                      @for (permission of getOtherPermissions(role.permissions); track permission) {
                        <span class="permission-badge">{{ formatPermissionName(permission) }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="role-actions">
              <button class="btn-edit" (click)="editRole(role.id!)">
                <i class="fas fa-edit"></i>
                Editar
              </button>
              <button class="btn-delete" (click)="deleteRole(role.id!)">
                <i class="fas fa-trash"></i>
                Excluir
              </button>
            </div>
          </div>
        } @empty {
          <div class="no-roles">
            <i class="fas fa-lock"></i>
            <p>Nenhuma função encontrada</p>
            <button class="btn-add" (click)="router.navigate(['/admin/role-form'])">
              Criar Primeira Função
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./role-list.component.scss']
})
export class RoleListComponent implements OnInit {
  roles: Role[] = [];
  router = inject(Router)

  constructor(
    private roleService: RoleService,
    private auth: AuthService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.roles = await this.roleService.getAll();
    } catch (err) {
      //this.error = 'Erro ao carregar os alunos';
      console.error(err);
    } finally {
      //this.loading = false;
    }
  }

  deleteRole(id: string) {
    this.roleService.delete(id);
  }

  editRole(id: string) {
    this.router.navigate(['/admin/role-form', id]);
  }

  hasPermissionInGroup(permissions: string[], group: string): boolean {
    return permissions.some(p => p.includes(group));
  }

  getPermissionsInGroup(permissions: string[], group: string): string[] {
    return permissions.filter(p => p.includes(group));
  }

  hasOtherPermissions(permissions: string[]): boolean {
    const mainGroups = ['ADMIN', 'STUDENT', 'COURSE', 'PACKAGE', 'CATEGORY', 'CLASS', 'EMPLOYEE', 'ROLE'];
    return permissions.some(p => !mainGroups.some(group => p.includes(group)));
  }

  getOtherPermissions(permissions: string[]): string[] {
    const mainGroups = ['ADMIN', 'STUDENT', 'COURSE', 'PACKAGE', 'CATEGORY', 'CLASS', 'EMPLOYEE', 'ROLE'];
    return permissions.filter(p => !mainGroups.some(group => p.includes(group)));
  }

  formatPermissionName(permission: string): string {
    // Remove o prefixo do grupo e formata o texto
    const parts = permission.split('_');
    if (parts.length > 1) {
      parts.shift(); // Remove o primeiro elemento (prefixo do grupo)
    }
    return parts.map(part =>
      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    ).join(' ');
  }
}
