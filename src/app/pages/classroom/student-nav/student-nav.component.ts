import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="student-nav" [class.collapsed]="isCollapsed()">
      <button class="toggle-nav" (click)="toggleNav()">
        <i class="fas" [class.fa-chevron-left]="!isCollapsed()" [class.fa-chevron-right]="isCollapsed()"></i>
      </button>
      <div class="nav-header">
        <h2>Área do Aluno</h2>
      </div>

      <ul class="nav-menu">
        <li>
          <a routerLink="/classroom/dashboard" routerLinkActive="active" [title]="'Dashboard'" (click)="onNavClick()">
            <i class="fas fa-chart-line"></i>
            <span>Dashboard</span>
          </a>
        </li>
        <li>
          <a routerLink="/classroom/course-catalog" routerLinkActive="active" [title]="'Catálogo de Cursos'" (click)="onNavClick()">
            <i class="fas fa-book"></i>
            <span>Catálogo de Cursos</span>
          </a>
        </li>
        <li>
          <a routerLink="/classroom/package-catalog" routerLinkActive="active" [title]="'Catálogo de Pacotes'" (click)="onNavClick()">
            <i class="fas fa-box"></i>
            <span>Catálogo de Pacotes</span>
          </a>
        </li>
        <li>
          <a routerLink="/classroom/student-exams" routerLinkActive="active" [title]="'Provas'" (click)="onNavClick()">
            <i class="fas fa-file-alt"></i>
            <span>Provas</span>
          </a>
        </li>
        <li>
          <a routerLink="/classroom/student-job-vacancies" routerLinkActive="active" [title]="'Vagas de Emprego'" (click)="onNavClick()">
            <i class="fas fa-briefcase"></i>
            <span>Vagas de Emprego</span>
          </a>
        </li>
        <li>
          <a routerLink="/classroom/student-id-card" routerLinkActive="active" [title]="'Carteirinha'" (click)="onNavClick()">
            <i class="fas fa-id-card"></i>
            <span>Carteirinha</span>
          </a>
        </li>
        <li>
          <a routerLink="/classroom/student-financial" routerLinkActive="active" [title]="'Financeiro'" (click)="onNavClick()">
            <i class="fas fa-money-bill-wave"></i>
            <span>Financeiro</span>
          </a>
        </li>
      </ul>

      <div class="nav-footer">
        <button class="logout-btn" (click)="logout()" [title]="'Sair'">
          <i class="fas fa-sign-out-alt"></i>
          <span>Sair</span>
        </button>
      </div>
    </nav>
  `,
  styleUrls: ['./student-nav.component.scss']
})
export class StudentNavComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  isCollapsed = signal<boolean>(window.innerWidth < 1024);

  @HostListener('window:resize')
  onResize() {
    this.isCollapsed.set(window.innerWidth < 1024);
  }

  toggleNav() {
    this.isCollapsed.update(value => !value);
  }

  onNavClick() {
    if (window.innerWidth < 1024) {
      this.isCollapsed.set(true);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
