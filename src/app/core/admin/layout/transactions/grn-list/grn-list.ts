import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { GrnService } from '../../shared/grn.service';
import { GrnHdr } from '../../shared/grn.model';

@Component({
  selector: 'app-grn-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './grn-list.html',
  styleUrl: '../../shared/admin-table.scss',
})
export class GrnList implements OnInit {
  private grnService = inject(GrnService);
  private router = inject(Router);

  grns = signal<GrnHdr[]>([]);
  loading = signal(true);
  columns = ['grnNo', 'grnDate', 'supplierName', 'invoiceNo', 'invoiceDate', 'remarks', 'actions'];

  ngOnInit(): void {
    this.grnService.getAll().subscribe({
      next: (grns) => {
        this.grns.set(grns);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToAdd(): void {
    this.router.navigate(['/admin/transaction/goods-receipt-note/add']);
  }

  goToEdit(grn: GrnHdr): void {
    this.router.navigate(['/admin/transaction/goods-receipt-note/edit', grn.grnCd]);
  }
}