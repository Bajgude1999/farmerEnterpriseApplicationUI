import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { SalesOrderService } from '../../shared/sales-order.service';
import { SalesOrder, SalesOrderDtl, SalesOrderGst } from '../../shared/sales-order.model';
import { UserMaster } from '../../../../models/user.model';
import { UserMasterService } from '../../shared/user-master.service';
import { MatDialog } from '@angular/material/dialog';
import { BatchDialog, BatchDialogData } from '../batch-dialog/batch-dialog';
import { SalesOrderBatchDtl } from '../../shared/sales-order.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { UnitService } from '../../shared/unit.service';
import { UnitOption } from '../../shared/unit.model';
import { ProductMaster } from '../../../../models/product.model';
import { ProductService } from '../../../../services/ product.service';

@Component({
  selector: 'app-sales-order',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    TranslatePipe,
    MatDatepickerModule,
  ],
  templateUrl: './sales-order.html',
  styleUrl: './sales-order.scss',
})
export class SalesOrderComponent implements OnInit {
  private fb = inject(FormBuilder);
  private salesOrderService = inject(SalesOrderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private userService = inject(UserMasterService);
  private dialog = inject(MatDialog);
  private unitService = inject(UnitService);
  private productService = inject(ProductService);
constructor(
  private cdr: ChangeDetectorRef
) {}

  units = signal<UnitOption[]>([]);
  products = signal<ProductMaster[]>([]);

  isEdit = signal(false);
  saving = signal(false);

  // Tracks which item row's tax sub-table is currently expanded, by index. null = none open.
  expandedItemIndex = signal<number | null>(null);

  itemColumns = [
    'productName',
    'packSize',
    'uomCd',
    'qty',
    'rate',
    'discount',
    'amount',
    'expand',
  ];
  taxColumns = ['taxName', 'taxRate', 'taxAmount'];

  paymentModes = ['COD', 'ONLINE', 'UPI', 'CARD'];
  orderStatuses = ['PLACED', 'PENDING', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'CANCELLED'];

  form = this.fb.nonNullable.group({
    orderCd: [null as number | null],
    orderNo: ['', Validators.required],
    userCd: [null as number | null, Validators.required],
    paymentMode: ['', Validators.required],
    deliveryAddress: ['', Validators.required],
    mobileNo: ['', [Validators.required, Validators.pattern(/^[6-9][0-9]{9}$/)]],
    email: [''],
    grossAmount: [0, Validators.required],
    discountAmount: [0],
    netAmount: [0, Validators.required],
    orderStatus: ['PENDING', Validators.required],
    invoiceNo: [''],
    invoiceDate: [''],
    orderDate: [''],
    items: this.fb.array([]),
  });

  get itemRows(): FormArray {
    return this.form.controls.items as FormArray;
  }

  ngOnInit(): void {
    this.unitService.getAll().subscribe((u) => this.units.set(u));
    this.loadCustomers();
    this.productService.getAll().subscribe({
      next: (result: ProductMaster[]) => {
        this.products.set(result);
        //  this.loading.set(false);
      },
      error: () => {
        //  this.loading.set(false);
      },
    });

    const orderCd = this.route.snapshot.paramMap.get('id');
    if (orderCd) {
      this.isEdit.set(true);
      this.loadOrder(Number(orderCd));
    }
  }
  taxTableRows: any[] = [];
  itemTableRows: any[] = [];
  users: UserMaster[] = [];
  loadCustomers(): void {
    this.userService.getAll().subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
      },
    });
  }
  private loadOrder(orderCd: number): void {
    this.salesOrderService.getById(orderCd).subscribe((order) => {
      this.form.patchValue(order);
      this.itemRows.clear();
      (order.items ?? []).forEach((item) => this.itemRows.push(this.buildItemRow(item)));
      this.itemTableRows = [...this.itemRows.controls];
    });
  }

  private buildItemRow(item?: SalesOrderDtl) {
      const taxRows = this.fb.array(
      item?.taxes?.length
        ? item.taxes.map((tax) => this.buildTaxRow(tax))
        : [this.createBasicTaxRow()],
    );
    return this.fb.group({
      orderDtlCd: [item?.orderDtlCd ?? null],
      orderCd: [item?.orderCd ?? this.form.controls.orderCd.value],

      productCd: [item?.productCd ?? null, Validators.required],

      productName: [item?.productName ?? '', Validators.required],

      packSize: [item?.packSize ?? 1],

      uomCd: [item?.uomCd ?? ''],

      qty: [item?.qty ?? 1, [Validators.required, Validators.min(1)]],

      rate: [item?.rate ?? 0, [Validators.required, Validators.min(0)]],

      discount: [item?.discount ?? 0],

      amount: [item?.amount ?? 0],

      active: [item?.active ?? true],

      taxes:taxRows,
      batchDetails: [item?.batchDetails ?? []],
    });
  }
  private createBasicTaxRow(): FormGroup {
  const row = this.fb.group({
    salesOrderGstId: [null],
    orderdtlcd: [null],
    taxName: ['BASIC'],
    taxRate: [0],
    taxAmount: [0],
  });

  row.disable();

  return row;
}

