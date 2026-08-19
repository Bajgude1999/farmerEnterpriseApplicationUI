import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../../../../environments/environment';
import { Http } from '../../../../common/http';
import { ProductService } from '../../../../services/ product.service';
import { CategoryService } from '../../../../services/category.service';
import { BrandService } from '../../../../services/brand.service';
import { ProductMaster } from '../../../../models/product.model';
import { Category } from '../../../../models/category.model';
import { Brand } from '../../../../models/brand.model';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormField, MatOption, MatSelect } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';

interface ItemWiseStockRow {
  productName: string;
  brandName: string;
  categoryName: string;
  availableQty: number;
  reserveQty: number;
  totalQty: number;
}

interface BatchWiseStockRow {
  productCd: number;
  productName: string;
  brandName: string;
  categoryName: string;
  packSize: number;
  unitName: string;
  mfgDate: string;
  expiryDate: string;
  batchQty: number;
  batchRate: number;
  availableQty: number;
  reserveQty: number;
  totalQty: number;
}

@Component({
  selector: 'app-stock-report',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    TranslatePipe,
    MatIconModule,
    MatOption,
    MatSelect,
    MatFormField,
    ReactiveFormsModule,
    MatRadioModule,
  ],
  templateUrl: './stock-report.html',
  styleUrls: ['./stock-report.scss', '../../shared/admin-table.scss'],
})
export class StockReport implements OnInit {
  private http = inject(Http);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private fb = inject(FormBuilder);

  rows = signal<(ItemWiseStockRow | BatchWiseStockRow)[]>([]);
  loading = signal(true);

  categories = signal<Category[]>([]);
  brands = signal<Brand[]>([]);
  products = signal<ProductMaster[]>([]);

  itemWiseColumns = ['productName', 'brandName', 'categoryName', 'availableQty', 'reserveQty', 'totalQty'];
  batchWiseColumns = [
    'productName',
    'brandName',
    'categoryName',
    'packSize',
    'unitName',
    'mfgDate',
    'expiryDate',
    'batchQty',
    'batchRate',
    'availableQty',
    'reserveQty',
    'totalQty',
  ];

  stockForm = this.fb.group({
    // 1 = ItemWise, 0 = BatchWise — sent directly in the payload as-is.
    itemWise: this.fb.control<number>(1),
    categoryCd: this.fb.control<number | null>(null),
    brandCd: this.fb.control<number | null>(null),
    productCd: this.fb.control<number | null>(null),
    categoryName: this.fb.control<string | null>(null),
    brandName: this.fb.control<string | null>(null),
    productName: this.fb.control<string | null>(null),
  });

  get isItemWise(): boolean {
    return this.stockForm.get('itemWise')?.value === 1;
  }

  get columns(): string[] {
    return this.isItemWise ? this.itemWiseColumns : this.batchWiseColumns;
  }

  ngOnInit(): void {
      console.log('STOCK REPORT INIT — loading value:', this.loading());

    this.categoryService.getAll().subscribe((c) => this.categories.set(c));
    this.brandService.getAll().subscribe((b) => this.brands.set(b));
    this.productService.getAll().subscribe((u) => this.products.set(u));
  }

  onModeChange(itemWise: number): void {
    
    this.stockForm.patchValue({ itemWise });
    // Clear previous results — the two modes return differently shaped rows.
    this.rows.set([]);
  }

  onProductChange(productCd: number): void {
    const product = this.products().find((c) => c.productCd === productCd);
    this.stockForm.patchValue({ productName: product?.productName ?? '' });
  }

  onCategoryChange(categoryCd: number): void {
    const category = this.categories().find((c) => c.categoryCd === categoryCd);
    this.stockForm.patchValue({ categoryName: category?.categoryName ?? '' });
  }

  onBrandChange(brandCd: number): void {
    const brand = this.brands().find((b) => b.brandCd === brandCd);
    this.stockForm.patchValue({ brandName: brand?.brandName ?? '' });
  }

  getAvailableStock(): void {
  this.loading.set(true);

  const payload = {
    itemWise: this.stockForm.get('itemWise')?.value,
    categoryCd: this.stockForm.get('categoryCd')?.value,
    brandCd: this.stockForm.get('brandCd')?.value,
    productCd: this.stockForm.get('productCd')?.value,
  };

  this.http
    .postWithPayload<(ItemWiseStockRow | BatchWiseStockRow)[]>(
      `${environment.apiBaseUrl}/v1/stock/available-stock`,
      payload
    )
    .subscribe({
      next: (res) => {
        this.rows.set(res ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading available stock:', error);
        this.rows.set([]);
        this.loading.set(false);
      },
    });
}
}