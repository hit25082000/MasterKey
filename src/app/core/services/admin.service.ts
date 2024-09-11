import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import BaseUser from '../models/default-user.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = //'http://127.0.0.1:5001/master-key-a3c69/us-central1';
  'https://us-central1-master-key-a3c69.cloudfunctions.net'

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): Observable<HttpHeaders> {
    return from(this.authService.getIdToken()).pipe(
      switchMap(token => {
        if (token) {
          return of(new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }));
        } else {
          throw new Error('Token não disponível');
        }
      })
    );
  }

  createUser(user: BaseUser): Observable<any> {
    const body = {
      id: user.id,
      email: user.email,
      password: user.password,
      displayName: user.name,
      phoneNumber: user.phone1,
      photoURL: user.profilePic
    };

    return this.getHeaders().pipe(
      switchMap(headers => this.http.post(`${this.apiUrl}/createUser`, body, { headers }))
    );
  }

  updateUser(user: BaseUser): Observable<any> {
    var uid = user.id
    var email = user.email
    var phoneNumber = user.phone1
    var password = user.password
    var displayName = user.name
    var photoURL = user.profilePic

    return this.http.post(`${this.apiUrl}/editUser`, { uid,email,displayName,password,phoneNumber,photoURL });
   }

   deleteUser(uid: string): Observable<any> {
     return this.http.post(`${this.apiUrl}/deleteUser`, { uid });
   }
}