private buildTaxRow(tax?: SalesOrderGst): FormGroup {
  return this.fb.group({
    salesOrderGstId: [tax?.salesOrderGstId ?? null],

    orderdtlcd: [tax?.orderdtlcd ?? null],

    taxName: [tax?.taxName ?? '', Validators.required],

    taxRate: [
      tax?.taxRate ?? 0,
      [Validators.required, Validators.min(0)]
    ],

    taxAmount: [
      tax?.taxAmount ?? 0,
      [Validators.required, Validators.min(0)]
    ],
  });
}
  taxRowsFor(itemIndex: number): FormArray {
    return this.itemRows.at(itemIndex).get('taxes') as FormArray;
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
    this.taxRowsFor(itemIndex).removeAt(taxIndex);
  }

  // Clicking a line-item row toggles its tax sub-table open/closed.
  toggleItemExpand(index: number): void {
    this.expandedItemIndex.set(this.expandedItemIndex() === index ? null : index);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const payload = this.form.getRawValue() as unknown as SalesOrder;

    if (this.isEdit()) {
      this.salesOrderService
        .update(payload)
        .pipe(finalize(() => this.saving.set(false)))
        .subscribe({
          next: () => {
            this.router.navigate(['/admin/transaction/sales-order']);
          },
          error: (error) => {
            console.error('Error saving sales order:', error);
          },
        });
    } else {
      this.salesOrderService
        .save(payload)
        .pipe(finalize(() => this.saving.set(false)))
        .subscribe({
          next: () => {
            this.router.navigate(['/admin/transaction/sales-order']);
          },
          error: (error) => {
            console.error('Error saving sales order:', error);
          },
        });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/transaction/sales-order']);
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
 openBatchDialog(itemIndex: number): void {
  const item = this.itemRows.at(itemIndex);

  const productCd = item.get('productCd')?.value;

  const existingBatches: SalesOrderBatchDtl[] =
    item.get('batchDetails')?.value ?? [];

  const product = this.products().find(
    (p) => p.productCd === productCd
  );

  const productControl = item.get('productCd');

  // Product is not selected / not found
  if (!product) {
    productControl?.setErrors({ required: true });
    productControl?.markAsTouched();
    return;
  }

  // At this point product is guaranteed to exist
  const productName = product.productName;

  const dialogRef = this.dialog.open<
    BatchDialog,
    BatchDialogData,
    SalesOrderBatchDtl[] | null
  >(BatchDialog, {
    width: '1500px',
     maxWidth: '95vw',
    data: {
      productName,
      productCd,
      existingBatches
    }
  });

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
        rate: Number(averageRate.toFixed(2)),
        amount: Number(totalAmount.toFixed(2)),
      });
      this.calculateTaxes();
    });
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

  hasBatches(itemIndex: number): boolean {
    const batches = this.itemRows.at(itemIndex).get('batchDetails')?.value;
    return !!batches?.length;
  }
   calculateAmount(index: number): void {
    const row = this.itemRows.at(index);

    const qty = Number(row.get('qty')?.value) || 0;
    const purchaseRate = Number(row.get('purchaseRate')?.value) || 0;

    const lineAmount = qty * purchaseRate;

    row.get('lineAmount')?.setValue(Number(lineAmount.toFixed(2)), { emitEvent: false });
    this.calculateTaxes();
  }
  
  private round(value: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}
