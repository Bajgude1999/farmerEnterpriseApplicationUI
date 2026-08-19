import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/ auth.service';
import { environment } from '../../../../environments/environment';
import { ProductService } from '../../../core/services/ product.service';
import { Product } from '../../../core/models/product.model';
import { SearchService } from '../../../core/services/search.service';
import { Category } from '../../../core/models/category.model';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationBell } from '../notification-bell/notification-bell';

@Component({
  selector: 'fp-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatMenuModule, MatBadgeModule, TranslatePipe,NotificationBell],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  private router = inject(Router);
  private translate = inject(TranslateService);
  private productService = inject(ProductService);
private searchService = inject(SearchService);
  private categoryService = inject(CategoryService);

  cart = inject(CartService);
  auth = inject(AuthService);
  
  searchQuery = '';
  languages = environment.supportedLanguages;
  currentLang = signal(this.translate.currentLang() || environment.defaultLanguage);
searchResults = signal<Product[]>([]);
    categories = signal<Category[]>([]);

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });
  }
onSearch(): void {
  const keyword = this.searchQuery.trim();

  if (!keyword) {
    this.searchService.searchResults.set([]);
    return;
  }

  this.productService.searchProducts(keyword).subscribe({
    next: (products) => {
      this.searchService.searchResults.set(products);
    }
  });
}
searchKeyword = '';
searchResults1: Product[] = [];
showSearchResults = signal(false);
onSearchChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  this.searchKeyword = input.value;

  if (!this.searchKeyword.trim()) {
   this.searchResults.set([]);
this.showSearchResults.set(false);
    return;
  }

  this.productService.searchProducts(this.searchKeyword.trim()).subscribe({
    next: (products) => {
      this.searchResults.set(products);
this.showSearchResults.set(products.length > 0);
    },
    error: (error) => {
      console.error('Search error:', error);
     this.searchResults.set([]);
this.showSearchResults.set(false);
    }
  });
}
openProduct(product: Product): void {
    this.productService.searchProducts(product.id).subscribe({
    next: (products) => {
      this.searchResults.set(products);
this.showSearchResults.set(products.length > 0);
    },
    error: (error) => {
      console.error('Search error:', error);
     this.searchResults.set([]);
this.showSearchResults.set(false);
    }
  });

}
 changeLanguage(lang: string): void {

  localStorage.setItem('fp_lang', lang);

  this.translate.use(lang).subscribe(() => {
    this.currentLang.set(lang);
  });

}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}