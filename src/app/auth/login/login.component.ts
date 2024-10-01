import { NotificationComponent } from './../../shared/components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../shared/components/notification/notification.service';
import { NotificationType } from '../../shared/components/notification/notifications-enum';
import { SystemLogService } from '../../core/services/system-log.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm!: FormGroup;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService,
    private systemLogService: SystemLogService
  ) {
    this.authService.logout();
  }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      // Inicia o carregamento
      this.isLoading = true;

      this.authService
        .login(
          this.loginForm.get('email')?.value,
          this.loginForm.get('password')?.value
        )
        .then((response) => {
          // Simula um atraso de 2 segundos
          setTimeout(() => {
            const user = this.authService.getCurrentUser();
            if (user && user.role == 'student') {
              this.systemLogService.logStudentLogin(user.id).subscribe();
            }
            this.router.navigate(['/admin']);
            // Finaliza o carregamento
            this.isLoading = false;
          }, 2000);
        })
        .catch(() => {
          // Finaliza o carregamento em caso de erro
          this.isLoading = false;
          this.notificationService.showNotification(
            'Login falhou!',
            NotificationType.ERROR
          );
        });
    }
  }
}
