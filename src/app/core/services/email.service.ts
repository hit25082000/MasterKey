import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

export interface EmailData {
  nome: string;
  email: string;
  mensagem: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/email`;

  enviarEmail(data: EmailData): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
}
