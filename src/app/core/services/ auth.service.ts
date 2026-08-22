import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  OtpLoginRequest,
  RegisterRequest,
  User,
} from '../models/user.model';
import { PendingAction } from '../models/cart.model';
import * as CryptoJS from 'crypto-js';
import { SessionExpiryDialogComponent } from '../../shared/components/session-expiry-dialog/session-expiry-dialog';
import { MatDialog } from '@angular/material/dialog';
import { Http } from '../common/http';
import { Router } from '@angular/router';

const TOKEN_KEY = 'fp_auth_token';
const USER_KEY = 'fp_auth_user';
const PENDING_ACTION_KEY = 'fp_pending_action';
const REFRESH_TOKEN_KEY = 'fp_refresh_token';

/**
 * Extracts and parses payload claims from a standard JWT without external libraries.
 */
export function parseJwtPayload(token: string): any | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Checks whether a JWT token is expired (including an optional skew in seconds).
 */
export function isJwtExpired(token: string, skewSeconds = 5): boolean {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return false;
  }
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp <= (currentTime + skewSeconds);
}

/**
 * Central authentication service managing tokens, user session state, and loop-protected logout flows.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private httpSecure = inject(Http);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private key: string = environment.encriptionKey;

  private currentUserSignal = signal<User | null>(this.readStoredUser());
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.hasValidSession());

  private sessionTimer: ReturnType<typeof setTimeout> | null = null;
  private isLoggingOut = false;

  readonly userCd = computed(() => {
    const user = this.currentUserSignal();
    if (!user) return null;
    const id = Number(user.userCd);
    return Number.isNaN(id) ? null : id;
  });

  readonly isAdmin = computed(() => {
    const user = this.currentUserSignal();
    return user?.roleName === 'ADMIN' || user?.roleCd === 2;
  });

  /**
   * Decrypts and reads stored user from localStorage.
   */
  private readStoredUser(): User | null {
    const encryptedData = localStorage.getItem(USER_KEY);
    if (!encryptedData) {
      return null;
    }

    try {
      const decryptedData = this.decrypt(encryptedData);
      if (!decryptedData) {
        return null;
      }
      return JSON.parse(decryptedData) as User;
    } catch (error) {
      console.error('Failed to decrypt stored user:', error);
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }

  /**
   * Decrypts and returns the raw access token string.
   */
  get token(): string | null {
    const encryptedToken = localStorage.getItem(TOKEN_KEY);
    if (!encryptedToken) {
      return null;
    }

    try {
      const decryptedToken = this.decrypt(encryptedToken);
      return decryptedToken || null;
    } catch (error) {
      console.error('Failed to decrypt token:', error);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  }

  /**
   * Checks if the currently stored JWT token is expired.
   */
  isTokenExpired(): boolean {
    const rawToken = this.token;
    if (!rawToken) return true;
    return isJwtExpired(rawToken);
  }

  /**
   * Verifies that both the stored user and token are present and not expired.
   */
  hasValidSession(): boolean {
    const user = this.currentUserSignal();
    const rawToken = this.token;
    if (!user || !rawToken) return false;
    return !isJwtExpired(rawToken);
  }

  /**
   * Clears all client-side authentication cache, state signals, and timers.
   * Does NOT touch unrelated application data (like language preference).
   */
  clearSession(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSignal.set(null);
  }

  /**
   * Loop-protected centralized logout:
   * 1. Protects against redundant/concurrent calls.
   * 2. Clears client session cache.
   * 3. Calls backend /v1/logout (safely ignoring any errors/401).
   * 4. Redirects to /login preserving returnUrl if applicable.
   */
  logout(returnUrl?: string): void {
    if (this.isLoggingOut) {
      return;
    }
    this.isLoggingOut = true;

    const user = this.currentUserSignal();
    const mobNo = user?.mobNo;

    // 1. Immediately purge local authentication cache
    this.clearSession();

    // 2. Safely call backend logout API
    const logout$ = mobNo
      ? this.http
          .post(`${environment.apiBaseUrl}/v1/logout`, {
            mobNo: this.encrypt(mobNo),
          })
          .pipe(catchError(() => of(null)))
      : of(null);

    logout$.subscribe({
      next: () => this.finalizeLogout(returnUrl),
      error: () => this.finalizeLogout(returnUrl),
    });
  }

  /**
   * Handles unauthorized (401) or expired session events:
   * Triggers the loop-protected logout workflow and redirects to /login.
   */
  handleUnauthorizedLogout(returnUrl?: string): void {
    const targetUrl = returnUrl || (this.router.url !== '/login' ? this.router.url : undefined);
    this.logout(targetUrl);
  }

  clearSessionAndRedirect(): void {
    this.handleUnauthorizedLogout();
  }

  private finalizeLogout(returnUrl?: string): void {
    this.isLoggingOut = false;

    // Avoid redundant redirects if already on /login
    if (this.router.url === '/login' || this.router.url.startsWith('/login?')) {
      return;
    }

    const queryParams =
      returnUrl && !returnUrl.startsWith('/login') && !returnUrl.startsWith('/unauthorized')
        ? { returnUrl }
        : undefined;

    this.router.navigate(['/login'], queryParams ? { queryParams } : undefined);
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    const password = this.encrypt(payload.password);
    const username = this.encrypt(payload.identifier);

    const loginData = {
      username: username,
      password: password,
    };
    return this.http.post<{ data: string[] }>(`${environment.apiBaseUrl}/v1/token`, loginData).pipe(
      map((res) => {
        const encrypted = res.data[0];
        const decrypted = this.decrypt(encrypted);
        return JSON.parse(decrypted) as AuthResponse;
      }),
      tap((res) => this.persistSession(res)),
    );
  }

  loginWithOtp(payload: OtpLoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/login-otp`, payload)
      .pipe(tap((res) => this.persistSession(res)));
  }

  requestOtp(mobile: string): Observable<{ sent: boolean }> {
    return this.http.post<{ sent: boolean }>(`${environment.apiBaseUrl}/auth/request-otp`, {
      mobile,
    });
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/register`, payload)
      .pipe(tap((res) => this.persistSession(res)));
  }

  forgotPassword(identifier: string): Observable<{ sent: boolean }> {
    return this.http.post<{ sent: boolean }>(`${environment.apiBaseUrl}/auth/forgot-password`, {
      identifier,
    });
  }

  private persistSession(res: AuthResponse): void {
    // Encrypt access token
    const encryptedAccessToken = this.encrypt(res.access_token);
    localStorage.setItem(TOKEN_KEY, encryptedAccessToken);

    // Encrypt refresh token
    const encryptedRefreshToken = this.encrypt(res.refresh_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, encryptedRefreshToken);

    const user: User = {
      userCd: res.userCd,
      fullName: res.fullName,
      mobNo: res.mobNo,
      email: res.email,
      roleCd: res.roleCd,
      roleName: res.roleName,
      addresses: res.addresses,
    };

    // Encrypt user data
    const encryptedUser = this.encrypt(JSON.stringify(user));
    localStorage.setItem(USER_KEY, encryptedUser);

    this.currentUserSignal.set(user);

    // Start 1-minute-before-expiry timer
    if (res.expires_in) {
      this.startSessionTimer(res.expires_in);
    }
  }

  private startSessionTimer(expiresIn: number): void {
    const totalSeconds = Math.floor(expiresIn / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    console.log(`Token expires in: ${minutes} minute(s) ${seconds} second(s)`);

    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }

    const ONE_MINUTE = 60 * 1000;
    const popupTime = expiresIn - ONE_MINUTE;
    const timeout = Math.max(popupTime, 0);

    this.sessionTimer = setTimeout(() => {
      this.showSessionExpiryPopup();
    }, timeout);
  }

  refreshToken(): Observable<AuthResponse> {
    const encryptedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!encryptedRefreshToken) {
      this.clearSessionAndRedirect();
      return throwError(() => new Error('Refresh token not found'));
    }

    const refreshToken = this.decrypt(encryptedRefreshToken);
    const encryptedUserJson = localStorage.getItem(USER_KEY);
    if (!encryptedUserJson) {
      return throwError(() => new Error('user not found'));
    }

    const userJson = this.decrypt(encryptedUserJson);
    if (!refreshToken || !userJson) {
      this.clearSessionAndRedirect();
      return throwError(() => new Error('Refresh session information not found'));
    }

    let user: User;
    try {
      user = JSON.parse(userJson);
    } catch {
      this.clearSessionAndRedirect();
      return throwError(() => new Error('Invalid user session information'));
    }

    if (!user?.mobNo) {
      this.clearSessionAndRedirect();
      return throwError(() => new Error('User mobile number not found'));
    }

    const payload = {
      username: this.encrypt(user.mobNo),
      refresh_token: refreshToken,
    };

    return this.httpSecure
      .postWithPayload<{ data: string[] }>(`${environment.apiBaseUrl}/v1/refreshToken`, payload)
      .pipe(
        map((res) => {
          if (!res || !res.data || !Array.isArray(res.data) || res.data.length === 0) {
            throw new Error('Invalid refresh token response');
          }

          const encryptedResponse = res.data[0];
          if (!encryptedResponse) {
            throw new Error('Empty refresh token response');
          }

          const decryptedResponse = this.decrypt(encryptedResponse);
          if (!decryptedResponse) {
            throw new Error('Unable to decrypt refresh token response');
          }

          return JSON.parse(decryptedResponse) as AuthResponse;
        }),
        tap((res: AuthResponse) => {
          console.log('Refresh token successful');
          this.persistSession(res);
        }),
        catchError((error) => {
          console.error('Refresh token API failed:', error);
          this.clearSessionAndRedirect();
          return throwError(() => error);
        })
      );
  }

  private showSessionExpiryPopup(): void {
    const dialogRef = this.dialog.open(SessionExpiryDialogComponent, {
      width: '400px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((continueSession: boolean) => {
      if (continueSession) {
        this.refreshToken().subscribe({
          next: () => {
            console.log('Session continued successfully');
          },
          error: () => {
            this.clearSessionAndRedirect();
          },
        });
      } else {
        this.clearSessionAndRedirect();
      }
    });
  }

  // ---- Guest pending-action replay ----

  setPendingAction(action: PendingAction): void {
    const encryptedAction = this.encrypt(JSON.stringify(action));
    sessionStorage.setItem(PENDING_ACTION_KEY, encryptedAction);
  }

  consumePendingAction(): PendingAction | null {
    const encryptedData = sessionStorage.getItem(PENDING_ACTION_KEY);
    if (!encryptedData) {
      return null;
    }

    sessionStorage.removeItem(PENDING_ACTION_KEY);

    try {
      const decryptedData = this.decrypt(encryptedData);
      if (!decryptedData) {
        return null;
      }
      return JSON.parse(decryptedData) as PendingAction;
    } catch (error) {
      console.error('Failed to decrypt pending action:', error);
      return null;
    }
  }

  encrypt(value: string): string {
    const encrypted = CryptoJS.AES.encrypt(value, CryptoJS.enc.Utf8.parse(this.key), {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }).toString();
    return encrypted;
  }

  decrypt(encrypted: string): string {
    const decrypted = CryptoJS.AES.decrypt(encrypted, CryptoJS.enc.Utf8.parse(this.key), {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}
