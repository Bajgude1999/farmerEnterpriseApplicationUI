import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/ auth.service';
import { StarRatingComponent } from '../star-rating/star-rating';
import { WishlistService } from '../../../core/services/wishlist.service';

@Component({
  selector: 'fp-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, TranslatePipe, StarRatingComponent],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  private cart = inject(CartService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private wishlist = inject(WishlistService);

  @Input({ required: true }) product!: Product;
  @Output() wishlistToggled = new EventEmitter<Product>();
isInCart = false;


  wishlisted = signal(false);
  wishlistSaving = signal(false);

ngOnInit(): void {
  this.checkCart();
}

checkCart(): void {
  this.isInCart = this.cart.isProductInCart(this.product.id);
}
goToCart(): void {
  this.router.navigate(['/cart']);
}
  get discountPercent(): number {
    if (!this.product.mrp || this.product.mrp <= this.product.price) return 0;
    return Math.round(((this.product.mrp - this.product.price) / this.product.mrp) * 100);
  }

  addToCart(): void {
    if (!this.auth.isLoggedIn()) {
      // this.auth.setPendingAction({ type: 'ADD_TO_CART', productId: this.product.id, quantity: 1 });
      // this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      
      // return;
      this.cart.addItem(this.product, 1);
      this.isInCart = true;
    }
    this.cart.addItem(this.product, 1);
      this.isInCart = true;

  }

  buyNow(): void {
    if (!this.auth.isLoggedIn()) {
      this.auth.setPendingAction({ type: 'BUY_NOW', productId: this.product.id, quantity: 1 });
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
    this.cart.addItem(this.product, 1);
    this.router.navigate(['/checkout']);
  }

 toggleWishlist(): void {
  if (!this.auth.isLoggedIn()) {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    return;
  }

  const userCd = this.auth.userCd();
  if (userCd == null) {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    return;
  }

  this.wishlistSaving.set(true);
  this.wishlist.add(userCd, this.product.id).subscribe({
    next: () => {
      this.wishlisted.set(true);
      this.wishlistSaving.set(false);
      this.wishlistToggled.emit(this.product);
    },
    error: () => this.wishlistSaving.set(false),
  });
}
onWishlistClick(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
  this.toggleWishlist();
}
}