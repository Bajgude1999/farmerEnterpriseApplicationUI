import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { finalize, switchMap } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { INDIA_LOCATIONS, DistrictOption } from '../../core/data/india-locations';

import { CartService } from '../../core/services/cart.service';
import { environment } from '../../../environments/environment/environment';
import { TaxDto } from '../../core/services/cart.model';

@Component({
  selector: 'fp-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class CheckoutComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  cart = inject(CartService);

  states = INDIA_LOCATIONS;

  districts = signal<DistrictOption[]>([]);
  talukas = signal<string[]>([]);
  placingOrder = signal(false);
  orderPlaced = signal(false);
  orderNumber = signal('');
userCd: number = Number(localStorage.getItem('userCd'));
  addressForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    mobNo: ['', [Validators.required, Validators.pattern(/^[6-9][0-9]{9}$/)]],
    email: ['', [Validators.email]],
    roleCd: [5, Validators.required],
    village: ['', Validators.required],
    state: ['', Validators.required],
    district: ['', Validators.required],
    taluka: ['', Validators.required],
    pin: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    optionalMobNo: ['', [Validators.required, Validators.pattern(/^[6-9][0-9]{9}$/)]],
    landmark: [''],
    address: [''],
    userCd:[''],
  });

placeOrder(): void {

  if (this.addressForm.invalid) {
    this.addressForm.markAllAsTouched();
    return;
  }

  this.placingOrder.set(true);

  const formValue = this.addressForm.getRawValue();

  // 1. Prepare data for tax calculation
  const taxRequest: TaxDto[] = this.cart.items().map(item => ({
    productCd: Number(item.product.id),
    grossAmount: Number(item.product.price) * item.quantity
  }));

  // 2. One call for ALL items
  this.http
  .post<any>(
    `${environment.apiBaseUrl}/v1/order/calculatetaxes`,
    taxRequest
  )
  .pipe(
    switchMap((res) => {

      const taxes: TaxDto[] = res.data;

      // Total gross amount
      const grossAmount = this.cart.items().reduce(
        (total, item) =>
          total + (Number(item.product.price) * item.quantity),
        0
      );

      // Total tax
      const taxAmount = taxes.reduce(
        (total, tax) =>
          total + Number(tax.taxAmount || 0),
        0
      );

        // 3. Create final order payload
        const payload = {

          userCd: formValue.userCd,
          userDto:formValue,
          paymentMode: 'COD',
          email:formValue.email,
          deliveryAddress: formValue.address,

          mobileNo: formValue.mobNo,

          grossAmount: grossAmount,

          discountAmount: 0,

          taxAmount: taxAmount,

          // Your price is GST-inclusive
          netAmount: grossAmount,

          orderStatus: 'PENDING',

          items: this.cart.items().map((i) => {

            // Taxes belonging to this product
            const itemTaxes = taxes
              .filter(tax =>
                Number(tax.productCd) === Number(i.product.id)
              )
              .map(tax => ({
                taxName: tax.taxName,
                taxRate: tax.taxRate,
                taxAmount: tax.taxAmount
              }));

            return {

              productCd: Number(i.product.id),

              productName: i.product.name,

              qty: i.quantity,

              rate: Number(i.product.price),

              discount: 0,

              amount:
                Number(i.product.price) * i.quantity,

              active: true,

              taxes: itemTaxes
            };
          })
        };

        // 4. Book order
        return this.http.post<{ orderNumber: string }>(
          `${environment.apiBaseUrl}/v1/order/save`,
          payload
        );
      }),

      finalize(() => this.placingOrder.set(false))

    )
    .subscribe({

      next: (res) => {

        this.orderNumber.set(res.orderNumber);

        this.orderPlaced.set(true);

        this.cart.clear();

      },

      error: () => {
        // surfaced via global error interceptor snackbar
      }

    });
}

  goToOrders(): void {
    this.router.navigate(['/my-orders']);
  }
  onStateChange(stateName: string): void {
    const state = this.states.find((s) => s.name === stateName);
    this.districts.set(state?.districts ?? []);
    this.talukas.set([]);
    this.addressForm.patchValue({ district: '', taluka: '' });
  }

  onDistrictChange(districtName: string): void {
    const district = this.districts().find((d) => d.name === districtName);
    this.talukas.set(district?.talukas ?? []);
    this.addressForm.patchValue({ taluka: '' });
  }

  onMobileNumber(mobNo: string): void {
    // Remove anything except numbers
    mobNo = mobNo.replace(/\D/g, '');

    // Wait until 10 digits
    if (mobNo.length !== 10) {
      return;
    }

    this.http.get<any>(`${environment.apiBaseUrl}/v1/user/get-by-mobile/${mobNo}`).subscribe({
      next: (res) => {
        console.log('User found:', res);
        // Example: populate checkout form
        const user = res.data[0];

        this.addressForm.patchValue({
          fullName: user.fullName,
          email: user.email,
          optionalMobNo: user.optionalMobNo,
          address: user.address,
          landmark: user.landmark,
          village: user.village,
          pin: user.pin,
          userCd:user.userId
        });

        // 1. Set state first
        this.addressForm.patchValue({
          state: user.state,
        });

        const state = this.states.find((s) => s.name === user.state);

        this.districts.set(state?.districts ?? []);

        // 2. Now set district
        this.addressForm.patchValue({
          district: user.district,
        });

        const district = this.districts().find((d) => d.name === user.district);

        this.talukas.set(district?.talukas ?? []);

        // 3. Finally set taluka
        this.addressForm.patchValue({
          taluka: user.taluka,
        });
      },

      error: (err) => {
        console.log('User not found', err);
      },
    });
  }
}
