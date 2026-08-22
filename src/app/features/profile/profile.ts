import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { ToastService } from '../../core/services/toast.service';
import { TranslatePipe } from '@ngx-translate/core';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

import { AuthService } from '../../core/services/ auth.service';

@Component({
  selector: 'fp-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    TranslatePipe,EmptyState
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  user = this.auth.currentUser;
  savingProfile = signal(false);
  savingPassword = signal(false);

  profileForm = this.fb.nonNullable.group({
    fullName: [this.user()?.fullName ?? '', Validators.required],
    mobile: [this.user()?.mobNo ?? '', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    email: [this.user()?.email ?? ''],
    addresses:[this.user()?.addresses??'']
  });

  passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.savingProfile.set(true);
    setTimeout(() => {
      this.savingProfile.set(false);
      this.toastService.success('Profile updated');
    }, 400);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.savingPassword.set(true);
    setTimeout(() => {
      this.savingPassword.set(false);
      this.passwordForm.reset();
      this.toastService.success('Password changed');
    }, 400);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}