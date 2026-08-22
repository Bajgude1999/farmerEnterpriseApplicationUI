import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { finalize, switchMap } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';

import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/ auth.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';
import { TaxDto } from '../../core/models/cart.model';
import { LocationService } from '../../core/services/location.service';
import { District, State, Taluka } from '../../core/models/location.model';
import { SalesOrderBatchDtl } from '../../core/models/sales-order.model';

@Component({
  selector: 'fp-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatSelectModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  cart = inject(CartService);
  auth = inject(AuthService);
  private toastService = inject(ToastService);
  private locationService = inject(LocationService);

  states = signal<State[]>([]);
  districts = signal<District[]>([]);
  talukas = signal<Taluka[]>([]);

  placingOrder = signal<boolean>(false);
  orderPlaced = signal<boolean>(false);
  orderNumber = signal<string>('');

  // Authentication & Guest Checkout State
  isLoggedIn = computed(() => this.auth.hasValidSession());
  guestStepCompleted = signal<boolean>(false);
  isExistingGuest = signal<boolean>(false);
  checkingMobile = signal<boolean>(false);

  // Payment Option
  selectedPaymentMode = signal<'COD' | 'ONLINE'>('COD');

  addressForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    mobNo: ['', [Validators.required, Validators.pattern(/^[6-9][0-9]{9}$/)]],
    email: [''],
    roleCd: [5, Validators.required],
    village: ['', Validators.required],
    state: ['', Validators.required],
    district: ['', Validators.required],
    taluka: ['', Validators.required],
    pin: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    optionalMobNo: ['', [Validators.pattern(/^[6-9][0-9]{9}$/)]],
    landmark: [''],
    address: [''],
    userCd: [''],
  });

  ngOnInit(): void {
    this.loadStates();

    if (this.isLoggedIn()) {
      this.populateAuthenticatedUser();
    }
  }

  private loadStates(): void {
    this.locationService.getStates().subscribe({
      next: (data: State[]) => this.states.set(data),
      error: (err) => {
        console.error('Failed to load states', err);
        this.states.set([]);
      },
    });
  }

  private populateAuthenticatedUser(): void {
    const userData = this.auth.currentUser();
    if (!userData) {
      return;
    }

    const address = userData.addresses?.[0];

    this.addressForm.patchValue({
      fullName: userData.fullName || '',
      mobNo: userData.mobNo || '',
      email: userData.email || '',
      roleCd: userData.roleCd || 5,
      userCd: userData.userCd ? String(userData.userCd) : '',

      village: address?.village || '',
      state: address?.state || '',
      district: address?.district || '',
      taluka: address?.taluka || '',
      pin: address?.pin || '',
      optionalMobNo: address?.optionalMobNo || '',
      landmark: address?.landmark || '',
      address: address?.address || '',
    });

    if (address?.state) {
      this.locationService.getStates().subscribe({
        next: (states: State[]) => {
          this.states.set(states);
          const selectedState = states.find((s) => s.stateName === address.state);
          if (selectedState) {
            this.locationService.getDistricts(selectedState.stateCd).subscribe({
              next: (districts: District[]) => {
                this.districts.set(districts);
                const selectedDistrict = districts.find((d) => d.districtName === address.district);
                if (selectedDistrict) {
                  this.locationService.getTalukas(selectedDistrict.districtCd).subscribe({
                    next: (talukas: Taluka[]) => {
                      this.talukas.set(talukas);
                    },
                  });
                }
              },
            });
          }
        },
      });
    }
  }

  /**
   * Guest checkout mobile number verification.
   * Identifies whether the customer exists or is a new customer.
   */
  checkGuestMobile(): void {
    const mobControl = this.addressForm.get('mobNo');
    if (!mobControl || mobControl.invalid) {
      mobControl?.markAsTouched();
      this.toastService.error('Please enter a valid 10-digit mobile number');
      return;
    }

    const mobNo = mobControl.value.replace(/\D/g, '');
    if (mobNo.length !== 10) {
      this.toastService.error('Please enter a valid 10-digit mobile number');
      return;
    }

    this.checkingMobile.set(true);

    this.http.get<any>(`${environment.apiBaseUrl}/v1/user/get-by-mobile/${mobNo}`).subscribe({
      next: (response) => {
        this.checkingMobile.set(false);
        const users = response?.data ?? [];

        if (Array.isArray(users) && users.length > 0) {
          // Existing Guest Customer
          const user = users[0];
          this.isExistingGuest.set(true);
          this.guestStepCompleted.set(true);

          // Remove required validator on fullName for existing guest since name is hidden
          this.addressForm.get('fullName')?.clearValidators();
          this.addressForm.get('fullName')?.updateValueAndValidity();

          this.addressForm.patchValue({
            fullName: user.fullName || 'Valued Customer',
            mobNo: user.mobNo || mobNo,
            email: user.email || '',
            userCd: user.userCd ? String(user.userCd) : '',
            roleCd: user.roleCd || 5,
          });
        } else {
          // New Guest Customer
          this.isExistingGuest.set(false);
          this.guestStepCompleted.set(true);

          // Restore validation for new customer
          this.addressForm.get('fullName')?.setValidators([Validators.required, Validators.minLength(3)]);
          this.addressForm.get('fullName')?.updateValueAndValidity();

          this.addressForm.patchValue({
            mobNo: mobNo,
            userCd: '',
            roleCd: 5,
          });
        }
      },
      error: () => {
        // Fallback to New Guest Customer
        this.checkingMobile.set(false);
        this.isExistingGuest.set(false);
        this.guestStepCompleted.set(true);

        this.addressForm.get('fullName')?.setValidators([Validators.required, Validators.minLength(3)]);
        this.addressForm.get('fullName')?.updateValueAndValidity();
      },
    });
  }

  changeGuestMobile(): void {
    this.guestStepCompleted.set(false);
    this.isExistingGuest.set(false);
    this.addressForm.reset({
      roleCd: 5,
      mobNo: this.addressForm.get('mobNo')?.value || '',
    });
    this.districts.set([]);
    this.talukas.set([]);
  }

  onStateChange(stateName: string): void {
    const state = this.states().find((s) => s.stateName === stateName);
    if (!state) return;

    this.districts.set([]);
    this.talukas.set([]);
    this.addressForm.patchValue({ district: '', taluka: '' });

    this.locationService.getDistricts(state.stateCd).subscribe({
      next: (data) => this.districts.set(data),
      error: () => this.districts.set([]),
    });
  }

  onDistrictChange(districtName: string): void {
    const district = this.districts().find((d) => d.districtName === districtName);
    if (!district) return;

    this.talukas.set([]);
    this.addressForm.patchValue({ taluka: '' });

    this.locationService.getTalukas(district.districtCd).subscribe({
      next: (data) => this.talukas.set(data),
      error: () => this.talukas.set([]),
    });
  }

  onPaymentModeChange(mode: 'COD' | 'ONLINE'): void {
    this.selectedPaymentMode.set(mode);
  }

  placeOrder(): void {
    if (this.cart.items().length === 0) {
      this.toastService.error('Your cart is empty');
      return;
    }

    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      this.toastService.error('Please fill in all required address details');
      return;
    }

    this.placingOrder.set(true);
    const formValue = this.addressForm.getRawValue();

    const taxRequest: TaxDto[] = this.cart.items().map((item) => ({
      productCd: Number(item.product.id),
      grossAmount: Number(item.product.price) * item.quantity,
    }));

    let fullAddress = formValue.address || '';
    if (formValue.village || formValue.taluka || formValue.district || formValue.state) {
      fullAddress = `At. ${formValue.village} Tq. ${formValue.taluka} Di. ${formValue.district} ${formValue.state} - ${formValue.pin}`;
    }

    this.http
      .post<any>(`${environment.apiBaseUrl}/v1/order/calculatetaxes`, taxRequest)
      .pipe(
        switchMap((res) => {
          const taxes: TaxDto[] = res.data?.[0] || [];

          const grossAmount = this.cart
            .items()
            .reduce((total, item) => total + Number(item.product.price) * item.quantity, 0);
          const mrpAmount = this.cart
            .items()
            .reduce((total, item) => total + Number(item.product.mrp || item.product.price) * item.quantity, 0);
          const discountAmount = mrpAmount > grossAmount ? mrpAmount - grossAmount : 0;
          const taxAmount = taxes.reduce((total, tax) => total + Number(tax.taxAmount || 0), 0);
          const netAmount = taxes
            .filter((tax) => tax.taxName === 'BASIC')
            .reduce((total, tax) => total + Number(tax.taxAmount || 0), 0);
          const shippingCharges = this.cart.deliveryCharge();

          const payload = {
            userCd: formValue.userCd ? Number(formValue.userCd) : null,
            userDto: formValue,
            paymentMode: this.selectedPaymentMode(),
            email: formValue.email || '',
            deliveryAddress: fullAddress,
            mobileNo: formValue.mobNo,
            grossAmount: grossAmount,
            discountAmount: discountAmount,
            taxAmount: taxAmount,
            shipingCharges: shippingCharges,
            netAmount: netAmount > 0 ? netAmount : grossAmount,
            orderStatus: 'PLACED',
            items: this.cart.items().map((i) => {
              const itemTaxes = taxes
                .filter((tax) => Number(tax.productCd) === Number(i.product?.id))
                .map((tax) => ({
                  taxName: tax.taxName,
                  taxRate: tax.taxRate,
                  taxAmount: tax.taxAmount,
                }));

              const batchDtlList: SalesOrderBatchDtl[] = [
                {
                  batchDtlCd: null,
                  orderDtlCd: null,
                  batchNo: '',
                  mfgDate: '',
                  expiryDate: '',
                  batchQty: i.quantity,
                  batchRate: i.product.price,
                  uomCd: i.product.uomCd || 1,
                  packSize: i.product.packSize || 1,
                  discount: Math.max(0, (Number(i.product.mrp || i.product.price) - Number(i.product.price)) * i.quantity),
                  mrpRate: Number(i.product.mrp || i.product.price),
                },
              ];

              return {
                productCd: Number(i.product.id),
                productName: i.product.name,
                qty: i.quantity,
                rate: Number(i.product.price),
                packSize: Number(i.product.packSize || 1),
                uomCd: Number(i.product.uomCd || 1),
                discount: Math.max(0, (Number(i.product.mrp || 0) - Number(i.product.price || 0)) * i.quantity),
                amount: Number(i.product.price) * i.quantity,
                active: true,
                taxes: itemTaxes,
                batchDetails: batchDtlList,
              };
            }),
          };

          return this.http.post<{ orderNumber: string }>(
            `${environment.apiBaseUrl}/v1/order/save`,
            payload
          );
        }),
        finalize(() => this.placingOrder.set(false))
      )
      .subscribe({
        next: (res) => {
          this.orderNumber.set(res?.orderNumber || 'ORD-' + Date.now());
          this.orderPlaced.set(true);
          this.cart.clear();
          this.toastService.success('Order placed successfully!');
        },
        error: () => {
          // Handled by global interceptor
        },
      });
  }

  goToOrders(): void {
    if (this.isLoggedIn()) {
      this.router.navigate(['/my-orders']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
