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
import { ProfitMarginReport } from '../../../../models/report.model';

@Component({
  selector: 'app-profit-margin-report',
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
  templateUrl: './profit-margin-report.html',
  styleUrls: ['./profit-margin-report.scss', '../../shared/admin-table.scss'],
})
export class ProfitMarginReportComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reportService = inject(ReportService);

  filterForm!: FormGroup;
  reportData = signal<ProfitMarginReport | null>(null);
  loading = signal(false);
  columns = ['period', 'salesAmount', 'purchaseCost', 'profitAmount', 'marginPercentage'];

  ngOnInit(): void {
    const today = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);

    this.filterForm = this.fb.group({
      fromDate: [ninetyDaysAgo.toISOString().substring(0, 10)],
      toDate: [today.toISOString().substring(0, 10)],
    });

    this.fetchReport();
  }

  fetchReport(): void {
    this.loading.set(true);
    const { fromDate, toDate } = this.filterForm.value;
    this.reportService.getProfitMargin(fromDate, toDate).subscribe({
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
