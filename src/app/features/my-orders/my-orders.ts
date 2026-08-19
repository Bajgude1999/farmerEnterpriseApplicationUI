import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { Order, OrderResponse } from '../../core/models/cart.model';
import { environment } from '../../../environments/environment';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { Http } from '../../core/common/http';

@Component({
  selector: 'fp-my-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, EmptyState],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.scss',
})
export class MyOrders implements OnInit {
  private http = inject(Http);

  orders = signal<Order[]>([]);
  loading = signal(true);

  ratings = signal<Record<string, number>>({});
  reviews = signal<Record<string, string>>({});
  ratedItems = signal<Set<string>>(new Set());

  ngOnInit(): void {
    const userData = localStorage.getItem('fp_auth_user');

    if (!userData) {
      this.loading.set(false);
      return;
    }

    const user = JSON.parse(userData);
    const userId = user.userId;

    this.http
      .get<OrderResponse>(`${environment.apiBaseUrl}/v1/salesorder/my-orders/${userId}`)
      .subscribe({
        next: (orders) => {
          this.orders.set(orders.data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  getRatingKey(order: Order, item: any): string {
    return `${order.id}_${item.productCd}`;
  }

  setRating(order: Order, item: any, rating: number): void {
    const key = this.getRatingKey(order, item);
    if (this.ratedItems().has(key)) return;

    this.ratings.update((current) => ({ ...current, [key]: rating }));
  }

  getRating(order: Order, item: any): number {
    const key = this.getRatingKey(order, item);
    return this.ratings()[key] || 0;
  }

  setReview(order: Order, item: any, review: string): void {
    const key = this.getRatingKey(order, item);
    this.reviews.update((current) => ({ ...current, [key]: review }));
  }

  getReview(order: Order, item: any): string {
    const key = this.getRatingKey(order, item);
    return this.reviews()[key] || '';
  }

  isRated(order: Order, item: any): boolean {
    const key = this.getRatingKey(order, item);
    return this.ratedItems().has(key);
  }

  saveRating(order: Order, item: any): void {
    const key = this.getRatingKey(order, item);
    const rating = this.getRating(order, item);
    const review = this.getReview(order, item);

    if (!rating) return;

    const userData = localStorage.getItem('fp_auth_user');
    if (!userData) return;

    const user = JSON.parse(userData);

    const payload = {
      productCd: Number(item.productCd),
      userCd: Number(user.userId),
      orderCd: Number((order as any)?.orderCd),
      rating: Math.round(rating),
      review: review?.trim() || '',
      active: true,
    };

    this.http.post(`${environment.apiBaseUrl}/v1/product/ratingsave`, payload).subscribe({
      next: () => {
        this.ratedItems.update((current) => {
          const updated = new Set(current);
          updated.add(key);
          return updated;
        });
      },
      error: (err) => {
        console.error('Failed to save rating', err);
      },
    });
  }
}