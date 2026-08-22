import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { ReportService } from '../../shared/report.service';
import { PurchaseSummaryReport } from '../../../../models/report.model';

@Component({
  selector: 'app-purchase-summary-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './purchase-summary-report.html',
  styleUrls: ['./purchase-summary-report.scss', '../../shared/admin-table.scss'],
})
export class PurchaseSummaryReportComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reportService = inject(ReportService);

  filterForm!: FormGroup;
  reportData = signal<PurchaseSummaryReport | null>(null);
  loading = signal(false);
  columns = ['grnDate', 'grnNo', 'supplierName', 'invoiceNo', 'totalAmount', 'grnStatus'];

  ngOnInit(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.filterForm = this.fb.group({
      fromDate: [thirtyDaysAgo.toISOString().substring(0, 10)],
      toDate: [today.toISOString().substring(0, 10)],
      supplier: [''],
    });

    this.fetchReport();
  }

  fetchReport(): void {
    this.loading.set(true);
    const { fromDate, toDate, supplier } = this.filterForm.value;
    this.reportService.getPurchaseSummary(fromDate, toDate, supplier).subscribe({
      next: (data) => {
        this.reportData.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
