import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ProductService } from '../../core/services/ product.service';
import { Product } from '../../core/models/product.model';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { SearchService } from '../../core/services/search.service';


interface HomeSections {
  featured: Product[];
  trending: Product[];
  recentlyAdded: Product[];
  bestSellers: Product[];
}


@Component({
  selector: 'fp-home',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    ProductCard,
    EmptyState
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {

  private productService = inject(ProductService);
  private searchService = inject(SearchService);

  loading = signal(true);

  // Store the actual Home API response separately
  private homeSections = signal<HomeSections>({
    featured: [],
    trending: [],
    recentlyAdded: [],
    bestSellers: []
  });

  // Displayed sections
  // Search results take priority when available
  sections = computed<HomeSections>(() => {

    const products = this.searchService.searchResults();

    if (products.length > 0) {
      return {
        featured: products,
        trending: [],
        recentlyAdded: [],
        bestSellers: []
      };
    }

    return this.homeSections();
  });


  banners = [
    { key: 'FERTILIZERS', icon: '🌱' },
    { key: 'SEEDS', icon: '🌾' },
    { key: 'CROP_PROTECTION', icon: '🛡️' }
  ];


  ngOnInit(): void {

    this.productService.getHomeSections().subscribe({
      next: (data: HomeSections) => {
        this.homeSections.set(data);
        this.loading.set(false);
      },

      error: () => {
        this.loading.set(false);
      }
    });

  }

}

