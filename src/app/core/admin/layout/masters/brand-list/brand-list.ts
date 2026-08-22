import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandService } from '../../../../services/brand.service';
import { UploadService } from '../../../../services/upload.service';
import { Brand } from '../../../../models/brand.model';

@Component({
  selector: 'app-brand-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    TranslatePipe,
  ],
  templateUrl: './brand-list.html',
  styleUrls: ['./brand-list.scss', '../../shared/admin-table.scss'],
})
export class BrandList implements OnInit {
  private brandService = inject(BrandService);
  upload = inject(UploadService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  brands = signal<Brand[]>([]);
  loading = signal(true);
  columns = ['logo', 'brandName', 'brandDesc', 'active', 'actions'];

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.loading.set(true);
    this.brandService.getAll().subscribe({
      next: (data) => {
        this.brands.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToAdd(): void {
    this.router.navigate(['/admin/master/brand/add']);
  }

  goToEdit(brand: Brand): void {
    this.router.navigate(['/admin/master/brand/edit', brand.brandCd]);
  }

  deleteBrand(brand: Brand): void {
    if (!brand.brandCd) return;
    if (confirm(`Are you sure you want to delete brand "${brand.brandName}"?`)) {
      this.brandService.delete(brand.brandCd).subscribe({
        next: () => {
          this.snackBar.open('Brand deleted successfully', 'OK', { duration: 3000 });
          this.loadBrands();
        },
        error: () => {
          this.snackBar.open('Failed to delete brand', 'OK', { duration: 3000 });
        },
      });
    }
  }
}
