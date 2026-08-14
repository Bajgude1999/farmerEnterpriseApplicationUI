import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { SalesOrderService } from '../../shared/sales-order.service';
import { SalesOrder } from '../../shared/sales-order.model';

@Component({
  selector: 'app-sales-order-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './sales-order-list.html',
  styleUrl: '../../shared/admin-table.scss',
})
export class SalesOrderList implements OnInit {
  private salesOrderService = inject(SalesOrderService);
  private router = inject(Router);

  orders = signal<SalesOrder[]>([]);
  loading = signal(true);
  columns = ['orderNo','orderDate' ,'userCd', 'paymentMode'/*, 'grossAmount'*/, 'orderStatus', 'invoiceNo', 'invoiceDate', 'actions'];

  ngOnInit(): void {
    this.salesOrderService.getAll().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToAdd(): void {
    this.router.navigate(['/admin/transaction/sales-order/add']);
  }

  goToEdit(order: SalesOrder): void {
    this.router.navigate(['/admin/transaction/sales-order/edit', order.orderCd]);
  }
}