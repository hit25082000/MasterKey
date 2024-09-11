import { Injectable } from '@angular/core';
import { auth } from 'firebase-admin';
import { initializeApp } from 'firebase-admin/app';
import DefaultUser from '../models/default-user.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import BaseUser from '../models/default-user.model';
import AuthUser from '../models/auth-user';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://127.0.0.1:5001/master-key-a3c69/us-central1'
  //'https://us-central1-master-key-a3c69.cloudfunctions.net'; // Substitua pelo seu URL de funções

   constructor(private http: HttpClient) {}

   createUser(user: BaseUser): Observable<any> {
    var id = user.id
    var email = user.email
    var phoneNumber = user.phone1
    var password = user.password
    var displayName = user.name
    var photoURL = user.profilePic

    const body = { id, email, password };
    const contentLength = JSON.stringify(body).length;

    // Define os cabeçalhos com Content-Length e Host
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Content-Length': contentLength.toString(), // Define o comprimento do conteúdo
      'Host': '127.0.0.1:5001', // Define o cabeçalho Host
    });

    // Faz a solicitação POST
    return this.http.post(`${this.apiUrl}/createUser`, body, { headers });
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
