import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ClassListDialogComponent } from './class-list-dialog/class-list-dialog.component';
import { ClassService } from '../../services/class.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Class } from '../../../../core/models/class.model';
import { firstValueFrom } from 'rxjs';
import { ClassManagementService } from '../../services/class-management.service';

@Component({
  selector: 'app-class-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    ClassListDialogComponent
  ],
  template: `
    <div class="class-selector">
      <div class="chips-container">
        @for (classItem of selectedClasses(); track classItem.id) {
          <mat-chip-row (removed)="removeClass(classItem)">
            {{ classItem.name }}
            <button matChipRemove>
              <mat-icon>cancel</mat-icon>
            </button>
          </mat-chip-row>
        }
      </div>
      <button mat-stroked-button color="primary" (click)="openClassSelector()">
        <mat-icon>add</mat-icon>
        Adicionar Turma
      </button>
    </div>
  `,
  styles: [`
    .class-selector {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    mat-chip-row {
      background-color: #e0e0e0;
    }
  `]
})
export class ClassSelectorComponent {
  private dialog = inject(MatDialog);
  private classService = inject(ClassService);
  private classManagementService = inject(ClassManagementService);
  private notificationService = inject(NotificationService);

  @Input() studentId = '';

  selectedClasses = signal<Class[]>([]);

  constructor() {
    this.loadStudentClasses();
  }

  private async loadStudentClasses() {
    if (!this.studentId) return;

    try {
      const classes = await firstValueFrom(this.classService.getClassesByStudentId(this.studentId));
      this.selectedClasses.set(classes);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
      this.notificationService.error('Erro ao carregar turmas');
    }
  }

  async openClassSelector() {
    const dialogRef = this.dialog.open(ClassListDialogComponent, {
      width: '600px',
      data: {
        selectedClasses: this.selectedClasses()
      }
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      this.selectedClasses.set(result);
      await this.updateStudentClasses();
    }
  }

  async removeClass(classItem: Class) {
    if (!classItem.id || !this.studentId) return;

    try {
      const newClasses = this.selectedClasses().filter(c => c.id !== classItem.id);
      this.selectedClasses.set(newClasses);
      await this.updateStudentClasses();
    } catch (error) {
      console.error('Erro ao remover turma:', error);
      this.notificationService.error('Erro ao remover turma');
    }
  }

  async updateStudentClasses() {
    if (!this.studentId) return;

    try {      
        this.classManagementService.updateClass(
          this.studentId,
          {},
          this.selectedClasses().map(c => c.id!)
        ).then(()=>{
          this.notificationService.success('Turmas atualizadas com sucesso');
        })
      
    } catch (error) {
      console.error('Erro ao atualizar turmas:', error);
      this.notificationService.error('Erro ao atualizar turmas');
    }
  }
}
