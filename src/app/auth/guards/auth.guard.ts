import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  constructor(private auth: Auth, private router: Router) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return authState(this.auth).pipe(
      take(1),
      map((user) => {
        if (user) {
          return true;
        } else {
          return false;
        }
      })
    );
  }
}
