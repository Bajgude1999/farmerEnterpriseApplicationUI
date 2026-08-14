import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../../../../environments/environment/environment';
import { Http } from '../../../../common/http';

interface GrnRow {
  grnNumber: string;
  supplierName: string;
  receivedDate: string;
  totalItems: number;
}

@Component({
  selector: 'app-goods-receipt-note',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './goods-receipt-note.html',
  styleUrl: '../../shared/admin-table.scss',
})
export class GoodsReceiptNote implements OnInit {
  private http = inject(Http);

  rows = signal<GrnRow[]>([]);
  loading = signal(true);
  columns = ['grnNumber', 'supplierName', 'receivedDate', 'totalItems'];

  ngOnInit(): void {
    this.http.get<{ data: GrnRow[] }>(`${environment.apiBaseUrl}/v1/grn/all`).subscribe({
      next: (res) => {
        this.rows.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}