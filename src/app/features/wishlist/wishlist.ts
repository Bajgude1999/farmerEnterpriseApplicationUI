import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/ auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { Product } from '../../core/models/product.model';

export interface WishlistProduct extends Product {
  wishlistCd?: number;
}

@Component({
  selector: 'fp-wishlist',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, TranslatePipe, ProductCard],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss',
})
export class WishlistComponent implements OnInit {
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  items = signal<WishlistProduct[]>([]);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    const userCd = this.authService.userCd();
    if (!userCd) {
      this.items.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.wishlistService.getWishlist(userCd).subscribe({
      next: (res: any) => {
        const rawList: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        const products: WishlistProduct[] = rawList.map((item: any) => {
          const image = item.profilePhoto || item.imagePath || 'assets/images/logo.png';
          return {
            id: String(item.productCd),
            wishlistCd: item.wishlistCd,
            name: item.productName || 'Product',
            slug: (item.productName || 'product').toLowerCase().replace(/\s+/g, '-'),
            brand: item.brandName || '',
            category: item.categoryName || '',
            price: item.saleRate || 0,
            mrp: item.saleRate || 0,
            packSize: 1,
            rating: 4.5,
            ratingCount: 100,
            uomCd: 1,
            stock: item.availableQty || 0,
            unit: item.unitName || '',
            featured: false,
            trending: false,
            recentlyAdded: false,
            bestSellers: false,
            imagePath: image,
            images: [
              {
                thumbnail: image,
                medium: image,
                large: image,
              },
            ],
            packsizes: [],
            productDesc: item.productName || '',
            usage: '',
            dose: '',
            precaution: '',
            productName: item.productName || 'Product',
            brandName: item.brandName || '',
          };
        });
        this.items.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loading.set(false);
      },
    });
  }

  removeItem(product: WishlistProduct, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!product.wishlistCd) {
      return;
    }

    this.wishlistService.remove(product.wishlistCd).subscribe({
      next: () => {
        this.items.update((list) => list.filter((p) => p.wishlistCd !== product.wishlistCd));
        this.toastService.success('Item removed from wishlist');
      },
      error: () => {
        // Handled by error interceptor
      },
    });
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }
}
