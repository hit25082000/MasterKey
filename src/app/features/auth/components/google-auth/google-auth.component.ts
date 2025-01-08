import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';

@Component({
  selector: 'app-google-auth',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="google-auth-container">
      <div class="auth-card">
        <div class="logo">
          <img src="assets/images/logo.png" alt="MasterKey Logo" />
        </div>
        <h1>Conectar com Google</h1>
        
        @if (!isAuthenticated()) {
          <div>
            <p>Clique no botão abaixo para conectar sua conta Google</p>
            <button class="google-button" (click)="connectGoogle()">
              <i class="fab fa-google"></i>
              Conectar com Google
            </button>
          </div>
        } @else {
          <div class="success-message">
            <p>
              <i class="fas fa-check-circle"></i>
              Conexão realizada com sucesso!
            </p>
            <button class="return-button" (click)="navigateBack()">
              Voltar
            </button>
          </div>
        }

        <div class="info">
          <p>
            <i class="fas fa-info-circle"></i>
            Esta página é dedicada à conexão segura com o Google
          </p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./google-auth.component.scss']
})
export class GoogleAuthComponent {
  private router = inject(Router);
  private googleAuthService = inject(GoogleAuthService);
  isAuthenticated = signal(false);

  connectGoogle() {
    const redirectUri = `${window.location.origin}/auth/google`;
    this.googleAuthService.initiateOAuthFlow(redirectUri);
  }

  handleAuthCallback(code: string) {
    const redirectUri = `${window.location.origin}/auth/google`;
    this.googleAuthService.exchangeCodeForToken(code, redirectUri).subscribe({
      next: (response) => {
        this.isAuthenticated.set(true);
        this.navigateBack();
      },
      error: (error) => {
        console.error('Erro na autenticação:', error);
        // TODO: Adicionar tratamento de erro visual para o usuário
      }
    });
  }

  navigateBack() {
    this.router.navigate(['admin/dashboard']);
  }

  ngOnInit() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      this.handleAuthCallback(code);
    }
  }
}
