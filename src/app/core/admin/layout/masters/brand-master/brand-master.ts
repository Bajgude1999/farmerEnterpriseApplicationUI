import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandService } from '../../../../services/brand.service';
import { UploadService } from '../../../../services/upload.service';

@Component({
  selector: 'app-brand-master',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSnackBarModule,
    TranslatePipe,
  ],
  templateUrl: './brand-master.html',
  styleUrls: ['./brand-master.scss'],
})
export class BrandMasterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private brandService = inject(BrandService);
  private uploadService = inject(UploadService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  isEdit = signal(false);
  saving = signal(false);
  uploadingLogo = signal(false);
  logoUrl = signal<string | null>(null);

  ngOnInit(): void {
    this.initForm();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.loadBrand(+id);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      brandCd: [null],
      brandName: ['', Validators.required],
      brandDesc: [''],
      logo: [''],
      active: [true],
    });
  }

  private loadBrand(id: number): void {
    this.brandService.getById(id).subscribe({
      next: (brand) => {
        if (brand) {
          this.form.patchValue({
            brandCd: brand.brandCd,
            brandName: brand.brandName,
            brandDesc: brand.brandDesc,
            logo: brand.logo,
            active: brand.active ?? true,
          });
          if (brand.logo) {
            this.logoUrl.set(this.uploadService.getFileUrl(brand.logo));
          }
        }
      },
      error: () => {
        this.snackBar.open('Failed to load brand', 'OK', { duration: 3000 });
      },
    });
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploadingLogo.set(true);
    this.uploadService.uploadFile(file).subscribe({
      next: (filePath: string) => {
        if (filePath) {
          this.form.patchValue({ logo: filePath });
          this.logoUrl.set(this.uploadService.getFileUrl(filePath));
        }
        this.uploadingLogo.set(false);
      },
      error: () => {
        this.uploadingLogo.set(false);
        this.snackBar.open('Logo upload failed', 'OK', { duration: 3000 });
      },
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const val = this.form.value;

    const req$ = this.isEdit()
      ? this.brandService.update(val)
      : this.brandService.save(val);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(
          this.isEdit() ? 'Brand updated successfully' : 'Brand saved successfully',
          'OK',
          { duration: 3000 }
        );
        this.router.navigate(['/admin/master/brand']);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to save brand', 'OK', { duration: 3000 });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/master/brand']);
  }
}
