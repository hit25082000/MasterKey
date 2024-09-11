import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { UserCredential } from 'firebase/auth';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty email and password', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should call AuthService.login and navigate to /admin on successful login', async () => {
    authServiceSpy.login.and.returnValue(Promise.resolve({} as UserCredential));

    component.loginForm.setValue({ email: 'test@example.com', password: 'password123' });
    await component.onSubmit();
    expect(authServiceSpy.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('should not call AuthService.login if form is invalid', async () => {
    component.loginForm.setValue({ email: 'invalid-email', password: '' });
    await component.onSubmit();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should call AuthService.logout on component initialization', () => {
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });
});
