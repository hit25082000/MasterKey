import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import BaseUser from '../models/default-user.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = 'http://127.0.0.1:5001/master-key-a3c69/us-central1'; //'https://us-central1-master-key-a3c69.cloudfunctions.net';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): Observable<HttpHeaders> {
    return from(this.authService.getIdToken()).pipe(
      switchMap((token) => {
        if (token) {
          return of(
            new HttpHeaders({
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            })
          );
        } else {
          throw new Error('Token não disponível');
        }
      })
    );
  }

  createUser(user: BaseUser): Observable<any> {
    const body = {
      email: user.email,
      password: user.password,
      displayName: user.name,
    };

    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.post(`${this.apiUrl}/createUser`, body, { headers })
      )
    );
  }

  updateUser(user: BaseUser): Observable<any> {
    const body = {
      uid: user.id,
      email: user.email,
      phoneNumber: user.phone1,
      password: user.password,
      displayName: user.name,
      photoURL: user.profilePic,
    };
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.post(`${this.apiUrl}/editUser`, body, { headers })
      )
    );
  }

  deleteUser(uid: string): Observable<any> {
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.post(`${this.apiUrl}/deleteUser`, { uid }, { headers })
      )
    );
  }

  getUsers(): Observable<any> {
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.get(`${this.apiUrl}/getUsers`, { headers })
      )
    );
  }
}
