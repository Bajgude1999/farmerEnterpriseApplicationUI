import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TranslatePipe } from '@ngx-translate/core';

import { ProductService } from '../../core/services/ product.service';
import { Product, ProductFilter, ProductSortOption } from '../../core/models/product.model';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

const CATEGORIES = [
  'SEEDS',
  'FERTILIZERS',
  'PESTICIDES',
  'IRRIGATION'
];
const BRANDS = [
  'UPL_LIMITED',
  'PI_INDUSTRIES',
  'BAYER_CROPSCIENCE',
  'SYNGENTA_INDIA',
  'BASF_INDIA',
  'FMC_INDIA',
  'CORTEVA_AGRISCIENCE',
  'SUMITOMO_CHEMICAL_INDIA',
  'DHANUKA_AGRITECH',
  'INSECTICIDES_INDIA_LIMITED',
  'RALLIS_INDIA',
  'INDOFIL_INDUSTRIES',
  'CRYSTAL_CROP_PROTECTION',
  'GODREJ_AGROVET',
  'ADAMA_INDIA',
  'NACL_INDUSTRIES',
  'EXCEL_CROP_CARE',
  'BIOSTADT_INDIA',
  'SHARDA_CROPCHEM'
];
@Component({
  selector: 'fp-product-listing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSliderModule,
    MatPaginatorModule,
    TranslatePipe,
    ProductCard,
    EmptyState,
  ],
  templateUrl: './product-listing.html',
  styleUrl: './product-listing.scss',
})
export class ProductListing implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  categories = CATEGORIES;
  brands = BRANDS;

  filter: ProductFilter = { category: [], brand: [], inStockOnly: false, minPrice: 0, maxPrice: 50000, minRating: 0 };
  sort: ProductSortOption = 'POPULARITY';

  products = signal<Product[]>([]);
  total = signal(0);
  page = signal(0);
  pageSize = signal(12);
  loading = signal(true);

ngOnInit(): void {

  this.route.queryParamMap.subscribe(params => {

    const categoryId = params.get('categoryCd');
    const category = params.get('category');
    const brandCd = params.get('brandCd');

    if (categoryId) {

      this.loading.set(true);

      this.productService.getProductsByCategory(+categoryId).subscribe({
        next: (result) => {
          this.products.set(result.items);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });

    } else if(brandCd){
      
      this.loading.set(true);

      this.productService.getProductsByBrand(+brandCd).subscribe({
        next: (result) => {
          this.products.set(result.items);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
     else if(category == 'all'){

      this.loading.set(true);

      this.productService.getAllCategory().subscribe({
        next: (result) => {
          this.products.set(result.items);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });

    }
    else {
      this.fetch();
    }

  });

}

  fetch(): void {
    this.loading.set(true);
    this.productService.list(this.filter, this.sort, this.page() + 1, this.pageSize()).subscribe({
      next: (result) => {
        this.products.set(result.items);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSortChange(): void {
    this.page.set(0);
    this.fetch();
  }

  onFilterChange(): void {
    this.page.set(0);
    this.fetch();
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.fetch();
  }

  toggleCategory(category: string, checked: boolean): void {
    const current = new Set(this.filter.category ?? []);
    checked ? current.add(category) : current.delete(category);
    this.filter.category = Array.from(current);
    this.onFilterChange();
  }

  toggleBrand(brand: string, checked: boolean): void {
    const current = new Set(this.filter.brand ?? []);
    checked ? current.add(brand) : current.delete(brand);
    this.filter.brand = Array.from(current);
    this.onFilterChange();
  }
}