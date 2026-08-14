import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/ auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/ product.service';

@Component({
  selector: 'fp-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    TranslatePipe,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private products = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  submitting = false;
  otpSent = false;
  errorMessage = '';

  passwordForm = this.fb.nonNullable.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  otpForm = this.fb.nonNullable.group({
    mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    otp: [''],
  });

  submitPasswordLogin(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.errorMessage = '';
    this.submitting = true;
    this.auth
      .login(this.passwordForm.getRawValue())
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => this.onLoginSuccess(),
        error: () => (this.errorMessage = 'LOGIN_ERROR'),
      });
  }

  requestOtp(): void {
    if (this.otpForm.controls.mobile.invalid) {
      this.otpForm.controls.mobile.markAsTouched();
      return;
    }
    this.submitting = true;
    this.auth
      .requestOtp(this.otpForm.controls.mobile.value)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.otpSent = true;
          this.snackBar.open('OTP sent to your mobile', 'OK', { duration: 3000 });
        },
        error: () => (this.errorMessage = 'OTP_SEND_ERROR'),
      });
  }

  submitOtpLogin(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.auth
      .loginWithOtp(this.otpForm.getRawValue())
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => this.onLoginSuccess(),
        error: () => (this.errorMessage = 'LOGIN_ERROR'),
      });
  }

  /**
   * Core of the "guest tried to act, now continue automatically" flow:
   * after a successful login we check for a stored pending action and
   * replay it — no second click required from the farmer.
   */
  private onLoginSuccess(): void {
  const user = this.auth.currentUser();
  if (user?.roleName === 'ADMIN' || user?.roleCd === 2) {
    this.router.navigateByUrl('/admin');
    return;
  }

  const pending = this.auth.consumePendingAction();
  if (pending) {
    this.products.getById(pending.productId).subscribe({
      next: (product) => {
        this.cart.addItem(product, pending.quantity);
        const destination = pending.type === 'BUY_NOW' ? '/checkout' : '/cart';
        this.navigateAfterLogin(destination);
      },
      error: () => this.navigateAfterLogin(),
    });
    return;
  }

  this.navigateAfterLogin();
}

  private navigateAfterLogin(fallback = '/'): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.router.navigateByUrl(returnUrl ?? fallback);
  }
}