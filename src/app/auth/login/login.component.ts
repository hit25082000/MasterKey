import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SystemLogService } from '../../core/services/system-log.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <a routerLink="/home" class="back-button">
        <i class="fas fa-arrow-left"></i>
        Voltar para o site
      </a>

      <div class="login-content">
        <div class="login-banner">
          <img src="assets/logo.png" alt="Logo" class="company-logo">
          <div class="banner-text">
            <h1>Bem-vindo de volta!</h1>
            <p>Acesse sua conta para continuar seus estudos</p>
          </div>
        </div>

        <div class="login-form-container">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              >
            </div>

            <div class="form-group">
              <label for="password">Senha</label>
              <div class="password-input">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  id="password"
                  formControlName="password"
                  [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
                >
                <button
                  type="button"
                  class="toggle-password"
                  (click)="showPassword = !showPassword"
                >
                  <i [class]="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              [disabled]="loginForm.invalid || isLoading"
              class="login-button"
            >
              @if (isLoading) {
                <i class="fas fa-spinner fa-spin"></i>
                Entrando...
              } @else {
                <i class="fas fa-sign-in-alt"></i>
                Entrar
              }
            </button>
            <a               class="login-button"
            href="https://masterkeycursos.com.br/metodo/login.php">Alunos de 2024</a>
          </form>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      background:
      linear-gradient(90deg, rgba(238, 60, 72, 0.2) 0%, rgba(56, 74, 135, 0.2) 100%), #000000;
            display: flex;
      flex-direction: column;
      padding: 2rem;
      position: relative;

      .back-button {
        position: absolute;
        top: 2rem;
        left: 2rem;
        color: white;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateX(-5px);
        }

        i {
          font-size: 1.1rem;
        }
      }

      .login-content {
        max-width: 1000px;
        width: 100%;
        margin: auto;
        background: white;
        overflow: hidden;
        display: grid;
        grid-template-columns: 1fr 1fr;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        animation: slideUp 0.5s ease-out;

        .login-banner {
          background:
          linear-gradient(90deg, rgba(238, 60, 72, 0.2) 0%, rgba(56, 74, 135, 0.2) 100%), #000000;
          padding: 3rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          color: white;
          text-align: center;

          .company-logo {
            width: 200px;
            height: auto;
            margin-bottom: 2rem;
          }

          .banner-text {
            h1 {
              font-size: 2rem;
              margin-bottom: 1rem;
            }

            p {
              font-size: 1.1rem;
              opacity: 0.9;
            }
          }
        }

        .login-form-container {
          padding: 3rem;
          background: white;

          form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;

            .form-group {
              label {
                display: block;
                margin-bottom: 0.5rem;
                color: #4a5568;
                font-weight: 500;
              }

              input {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                transition: all 0.3s ease;

                &:focus {
                  outline: none;
                  border-color: #384A87;
                  box-shadow: 0 0 0 3px rgba(56, 74, 135, 0.1);
                }

                &.error {
                  border-color: #ee3c48;
                }
              }

              .password-input {
                position: relative;

                .toggle-password {
                  position: absolute;
                  right: 1rem;
                  top: 50%;
                  transform: translateY(-50%);
                  background: none;
                  border: none;
                  color: #718096;
                  cursor: pointer;
                  padding: 0.5rem;

                  &:hover {
                    color: #4a5568;
                  }
                }
              }
            }

            .login-button {
              margin-top: 1rem;
              padding: 1rem;
              background: #384A87;
              color: white;
              border: none;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.5rem;
              transition: all 0.3s ease;

              &:hover:not(:disabled) {
                background: #2d3a6d;
                transform: translateY(-2px);
              }

              &:disabled {
                opacity: 0.7;
                cursor: not-allowed;
              }

              i {
                font-size: 1.1rem;
              }
            }
          }
        }
      }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .login-container {
        padding: 1rem;

        .back-button {
          top: 1rem;
          left: 1rem;
        }

        .login-content {
          grid-template-columns: 1fr;

          .login-banner {
            padding: 2rem;
          }

          .login-form-container {
            padding: 2rem;
          }
        }
      }
    }
  `]
})
export class LoginComponent {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  notificationService = inject(NotificationService);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private systemLogService: SystemLogService
  ) {
    this.authService.logout();
  }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;

      this.authService.login(
        this.loginForm.get('email')?.value,
        this.loginForm.get('password')?.value
      ).then((response) => {
        setTimeout(() => {
          const user = this.authService.getCurrentUser();
          if (user && user.role == 'student') {
            this.systemLogService.logStudentLogin(user.id).subscribe();
          }
          this.router.navigate(['/admin']);
          this.isLoading = false;
        }, 2000);
      }).catch(() => {
        this.isLoading = false;
        this.notificationService.error('Login falhou!');
      });
    }
  }
}
