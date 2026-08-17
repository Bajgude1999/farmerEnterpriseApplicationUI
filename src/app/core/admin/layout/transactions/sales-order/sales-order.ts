import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
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
import { ProductMaster, WhMaster } from '../../../../models/product.model';
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
  constructor(private cdr: ChangeDetectorRef) {}

  units = signal<UnitOption[]>([]);
  products = signal<ProductMaster[]>([]);

  isEdit = signal(false);
  saving = signal(false);

  // Tracks which item row's tax sub-table is currently expanded, by index. null = none open.
  expandedItemIndex = signal<number | null>(null);

  itemColumns = ['productName', 'packSize', 'uomCd', 'qty', 'rate', 'discount', 'amount', 'expand'];
  taxColumns = ['taxName', 'taxRate', 'taxAmount'];
  taxNameOptions: string[] = ['BASIC', 'ROUND OFF', 'FREIGHT', 'SGST', 'CGST', 'IGST', 'CESS'];

  warehouses = signal<WhMaster[]>([]);
  paymentModes = ['COD', 'ONLINE', 'UPI', 'CARD'];
  orderStatuses = [
    'PENDING',
    'PLACED',
    'CONFIRMED',
    'PACKED',
    'OUT FOR DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
  ];
  showPrintButton = false;
  form = this.fb.nonNullable.group({
    orderCd: [null as number | null],
    orderNo: [{ value: '', disabled: true }],
    userCd: [null as number | null, Validators.required],
    paymentMode: ['', Validators.required],
    deliveryAddress: ['', Validators.required],
    mobileNo: ['', [Validators.required, Validators.pattern(/^[6-9][0-9]{9}$/)]],
    email: [''],
    grossAmount: [0, Validators.required],
    discountAmount: [0],
    netAmount: [0, Validators.required],
    orderStatus: ['PENDING', Validators.required],
    invoiceNo: [{ value: '', disabled: true }],
    invoiceDate: [{ value: '', disabled: true }],
    orderDate: [''],
    whCd: ['', Validators.required],
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
    this.productService.getAllWh().subscribe({
      next: (result: WhMaster[]) => {
        this.warehouses.set(result);
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
  selectedItemRow: FormGroup | null = null;
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
      if (order.invoiceNo) {
        this.showPrintButton = true;
      }
      this.itemRows.clear();
      (order.items ?? []).forEach((item) => this.itemRows.push(this.buildItemRow(item)));
      this.itemTableRows = [...this.itemRows.controls];
    });
  }
  selectItemRow(row: FormGroup): void {
    this.selectedItemRow = row;
    this.taxTableRows = [...(row.get('taxes') as FormArray).controls];
    console.log('Selected item:', row.value);
    console.log('Selected taxes:', row.get('taxes')?.value);
  }
  getSelectedItemTaxes(index: number): FormArray {
    return this.itemTableRows.at(index).get('taxes') as FormArray;
  }
  private buildItemRow(item?: SalesOrderDtl) {
    const taxRows = this.fb.array(
      item?.taxes?.length
        ? item.taxes.map((tax) => this.buildTaxRow(tax))
        : [this.createBasicTaxRow()],
    );
    console.log('taxrpws', taxRows);
    return this.fb.group({
      orderDtlCd: [item?.orderDtlCd ?? null],
      orderCd: [item?.orderCd ?? this.form.controls.orderCd.value],

      productCd: [item?.productCd ?? null, Validators.required],

      productName: [item?.productName ?? ''],

      packSize: [item?.packSize ?? 1],

      uomCd: [item?.uomCd ?? ''],

      qty: [item?.qty ?? 1, [Validators.required, Validators.min(1)]],

      rate: [item?.rate ?? 0, [Validators.required, Validators.min(0)]],

      discount: [item?.discount ?? 0],

      amount: [item?.amount ?? 0],

      active: [item?.active ?? true],

      taxes: taxRows,
      batchDetails: [item?.batchDetails ?? []],
    });
  }
  onSelectCustomer(userId: number): void {
    console.log('Selected Customer ID:', userId);
    const user = this.users.find((u) => u.userId === userId);
    const address = user?.address;
    this.form.patchValue({
      mobileNo: user?.mobNo,
      email: user?.email,
      deliveryAddress: address,
    });
    // your logic here
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

      taxRate: [tax?.taxRate ?? 0, [Validators.required, Validators.min(0)]],

      taxAmount: [tax?.taxAmount ?? 0, [Validators.required]],
    });
  }
  taxRowsFor(itemIndex: number): FormArray {
    return this.itemRows.at(itemIndex).get('taxes') as FormArray;
  }

  addItemRow(): void {
    const newItemRow = this.buildItemRow();

    this.itemRows.push(newItemRow);
    this.itemTableRows = [...this.itemRows.controls];

    this.selectItemRow(newItemRow);
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
    this.getSelectedItemTaxes(itemIndex);
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
      console.log('FORM STATUS:', this.form.status);
      console.log('FORM ERRORS:', this.form.errors);

      Object.keys(this.form.controls).forEach((key) => {
        const control = this.form.get(key);

        console.log(
          key,
          'status:',
          control?.status,
          'value:',
          control?.value,
          'errors:',
          control?.errors,
        );
      });
      return;
    }
    this.calculateBasicTax();
    if (!this.validateTotalSalesOrderAmount()) {
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
            this.router.navigate(['/admin/transaction/sales-order-list']);
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
      const grossAmount = Number(itemRow.get('amount')?.value || 0);

      const gstRows = itemRow.get('taxes') as FormArray;

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

    const existingBatches: SalesOrderBatchDtl[] = item.get('batchDetails')?.value ?? [];
    const discount = item.get('discount')?.value ?? 0;
    const product = this.products().find((p) => p.productCd === productCd);

    const productControl = item.get('productCd');

    // Product is not selected / not found
    if (!product) {
      productControl?.setErrors({ required: true });
      productControl?.markAsTouched();
      return;
    }

    // At this point product is guaranteed to exist
    const productName = product.productName;

    const dialogRef = this.dialog.open<BatchDialog, BatchDialogData, SalesOrderBatchDtl[] | null>(
      BatchDialog,
      {
        width: '1500px',
        maxWidth: '95vw',
        data: {
          productName,
          productCd,
          existingBatches,
          discount,
        },
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
      const discount = result[0].discount;
      item.patchValue({
        qty: totalQty,
        rate: Number(averageRate.toFixed(2)),
        amount: Number(totalAmount.toFixed(2)),
        discount: discount,
      });
      this.calculateTaxes();
    });
  }

  @ViewChild('totalAmountInput')
  totalAmountInput!: ElementRef<HTMLInputElement>;

  validateTotalSalesOrderAmount(): boolean {
    let totaSalesOrderAmount = 0;

    this.itemRows.controls.forEach((itemRow) => {
      const amount = Number(itemRow.get('amount')?.value || 0);

      totaSalesOrderAmount += amount;
    });

    totaSalesOrderAmount = this.round(totaSalesOrderAmount, 2);

    const totalAmount = this.round(Number(this.form.get('grossAmount')?.value || 0), 2);

    if (totalAmount !== totaSalesOrderAmount) {
      alert(`Total Amount is ₹${totaSalesOrderAmount.toFixed(2)}`);

      setTimeout(() => {
        const input = document.querySelector(
          'input[formControlName="grossAmount"]',
        ) as HTMLInputElement;

        input?.focus();
        input?.select();
      });

      return false;
    }

    return true;
  }
  calculateBasicTax(): void {
    let totalBasicTax = 0;
    let totalDiscount = 0;

    this.itemRows.controls.forEach((item) => {
      // Calculate BASIC tax
      const taxes = item.get('taxes') as FormArray;

      taxes?.controls.forEach((tax) => {
        if (tax.get('taxName')?.value === 'BASIC') {
          totalBasicTax += Number(tax.get('taxAmount')?.value || 0);
        }
      });

      // Calculate discount
      totalDiscount += Number(item.get('discount')?.value || 0);
    });

    this.form.patchValue({
      netAmount: totalBasicTax,
      discountAmount: totalDiscount,
    });
  }
  hasBatches(itemIndex: number): boolean {
    const batches = this.itemRows.at(itemIndex).get('batchDetails')?.value;
    return !!batches?.length;
  }
  calculateAmount(index: number): void {
    const row = this.itemRows.at(index);

    const qty = Number(row.get('qty')?.value) || 0;
    const purchaseRate = Number(row.get('purchaseRate')?.value) || 0;

    const amount = qty * purchaseRate;

    row.get('amount')?.setValue(Number(amount.toFixed(2)), { emitEvent: false });
    this.calculateTaxes();
  }

  private round(value: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
  printInvoice(): void {
    const formValue = this.form.getRawValue();
    const logoUrl = `${window.location.origin}/assets/images/logo.png`;
    const customerName = this.users.find((u: any) => u.userId === formValue.userCd)?.fullName || '';

    const warehouseName =
      this.warehouses().find((w: any) => w.whCd === formValue.whCd)?.whName || '';

    const items = this.itemRows.controls;

   const itemRows = items.map((row: any, index: number) => {

  const productCd = row.get('productCd')?.value;

  const productName =
    this.products().find(
      (p: any) => p.productCd === productCd
    )?.productName || '';

  const unitName =
    this.units().find(
      (u: any) => u.unitCd === row.get('uomCd')?.value
    )?.unitName || '';

  const qty = row.get('qty')?.value || 0;
  const rate = row.get('rate')?.value || 0;
  const discount = row.get('discount')?.value || 0;
  const amount = row.get('amount')?.value || 0;
  const packSize = row.get('packSize')?.value || '';

  // Batch details
  const batchNo = row.get('batchNo')?.value || '';
  const expiryDate = row.get('expiryDate')?.value || '';
  const hsnCode = row.get('hsnCode')?.value || '';

  // GST details
  const gstRate = row.get('gstRate')?.value || 0;
  const taxableValue = row.get('taxableValue')?.value || 0;
  const cgst = row.get('cgst')?.value || 0;
  const igst = row.get('igst')?.value || 0;

  return `
    <tr>

      <td class="center">
        ${index + 1}
      </td>

      <td>
        ${productName}
      </td>

      <td>
        ${batchNo}
      </td>

      <td class="center">
        ${expiryDate}
      </td>

      <td class="center">
        ${hsnCode}
      </td>

      <td class="center">
        ${packSize} ${unitName}
      </td>

      <td class="center">
        ${qty}
      </td>

      <td class="right">
        ${Number(rate).toFixed(2)}
      </td>

      <td class="center">
        ${Number(gstRate).toFixed(2)}%
      </td>

      <td class="right">
        ${Number(taxableValue).toFixed(2)}
      </td>

      <td class="right">
        ${Number(cgst).toFixed(2)}
      </td>

      <td class="right">
        ${Number(igst).toFixed(2)}
      </td>

      <td class="right">
        ${Number(discount).toFixed(2)}
      </td>

      <td class="right">
        ${Number(amount).toFixed(2)}
      </td>

    </tr>
  `;
}).join('');
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
      alert('Please allow popups to print the invoice.');
      return;
    }

    printWindow.document.open();

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>

      <title>Invoice - ${formValue.invoiceNo || formValue.orderNo || ''}</title>

      <style>

        @page {
          size: A4;
          margin: 10mm;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #fff;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          color: #000;
        }

        .invoice {
          width: 190mm;
          min-height: 277mm;
          margin: 0 auto;
          padding: 0;
        }

        /* HEADER */

     .header {
  border: 1px solid #000;
  padding: 8px 10px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 65px;
}

.header-details {
  flex: 1;
  text-align: center;
}

.header-details h1 {
  margin: 0 0 5px 0;
  font-size: 22px;
  font-weight: bold;
}

.header-details p {
  margin: 0;
  font-size: 10px;
  line-height: 14px;
}

.header-logo {
  width: 70px;
  height: 65px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 10px;
}

.header-logo img {
  max-width: 65px;
  max-height: 60px;
  object-fit: contain;
}

        /* TITLE */

        .invoice-title {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          padding: 8px;
          border-left: 1px solid #000;
          border-right: 1px solid #000;
          border-bottom: 1px solid #000;
        }

        /* DETAILS */

        .details-table {
          width: 100%;
          border-collapse: collapse;
        }

        .details-table td {
          border: 1px solid #000;
          padding: 6px;
          vertical-align: top;
        }

        .label {
          font-weight: bold;
        }

        /* ITEMS */

        .items-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  table-layout: fixed;
}

