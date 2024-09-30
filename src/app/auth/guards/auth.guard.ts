import { Injectable } from '@angular/core';
import {  Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private auth: Auth, private router: Router) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return authState(this.auth).pipe(
      take(1), // Obtém o state de autenticação uma única vez
      map(user => {
        if (user) {
          return true; // Permite acesso se o usuário estiver autenticado
        } else {
          return false;
        }
      })
    );
  }
}
