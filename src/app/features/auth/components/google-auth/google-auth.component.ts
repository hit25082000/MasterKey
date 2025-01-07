import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';

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
        <p>Clique no botão abaixo para conectar sua conta Google</p>
        
        <button class="google-button" (click)="connectGoogle()">
          <i class="fab fa-google"></i>
          Conectar com Google
        </button>

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

  connectGoogle() {
    const clientId = environment.googleClientId;
    const redirectUri = 'https://masterkey.com.br/auth/google/callback'; // URL fixa para callback
    const scope = 'email profile';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent`;

    window.location.href = authUrl;
  }
}
