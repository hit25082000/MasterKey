import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { FirestoreService } from '../../core/services/firestore.service';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/models/role.model';
import { RoutePermission } from '../../features/role/components/permission-select/permission.enum';
import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private firestore: FirestoreService,
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const requiredPermission = route.data['permission'] as RoutePermission;

    return this.auth.user$.pipe(
      take(1),
      switchMap(async (user) => {
        if (user) {
          const userDoc = await this.firestore.getDocument<{ role: string }>(
            'users',
            user.uid
          );
          const userRole = userDoc?.role;

          if (userRole) {
            const roleDoc = await this.firestore.getDocumentsByAttribute<Role>(
              'roles',
              'name',
              userRole
            );

            if (
              roleDoc.length > 0 &&
              roleDoc[0].permissions.includes(requiredPermission)
            ) {
              return true;
            }

            switch (userRole) {
              case 'student':
                this.router.navigate(['/classroom']);
                break;
              case 'teacher':
              case 'admin':
                this.router.navigate(['/admin']);
                break;
              default:
                this.router.navigate(['/unauthorized']);
            }
          }
        } else {
          this.router.navigate(['/login']);
        }
        return false;
      })
    );
  }
}
