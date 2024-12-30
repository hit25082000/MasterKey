import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-google-auth-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="google-auth-button" 
      [class.connected]="isConnected()" 
      [class.expired]="isExpired()"
      (click)="handleAuth()">
      <i class="fab fa-google"></i>
      <span class="label">{{ getButtonText() }}</span>
    </button>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      transition: all 0.3s ease;
      container-type: inline-size;
    }

    .google-auth-button {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background: #fff;
      color: #757575;
      padding: 8px;
      font-size: 14px;
      transition: all 0.3s ease;

      i {
        font-size: 18px;
        color: #db4437;
      }

      .label {
        transition: opacity 0.3s ease;
      }
    }

    @container (max-width: 150px) {
      .google-auth-button {
        justify-content: center;

        .label {
          display: none;
          opacity: 0;
        }

        i {
          margin: 0;
        }
      }
    }
  `]

})
export class GoogleAuthButtonComponent implements OnInit {
  private googleAuthService = inject(GoogleAuthService);
  private connectionStatus = new BehaviorSubject<'connected' | 'expired' | 'disconnected'>('disconnected');

  ngOnInit() {
    this.googleAuthService.accessToken$.subscribe(token => {
      if (!token) {
        this.connectionStatus.next('disconnected');
        return;
      }

      if (this.googleAuthService.isTokenExpired()) {
        this.connectionStatus.next('expired');
      } else {
        this.connectionStatus.next('connected');
      }
    });
  }

  isConnected(): boolean {
    return this.connectionStatus.value === 'connected';
  }

  isExpired(): boolean {
    return this.connectionStatus.value === 'expired';
  }

  getButtonText(): string {
    switch (this.connectionStatus.value) {
      case 'connected':
        return 'Google Conectado';
      case 'expired':
        return 'Reconectar Google';
      default:
        return 'Conectar Google';
    }
  }

  handleAuth() {
    const currentUrl = window.location.origin + window.location.pathname;
    this.googleAuthService.initiateOAuthFlow(currentUrl);
  }
}
