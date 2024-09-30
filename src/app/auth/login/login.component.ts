import { NotificationComponent } from './../../shared/components/notification/notification.component';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../shared/components/notification/notification.service';
import { NotificationType } from '../../shared/components/notification/notifications-enum';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink,ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm!: FormGroup;

  constructor(private fb: FormBuilder, private router : Router,
    private notificationService : NotificationService,
    private authService : AuthService) {
    this.authService.logout()
  }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['',Validators.required],
      password: ['',Validators.required],
    });
  }

  onSubmit(){

  if (this.loginForm.valid) {
      this.authService.login(this.loginForm.get('email')?.value,this.loginForm.get('password')?.value).then(()=>{
        this.router.navigate(['/admin'])
      }).catch(()=>{
        this.notificationService.showNotification("Login falhou!", NotificationType.ERROR )
      });
    }
  }
}
