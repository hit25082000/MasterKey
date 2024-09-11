import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { FirestoreService } from '../../core/services/firestore.service';
import DefaultUser from '../../core/models/default-user.model';
import { Role } from '../../core/models/role.model';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard {
  constructor(
    private authService: AuthService,
    private firestoreService: FirestoreService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredPermission = route.data['requiredPermission'] as string;

    return this.authService.user$.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return of(false);
        }
        return this.firestoreService.getDocument<DefaultUser>('users', user.uid);
      }),
      switchMap(user => {
        if (!user || !user.role) {
          this.router.navigate(['/unauthorized']);
          return of(false);
        }
        return this.firestoreService.getDocument<Role>('roles', user.role);
      }),
      map(role => {
        if (!role || !role.permissions.includes(requiredPermission)) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
        return true;
      })
    );
  }
}
