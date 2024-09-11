import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SystemLogService {
  private apiUrl = 'API_URL_AQUI'; // Substitua pela URL real da sua API

  constructor(private http: HttpClient) {}

  logAction(action: string, details: string): Observable<any> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: action,
      details: details
    };

    return this.http.post(`${this.apiUrl}/logs`, logEntry);
  }
}