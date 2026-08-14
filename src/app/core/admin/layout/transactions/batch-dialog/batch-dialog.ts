import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { AvailableBatch, SalesOrderBatchDtl } from '../../shared/sales-order.model';
import { SalesOrderService } from '../../shared/sales-order.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { UnitOption } from '../../shared/unit.model';
import { UnitService } from '../../shared/unit.service';

export interface BatchDialogData {
  productCd: number;
  productName: string;
  existingBatches: SalesOrderBatchDtl[];
}

@Component({
  selector: 'app-batch-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    TranslatePipe,
    MatDatepickerModule,
  ],
  templateUrl: './batch-dialog.html',
  styleUrl: './batch-dialog.scss',
})
export class BatchDialog implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<BatchDialog>);
  private salesOrderService = inject(SalesOrderService);
  private unitService = inject(UnitService);

  availableBatches = signal<AvailableBatch[]>([]);
  loading = signal(true);
  columns = ['batchNo','packSize','uomCd', 'mfgDate', 'expiryDate','AvailQty', 'batchQty', 'batchRate', 'remove'];
  units = signal<UnitOption[]>([]);

  rows = this.fb.array<FormGroup>([]);

  constructor(@Inject(MAT_DIALOG_DATA) public data: BatchDialogData) {}

  ngOnInit(): void {
        this.unitService.getAll().subscribe((u) => this.units.set(u));

    this.salesOrderService.getAvailableBatches(this.data.productCd).subscribe({
      next: (batches) => {
        this.availableBatches.set(batches);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    if (this.data.existingBatches?.length) {
      this.data.existingBatches.forEach((b) => this.rows.push(this.buildRow(b)));
    } else {
      this.rows.push(this.buildRow());
    }
  }

 private buildRow(existing?: SalesOrderBatchDtl): FormGroup {
  return this.fb.group({
    batchDtlCd: [existing?.batchDtlCd ?? null],
    orderDtlCd: [existing?.orderDtlCd ?? null],

    batchNo: [
      existing?.batchNo ?? '',
      Validators.required
    ],

    mfgDate: [
      existing?.mfgDate ?? ''
    ],

    expiryDate: [
      existing?.expiryDate ?? ''
    ],

    batchQty: [
      existing?.batchQty ?? 0,
      [
        Validators.required,
        Validators.min(0.01)
      ]
    ],

    batchRate: [
      existing?.batchRate ?? 0,
      [
        Validators.required,
        Validators.min(0)
      ]
    ],
     packSize: [
      existing?.packSize ?? '',
      Validators.required
    ],
     uomCd: [
      existing?.uomCd ?? '',
      Validators.required
    ],
    // Not sent to backend.
    // Used only for client-side available quantity validation.
    _availableQty: [
      {
        value: existing ? null : 0,
        disabled: true
      }
    ]
  });
}

  get rowControls(): FormGroup[] {
    return this.rows.controls as FormGroup[];
  }

  addRow(): void {
    this.rows.push(this.buildRow());
  }

  removeRow(index: number): void {
    this.rows.removeAt(index);
  }

  
  onBatchSelected(row: FormGroup, batchNo: string): void {
    const batch = this.availableBatches().find((b) => b.batchNo === batchNo);
    if (!batch) return;

    // Rate and dates auto-fill from the selected batch; qty is left for the user to enter manually,
    // but capped against the batch's availableQty by the validator below.
    row.patchValue({
      mfgDate: batch.mfgDate ?? '',
      expiryDate: batch.expiryDate ?? '',
      batchRate: batch.rate,
      _availableQty: batch.availableQty,
      packSize:batch.packSize,
      uomCd:batch.uomCd
    });
    row.get('batchQty')?.setValidators([Validators.required, Validators.min(0.01), this.maxQtyValidator(batch.availableQty)]);
    row.get('batchQty')?.updateValueAndValidity();
  }

  private maxQtyValidator(max: number) {
    return (control: { value: number }) => (control.value > max ? { exceedsAvailable: true } : null);
  }

  availableQtyFor(row: FormGroup): number | null {
    return row.get('_availableQty')?.value ?? null;
  }

  isRowInvalid(row: FormGroup): boolean {
    return row.get('batchQty')?.invalid ?? false;
  }

  confirm(): void {
    if (this.rows.invalid) {
      this.rows.markAllAsTouched();
      return;
    }

    const result: SalesOrderBatchDtl[] = this.rows.controls.map((row) => {
      const raw = row.getRawValue();
      const { _availableQty, ...batch } = raw;
      return batch as SalesOrderBatchDtl;
    });

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}