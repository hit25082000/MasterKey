import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { FirestoreService } from '../../core/services/firestore.service';
import DefaultUser from '../../core/models/default-user.model';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/models/role.model';
import { RoutePermission } from '../../features/role/components/permission-select/permission.enum';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard {

  constructor(
    private firestore: FirestoreService,
    private auth: AuthService,
    private router: Router
  ) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const requiredPermission = route.data['permission'] as RoutePermission;
    const user = await this.auth.getCurrentUser();

    if (user) {
      const userRole = await this.firestore.getDocumentsByAttribute<Role>('roles', 'name', user.role);

      if (userRole.length > 0 && userRole[0].permissions.includes(requiredPermission)) {
        return true;
      }

      switch (user.role) {
        case 'student':
          this.router.navigate(['/classroom']);
          break;
        case 'teacher':
          this.router.navigate(['/admin']);
          break;
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
  }
}
