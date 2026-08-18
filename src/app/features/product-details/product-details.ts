import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslatePipe } from '@ngx-translate/core';

import { ProductService } from '../../core/services/ product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/ auth.service';
import { Packsizes, Product, ProductMaster } from '../../core/models/product.model';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating';
import { ProductCard } from '../../shared/components/product-card/product-card';

@Component({
  selector: 'fp-product-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    TranslatePipe,
    StarRatingComponent,
    ProductCard,
  ],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss',
})
export class ProductDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cart = inject(CartService);
  private auth = inject(AuthService);

  product = signal<Product | null>(null);
  related = signal<Product[]>([]);
  activeImageIndex = signal(0);
  quantity = signal(1);
  loading = signal(true);
  selectedPackSize = signal<Packsizes | null>(null);
  isInCart = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.loadProduct(id);
    });
  }

  private loadProduct(id: string): void {
    this.loading.set(true);
    this.productService.getById(id).subscribe({
      next: (product) => {
        this.activeImageIndex.set(0);
        this.quantity.set(1);
        this.loading.set(false);

        const defaultPack = product.packsizes?.find(
          (pack) => pack.defaultYn === true && pack.inStock,
        );

        if (defaultPack) {
          this.selectedPackSize.set(defaultPack);

          this.product.set({
            ...product,
            unit: `${defaultPack.packSize} ${defaultPack.unitName}`,
            price: defaultPack.sellingPrice,
            name: product.productName,
            brand:product.brandName
          });
        } else {
          this.product.set(product);
        }
      },
      error: () => this.loading.set(false),
    });

    this.productService.getRelated(id).subscribe((related) => this.related.set(related));
  }

  selectImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  incrementQuantity(): void {
    this.quantity.update((q) => q + 1);
  }
  decrementQuantity(): void {
    this.quantity.update((q) => Math.max(q - 1, 1));
  }

  addToCart(): void {
    const product = this.product();
    if (!product) return;
    this.cart.addItem(product, this.quantity());
    this.isInCart = true;
  }
  goToCart(): void {
    this.router.navigate(['/cart']);
  }
  buyNow(): void {
    const product = this.product();
    if (!product) return;

    // if (!this.auth.isLoggedIn()) {
    //   this.auth.setPendingAction({ type: 'BUY_NOW', productId: product.id, quantity: this.quantity() });
    //   this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
    //   return;
    // }
    this.cart.addItem(product, this.quantity());
    this.router.navigate(['/checkout']);
  }
  selectPackSize(pack: Packsizes): void {
    if (!pack.inStock) {
      return;
    }

    this.selectedPackSize.set(pack);

    // Reset quantity whenever pack changes
    this.quantity.set(1);
  }

  getSelectedPrice(): number {
    const pack = this.selectedPackSize();

    return pack?.sellingPrice ?? this.product()?.price ?? 0;
  }

  getSelectedMrp(): number {
    const pack = this.selectedPackSize();

    return pack?.mrpPrice ?? this.product()?.mrp ?? 0;
  }

  getDiscountPercent(): number {
    const mrp = this.getSelectedMrp();
    const price = this.getSelectedPrice();

    if (!mrp || mrp <= price) {
      return 0;
    }

    return Math.round(((mrp - price) / mrp) * 100);
  }

  isSelectedPackInStock(): boolean {
    const pack = this.selectedPackSize();

    return pack ? pack.inStock : (this.product()?.stock ?? 0) > 0;
  }

  getAvailableStock(): number {
    const pack = this.selectedPackSize();

    return pack ? (pack.inStock ? 1 : 0) : (this.product()?.stock ?? 0);
  }
}
