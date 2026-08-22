import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

/**
 * Centralized toast / notification service using Angular Material's MatSnackBar
 * themed consistently with the application's design system.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private snackBar = inject(MatSnackBar);

  private defaultConfig: MatSnackBarConfig = {
    duration: 3500,
    horizontalPosition: 'right',
    verticalPosition: 'top',
  };

  /**
   * Display a success message.
   */
  success(message: string, action = 'OK'): void {
    if (!message) return;
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      panelClass: ['toast-success'],
    });
  }

  /**
   * Display an error message.
   */
  error(message: string, action = 'Close'): void {
    if (!message) return;
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      duration: 5000,
      panelClass: ['toast-error'],
    });
  }

  /**
   * Display a warning message.
   */
  warning(message: string, action = 'OK'): void {
    if (!message) return;
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      panelClass: ['toast-warning'],
    });
  }

  /**
   * Display an informational message.
   */
  info(message: string, action = 'OK'): void {
    if (!message) return;
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      panelClass: ['toast-info'],
    });
  }
}
