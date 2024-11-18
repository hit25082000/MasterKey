import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { FirestoreService } from '../../core/services/firestore.service';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/models/role.model';
import { RoutePermission } from '../../features/role/components/permission-select/permission.enum';
import { Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { NotificationService } from '../../shared/services/notification.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private firestore: FirestoreService,
    private auth: AuthService,
    private router: Router,
    private notificationService: NotificationService
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

            if (roleDoc.length > 0) {
              const userPermissions = roleDoc[0].permissions;

              // Se o usuário tem permissão ADMIN, permite tudo
              if (userPermissions.includes(RoutePermission.ADMIN)) {
                return true;
              }

              // Verifica se o usuário tem a permissão específica
              if (userPermissions.includes(requiredPermission)) {
                return true;
              }
            }
          }

          // Se chegou aqui, não tem permissão
          this.notificationService.error('Você não tem permissão para acessar esta página');

          // Redireciona baseado no papel do usuário
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
        } else {
          this.router.navigate(['/login']);
        }
        return false;
      })
    );
  }
}
