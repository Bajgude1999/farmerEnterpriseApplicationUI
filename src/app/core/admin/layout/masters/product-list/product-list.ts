import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { ProductService } from '../../../../services/ product.service';
import { ProductMaster } from '../../../../models/product.model';
import { Http } from '../../../../common/http';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);
 private http = inject(Http);
  private base = `${environment.apiBaseUrl}`;

  products = signal<ProductMaster[]>([]);
  loading = signal(true);
  columns = ['name', 'brand', 'category', 'price', 'stock', 'actions'];

  ngOnInit(): void {
    this.productService.getAll().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToAdd(): void {
    this.router.navigate(['/admin/master/product/add']);
  }

  goToEdit(product: ProductMaster): void {
    this.router.navigate(['/admin/master/product/edit', product.productCd]);
  }
  downloadPackPriceExcel(): void {

  this.http
    .getWithBlob(
      `${environment.apiBaseUrl}/v1/product/pack-price/excel/download`
    )
    .subscribe({
      next: (blob: Blob) => {

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'pack_price_details.xlsx';

        link.click();

        window.URL.revokeObjectURL(url);
      },

      error: (error) => {
        console.error('Excel download failed:', error);
      }
    });
}
uploadPackPriceExcel(event: Event): void {

  const input =
    event.target as HTMLInputElement;

  if (!input.files || input.files.length === 0) {
    return;
  }

  const file = input.files[0];

  if (!file.name.toLowerCase().endsWith('.xlsx')) {

    alert('Please select a valid Excel (.xlsx) file.');

    input.value = '';

    return;
  }

  const formData = new FormData();

  formData.append('file', file);

  this.http.post(
    `${environment.apiBaseUrl}/v1/product/pack-price/excel/upload`,
    formData
  ).subscribe({

    next: (response: any) => {

      console.log(
        'Pack Price Excel upload response:',
        response
      );

      if (response.errorRows > 0) {

        alert(
          `Upload completed.\n\n` +
          `Success: ${response.successRows}\n` +
          `Errors: ${response.errorRows}\n\n` +
          response.errors.join('\n')
        );

      } else {

        alert(
          `Excel uploaded successfully.\n` +
          `Total rows: ${response.successRows}`
        );
      }

      input.value = '';
    },

    error: (error) => {

      console.error(
        'Failed to upload Pack Price Excel',
        error
      );

      alert(
        error?.error?.message ||
        'Failed to upload Excel.'
      );

      input.value = '';
    }
  });
}
}