import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-session-expiry-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule,MatIcon],
  templateUrl: './session-expiry-dialog.html',
  styleUrl: './session-expiry-dialog.scss',
})
export class SessionExpiryDialogComponent {
  constructor(private dialogRef: MatDialogRef<SessionExpiryDialogComponent>) {}

  continueSession(): void {
    this.dialogRef.close(true);
  }

  logout(): void {
    this.dialogRef.close(false);
  }
}