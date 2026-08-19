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
import { SalesOrder, SalesOrderDtl, SalesOrderGst } from '../../../../models/sales-order.model';
import { UserMaster } from '../../../../models/user.model';
import { UserMasterService } from '../../shared/user-master.service';
import { MatDialog } from '@angular/material/dialog';
import { BatchDialog, BatchDialogData } from '../batch-dialog/batch-dialog';
import { SalesOrderBatchDtl } from '../../../../models/sales-order.model';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { UnitService } from '../../shared/unit.service';
import { UnitOption } from '../../../../models/unit.model';
import { ProductMaster, WhMaster } from '../../../../models/product.model';
import { ProductService } from '../../../../services/ product.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateService } from '@ngx-translate/core';

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
  private translate = inject(TranslateService);

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
  showMessageButton = false;

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
    upiPayment:[null as number | null],
    upipaymentRef:[''],
    shipingCharges:[null as number | null],
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
      if(order.orderStatus!='PENDING'){
        this.showMessageButton=true;
      }
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


callCustomer(): void {
          const order = this.form.getRawValue() as unknown as SalesOrder;

  const mobile = order.mobileNo;
  if (!mobile) return;
  window.location.href = `tel:${mobile}`;
}

whatsappCustomer(): void {
        const order = this.form.getRawValue() as unknown as SalesOrder;

  const mobile = order.mobileNo;
  if (!mobile) return;

  const message = this.buildOrderMessage(order);
  const digitsOnly = mobile.replace(/\D/g, '');
  const phoneWithCountryCode = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;

  window.open(`https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(message)}`, '_blank');
}

