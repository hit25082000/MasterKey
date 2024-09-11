import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Firestore } from '@angular/fire/firestore';
import { FirestoreService } from '../../core/services/firestore.service';
import DefaultUser from '../../core/models/default-user.model';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private firestore: FirestoreService,
    private auth: AuthService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    var user = this.auth.getCurrentUser()
        if (user) {
          var userDoc = await this.firestore.getDocument<DefaultUser>('users',user.uid!)
            if(userDoc.role == "admin")
              return true

            if(userDoc.role == "student"){
              this.router.navigate(['/student/dashboard']);
              return true
            }

            if(userDoc.role == "teacher")
              return true

            this.router.navigate(['/unauthorized']);
            return false
        } else {
          this.router.navigate(['/unauthorized']); // Redireciona para uma página de não autorizado
          return false;
        }
  }
}
