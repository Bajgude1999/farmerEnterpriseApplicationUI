import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';

import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/ auth.service';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'fp-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, TranslatePipe, EmptyState],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class CartComponent {
  cart = inject(CartService);
  private auth = inject(AuthService);
  private router = inject(Router);

  updateQuantity(productId: string, quantity: number): void {
    this.cart.updateQuantity(productId, quantity);
  }

  removeItem(productId: string): void {
    this.cart.removeItem(productId);
  }

  goToCheckout(): void {
    // if (!this.auth.isLoggedIn()) {
    //   // this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
    //   // return;
    //       this.router.navigate(['/checkout']);

    // }
    this.cart.calculateTaxes();
    this.router.navigate(['/checkout']);
  }
  
}