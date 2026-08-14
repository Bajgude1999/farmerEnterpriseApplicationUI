import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe } from '@ngx-translate/core';

import { Order, OrderStatus } from '../../core/models/cart.model';
import { environment } from '../../../environments/environment/environment';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

const TABS: OrderStatus[] = ['PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED'];

@Component({
  selector: 'fp-my-orders',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatChipsModule, TranslatePipe, EmptyState],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.scss',
})
export class MyOrders implements OnInit {
  private http = inject(HttpClient);

  tabs = TABS;
  activeTabIndex = signal(0);
  orders = signal<Order[]>([]);
  loading = signal(true);

  filteredOrders = computed(() => {
    const status = this.tabs[this.activeTabIndex()];
    return this.orders().filter((o) => o.status === status);
  });

  ngOnInit(): void {
    this.http.get<Order[]>(`${environment.apiBaseUrl}/orders/my`).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onTabChange(index: number): void {
    this.activeTabIndex.set(index);
  }
}