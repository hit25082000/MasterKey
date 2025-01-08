import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ClassService } from '../../services/class.service';
import { ClassManagementService } from '../../services/class-management.service';
import { firstValueFrom } from 'rxjs';
import { computed } from '@angular/core';
import { WeekdayTranslatorPipe } from '../../pipes/weekday-translator.pipe';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, WeekdayTranslatorPipe],
  templateUrl: './class-list.component.html',
  styles: [`
    .class-list-container {
      padding: 2rem;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h2 {
      font-size: 1.5rem;
      color: #333;
      margin: 0;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }

    .btn i {
      font-size: 0.875rem;
    }

    .btn-primary {
      background-color: #2196f3;
      color: white;
    }

    .btn-primary:hover {
      background-color: #1976d2;
    }

    .btn-edit {
      background-color: #4caf50;
      color: white;
    }

    .btn-edit:hover {
      background-color: #388e3c;
    }

    .btn-delete {
      background-color: #f44336;
      color: white;
    }

    .btn-delete:hover {
      background-color: #d32f2f;
    }

    .class-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    .class-table th,
    .class-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    .class-table th {
      background-color: #f5f5f5;
      font-weight: 600;
      color: #333;
    }

    .class-table tr:hover {
      background-color: #f8f9fa;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .actions button {
      padding: 0.4rem 0.8rem;
      font-size: 0.875rem;
    }
  `]
})
export class ClassListComponent {
  private classService = inject(ClassService);
  private classManagementService = inject(ClassManagementService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  classes = computed(() => this.classService.classes());
  displayedColumns: string[] = ['name', 'description', 'actions'];

  create() {
    this.router.navigate(['/admin/class-form']);
  }

  edit(id: string) {
    this.router.navigate(['/admin/class-form', id]);
  }

  attendance(id: string) {
    this.router.navigate(['/admin/classes/attendance', id]);
  }

  async delete(id: string) {
    try {
      await firstValueFrom(this.classManagementService.delete(id));
      this.notificationService.success('Turma excluída com sucesso');
    } catch (error) {
      this.notificationService.error('Erro ao excluir turma');
    }
  }
}
