import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'fp-contact',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  submitted = signal(false);

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    mobile: ['', [Validators.required, Validators.pattern(/^[6-9][0-9]{9}$/)]],
    message: [''],
  });

  submit(): void {

  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const payload = {
    name: this.form.get('name')?.value,
    mobile: this.form.get('mobile')?.value,
    message: this.form.get('message')?.value
  };

  this.http.post(
      `${environment.apiBaseUrl}/v1/email/contact`,
    payload,
    {
      responseType: 'text'
    }
  ).subscribe({
    next: () => {
      this.submitted.set(true);
      this.form.reset();
    },
    error: (error) => {
      console.error(
        'Failed to send contact enquiry',
        error
      );
    }
  });
}
}