import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ClassManagementService } from '../../services/class-management.service';
import { Class } from '../../../../core/models/class.model';
import { NotificationService } from '../../../../shared/services/notification.service';
import { SearchBarComponent } from "../../../../shared/components/search-bar/search-bar.component";
import { ClassService } from '../../services/class.service';

@Component({
  selector: 'app-class-attendance-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    SearchBarComponent
],
  template: `
    <div class="attendance-list-container">
      <div>

        <h2>Lista de Presenças por Turma</h2>

        <app-search-bar [dataList]="classes()" #searchBar></app-search-bar>
      </div>

      <div class="classes-grid">
        @for (class of searchBar.filteredList(); track class.id) {
          <mat-card class="class-card" (click)="navigateToAttendance(class)">
            <mat-card-header>
              <mat-card-title>{{ class.name }}</mat-card-title>
              <mat-card-subtitle>
                {{ class.time }} - Sala {{ class.room }}
              </mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
              <p><strong>Professor:</strong> {{ class.teacher }}</p>
              <p><strong>Alunos:</strong> {{ class.studentIds?.length || 0 }}</p>
              <p><strong>Dias:</strong> {{ formatDaysWeek(class.daysWeek) }}</p>
            </mat-card-content>

            <mat-card-actions>
              <button mat-button color="primary" (click)="navigateToAttendance(class); $event.stopPropagation()">
                <mat-icon>fact_check</mat-icon>
                Ver Presenças
              </button>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .attendance-list-container {
      padding: 2rem;
      
      h2 {
        margin-bottom: 2rem;
        color: #333;
      }
    }

    .classes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      padding: 1rem;
    }

    .class-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      
      mat-card-header {
        margin-bottom: 1rem;
      }
      
      mat-card-content {
        p {
          margin: 0.5rem 0;
        }
      }
      
      mat-card-actions {
        padding: 1rem;
        display: flex;
        justify-content: flex-end;
      }
    }
  `]
})
export class ClassAttendanceListComponent implements OnInit {
  private classService = inject(ClassService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  classes = signal<Class[]>([]);

  constructor() {
  }

  ngOnInit() {
    this.loadClasses();
  }

  private async loadClasses() {
    try {
      // As classes já são carregadas e mantidas no serviço
      this.classes = this.classService.classes;
      console.log(this.classes)
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
      this.notificationService.error('Erro ao carregar lista de turmas');
    }
  }

  formatDaysWeek(days: string[]): string {
    if (!days || days.length === 0) return 'Não definido';
    
    const dayMap: { [key: string]: string } = {
      'MONDAY': 'Seg',
      'TUESDAY': 'Ter',
      'WEDNESDAY': 'Qua',
      'THURSDAY': 'Qui',
      'FRIDAY': 'Sex',
      'SATURDAY': 'Sáb',
      'SUNDAY': 'Dom'
    };

    return days.map(day => dayMap[day] || day).join(', ');
  }

  navigateToAttendance(classData: Class) {
    this.router.navigate(['/admin/class-attendance', classData.id]);
  }
}
