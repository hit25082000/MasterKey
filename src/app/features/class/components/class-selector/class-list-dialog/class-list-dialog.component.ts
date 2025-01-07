import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ClassManagementService } from '../../../services/class-management.service';
import { Class } from '../../../../../core/models/class.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-class-list-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>Selecionar Turmas</h2>
    <mat-dialog-content>
      <table mat-table [dataSource]="classes()" class="mat-elevation-z8">
        <ng-container matColumnDef="select">
          <th mat-header-cell *matHeaderCellDef>
            <mat-checkbox
              (change)="$event ? toggleAllRows() : null"
              [checked]="selection().size === classes().length"
              [indeterminate]="selection().size > 0 && selection().size < classes().length"
            >
            </mat-checkbox>
          </th>
          <td mat-cell *matCellDef="let row">
            <mat-checkbox
              (click)="$event.stopPropagation()"
              (change)="$event ? toggleRow(row) : null"
              [checked]="selection().has(row.id!)"
            >
            </mat-checkbox>
          </td>
        </ng-container>

        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nome</th>
          <td mat-cell *matCellDef="let element">{{ element.name }}</td>
        </ng-container>

        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>Descrição</th>
          <td mat-cell *matCellDef="let element">{{ element.description }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr
          mat-row
          *matRowDef="let row; columns: displayedColumns"
          (click)="toggleRow(row)"
        ></tr>
      </table>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()">Salvar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-height: 400px;
      max-height: 600px;
      overflow: auto;
    }

    table {
      width: 100%;
    }

    .mat-column-select {
      width: 48px;
      padding: 0 8px;
    }
  `]
})
export class ClassListDialogComponent {
  private classService = inject(ClassManagementService);
  private dialogRef = inject(MatDialogRef<ClassListDialogComponent>);
  private data = inject<{ selectedClasses: Class[] }>(MAT_DIALOG_DATA);

  classes = signal<Class[]>([]);
  selection = signal<Set<string>>(new Set());
  displayedColumns = ['select', 'name', 'description'];

  constructor() {
    this.loadClasses();
    // Inicializa a seleção com as turmas já selecionadas
    this.selection.set(new Set(this.data.selectedClasses.map(c => c.id!)));
  }

  async loadClasses() {
    try {
      const classes = await firstValueFrom(this.classService.loadClasses());
      this.classes.set(classes);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  }

  toggleRow(row: Class) {
    const newSelection = new Set(this.selection());
    if (row.id) {
      if (newSelection.has(row.id)) {
        newSelection.delete(row.id);
      } else {
        newSelection.add(row.id);
      }
      this.selection.set(newSelection);
    }
  }

  toggleAllRows() {
    if (this.selection().size === this.classes().length) {
      this.selection.set(new Set());
    } else {
      this.selection.set(new Set(this.classes().map(c => c.id!)));
    }
  }

  save() {
    const selectedClasses = this.classes().filter(c => c.id && this.selection().has(c.id));
    this.dialogRef.close(selectedClasses);
  }
}
