import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { ReportService } from '../../shared/report.service';
import { SalesSummaryReport } from '../../../../models/report.model';

@Component({
  selector: 'app-sales-summary-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './sales-summary-report.html',
  styleUrls: ['./sales-summary-report.scss', '../../shared/admin-table.scss'],
})
export class SalesSummaryReportComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reportService = inject(ReportService);

  filterForm!: FormGroup;
  reportData = signal<SalesSummaryReport | null>(null);
  loading = signal(false);
  columns = ['period', 'orderCount', 'totalGrossAmount', 'totalDiscountAmount', 'totalNetAmount'];

  ngOnInit(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.filterForm = this.fb.group({
      groupBy: ['DAY'],
      fromDate: [thirtyDaysAgo.toISOString().substring(0, 10)],
      toDate: [today.toISOString().substring(0, 10)],
    });

    this.fetchReport();
  }

  fetchReport(): void {
    this.loading.set(true);
    const { fromDate, toDate, groupBy } = this.filterForm.value;
    this.reportService.getSalesSummary(fromDate, toDate, groupBy).subscribe({
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
