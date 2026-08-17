import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { GrnBatchDialog, GrnBatchDialogData } from '../grn-batch-dialog/grn-batch-dialog';
import { GrnBatchDtl } from '../../shared/grn.model';
import { GrnService } from '../../shared/grn.service';
import { GrnHdr, GrnDtl, GrnGst } from '../../shared/grn.model';
import { Packsizes, Product, ProductMaster, WhMaster } from '../../../../models/product.model';
import { ProductService } from '../../../../services/ product.service';
import { MatOption } from '@angular/material/select';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { UserMasterService } from '../../shared/user-master.service';
import { UserMaster } from '../../../../models/user.model';
import { UnitOption } from '../../shared/unit.model';
import { UnitService } from '../../shared/unit.service';
@Component({
  selector: 'app-grn',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    TranslatePipe,
    MatOption,
    MatSelectModule,
    MatDatepickerModule,
  ],
  templateUrl: './grn.html',
  styleUrl: './grn.scss',
})
export class GrnComponent implements OnInit {
  private fb = inject(FormBuilder);
  private grnService = inject(GrnService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private productService = inject(ProductService);
  private userService = inject(UserMasterService);
  private unitService = inject(UnitService);

  taxTableRows: any[] = [];

  isEdit = signal(false);
  saving = signal(false);
  expandedItemIndex = signal<number | null>(null);
  itemTableRows: any[] = [];
  taxNameOptions: string[] = ['BASIC', 'ROUND OFF', 'SGST', 'CGST', 'IGST', 'CESS'];
  grnStatuses = ['RECIEVED', 'CANCELLED','RETURNED'];
  warehouses= signal<WhMaster[]>([]);
  itemColumns = [
    'productCd',
    'packSize',
    'UOM',
    'qty',
    'freeQty',
    'purchaseRate',
    'mrp',
    'amount',
    'expand',
  ];
  taxColumns = ['taxName', 'taxRate', 'taxAmount'];
  products = signal<ProductMaster[]>([]);
  units = signal<UnitOption[]>([]);
  totalGrnAmount = 0;
  form = this.fb.nonNullable.group({
    grnCd: [null as number | null],
    grnNo: [{ value: '', disabled: true }],
    grnDate: ['', Validators.required],
    supplierName: ['', Validators.required],
    remarks: [''],
    totalAmount: [0, Validators.required],
    active: [true],
    grnStatus:['', Validators.required],
    invoiceDate:['', Validators.required],
    invoiceNo:['', Validators.required],
    whCd:['', Validators.required],
    grnDtlList: this.fb.array<FormGroup>([]),
  });
  suppliers = signal<UserMaster[]>([]);

  get itemRows(): FormArray<FormGroup> {
    return this.form.controls.grnDtlList as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    this.unitService.getAll().subscribe((u) => this.units.set(u));

    this.userService.getAllActiveUserByRoleCode(4).subscribe({
      next: (users) => {
        this.suppliers.set(users);
        //this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users', err);
        // this.loading.set(false);
      },
    });
    // this.loading.set(true);
    this.productService.getAll().subscribe({
      next: (result: ProductMaster[]) => {
        this.products.set(result);
        //  this.loading.set(false);
      },
      error: () => {
        //  this.loading.set(false);
      },
    });
      this.productService.getAllWh().subscribe({
      next: (result: WhMaster[]) => {
        this.warehouses.set(result);
        //  this.loading.set(false);
      },
      error: () => {
        //  this.loading.set(false);
      },
    });
    const grnCd = this.route.snapshot.paramMap.get('id');
    if (grnCd) {
      this.isEdit.set(true);
      this.loadGrn(Number(grnCd));
    }
  }

 private loadGrn(grnCd: number): void {
  this.grnService.getById(grnCd).subscribe({
    next: (grn: GrnHdr) => {

      // Patch GRN header
      this.form.patchValue({
        grnCd: grn.grnCd,
        grnNo: grn.grnNo,
        grnDate: grn.grnDate,
        supplierName: grn.supplierName,
        remarks: grn.remarks,
        totalAmount: grn.totalAmount,
        active: grn.active,
        grnStatus:grn.grnStatus,
      });

      // Clear existing rows
      this.itemRows.clear();

      // Patch GRN detail rows
      (grn.grnDtlList ?? []).forEach((item: GrnDtl) => {
        this.itemRows.push(
          this.buildItemRow(item)
        );
      });

      // Refresh table datasource
      this.itemTableRows = [...this.itemRows.controls];

      // Optional: calculate taxes after loading
      this.calculateTaxes();
    },

    error: (err) => {
      console.error('Failed to load GRN:', err);
    }
  });
}

  private buildItemRow(item?: GrnDtl) {
    const taxRows = this.fb.array(
      item?.grnGstDtos?.length
        ? item.grnGstDtos.map((tax) => this.buildTaxRow(tax))
        : [this.createBasicTaxRow()],
    );

    return this.fb.group({
      grnDtlCd: [item?.grnDtlCd ?? null],
      grnCd: [item?.grnCd ?? null],

      productCd: [item?.productCd ?? null, Validators.required],
      packSize: [item?.packSize ?? 1, Validators.required],
      qty: [item?.qty ?? 0, [Validators.required, Validators.min(0)]],

      freeQty: [item?.freeQty ?? 0],

      purchaseRate: [item?.purchaseRate ?? 0, [Validators.required, Validators.min(0)]],

      mrp: [item?.mrp ?? 0, [Validators.required, Validators.min(0)]],

      saleRate: [item?.saleRate ?? 0, [Validators.required, Validators.min(0)]],

      discount: [item?.discount ?? 0],

      lineAmount: [item?.lineAmount ?? 0],

      remarks: [item?.remarks ?? ''],

      active: [item?.active ?? true],

      grnGstDtos: taxRows,

      batchDetails: [item?.batchDetails ?? []],
    });
  }
  private createBasicTaxRow(): FormGroup {
    const row = this.fb.group({
      grnGstId: [null],
      grnCd: [null],
      productCd: [null],
      taxName: ['BASIC'],
      taxRate: [0],
      taxAmount: [0],
    });

    row.disable();

    return row;
  }
  calculateTaxes(): void {
    this.itemRows.controls.forEach((itemRow) => {
      const productCd = itemRow.get('productCd')?.value;
      const grossAmount = Number(itemRow.get('lineAmount')?.value || 0);

      const gstRows = itemRow.get('grnGstDtos') as FormArray;

      if (!gstRows || !productCd || grossAmount <= 0) {
        return;
      }

      // Get existing GST rows
      const taxes = gstRows.controls
        .map((control) => control.value)
        .filter((tax) => tax.taxName !== 'BASIC' && tax.taxName !== 'ROUND OFF');

      // Total GST %
      const totalTaxRate = taxes.reduce((total, tax) => total + Number(tax.taxRate || 0), 0);

      // BASIC amount
      const basicAmount = this.round(grossAmount / (1 + totalTaxRate / 100), 2);

      // Update BASIC row
      const basicRow = gstRows.controls.find(
        (control) => control.get('taxName')?.value === 'BASIC',
      );

      if (basicRow) {
        basicRow.patchValue({
          productCd: productCd,
          taxRate: 0,
          taxAmount: basicAmount,
        });
      }

      // Update CGST / SGST / other taxes
      taxes.forEach((tax) => {
        const taxAmount = this.round((basicAmount * Number(tax.taxRate || 0)) / 100, 2);

        const taxRow = gstRows.controls.find(
          (control) => control.get('taxName')?.value === tax.taxName,
        );

        if (taxRow) {
          taxRow.patchValue({
            productCd: productCd,
            taxAmount: taxAmount,
          });
        }
      });

      // Calculate round off
      const totalTaxAmount = gstRows.controls
        .filter((control) => control.get('taxName')?.value !== 'ROUND OFF')
        .reduce((total, control) => total + Number(control.get('taxAmount')?.value || 0), 0);

      const roundOff = this.round(grossAmount - totalTaxAmount, 2);

      // Find existing ROUND OFF row
      const roundOffRow = gstRows.controls.find(
        (control) => control.get('taxName')?.value === 'ROUND OFF',
      );

      if (roundOff !== 0) {
        if (roundOffRow) {
          roundOffRow.patchValue({
            taxAmount: roundOff,
          });
        } else {
          gstRows.push(
            this.buildTaxRow({
              taxName: 'ROUND OFF',
              taxRate: 0,
              taxAmount: roundOff,
            }),
          );
        }
      } else if (roundOffRow) {
        const index = gstRows.controls.indexOf(roundOffRow);

        if (index !== -1) {
          gstRows.removeAt(index);
        }
      }
    });
  }
  private round(value: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
  private buildTaxRow(tax?: GrnGst) {
    return this.fb.group({
      grnGstId: [tax?.grnGstId ?? null],
      grnCd: [tax?.grnCd ?? null],
      taxName: [tax?.taxName ?? '', Validators.required],
      taxRate: [tax?.taxRate ?? 0, [Validators.required, Validators.min(0)]],
      taxAmount: [tax?.taxAmount ?? 0, [Validators.required]],
    });
  }

  taxRowsFor(itemIndex: number): FormArray {
    return this.itemRows.at(itemIndex).get('grnGstDtos') as FormArray;
  }

  addItemRow(): void {
    this.itemRows.push(this.buildItemRow());
    this.itemTableRows = [...this.itemRows.controls];
  }

  removeItemRow(index: number): void {
    this.itemRows.removeAt(index);
    if (this.expandedItemIndex() === index) this.expandedItemIndex.set(null);
  }

  addTaxRow(itemIndex: number): void {
    const taxRows = this.taxRowsFor(itemIndex);

    taxRows.push(this.buildTaxRow());

    // Refresh table datasource
    this.taxTableRows = [...taxRows.controls];

    console.log('Tax rows:', taxRows.value);
  }

  removeTaxRow(itemIndex: number, taxIndex: number): void {
    const taxRows = this.taxRowsFor(itemIndex);

    taxRows.removeAt(taxIndex);

    // Refresh table datasource
    this.taxTableRows = [...taxRows.controls];
  }
  toggleItemExpand(index: number): void {
    if (this.expandedItemIndex() === index) {
      this.expandedItemIndex.set(null);
      this.taxTableRows = [];
      return;
    }

    this.expandedItemIndex.set(index);

    const taxRows = this.taxRowsFor(index);
    this.taxTableRows = [...taxRows.controls];
  }
  calculateLineAmount(index: number): void {
    const row = this.itemRows.at(index);

    const qty = Number(row.get('qty')?.value) || 0;
    const purchaseRate = Number(row.get('purchaseRate')?.value) || 0;

    const lineAmount = qty * purchaseRate;

    row.get('lineAmount')?.setValue(Number(lineAmount.toFixed(2)), { emitEvent: false });
    this.calculateTaxes();
  }
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      Object.keys(this.form.controls).forEach((key) => {
        const control = this.form.get(key);

        if (control?.invalid) {
          console.log(`Field: ${key}`, 'Value:', control.value, 'Errors:', control.errors);
        }
      });
      return;
    }

    if (!this.validateTotalGrnAmount()) {
      return;
    }
    this.saving.set(true);
    const payload = this.form.getRawValue() as unknown as GrnHdr;
    this.grnService
      .save(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.router.navigate(['/admin/transaction/goods-receipt-note']),
      });
  }

  cancel(): void {
    this.router.navigate(['/admin/transaction/goods-receipt-note']);
  }

  openBatchDialog(itemIndex: number): void {
    const item = this.itemRows.at(itemIndex);

    const productCd = item.get('productCd')?.value;

    const product = this.products().find((p) => p.productCd === productCd);
    const productControl = item.get('productCd');

    if (!product) {
      productControl?.setErrors({ required: true });
      productControl?.markAsTouched();
      return;
    }
    const existingBatches: GrnBatchDtl[] = item.get('batchDetails')?.value ?? [];

    const dialogRef = this.dialog.open<GrnBatchDialog, GrnBatchDialogData, GrnBatchDtl[] | null>(
      GrnBatchDialog,
      {
        width: '1200px',
        maxWidth: '95vw',
        data: { productName: product.productName, existingBatches },
      },
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      item.patchValue({ batchDetails: result });
      const totalQty = result.reduce((sum, b) => sum + (b.batchQty ?? 0), 0);

      const totalAmount = result.reduce(
        (sum, b) => sum + (b.batchQty ?? 0) * (b.batchRate ?? 0),
        0,
      );

      const averageRate = totalQty > 0 ? totalAmount / totalQty : 0;

      item.patchValue({
        qty: totalQty,
        purchaseRate: Number(averageRate.toFixed(2)),
        lineAmount: Number(totalAmount.toFixed(2)),
      });
      this.calculateTaxes();
    });
  }

  hasBatches(itemIndex: number): boolean {
    const batches = this.itemRows.at(itemIndex).get('batchDetails')?.value;
    return !!batches?.length;
  }
  @ViewChild('totalAmountInput')
  totalAmountInput!: ElementRef<HTMLInputElement>;

  validateTotalGrnAmount(): boolean {
    let totalGrnAmount = 0;

    this.itemRows.controls.forEach((itemRow) => {
      const lineAmount = Number(itemRow.get('lineAmount')?.value || 0);

      totalGrnAmount += lineAmount;
    });

    totalGrnAmount = this.round(totalGrnAmount, 2);

    const totalAmount = this.round(Number(this.form.get('totalAmount')?.value || 0), 2);

    if (totalAmount !== totalGrnAmount) {
      alert(`Total Amount is ₹${totalGrnAmount.toFixed(2)}`);

      setTimeout(() => {
        const input = document.querySelector(
          'input[formControlName="totalAmount"]',
        ) as HTMLInputElement;

        input?.focus();
        input?.select();
      });

      return false;
    }

    return true;
  }
}