.items-table th,
.items-table td {
  border: 1px solid #000;
  padding: 4px 3px;
  font-size: 8px;
  word-wrap: break-word;
}

.items-table th {
  text-align: center;
  font-weight: bold;
  background: #f2f2f2;
  font-size: 8px;
}

.items-table .center {
  text-align: center;
}

.items-table .right {
  text-align: right;
}

        /* TOTAL */

        .total-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        .total-table td {
          border: 1px solid #000;
          padding: 7px;
        }

        .total-label {
          text-align: right;
          font-weight: bold;
        }

        .net-total {
          font-size: 14px;
          font-weight: bold;
        }

        /* FOOTER */

        .footer {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
        }

        .signature {
          width: 180px;
          text-align: center;
          padding-top: 35px;
          border-top: 1px solid #000;
        }

        @media print {

          body {
            margin: 0;
          }

          .invoice {
            width: 190mm;
            min-height: 277mm;
          }

        }

      </style>

    </head>

    <body>

      <div class="invoice">

        <!-- HEADER -->

        <div class="header">

  <div class="header-content">

    <div class="header-details">
      <h1>VELNEXA</h1>

      <p>
        H-1453 Charholi Kh, Chakan, Tal Khed, Junnar,
        Pune, Maharashtra 410502
      </p>
    </div>

    <div class="header-logo">
      <img src="${logoUrl}" alt="VELNEXA" />
    </div>

  </div>

