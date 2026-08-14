import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment/environment';
import { AuthResponse, LoginRequest, OtpLoginRequest, RegisterRequest, User } from '../models/user.model';
import { PendingAction } from '../models/cart.model';
import * as CryptoJS from 'crypto-js';

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

 private currentUserSignal = signal<User | null>(this.readStoredUser());
readonly currentUser = this.currentUserSignal.asReadonly();
readonly isLoggedIn = computed(() => !!this.currentUserSignal());
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
    this.currentUserSignal.set(null);
  }

private persistSession(res: AuthResponse): void {

  localStorage.setItem(TOKEN_KEY, res.access_token);

  const user: User = {
    userId: res.userCd,
    fullName: res.fullName,
    mobNo: res.mobNo,
    email: res.email,
    roleCd: res.roleCd,
    roleName: res.roleName,
    addresses:res.addresses
  };

  localStorage.setItem(USER_KEY, JSON.stringify(user));
  this.currentUserSignal.set(user);
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