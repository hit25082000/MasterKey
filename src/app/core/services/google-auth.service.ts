import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private accessTokenSubject: BehaviorSubject<string | null> =
    new BehaviorSubject<string | null>(null);
  public accessToken$: Observable<string | null> =
    this.accessTokenSubject.asObservable();
  private refreshToken: string | null = null;
  private tokenExpirationTime: number | null = null;

  constructor(private httpClient: HttpClient) {
    this.loadTokenFromStorage();
  }

  private loadTokenFromStorage() {
    const savedToken = localStorage.getItem('googleAccessToken');
    const expirationTime = localStorage.getItem('tokenExpirationTime');
    const refreshToken = localStorage.getItem('googleRefreshToken');

    if (savedToken && expirationTime) {
      this.accessTokenSubject.next(savedToken);
      this.tokenExpirationTime = parseInt(expirationTime, 10);
      this.refreshToken = refreshToken;

      if (this.isTokenExpired()) {
        this.refreshAccessToken();
      }
    }
  }

  initiateOAuthFlow(redirectUri: string) {
    const clientId = environment.googleClientId;
    const scope =
      'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.readonly';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?scope=${encodeURIComponent(
      scope
    )}&access_type=offline&include_granted_scopes=true&response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;

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
    return this.httpClient.post(tokenEndpoint, body).pipe(
      tap((response) => this.handleTokenResponse(response)),
      catchError(this.handleError)
    );
  }

  private refreshAccessToken() {
    if (!this.refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const body = {
      refresh_token: this.refreshToken,
      client_id: environment.googleClientId,
      client_secret: environment.googleClientSecret,
      grant_type: 'refresh_token',
    };

    return this.httpClient.post(tokenEndpoint, body).pipe(
      tap((response) => this.handleTokenResponse(response)),
      catchError(this.handleError)
    );
  }

  private handleTokenResponse(response: any) {
    const expiresIn = response.expires_in * 1000;
    const expirationTime = Date.now() + expiresIn;

    this.setAccessToken(response.access_token, expirationTime);
    if (response.refresh_token) {
      this.setRefreshToken(response.refresh_token);
    }
  }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Erro na autenticação com o Google'));
  }

  setAccessToken(token: string, expirationTime: number) {
    localStorage.setItem('googleAccessToken', token);
    localStorage.setItem('tokenExpirationTime', expirationTime.toString());
    this.accessTokenSubject.next(token);
    this.tokenExpirationTime = expirationTime;
  }

  setRefreshToken(token: string) {
    localStorage.setItem('googleRefreshToken', token);
    this.refreshToken = token;
  }

  getAccessToken(): Observable<string | null> {
    if (this.isTokenExpired()) {
      return this.refreshAccessToken().pipe(
        map((token) => token as string | null)
      );
    }
    return this.accessToken$;
  }

  isTokenExpired(): boolean {
    return this.tokenExpirationTime
      ? Date.now() > this.tokenExpirationTime
      : true;
  }

  logout() {
    localStorage.removeItem('googleAccessToken');
    localStorage.removeItem('tokenExpirationTime');
    localStorage.removeItem('googleRefreshToken');
    this.accessTokenSubject.next(null);
    this.refreshToken = null;
    this.tokenExpirationTime = null;
  }
}
