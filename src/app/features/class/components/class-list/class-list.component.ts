import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Class } from '../../../../core/models/class.model';
import { ClassService } from '../../services/class.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="class-list-container">
      <div class="list-header">
        <h2>Lista de Turmas</h2>
        <button class="btn-add" (click)="router.navigate(['/admin/class-form'])">
          <i class="fas fa-plus"></i>
          Nova Turma
        </button>
      </div>

      <div class="class-grid">
        @for (classItem of classService.classes(); track classItem.id) {
          <div class="class-card">
            <div class="class-content">
              <h3>{{ classItem.name }}</h3>

              <div class="class-info">
                <div class="info-item">
                  <i class="fas fa-clock"></i>
                  <span>{{ classItem.time }}</span>
                </div>
                <div class="info-item">
                  <i class="fas fa-calendar"></i>
                  <span>{{ formatDaysWeek(classItem.daysWeek) }}</span>
                </div>
                <div class="info-item">
                  <i class="fas fa-door-open"></i>
                  <span>Sala: {{ classItem.room }}</span>
                </div>
              </div>

              <div class="class-dates">
                <span>Início: {{ classItem.startDate | date }}</span>
                <span>Término: {{ classItem.finishDate | date }}</span>
              </div>

              <div class="class-status" [class.active]="classItem.status">
                {{ classItem.status ? 'Ativa' : 'Inativa' }}
              </div>
            </div>

            <div class="class-actions">
              <button class="btn-edit" (click)="edit(classItem.id!)">
                <i class="fas fa-edit"></i>
                Editar
              </button>
              <button class="btn-delete" (click)="delete(classItem.id!)">
                <i class="fas fa-trash"></i>
                Excluir
              </button>
            </div>
          </div>
        } @empty {
          <div class="no-classes">
            <i class="fas fa-users"></i>
            <p>Nenhuma turma encontrada</p>
            <button class="btn-add" (click)="router.navigate(['/admin/class-form'])">
              Criar Primeira Turma
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./class-list.component.scss']
})
export class ClassListComponent implements OnInit {
  loading = signal(true);

  private readonly dayWeekMap = {
    'MONDAY': 'Segunda',
    'TUESDAY': 'Terça',
    'WEDNESDAY': 'Quarta',
    'THURSDAY': 'Quinta',
    'FRIDAY': 'Sexta',
    'SATURDAY': 'Sábado',
    'SUNDAY': 'Domingo'
  };

  constructor(
    public classService: ClassService,
    private notificationService: NotificationService,
    public router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // O serviço já carrega as turmas automaticamente
      this.loading.set(false);
    } catch (error) {
      this.notificationService.error('Erro ao carregar turmas');
      console.error(error);
    }
  }

  formatDaysWeek(days: string[]): string {
    if (!days || days.length === 0) return 'Não definido';
    return days.map(day => this.dayWeekMap[day as keyof typeof this.dayWeekMap] || day)
               .join(', ');
  }

  async delete(id: string) {
    try {
      //await this.classService.delete(id);
      this.notificationService.success('Turma excluída com sucesso');
    } catch (error) {
      this.notificationService.error('Erro ao excluir turma');
      console.error(error);
    }
  }

  edit(id: string) {
    this.router.navigate(['/admin/class-form', id]);
  }
}