</div>

        <div class="invoice-title">
          TAX INVOICE
        </div>


        <!-- CUSTOMER / INVOICE DETAILS -->

        <table class="details-table">

          <tr>

            <td>
              <span class="label">Invoice No:</span>
              ${formValue.invoiceNo || ''}
            </td>

            <td>
              <span class="label">Invoice Date:</span>
              ${
                formValue.invoiceDate
                  ? new Date(formValue.invoiceDate).toLocaleDateString('en-IN')
                  : ''
              }
            </td>

          </tr>

          <tr>

            <td>
              <span class="label">Order No:</span>
              ${formValue.orderNo || ''}
            </td>

            <td>
              <span class="label">Payment Mode:</span>
              ${formValue.paymentMode || ''}
            </td>

          </tr>

          <tr>

            <td>
              <span class="label">Customer:</span>
              ${customerName}
            </td>

            <td>
              <span class="label">Mobile:</span>
              ${formValue.mobileNo || ''}
            </td>

          </tr>

          <tr>

            <td>
              <span class="label">Email:</span>
              ${formValue.email || ''}
            </td>

            <td>
              <span class="label">Warehouse:</span>
              ${warehouseName}
            </td>

          </tr>

          <tr>

            <td colspan="2">
              <span class="label">Delivery Address:</span>
              ${formValue.deliveryAddress || ''}
            </td>

          </tr>

        </table>


        <!-- ITEMS -->

       <table class="items-table">

  <thead>
    <tr>

      <th>Sr.</th>

      <th>Product</th>

      <th>Batch No</th>

      <th>Expiry Date</th>

      <th>HSN Code</th>

      <th>Pack Size / UOM</th>

      <th>Qty</th>

      <th>Rate</th>

      <th>GST Rate %</th>

      <th>Taxable Value</th>

      <th>CGST</th>

      <th>IGST</th>

      <th>Discount</th>

      <th>Amount</th>

    </tr>
  </thead>

  <tbody>

    ${itemRows}

  </tbody>

</table>


        <!-- TOTAL -->

        <table class="total-table">

          <tr>
            <td class="total-label">
              Gross Amount
            </td>

            <td class="right">
              ₹ ${Number(formValue.grossAmount || 0).toFixed(2)}
            </td>
          </tr>

          <tr>
            <td class="total-label">
              Discount
            </td>

            <td class="right">
              ₹ ${Number(formValue.discountAmount || 0).toFixed(2)}
            </td>
          </tr>

          <tr>
            <td class="total-label net-total">
              Net Amount
            </td>

            <td class="right net-total">
              ₹ ${Number(formValue.netAmount || 0).toFixed(2)}
            </td>
          </tr>

        </table>


        <!-- FOOTER -->

        <div class="footer">

          <div>
            <strong>Payment Mode:</strong>
            ${formValue.paymentMode || ''}
          </div>

          <div class="signature">
            Authorized Signature
          </div>

        </div>

      </div>


      <script>

        window.onload = function() {

          setTimeout(function() {

            window.print();

          }, 300);

        };

      </script>

    </body>
    </html>
  `);

    printWindow.document.close();
  }
}
