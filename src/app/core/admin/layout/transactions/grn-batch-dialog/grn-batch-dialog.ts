import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

import { GrnBatchDtl } from '../../shared/grn.model';
import { UnitOption } from '../../../../models/unit.model';
import { UnitService } from '../../shared/unit.service';
import { MatOption } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

export interface GrnBatchDialogData {
  productName: string;
  existingBatches: GrnBatchDtl[];
}

@Component({
  selector: 'app-grn-batch-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    TranslatePipe,
    MatDatepickerModule,
    MatOption,
    MatSelectModule
  ],
  templateUrl: './grn-batch-dialog.html',
  styleUrl: './grn-batch-dialog.scss',
})
export class GrnBatchDialog implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<GrnBatchDialog>);
  private unitService = inject(UnitService);

  itemBatchRows: FormGroup[] = [];
  units = signal<UnitOption[]>([]);

  columns = [
    'batchNo',
    'packSize',
    'uomCd',
    'mfgDate',
    'expiryDate',
    'batchQty',
    'batchRate',
    'remove'
  ];

  rows = this.fb.array<FormGroup>([]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: GrnBatchDialogData
  ) {}

  ngOnInit(): void {
        this.unitService.getAll().subscribe((u) => this.units.set(u));

    if (this.data.existingBatches?.length) {
      this.data.existingBatches.forEach((b) => {
        this.rows.push(this.buildRow(b));
      });
    } else {
      this.rows.push(this.buildRow());
    }

    this.refreshRows();
  }

  private buildRow(existing?: GrnBatchDtl): FormGroup {
    return this.fb.group({
      batchDtlCd: [existing?.batchDtlCd ?? null],
      grnDtlCd: [existing?.grnDtlCd ?? null],

      batchNo: [
        existing?.batchNo ?? '',
        Validators.required
      ],

      packSize: [
        existing?.packSize ?? ''
      ],
      uomCd: [
        existing?.uomCd ?? ''
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
      ]
    });
  }

  private refreshRows(): void {
    this.itemBatchRows = [...this.rows.controls];
  }

  addRow(): void {
    this.rows.push(this.buildRow());

    // Refresh table data
    this.refreshRows();
  }

  removeRow(index: number): void {
    this.rows.removeAt(index);

    // Refresh table data
    this.refreshRows();
  }

  confirm(): void {
    if (this.rows.invalid) {
      this.rows.markAllAsTouched();
      return;
    }

    const result: GrnBatchDtl[] = this.rows.controls.map(
      (row) => row.getRawValue()
    );

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}

