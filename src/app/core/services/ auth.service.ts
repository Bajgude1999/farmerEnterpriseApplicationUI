import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, OtpLoginRequest, RegisterRequest, User } from '../models/user.model';
import { PendingAction } from '../models/cart.model';
import * as CryptoJS from 'crypto-js';
import { SessionExpiryDialogComponent } from '../../shared/components/session-expiry-dialog/session-expiry-dialog';
import { MatDialog } from '@angular/material/dialog';
import { Http } from '../common/http';
import { Router } from '@angular/router';

const TOKEN_KEY = 'fp_auth_token';
const USER_KEY = 'fp_auth_user';
const PENDING_ACTION_KEY = 'fp_pending_action';

/**
 * Central authentication service.
 *
 * Also owns the "guest tried to Add to Cart / Buy Now" flow:
 * 1. A guest clicks Add to Cart or Buy Now.
 * 2. The calling component stores the intended action via `setPendingAction`
 *    and navigates to /login (with a returnUrl).
 * 3. On successful login/register, `consumePendingAction()` is read by the
 *    login component, which replays the action automatically — no second click.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
    private key: string = environment.encriptionKey;
constructor(
  private httpSecure: Http,
  private router: Router,
  private dialog: MatDialog
) {}
 private currentUserSignal = signal<User | null>(this.readStoredUser());
readonly currentUser = this.currentUserSignal.asReadonly();
readonly isLoggedIn = computed(() => !!this.currentUserSignal());
private readonly TOKEN_KEY = 'fp_auth_token';
private readonly REFRESH_TOKEN_KEY = 'fp_refresh_token';
private readonly USER_KEY = 'fp_user';

private sessionTimer: ReturnType<typeof setTimeout> | null = null;
readonly userCd = computed(() => {
  const user = this.currentUserSignal();
  if (!user) return null;
  const id = Number(user.userId);
  return Number.isNaN(id) ? null : id;
});
  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
     const password = this.encrypt(payload.password);
        const username = this.encrypt(payload.identifier);

        const loginData = {
            username: username,
            password: password
        };
     return this.http
    .post<{ data: string[] }>(`${environment.apiBaseUrl}/v1/token`, loginData)
    .pipe(
      map((res) => {
        const encrypted = res.data[0];
        const decrypted = this.decrypt(encrypted);
        return JSON.parse(decrypted) as AuthResponse;
      }),
      tap((res) => this.persistSession(res))
    );

  }

  loginWithOtp(payload: OtpLoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/login-otp`, payload)
      .pipe(tap((res) => this.persistSession(res)));
  }

  requestOtp(mobile: string): Observable<{ sent: boolean }> {
    return this.http.post<{ sent: boolean }>(`${environment.apiBaseUrl}/auth/request-otp`, { mobile });
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/register`, payload)
      .pipe(tap((res) => this.persistSession(res)));
  }

  forgotPassword(identifier: string): Observable<{ sent: boolean }> {
    return this.http.post<{ sent: boolean }>(`${environment.apiBaseUrl}/auth/forgot-password`, { identifier });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
   // localStorage.removeItem(access_token);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.currentUserSignal.set(null);
  }
private persistSession(res: AuthResponse): void {

  localStorage.setItem(
    TOKEN_KEY,
    res.access_token
  );
const encryptedRefreshToken = this.encrypt(res.refresh_token);

  localStorage.setItem(
  this.REFRESH_TOKEN_KEY,
     encryptedRefreshToken
  );

  const user: User = {

    userId: res.userCd,

    fullName: res.fullName,

    mobNo: res.mobNo,

    email: res.email,

    roleCd: res.roleCd,

    roleName: res.roleName,

    addresses: res.addresses

  };

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user)
  );

  this.currentUserSignal.set(user);

  // Start 1-minute-before-expiry timer
  this.startSessionTimer(res.expires_in);
}
private startSessionTimer(expiresIn: number): void {
  const totalSeconds = Math.floor(expiresIn / 1000);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  console.log(
    `Token expires in: ${minutes} minute(s) ${seconds} second(s)`
  );

  // Clear previous timer
  if (this.sessionTimer) {
    clearTimeout(this.sessionTimer);
    this.sessionTimer = null;
  }

  // Show popup 1 minute before expiry
  const ONE_MINUTE = 60 * 1000;

  const popupTime = expiresIn - ONE_MINUTE;

  // Don't allow negative timeout
  const timeout = Math.max(popupTime, 0);

  this.sessionTimer = setTimeout(() => {

    this.showSessionExpiryPopup();

  }, timeout);
}
refreshToken(): Observable<AuthResponse> {

const encryptedRefreshToken =
  localStorage.getItem(this.REFRESH_TOKEN_KEY);

if (!encryptedRefreshToken) {
  this.clearSessionAndRedirect();

  return throwError(
    () => new Error('Refresh token not found')
  );
}

const refreshToken =
  this.decrypt(encryptedRefreshToken);
    const userJson = localStorage.getItem(USER_KEY);

  if (!refreshToken || !userJson) {
    this.clearSessionAndRedirect();

    return throwError(() =>
      new Error('Refresh session information not found')
    );
  }

  let user: User;

  try {
    user = JSON.parse(userJson);
  } catch (error) {

    this.clearSessionAndRedirect();

    return throwError(() =>
      new Error('Invalid user session information')
    );
  }

  if (!user?.mobNo) {

    this.clearSessionAndRedirect();

    return throwError(() =>
      new Error('User mobile number not found')
    );
  }

  const payload = {
    username: this.encrypt(user.mobNo),
    refresh_token: refreshToken
  };


  return this.httpSecure
    .postWithPayload<{ data: string[] }>(
      `${environment.apiBaseUrl}/v1/refreshToken`,
      payload    )
    .pipe(

      map((res) => {

        if (
          !res ||
          !res.data ||
          !Array.isArray(res.data) ||
          res.data.length === 0
        ) {
          throw new Error('Invalid refresh token response');
        }

        const encryptedResponse = res.data[0];

        if (!encryptedResponse) {
          throw new Error('Empty refresh token response');
        }

        const decryptedResponse =
          this.decrypt(encryptedResponse);

        if (!decryptedResponse) {
          throw new Error('Unable to decrypt refresh token response');
        }

        const authResponse =
          JSON.parse(decryptedResponse) as AuthResponse;

        return authResponse;
      }),

      tap((res: AuthResponse) => {

        console.log('Refresh token successful');

        // Save new access token and refresh token
        this.persistSession(res);

      }),

      catchError((error) => {

        console.error(
          'Refresh token API failed:',
          error
        );

        this.clearSessionAndRedirect();

        return throwError(() => error);
      })
    );
}
private showSessionExpiryPopup(): void {

  const dialogRef = this.dialog.open(
    SessionExpiryDialogComponent,
    {
      width: '400px',
      disableClose: true
    }
  );

  dialogRef.afterClosed().subscribe(
    (continueSession: boolean) => {

      if (continueSession) {

        this.refreshToken().subscribe({

          next: () => {

            console.log(
              'Session continued successfully'
            );

          },

          error: () => {

            this.clearSessionAndRedirect();

          }

        });

      } else {

        this.clearSessionAndRedirect();

      }

    }
  );
}
 clearSessionAndRedirect(): void {

  if (this.sessionTimer) {

    clearTimeout(this.sessionTimer);

    this.sessionTimer = null;
  }

  localStorage.removeItem(TOKEN_KEY);

  localStorage.removeItem(this.REFRESH_TOKEN_KEY);

  //localStorage.removeItem(REFRESH_USERNAME_KEY);

  localStorage.removeItem(USER_KEY);

  this.currentUserSignal.set(null);

  this.router.navigate(['/login']);

}
  // ---- Guest pending-action replay ----

  setPendingAction(action: PendingAction): void {
    sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(action));
  }

  consumePendingAction(): PendingAction | null {
    const raw = sessionStorage.getItem(PENDING_ACTION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_ACTION_KEY);
    return JSON.parse(raw) as PendingAction;
  }
  encrypt(value: string): string {
        const encrypted = CryptoJS.AES.encrypt(value, CryptoJS.enc.Utf8.parse(this.key), {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }).toString();

        return encrypted;
    }

    decrypt(encrypted: string): string {
        const decrypted = CryptoJS.AES.decrypt(encrypted, CryptoJS.enc.Utf8.parse(this.key), {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });

        return decrypted.toString(CryptoJS.enc.Utf8);
    }
}