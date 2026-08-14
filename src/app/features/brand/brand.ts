import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandService } from '../../core/services/brand.service';
import { Brand } from '../../core/models/brand.model';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'fp-brand',
  standalone: true,
  imports: [CommonModule, TranslatePipe, EmptyState],
  templateUrl: './brand.html',
  styleUrl: './brand.scss',
})
export class BrandComponent implements OnInit {
  private brandService = inject(BrandService);
  private router = inject(Router);

  brands = signal<Brand[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.brandService.getAll().subscribe({
      next: (brands) => {
        this.brands.set(brands);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  viewBrandProducts(brand: Brand): void {
this.router.navigate(['/products'], {
  queryParams: {
    brandCd: brand.brandCd
  }
});  }
}