import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import BaseUser from '../models/base-user.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = environment.apiUrl;

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

  downloadImage(studentId: string): Observable<ArrayBuffer> {
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.get(`${this.apiUrl}/downloadImage?studentId=${encodeURIComponent(studentId)}`, {
          headers,
          responseType: 'arraybuffer'
        })
      )
    );
  }

  createUser(user: BaseUser, icon: string | null): Observable<any> {
    const body = {
      email: user.email,
      password: user.password,
      userData: user,
      iconFile: icon || '',
    };
    console.log(body);
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.post(`${this.apiUrl}/createUserWithProfile`, body, {
          headers,
        })
      )
    );
  }

  updateUser(user: BaseUser, icon: string | null): Observable<any> {
    const body = {
      uid: user.id,
      email: user.email,
      password: user.password,
      userData: user,
      iconFile: icon,
    };

    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.post(`${this.apiUrl}/updateUserWithProfile`, body, {
          headers,
        })
      )
    );
  }

  deleteUser(uid: string): Observable<any> {
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.post(
          `${this.apiUrl}/deleteUserWithProfile`,
          { uid },
          { headers }
        )
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
