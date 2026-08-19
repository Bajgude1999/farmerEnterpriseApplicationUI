import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import { ChangePasswordService } from '../../core/services/change-password.service';
import { environment } from '../../../environments/environment';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return newPassword === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'fp-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, TranslatePipe],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePassword {
  private fb = inject(FormBuilder);
  private changePasswordService = inject(ChangePasswordService);
  private router = inject(Router);
    private key: string = environment.encriptionKey;

  submitting = signal(false);
  success = signal(false);
  errorMessage = signal('');

  form = this.fb.nonNullable.group(
    {
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator }
  );
submit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const userData = localStorage.getItem('fp_auth_user');

  if (!userData) {
    this.errorMessage.set('SESSION_EXPIRED');
    return;
  }

  const user = JSON.parse(userData);

  const userName =
    user.mobNo ??
    user.email ??
    user.userName;

  const oldPassword =
    this.form.controls.oldPassword.value;

  const newPassword =
    this.form.controls.newPassword.value;

  this.errorMessage.set('');
  this.submitting.set(true);

  const request = {
    userName: this.encrypt(userName),
    oldPassword: this.encrypt(oldPassword),
    newPassword: this.encrypt(newPassword)
  };

  this.changePasswordService
    .changePassword(request)
    .pipe(
      finalize(() => this.submitting.set(false))
    )
    .subscribe({
      next: () => {
        this.success.set(true);
      },
      error: () => {
        this.errorMessage.set('CHANGE_PASSWORD_ERROR');
      }
    });
}
encrypt(value: string): string {
        const encrypted = CryptoJS.AES.encrypt(value, CryptoJS.enc.Utf8.parse(this.key), {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }).toString();

        return encrypted;
    }
  backToProfile(): void {
    this.router.navigate(['/profile']);
  }
}