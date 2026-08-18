import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe } from '@ngx-translate/core';

import {
  Order,
  OrderStatus,
  OrderResponse
} from '../../core/models/cart.model';

import { environment } from '../../../environments/environment/environment';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { Http } from '../../core/common/http';
import { ProductRatingDto } from '../../core/services/ product.model';

const TABS: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PACKED',
  'OUT FOR DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURNED'
];

@Component({
  selector: 'fp-my-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatChipsModule,
    TranslatePipe,
    EmptyState
  ],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.scss',
})
export class MyOrders implements OnInit {

  private http = inject(Http);

  tabs = TABS;

  activeTabIndex = signal(0);

  orders = signal<Order[]>([]);

  loading = signal(true);

  // Selected rating for each product/order
  // key = orderCd_productCd
  ratings = signal<Record<string, number>>({});

  // Review for each product/order
  // key = orderCd_productCd
  reviews = signal<Record<string, string>>({});

  // Items which have already been saved
  ratedItems = signal<Set<string>>(new Set());

  filteredOrders = computed(() => {
    const status = this.tabs[this.activeTabIndex()];

    return this.orders().filter((o) => {

      if (status === 'PENDING') {
        return (
          o.orderStatus === 'PLACED' ||
          o.orderStatus === 'PENDING'
        );
      }

      return o.orderStatus === status;
    });
  });

  ngOnInit(): void {

    const userData = localStorage.getItem('fp_auth_user');

    if (!userData) {
      this.loading.set(false);
      return;
    }

    const user = JSON.parse(userData);

    const userId = user.userId;

    this.http.get<OrderResponse>(
      `${environment.apiBaseUrl}/v1/salesorder/my-orders/${userId}`
    ).subscribe({
      next: (orders) => {

        this.orders.set(orders.data);

        this.loading.set(false);
      },

      error: () => {
        this.loading.set(false);
      },
    });
  }

  onTabChange(index: number): void {
    this.activeTabIndex.set(index);
  }

  /**
   * Unique key for product inside an order
   */
  getRatingKey(order: Order, item: any): string {
    return `${order.id}_${item.productCd}`;
  }

  /**
   * Set rating.
   *
   * rating is stored as:
   * 0.5 -> 1
   * 1.0 -> 2
   * 1.5 -> 3
   * ...
   * 5.0 -> 10
   */
  setRating(order: Order, item: any, rating: number): void {

    const key = this.getRatingKey(order, item);

    if (this.ratedItems().has(key)) {
      return;
    }

    this.ratings.update(current => ({
      ...current,
      [key]: rating
    }));
  }

  getRating(order: Order, item: any): number {

    const key = this.getRatingKey(order, item);

    return this.ratings()[key] || 0;
  }

  setReview(
    order: Order,
    item: any,
    review: string
  ): void {

    const key = this.getRatingKey(order, item);

    this.reviews.update(current => ({
      ...current,
      [key]: review
    }));
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

    if (!rating) {
      return;
    }

    const userData = localStorage.getItem('fp_auth_user');

    if (!userData) {
      return;
    }

    const user = JSON.parse(userData);

    const payload = {
      productCd: Number(item.productCd),
      userCd: Number(user.userId),
      orderCd: Number(order?.orderCd),
      rating: Math.round(rating ),

      review: review?.trim() || '',
      active: true
    };

 this.http.post(
  `${environment.apiBaseUrl}/v1/product/ratingsave`,
  payload
).subscribe({
  next: () => {

    this.ratedItems.update(current => {
      const updated = new Set(current);
      updated.add(key);
      return updated;
    });

  },

  error: (err) => {
    console.error('Failed to save rating', err);
  }
});}
}