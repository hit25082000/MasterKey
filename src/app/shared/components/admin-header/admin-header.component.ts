import { Component, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import BaseUser from '../../../core/models/base-user.model';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="admin-header" [class.expanded]="expanded">
      <div class="logo-container">
        <img src="assets/logo.png" 
             alt="Logo da Empresa" 
             class="company-logo" 
             [routerLink]="['dashboard']" 
             style="cursor: pointer;">
      </div>

      <div class="user-container">
        <div class="user-info">
          <span class="user-name">{{ user()?.name || 'Usuário' }}</span>
          <span class="user-role">{{ user()?.role | titlecase }}</span>
        </div>
        <div class="user-avatar">
          @if (user()?.profilePic) {
            <img [src]="user()?.profilePic"
                 [alt]="user()?.name"
                 class="avatar-image"
                 (error)="handleImageError($event)">
          } @else {
            <div class="default-avatar">
              <i class="fas fa-user"></i>
            </div>
          }
          <span class="status-indicator"></span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .admin-header {
      height: 70px;
      background: white;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      padding: 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: .5rem;
      top: 0;
      right: 0;
      left: 280px; // Largura inicial do sidenav
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;

      &.expanded {
        left: 280px; // Largura quando expandido
      }

      &:not(.expanded) {
        left: 80px; // Largura quando recolhido
      }

      .logo-container {
        .company-logo {
          height: 40px;
          width: auto;
          transition: transform 0.3s ease;

          &:hover {
            transform: scale(1.05);
          }
        }
      }

      .user-container {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem;
        border-radius: 12px;
        transition: all 0.3s ease;

        &:hover {
          background: #f8fafc;

          .user-avatar {
            .avatar-image, .default-avatar {
              transform: scale(1.05);
            }
          }
        }

        .user-info {
          text-align: right;

          .user-name {
            display: block;
            color: #2d3748;
            font-weight: 600;
            font-size: 0.95rem;
          }

          .user-role {
            color: #718096;
            font-size: 0.8rem;
          }
        }

        .user-avatar {
          position: relative;

          .avatar-image, .default-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            transition: all 0.3s ease;
          }

          .avatar-image {
            object-fit: cover;
            border: 2px solid #e2e8f0;
          }

          .default-avatar {
            background: #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #718096;
            font-size: 1.2rem;
            border: 2px solid #e2e8f0;
          }

          .status-indicator {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #48bb78;
            border: 2px solid white;
            box-shadow: 0 0 0 2px rgba(72, 187, 120, 0.2);
          }
        }
      }
    }

    // Responsividade
    @media (max-width: 768px) {
      .admin-header {
        left: 0 !important; // Força left: 0 em mobile
        padding: 0 1rem;

        .logo-container {
          .company-logo {
            height: 32px;
          }
        }

        .user-container {
          .user-info {
            display: none;
          }
        }
      }
    }
  `]
})
export class AdminHeaderComponent {
  private authService = inject(AuthService);
  user = signal<BaseUser | undefined>(undefined);
  @Input() expanded = true;

  ngOnInit() {
    this.user.set(this.authService.getCurrentUser());
  }

  handleImageError(event: any) {
    const imgElement = event.target;
    // Remove a imagem com erro e mostra o avatar padrão
    imgElement.style.display = 'none';
    imgElement.insertAdjacentHTML('afterend', `
      <div class="default-avatar">
        <i class="fas fa-user"></i>
      </div>
    `);
  }
}
