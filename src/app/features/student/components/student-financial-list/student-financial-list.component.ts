import { Component, OnInit, signal, computed, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Student } from '../../../../core/models/student.model';
import { StudentService } from '../../services/student.service';
import { Router } from '@angular/router';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-student-financial-list',
  standalone: true,
  imports: [
    CommonModule,
    PaginationComponent,
    SearchBarComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="financial-list-container">
      <h2>Histórico Financeiro dos Alunos</h2>
      
      <app-search-bar #searchBar [dataList]="displayedStudents()"></app-search-bar>

      <div class="students-grid" *ngIf="!loadingService.isLoading()">
        <mat-card *ngFor="let student of searchBar.filteredList()" class="student-card">
          <mat-card-header>
            <img mat-card-avatar [src]="getImageUrl(student.profilePic)" [alt]="student.name">
            <mat-card-title>{{ student.name }}</mat-card-title>
            <mat-card-subtitle>{{ formatCpf(student.cpf) }}</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <p><strong>Email:</strong> {{ student.email }}</p>
            <p><strong>Telefone:</strong> {{ student.phone1 }}</p>
          </mat-card-content>

          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="viewFinancial(student.id)">
              <mat-icon>account_balance_wallet</mat-icon>
              Ver Financeiro
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <div class="loading-container" *ngIf="loadingService.isLoading()">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <app-pagination
        [currentPage]="currentPage()"
        [totalItems]="students().length"
        [pageSize]="pageSize()"
        (pageChange)="onPageChange($event)">
      </app-pagination>
    </div>
  `,
  styles: [`
    .financial-list-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    h2 {
      color: #333;
      margin-bottom: 20px;
    }

    .students-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }

    .student-card {
      border-radius: 8px;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-2px);
      }
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    mat-card-content {
      padding: 0 16px;
    }

    mat-card-actions {
      padding: 16px;
      display: flex;
      justify-content: flex-end;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }

    img[mat-card-avatar] {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }
  `]
})
export class StudentFinancialListComponent implements OnInit {
  public loadingService = inject(LoadingService);
  private studentService = inject(StudentService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  students = signal<Student[]>([]);
  currentPage = signal<number>(1);
  pageSize = signal<number>(12);
  error = signal<string>('');

  displayedStudents = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return this.students().slice(startIndex, endIndex);
  });

  async ngOnInit(): Promise<void> {
    this.loadingService.show();
    try {
      this.students = this.studentService.students;
    } catch (error: any) {
      this.error.set(error);
      this.notificationService.error('Erro ao consultar estudantes: ' + error);
    } finally {
      this.loadingService.hide();
    }
  }

  onPageChange(page: number): void {
    this.currentPage.set(Number(page));
  }

  viewFinancial(id: string) {
    this.router.navigate(['/admin/student-financial', id]);
  }

  getImageUrl(url: string | undefined): string {
    if (!url) return 'assets/images/default-profile.png';
    return `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
  }

  formatCpf(cpf: string | undefined): string {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
} 
