import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private accessTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  public accessToken$: Observable<string | null> = this.accessTokenSubject.asObservable();

  constructor(private httpClient: HttpClient) {
    const savedToken = localStorage.getItem('googleAccessToken');
    if (savedToken) {
      this.accessTokenSubject.next(savedToken);
    }
  }

  initiateOAuthFlow(redirectUri: string) {
    const clientId = environment.googleClientId;
    const scope = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.readonly';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?scope=${encodeURIComponent(scope)}&access_type=offline&include_granted_scopes=true&response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.href = authUrl;
  }

  exchangeCodeForToken(code: string, redirectUri: string): Observable<any> {
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const body = {
      code: code,
      client_id: environment.googleClientId,
      client_secret: environment.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    };
    return this.httpClient.post(tokenEndpoint, body);
  }

  setAccessToken(token: string) {
    localStorage.setItem('googleAccessToken', token);
    this.accessTokenSubject.next(token);
  }

  getAccessToken(): string | null {
    return this.accessTokenSubject.value;
  }

  logout() {
    localStorage.removeItem('googleAccessToken');
    this.accessTokenSubject.next(null);
  }
}
