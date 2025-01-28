import { routes } from '../../../../app.routes';
import { Component, OnInit, inject } from '@angular/core';
import {Employee} from '../../../../core/models/employee.model';
import { EmployeeManagementService } from '../../services/employee-management.service';
import { Router, Routes } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, ConfirmationDialogComponent],
  template: `
    <div class="employee-list-container">
      <div class="list-header">
        <h2>Lista de Funcionários</h2>
        <button class="btn-add" (click)="router.navigate(['/admin/employee-form'])">
          <i class="fas fa-plus"></i>
          Novo Funcionário
        </button>
      </div>

      <div class="employee-grid">
        @for (employee of employees; track employee.id) {
          <div class="employee-card">
            <div class="employee-avatar">
              <img [src]="employee.profilePic || 'assets/images/default-avatar.png'" [alt]="employee.name">
            </div>

            <div class="employee-content">
              <h3>{{ employee.name }}</h3>

              <div class="employee-info">
                <div class="info-item">
                  <i class="fas fa-phone"></i>
                  <span>{{ employee.phone1 }}</span>
                </div>
                <div class="info-item">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>{{ employee.city }}</span>
                </div>
                <div class="info-item">
                  <i class="fas fa-building"></i>
                  <span>{{ employee.polo }}</span>
                </div>
              </div>

              <div class="employee-role">
                {{ employee.role }}
              </div>
            </div>

            <div class="employee-actions">
              <button class="btn-edit" (click)="editEmployees(employee.id!)">
                <i class="fas fa-edit"></i>
                Editar
              </button>
              <button class="btn-delete" (click)="deleteEmployees(employee.id!)">
                <i class="fas fa-trash"></i>
                Excluir
              </button>
            </div>
          </div>
        } @empty {
          <div class="no-employees">
            <i class="fas fa-user-tie"></i>
            <p>Nenhum funcionário encontrado</p>
            <button class="btn-add" (click)="router.navigate(['/admin/employee-form'])">
              Adicionar Primeiro Funcionário
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./employee-list.component.scss']
})
export class EmployeeListComponent implements OnInit {
  employees: Employee[] = [];
  router = inject(Router);
  private employeeManagementService = inject(EmployeeManagementService);
  private notificationService = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);
  private employeeService = inject(EmployeeService)    

  constructor() {}

  async ngOnInit(): Promise<void> {
    try {
      this.employees = await this.employeeService.getAll();
    } catch (err) {
    } finally {
    }
  }

  deleteEmployees(id: string) {
    this.confirmationService.confirm({
      header: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir este funcionário?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.employeeManagementService.delete(id).subscribe({
          next: () => {
            this.employees = this.employees.filter(emp => emp.id !== id);
            this.notificationService.success('Funcionário excluído com sucesso');
          },
          error: (error: Error) => {
            console.error('Erro ao deletar funcionário:', error);
            this.notificationService.error('Erro ao excluir funcionário: ' + error.message);
          }
        });
      }
    });
  }

  editEmployees(id: string) {
    this.router.navigate(['/admin/employee-form', id]);
  }
}