smsCustomer(): void {
      const order = this.form.getRawValue() as unknown as SalesOrder;

  const mobile =order.mobileNo;
  if (!mobile) return;

  const message = this.buildOrderMessage(order);
  // Body is pre-filled only — sending itself stays manual, the user taps Send in their SMS app.
  window.location.href = `sms:${mobile}?body=${encodeURIComponent(message)}`;
}
private buildOrderMessage(order: SalesOrder): string {

  const itemLines = (order.items ?? [])
    .map((item: any) => {

      // Find matching unit from signal
      const unit = this.units().find(
        (u: UnitOption) =>
          String(u.unitCd) === String(item.uomCd)
      );

      const unitName = unit?.unitName ?? '';

      // Example: 1 Litre
      const packInfo = [
        item.packSize,
        unitName
      ]
        .filter(
          value =>
            value !== null &&
            value !== undefined &&
            value !== ''
        )
        .join(' ');

      return `${item.productName}${packInfo ? ' (' + packInfo + ')' : ''} — Qty: ${item.qty} x ₹${item.rate} = ₹${item.amount}`;
    })
    .join('\n');

  // Normalize status
  const status = String(order.orderStatus ?? '')
    .trim()
    .toUpperCase();

  // Select translation key based on order status
  let messageKey = 'WHATSAPP_MESSAGE';

  switch (status) {

    case 'PLACED':
      messageKey = 'WHATSAPP_ORDER_PLACED';
      break;

    case 'CONFIRMED':
      messageKey = 'WHATSAPP_ORDER_CONFIRMED';
      break;

    case 'PACKED':
      messageKey = 'WHATSAPP_ORDER_PACKED';
      break;

    case 'OUT FOR DELIVERY':
      messageKey = 'WHATSAPP_ORDER_OUT_FOR_DELIVERY';
      break;

    case 'DELIVERED':
      messageKey = 'WHATSAPP_ORDER_DELIVERED';
      break;

    case 'CANCELLED':
      messageKey = 'WHATSAPP_ORDER_CANCELLED';
      break;

    case 'RETURNED':
      messageKey = 'WHATSAPP_ORDER_RETURNED';
      break;

    default:
      messageKey = 'WHATSAPP_MESSAGE';
      break;
  }

  return this.translate.instant(messageKey, {
    orderNo: order.orderNo,
    items: itemLines,
    total: order.grossAmount
  });
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
    // const shipingCharges=Number(this.form.get('grossAmount')?.value || 0);
    // totaSalesOrderAmount=totaSalesOrderAmount+shipingCharges;
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

  // ============================================================
  // LOGO
  // ============================================================

  const logoUrl =
    `${window.location.origin}/assets/images/logo.png`;


  // ============================================================
  // CUSTOMER
  // ============================================================

  const customer = this.users.find(
    (u: any) =>
      u.userId === formValue.userCd
  );


  // ============================================================
  // WAREHOUSE
  // warehouses is WritableSignal, therefore use ()
  // ============================================================

  const whMObj = this.warehouses().find(
    (w: any) =>
      w.whCd === formValue.whCd
  );


  // ============================================================
  // PHONE
  // ============================================================

  const phone =
    customer?.mobNo
      ? `${customer.mobNo}${
          customer?.optionalMobNo
            ? ' / ' + customer.optionalMobNo
            : ''
        }`
      : customer?.optionalMobNo || '';


  // ============================================================
  // INVOICE DATE
  // ============================================================

  const invoiceDate =
    formValue.invoiceDate
      ? new Date(
          formValue.invoiceDate
        ).toLocaleDateString('en-IN')
      : '';


  // ============================================================
  // FORM TOTALS
  // ============================================================

  const grossAmount =
    Number(
      formValue.grossAmount || 0
    );

  const discountAmount =
    Number(
      formValue.discountAmount || 0
    );

  const upiPayment =
    Number(
      formValue.upiPayment || 0
    );

  const netAmount =
    Number(
      formValue.netAmount || 0
    );


  // ============================================================
  // SHIPPING CHARGES
  // ============================================================

  const shippingCharges =
    Number(
      formValue.shipingCharges || 0
    );


  // ============================================================
  // ITEMS
  // ============================================================

  const items =
    this.itemRows.controls;


  // ============================================================
  // ROUND OFF
  //
  // Sum all tax rows where taxName = ROUND OFF
  // ============================================================

  let roundOff = 0;

  items.forEach(
    (row: any) => {

      const taxes =
        row.get('taxes')?.value || [];


      taxes.forEach(
        (tax: any) => {

          const taxName =
            String(
              tax.taxName || ''
            )
              .trim()
              .toUpperCase();


          if (
            taxName === 'ROUND OFF'
          ) {

            roundOff += Number(
              tax.taxAmount || 0
            );

          }

        }
      );

    }
  );


  // ============================================================
  // ITEM ROWS FOR TAX INVOICE
  // ============================================================

  const itemRows =
    items
      .map(
        (
          row: any,
          index: number
        ) => {


          // ==================================================
          // PRODUCT
          // ==================================================

          const productCd =
            row.get(
              'productCd'
            )?.value;


          const product =
            this.products().find(
              (p: any) =>
                p.productCd ===
                productCd
            );


          const productName =
            product?.productName || '';


          const hsnCode =
            product?.hsnCode || '';


          // ==================================================
          // ITEM VALUES
          // ==================================================

          const qty =
            Number(
              row.get(
                'qty'
              )?.value || 0
            );


          const rate =
            Number(
              row.get(
                'rate'
              )?.value || 0
            );


          const amount =
            Number(
              row.get(
                'amount'
              )?.value || 0
            );


          const discount =
            Number(
              row.get(
                'discount'
              )?.value || 0
            );


          // ==================================================
          // TAXES
          // ==================================================

          const taxes =
            row.get(
              'taxes'
            )?.value || [];


          // ==================================================
          // CGST
          // ==================================================

          const cgstTax =
            taxes.find(
              (tax: any) =>
                String(
                  tax.taxName || ''
                )
                  .trim()
                  .toUpperCase() ===
                'CGST'
            );


          // ==================================================
          // SGST
          // ==================================================

          const sgstTax =
            taxes.find(
              (tax: any) =>
                String(
                  tax.taxName || ''
                )
                  .trim()
                  .toUpperCase() ===
                'SGST'
            );


          // ==================================================
          // IGST
          // ==================================================

          const igstTax =
            taxes.find(
              (tax: any) =>
                String(
                  tax.taxName || ''
                )
                  .trim()
                  .toUpperCase() ===
                'IGST'
            );


          // ==================================================
          // TAX RATES
          // ==================================================

          const cgstRate =
            Number(
              cgstTax?.taxRate || 0
            );


          const sgstRate =
            Number(
              sgstTax?.taxRate || 0
            );


          const igstRate =
            Number(
              igstTax?.taxRate || 0
            );


          // ==================================================
          // GST RATE
          // ==================================================

          const gstRate =
            (
              cgstTax ||
              sgstTax
            )
              ? cgstRate + sgstRate
              : igstRate;


          // ==================================================
          // TAX AMOUNTS
          // ==================================================

          const cgst =
            Number(
              cgstTax?.taxAmount || 0
            );


          const sgst =
            Number(
              sgstTax?.taxAmount || 0
            );


          const igst =
            Number(
              igstTax?.taxAmount || 0
            );


          // ==================================================
          // TAXABLE VALUE
          //
          // Amount is GST inclusive.
          // ==================================================

          const taxableValue =
            gstRate > 0
              ? amount /
                (
                  1 +
                  gstRate / 100
                )
              : amount;


          // ==================================================
          // BATCH DETAILS
          // ==================================================

          const batchDetails =
            row.get(
              'batchDetails'
            )?.value || [];


          // ==================================================
          // FALLBACK BATCH
          // ==================================================

          const batches =
            batchDetails.length > 0
              ? batchDetails
              : [
                  {
                    batchNo:
                      row.get(
                        'batchNo'
                      )?.value || '',

                    expiryDate:
                      row.get(
                        'expiryDate'
                      )?.value || '',

                    batchQty:
                      qty,

                    packSize:
                      row.get(
                        'packSize'
                      )?.value || '',

                    unitCd:
                      row.get(
                        'uomCd'
                      )?.value || ''
                  }
                ];


          // ==================================================
          // PRINT EACH BATCH
          // ==================================================

          return batches
            .map(
              (
                batch: any,
                batchIndex: number
              ) => {

                const isFirstBatch =
                  batchIndex === 0;


                // ============================================
                // BATCH QTY
                // ============================================

                const batchQty =
                  Number(
                    batch.batchQty ??
                    batch.qty ??
                    0
                  );


                // ============================================
                // UNIT
                // ============================================

                const batchUnitName =
                  this.units().find(
                    (u: any) =>
                      u.unitCd ===
                      batch.unitCd
                  )?.unitName || '';


                // ============================================
                // PACK SIZE / UOM
                // ============================================

                const packUom =
                  batch.packSize !== null &&
                  batch.packSize !== undefined &&
                  batch.packSize !== ''
                    ? `${batch.packSize} ${batchUnitName}`
                    : batchUnitName;


                // ============================================
                // ROW
                // ============================================

                return `

                  <tr>

                    <td class="center">
                      ${
                        isFirstBatch
                          ? index + 1
                          : ''
                      }
                    </td>


                    <td class="product-name">
                      ${
                        isFirstBatch
                          ? productName
                          : ''
                      }
                    </td>


                    <td class="center">
                      ${
                        batch.batchNo || ''
                      }
                    </td>


                    <td class="center">
                      ${
                        batch.expiryDate || ''
                      }
                    </td>


                    <td class="center">
                      ${
                        isFirstBatch
                          ? hsnCode
                          : ''
                      }
                    </td>


                    <td class="center">
                      ${packUom}
                    </td>


                    <td class="center">
                      ${batchQty}
                    </td>


                    <td class="right">
                      ${
                        isFirstBatch
                          ? rate.toFixed(2)
                          : ''
                      }
                    </td>


                    <td class="center">
                      ${
                        isFirstBatch
                          ? gstRate.toFixed(2) + '%'
                          : ''
                      }
                    </td>


                    <td class="right">
                      ${
                        isFirstBatch
                          ? taxableValue.toFixed(2)
                          : ''
                      }
                    </td>


                    <td class="right">
                      ${
                        isFirstBatch
                          ? cgst.toFixed(2)
                          : ''
                      }
                    </td>


                    <td class="right">
                      ${
                        isFirstBatch
                          ? sgst.toFixed(2)
                          : ''
                      }
                    </td>


                    <td class="right">
                      ${
                        isFirstBatch
                          ? discount.toFixed(2)
                          : ''
                      }
                    </td>


                    <td class="right">
                      ${
                        isFirstBatch
                          ? amount.toFixed(2)
                          : ''
                      }
                    </td>

                  </tr>

                `;

              }
            )
            .join('');

        }
      )
      .join('');


  // ============================================================
  // SECOND BOX PRODUCTS
  //
  // One row per product
  // ============================================================

  const deliveryProductRows =
    items
      .map(
        (row: any) => {

          const productCd =
            row.get(
              'productCd'
            )?.value;


          const product =
            this.products().find(
              (p: any) =>
                p.productCd ===
                productCd
            );


          const productName =
            product?.productName || '-';


          const qty =
            Number(
              row.get(
                'qty'
              )?.value || 0
            );


          const rate =
            Number(
              row.get(
                'rate'
              )?.value || 0
            );


          const amount =
            Number(
              row.get(
                'amount'
              )?.value || 0
            );


          return `

            <tr>

              <td class="slip-product-name">
                ${productName}
              </td>

              <td class="center">
                ${qty}
              </td>

              <td class="right">
                ${rate.toFixed(2)}
              </td>

              <td class="right">
                ${amount.toFixed(2)}
              </td>

            </tr>

          `;

        }
      )
      .join('');


  // ============================================================
  // OPEN PRINT WINDOW
  // ============================================================

  const printWindow =
    window.open(
      '',
      '_blank',
      'width=900,height=700'
    );


  if (!printWindow) {

    alert(
      'Please allow popups to print the invoice.'
    );

    return;
  }


  printWindow.document.open();


  // ============================================================
  // PRINT HTML
  // ============================================================

  printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<title>
  Invoice -
  ${
    formValue.invoiceNo ||
    formValue.orderNo ||
    ''
  }
</title>


<style>

/* ============================================================
   PAGE
============================================================ */

@page {

  size: A4;

  margin: 8mm;

}


* {

  box-sizing: border-box;

}


html,
body {

  margin: 0;

  padding: 0;

  background: #fff;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  font-size: 10px;

  color: #000;

}


body {

  width: 100%;

}


/* ============================================================
   COMMON A4 WIDTH
============================================================ */

.invoice,
.delivery-slip-wrapper {

  width: 100%;

  max-width: 194mm;

  margin-left: auto;

  margin-right: auto;

}


/* ============================================================
   HEADER
============================================================ */

.header {

  border: 1px solid #000;

  padding: 6px 8px;

}


.header-content {

  display: flex;

  align-items: center;

  justify-content: space-between;

  min-height: 60px;

}


.header-details {

  flex: 1;

  text-align: center;

}


.header-details h1 {

  margin: 0 0 4px 0;

  font-size: 20px;

  font-weight: bold;

}


.header-details p {

  margin: 0;

  font-size: 9px;

  line-height: 13px;

}


.header-logo {

  width: 65px;

  height: 55px;

  display: flex;

  align-items: center;

  justify-content: center;

  margin-left: 10px;

}


.header-logo img {

  max-width: 60px;

  max-height: 55px;

  object-fit: contain;

}


/* ============================================================
   TITLE
============================================================ */

.invoice-title {

  text-align: center;

  font-size: 14px;

  font-weight: bold;

  padding: 6px;

  border-left: 1px solid #000;

  border-right: 1px solid #000;

  border-bottom: 1px solid #000;

}


/* ============================================================
   CUSTOMER DETAILS
============================================================ */

.details-table {

  width: 100%;

  border-collapse: collapse;

  table-layout: fixed;

}


.details-table td {

  border: 1px solid #000;

  padding: 6px 8px;

  vertical-align: top;

  line-height: 15px;

}


.customer-left {

  width: 55%;

}


.bill-title {

  font-weight: bold;

  font-size: 11px;

  margin-bottom: 4px;

}


.customer-left
div:not(.bill-title) {

  margin: 0;

  padding: 0;

  line-height: 15px;

}


.invoice-right {

  width: 45%;

  vertical-align: top;

}


.invoice-right div {

  margin: 0 0 3px 0;

}


.label {

  font-weight: bold;

}


/* ============================================================
   ITEMS
============================================================ */

.items-table {

  width: 100%;

  border-collapse: collapse;

  margin-top: 8px;

  table-layout: fixed;

}


.items-table th,
.items-table td {

  border: 1px solid #000;

  padding: 4px 3px;

  font-size: 7.5px;

  line-height: 10px;

  word-wrap: break-word;

  overflow-wrap: anywhere;

}


.items-table th {

  text-align: center;

  font-weight: bold;

  background: #f2f2f2;

  font-size: 7.5px;

}


.items-table thead {

  display: table-header-group;

}


.items-table tr {

  page-break-inside: avoid;

}


.center {

  text-align: center;

}


.right {

  text-align: right;

}


.product-name {

  text-align: left;

}


/* ============================================================
   ITEM COLUMN WIDTHS
============================================================ */

.items-table th:nth-child(1),
.items-table td:nth-child(1) {
  width: 4%;
}

.items-table th:nth-child(2),
.items-table td:nth-child(2) {
  width: 13%;
}

.items-table th:nth-child(3),
.items-table td:nth-child(3) {
  width: 8%;
}

.items-table th:nth-child(4),
.items-table td:nth-child(4) {
  width: 8%;
}

.items-table th:nth-child(5),
.items-table td:nth-child(5) {
  width: 7%;
}

.items-table th:nth-child(6),
.items-table td:nth-child(6) {
  width: 9%;
}

.items-table th:nth-child(7),
.items-table td:nth-child(7) {
  width: 5%;
}

.items-table th:nth-child(8),
.items-table td:nth-child(8) {
  width: 7%;
}

.items-table th:nth-child(9),
.items-table td:nth-child(9) {
  width: 7%;
}

.items-table th:nth-child(10),
.items-table td:nth-child(10) {
  width: 8%;
}

.items-table th:nth-child(11),
.items-table td:nth-child(11) {
  width: 6%;
}

.items-table th:nth-child(12),
.items-table td:nth-child(12) {
  width: 6%;
}

.items-table th:nth-child(13),
.items-table td:nth-child(13) {
  width: 6%;
}

.items-table th:nth-child(14),
.items-table td:nth-child(14) {
  width: 6%;
}


/* ============================================================
   BOTTOM SECTION
============================================================ */

.bottom-section-table {

  width: 100%;

  border-collapse: collapse;

  margin-top: 8px;

  table-layout: fixed;

}


.bottom-section-table
> tbody > tr > td {

  vertical-align: top;

  border: 1px solid #000;

  padding: 7px 8px;

}


.bottom-left {

  width: 65%;

  font-size: 8px;

  line-height: 12px;

  text-align: left;

}


.bottom-left > div {

  margin-bottom: 5px;

}


.sold-by {

  margin-top: 8px;

  padding-top: 6px;

  border-top: 1px solid #000;

}


.disclaimer {

  margin-top: 8px;

  line-height: 12px;

}


.bottom-right {

  width: 35%;

  vertical-align: top;

  padding: 0 !important;

}


/* ============================================================
   TOTAL TABLE
============================================================ */

.total-table {

  width: 100%;

  border-collapse: collapse;

  margin: 0;

}


.total-table td {

  border: 1px solid #000;

  padding: 5px 6px;

}


.total-table td:first-child {

  width: 65%;

}


.total-table td:last-child {

  width: 35%;

}


.total-label {

  text-align: right;

  font-weight: bold;

}


.total-final {

  font-size: 12px;

  font-weight: bold;

}


/* ============================================================
   SECOND BOX - DELIVERY SLIP
============================================================ */

.delivery-slip-wrapper {

  margin-top: 10px;

  page-break-inside: avoid;

}


.delivery-slip-table {

  width: 100%;

  border-collapse: collapse;

  table-layout: fixed;

  margin: 0;

}


.delivery-slip-table
> tbody > tr > td {

  border: 1px solid #000;

  vertical-align: top;

}


/* ============================================================
   DELIVERY LEFT / RIGHT
============================================================ */

.delivery-slip-left {

  width: 82%;

  padding: 8px;

  font-size: 9px;

  line-height: 14px;

}


.delivery-slip-right {

  width: 18%;

  padding: 8px;

  vertical-align: top;

}


/* ============================================================
   DELIVERY HEADER
============================================================ */

.slip-header {

  font-size: 10px;

  margin-bottom: 5px;

}


.cod-row {

  display: flex;

  justify-content: space-between;

  width: 70%;

  margin-bottom: 8px;

}


.to-title {

  font-size: 10px;

  margin-bottom: 5px;

}


/* ============================================================
   CUSTOMER DETAILS
============================================================ */

.slip-detail {

  margin: 1px 0;

  line-height: 14px;

}


/* ============================================================
   DELIVERY LOGO
============================================================ */

.slip-logo {

  width: 100%;

  min-height: 70px;

  display: flex;

  align-items: flex-start;

  justify-content: center;

}


.slip-logo img {

  max-width: 85px;

  max-height: 70px;

  object-fit: contain;

}


/* ============================================================
   DELIVERY PRODUCTS
============================================================ */

.slip-products-table {

  width: 100%;

  border-collapse: collapse;

  margin-top: 8px;

  table-layout: fixed;

}


.slip-products-table th,
.slip-products-table td {

  border: 1px solid #000;

  padding: 4px 5px;

  font-size: 8px;

  line-height: 11px;

  word-wrap: break-word;

  overflow-wrap: anywhere;

}


.slip-products-table th {

  text-align: center;

  font-weight: bold;

}


.slip-products-table
th:nth-child(1),
.slip-products-table
td:nth-child(1) {

  width: 58%;

}


.slip-products-table
th:nth-child(2),
.slip-products-table
td:nth-child(2) {

  width: 12%;

}


.slip-products-table
th:nth-child(3),
.slip-products-table
td:nth-child(3) {

  width: 15%;

}


.slip-products-table
th:nth-child(4),
.slip-products-table
td:nth-child(4) {

  width: 15%;

}


.slip-product-name {

  text-align: left;

}


/* ============================================================
   DELIVERY TOTALS
============================================================ */

.slip-total-table {

  width: 100%;

  border-collapse: collapse;

  table-layout: fixed;

}


.slip-total-table td {

  padding: 4px 7px;

  font-size: 8.5px;

  line-height: 12px;

  border: none;

}


.slip-total-table
td:nth-child(1) {

  width: 65%;

}


.slip-total-table
td:nth-child(2) {

  width: 20%;

}


.slip-total-table
td:nth-child(3) {

  width: 15%;

}


.slip-total-table
.total-label {

  text-align: right;

  font-weight: bold;

}


.slip-grand-total td {

  font-size: 10px;

  font-weight: bold;

  border-top: 1px solid #000 !important;

}


/* ============================================================
   DELIVERY INSTRUCTIONS
============================================================ */

.delivery-instructions {

  padding: 7px 8px;

  font-size: 8px;

  line-height: 12px;

}


.delivery-instructions p {

  margin: 0 0 5px 0;

}


.contact-row {

  display: flex;

  justify-content: space-between;

  margin-top: 5px;

  font-weight: bold;

}


/* ============================================================
   PRINT
============================================================ */

@media print {

  html,
  body {

    width: 100%;

  }


  .invoice,
  .delivery-slip-wrapper {

    width: 100%;

    max-width: 194mm;

    margin-left: auto;

    margin-right: auto;

  }


  .items-table {

    page-break-inside: auto;

  }


  .bottom-section-table {

    page-break-inside: avoid;

  }


  .delivery-slip-wrapper {

    page-break-inside: avoid;

  }


  .delivery-slip-table {

    page-break-inside: avoid;

  }


  .delivery-slip-table tr {

    page-break-inside: avoid;

  }

}

</style>

</head>


<body>


<!-- ============================================================
     FIRST BOX - TAX INVOICE
============================================================ -->

<div class="invoice">


  <!-- ==========================================================
       HEADER
  ========================================================== -->

  <div class="header">

    <div class="header-content">

      <div class="header-details">

        <h1>
          VELNEXA
        </h1>

        <p>
          H-1453 Charholi Kh, Chakan,
          Tal Khed, Junnar,
          Pune, Maharashtra 410502
        </p>

      </div>


      <div class="header-logo">

        <img
          src="${logoUrl}"
          alt="VELNEXA"
        />

      </div>

    </div>

  </div>


  <!-- ==========================================================
       TITLE
  ========================================================== -->

  <div class="invoice-title">

    TAX INVOICE

  </div>


  <!-- ==========================================================
       CUSTOMER DETAILS
  ========================================================== -->

  <table class="details-table">

    <tr>

      <td class="customer-left">

        <div class="bill-title">
          Bill To
        </div>


        <div>

          <span class="label">
            Name:
          </span>

          ${customer?.fullName || ''}

        </div>


        <div>

          <span class="label">
            Address:
          </span>

          ${formValue.deliveryAddress || ''}

        </div>


        <div>

          <span class="label">
            Taluka:
          </span>

          ${customer?.taluka || ''}

        </div>


        <div>

          <span class="label">
            District:
          </span>

          ${customer?.district || ''}

        </div>


        <div>

          <span class="label">
            Pin Code:
          </span>

          ${customer?.pin || ''}

        </div>


        <div>

          <span class="label">
            Phone:
          </span>

          ${phone}

        </div>

      </td>


      <td class="invoice-right">

        <div>

          <span class="label">
            Invoice No:
          </span>

          ${
            formValue.invoiceNo ||
            formValue.orderNo ||
            ''
          }

        </div>


        <div>

          <span class="label">
            Invoice Date:
          </span>

          ${invoiceDate}

        </div>


        <div>

          <span class="label">
            Payment Mode:
          </span>

          ${formValue.paymentMode || ''}

        </div>

      </td>

    </tr>

  </table>


  <!-- ==========================================================
       ITEMS
  ========================================================== -->

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

        <th>SGST</th>

        <th>Discount</th>

        <th>Amount</th>

      </tr>

    </thead>


    <tbody>

      ${itemRows}

    </tbody>

  </table>


  <!-- ==========================================================
       BOTTOM SECTION
  ========================================================== -->

  <table class="bottom-section-table">

    <tr>


      <!-- LEFT -->
      <td class="bottom-left">


        <div>

          <strong>
            Whether tax is payable under reverse charge:
          </strong>

          No

        </div>


        <div>

          <strong>
            Order online
          </strong>

          www.velnexa.in

        </div>


        <div>

          For any assistance, write to us at

          <strong>
            care@velnexa.com
          </strong>

          or call us on

          <strong>
            +91 8441844135
          </strong>

        </div>


        <div>

          <strong>
            Hope to serve you soon again
          </strong>

        </div>


        <div class="sold-by">

          <strong>
            Sold By:
          </strong>

          <br>

          Nitin Agro Inputs,
          Bachelor Road,
          Wardha, Maharashtra.
          Code-27.
          GSTIN:27ASSPV2626D2ZC,
          Pesticide Lic. No: LAID26040248,
          Seeds Lic No: LASD26040246

        </div>


        <div class="disclaimer">

          <strong>
            Disclaimer:
          </strong>

          <br>

          We declare that this invoice shows the actual
          price of the goods described and that all
          particulars are true and correct.

          <br>

          The above products were sold at Wardha.
          At the customers instructions they are being
          shipped to the above address.

          <br>

          Subject to Wardha Jursidiction.

          <br>

          Products sold are not for resale.

          <br>

          The performance of the products is subject to
          the usage as per manufacturer guidelines.
          Read enclosed leaflet of the product carefully
          before use.

          <br>

          The user agrees to use the product all safety
          precautions mentioned by the manufacturer.

          <br>

          Farme/Seller will not be responsible for any
          damage/mishap/injury resulting from the use of
          the products.

          <br>

          This is a computer generated invoice and does
          not require a signature.

        </div>

      </td>


      <!-- RIGHT -->
      <td class="bottom-right">

        <table class="total-table">


          <tr>

            <td class="total-label">
              Net Amount
            </td>

            <td class="right">
              ₹ ${netAmount.toFixed(2)}
            </td>

          </tr>


          <tr>

            <td class="total-label">
              UPI Payment
            </td>

            <td class="right">
              ₹ ${upiPayment.toFixed(2)}
            </td>

          </tr>


          <tr>

            <td class="total-label">
              Discount
            </td>

            <td class="right">
              ₹ ${discountAmount.toFixed(2)}
            </td>

          </tr>


          <tr>

            <td class="total-label">
              Round Off
            </td>

            <td class="right">
              ₹ ${roundOff.toFixed(2)}
            </td>

          </tr>


          <tr class="total-final">

            <td class="total-label">
              Total
            </td>

            <td class="right">
              ₹ ${grossAmount.toFixed(2)}
            </td>

          </tr>


        </table>

      </td>

    </tr>

  </table>

</div>


<!-- ============================================================
     SECOND BOX - DELIVERY / COD SLIP
============================================================ -->

<div class="delivery-slip-wrapper">

  <table class="delivery-slip-table">


    <!-- ========================================================
         TOP DELIVERY SECTION
    ======================================================== -->

    <tr>


      <!-- LEFT -->
      <td class="delivery-slip-left">


        <!-- BNPL -->
        <div class="slip-header">

          <strong>
            Booked Under BNPL NO:
          </strong>

          ${formValue.orderNo || ''}

        </div>


        <!-- COD -->
        <div class="cod-row">

          <strong>
            COD :-
          </strong>

          <span>
            ${grossAmount.toFixed(2)}
          </span>

        </div>


        <!-- TO -->
        <div class="to-title">

          <strong>
            TO
          </strong>

        </div>


        <!-- CUSTOMER -->
        <div class="slip-detail">

          <strong>
            Name&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:-
          </strong>

          ${customer?.fullName || ''}

        </div>


        <div class="slip-detail">

          <strong>
            Address&nbsp;&nbsp;&nbsp;:-
          </strong>

          ${formValue.deliveryAddress || ''}

        </div>


        <div class="slip-detail">

          <strong>
            Taluka&nbsp;&nbsp;&nbsp;&nbsp;:-
          </strong>

          ${customer?.taluka || ''}

        </div>


        <div class="slip-detail">

          <strong>
            District&nbsp;&nbsp;&nbsp;:-
          </strong>

          ${customer?.district || ''}

        </div>


        <div class="slip-detail">

          <strong>
            Pincode&nbsp;&nbsp;&nbsp;:-
          </strong>

          ${customer?.pin || ''}

        </div>


        <div class="slip-detail">

          <strong>
            Phone&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:-
          </strong>

          ${phone}

        </div>


        <!-- ====================================================
             PRODUCTS
        ===================================================== -->

        <table class="slip-products-table">


          <thead>

            <tr>

              <th>
                Product
              </th>

              <th>
                QTY
              </th>

              <th>
                Price
              </th>

              <th>
                Total
              </th>

            </tr>

          </thead>


          <tbody>

            ${deliveryProductRows}

          </tbody>


        </table>

      </td>


      <!-- ======================================================
           RIGHT LOGO
      ====================================================== -->

      <td class="delivery-slip-right">

        <div class="slip-logo">

          <img
            src="${logoUrl}"
            alt="VELNEXA"
          />

        </div>

      </td>

    </tr>


    <!-- ========================================================
         TOTAL SECTION
    ======================================================== -->

    <tr>

      <td colspan="2">


        <table class="slip-total-table">


          <tr>

            <td></td>

            <td class="total-label">
              Shipping Charges
            </td>

            <td class="right">
              ₹ ${shippingCharges.toFixed(2)}
            </td>

          </tr>


          <tr>

            <td></td>

            <td class="total-label">
              UPI Payment
            </td>

            <td class="right">
              ₹ ${upiPayment.toFixed(2)}
            </td>

          </tr>


          <tr>

            <td></td>

            <td class="total-label">
              Discount
            </td>

            <td class="right">
              ₹ ${discountAmount.toFixed(2)}
            </td>

          </tr>


          <tr>

            <td></td>

            <td class="total-label">
              R/Off
            </td>

            <td class="right">
              ₹ ${roundOff.toFixed(2)}
            </td>

          </tr>


          <tr class="slip-grand-total">

            <td></td>

            <td class="total-label">
              TOTAL
            </td>

            <td class="right">
              ₹ ${grossAmount.toFixed(2)}
            </td>

          </tr>


        </table>

      </td>

    </tr>


    <!-- ========================================================
         DELIVERY INSTRUCTIONS
    ======================================================== -->

    <tr>

      <td
        colspan="2"
        class="delivery-instructions"
      >


        <p>

          If Electronic Data Not Received At Destination PO
          Then Deliver The Parcel And Send An eMO/MO To The
          Sender’s Address

        </p>


        <p>

          If Undelivered, please return to:-

        </p>


        <p>

          ${
            whMObj?.address ||
            '401, 402 Third Floor, Shreeman Yogi Complex, Besides Khare Town Post Office, Dharampeth, Nagpur - 440010'
          }

        </p>


        <div class="contact-row">


          <span>

            Ph: 8441844135

          </span>


          <span>

            Email: care@farme.in

          </span>


        </div>


      </td>

    </tr>


  </table>

</div>


<script>

window.onload = function () {

  setTimeout(
    function () {

      window.print();

    },
    500
  );

};

</script>


</body>

</html>

  `);


  printWindow.document.close();

}
}
