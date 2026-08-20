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
import * as CryptoJS from 'crypto-js';

import { CartService } from '../../core/services/cart.service';
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
  private readonly ENCRYPTION_KEY = environment.encriptionKey;

  private locationService = inject(LocationService);
  states = signal<State[]>([]);
  districts = signal<District[]>([]);
  talukas = signal<Taluka[]>([]);
  placingOrder = signal(false);
  orderPlaced = signal(false);
  orderNumber = signal('');
userCd: number | null = (() => {
  const value = localStorage.getItem('userCd');
  return value !== null ? Number(value) : null;
})();
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
  const encryptedUserData = localStorage.getItem('fp_auth_user');

  let userData: any = null;

  try {
    if (encryptedUserData) {
      userData = JSON.parse(this.decrypt(encryptedUserData));
    }
  } catch (error) {
    console.error('Invalid user data in localStorage:', error);
  }

  // Load states first because district loading depends on stateCd
  this.locationService.getStates().subscribe({
    next: (data: State[]) => {
      this.states.set(data);

      if (!userData) {
        return;
      }

      const address = userData.addresses?.[0];

      // --------------------------------------------------
      // USER DETAILS
      // --------------------------------------------------
      this.addressForm.patchValue({
        fullName: userData.fullName || '',
        mobNo: userData.mobNo || '',
        email: userData.email || '',
        roleCd: userData.roleCd || 5,
        userCd: userData.userId?.toString() || '',

        // Address details
        village: address?.village || '',
        state: address?.state || '',
        district: address?.district || '',
        taluka: address?.taluka || '',
        pin: address?.pin || '',
        optionalMobNo: address?.optionalMobNo || '',
        landmark: address?.landmark || '',
        address: address?.address || '',
      });

      // --------------------------------------------------
      // FIND STATE BY stateName
      // --------------------------------------------------
      const selectedState = data.find(
        (state: State) => state.stateName === address?.state
      );

      if (selectedState) {
        const stateCd = selectedState.stateCd;

        // --------------------------------------------------
        // LOAD DISTRICTS
        // --------------------------------------------------
        this.locationService.getDistricts(stateCd).subscribe({
          next: (districtData: District[]) => {
            this.districts.set(districtData);

            // Find district by districtName
            const selectedDistrict = districtData.find(
              (district: District) =>
                district.districtName === address?.district
            );

            if (selectedDistrict) {
              const districtCd = selectedDistrict.districtCd;

              // --------------------------------------------------
              // LOAD TALUKAS
              // --------------------------------------------------
              this.locationService.getTalukas(districtCd).subscribe({
                next: (talukaData: Taluka[]) => {
                  this.talukas.set(talukaData);

                  this.addressForm.patchValue({
                    taluka: address?.taluka || '',
                  });
                },
                error: (err) => {
                  console.error('Failed to load talukas', err);
                  this.talukas.set([]);
                },
              });
            } else {
              // District not found - simply clear talukas
              this.talukas.set([]);
            }
          },
          error: (err) => {
            console.error('Failed to load districts', err);
            this.districts.set([]);
            this.talukas.set([]);
          },
        });
      } else {
        // State not found - simply clear districts and talukas
        this.districts.set([]);
        this.talukas.set([]);
      }
    },

    error: (err) => {
      console.error('Failed to load states', err);
      this.states.set([]);
    },
  });
}
 private encrypt(value: string): string {
  // your encryption implementation
  return CryptoJS.AES.encrypt(
    value,
    this.ENCRYPTION_KEY
  ).toString();
}

private decrypt(value: string): string {
  const bytes = CryptoJS.AES.decrypt(
    value,
    this.ENCRYPTION_KEY
  );

  return bytes.toString(CryptoJS.enc.Utf8);
}
  goToOrders(): void {
    this.router.navigate(['/my-orders']);
  }

onMobileNumber(mobNo: string): void {

  // Remove non-numeric characters
  mobNo = mobNo.replace(/\D/g, '');

  // Only call API when exactly 10 digits
  if (mobNo.length !== 10) {
    return;
  }

  this.http
    .get<any>(
      `${environment.apiBaseUrl}/v1/user/get-by-mobile/${mobNo}`
    )
    .subscribe({

      next: (response) => {

        console.log('API Response:', response);

        const users = response?.data ?? [];

        console.log('Users found:', users);

        // No user found
        if (!Array.isArray(users) || users.length === 0) {

          this.districts.set([]);
          this.talukas.set([]);

          return;
        }

        // Get first user
        const user = users[0];

        console.log('User:', user);

        // ============================================================
        // BASIC USER DETAILS
        // ============================================================

        this.addressForm.patchValue({

          fullName: user.fullName ?? '',

          mobNo: user.mobNo ?? mobNo,

          email: user.email ?? '',

          optionalMobNo: user.optionalMobNo ?? '',

          address: user.address ?? '',

          landmark: user.landmark ?? '',

          village: user.village ?? '',

          pin: user.pin ?? '',

          userCd: user.userId ?? ''

        });

        // ============================================================
        // FIND STATE
        // ============================================================

        const state = this.states().find(
          (s: any) =>
            s.stateName?.trim().toLowerCase() ===
            user.state?.trim().toLowerCase()
        );

        if (!state) {

          console.warn(
            'State not found:',
            user.state
          );

          this.districts.set([]);
          this.talukas.set([]);

          this.addressForm.patchValue({
            district: '',
            taluka: ''
          });

          return;
        }

        // Set state if your form has state field
        this.addressForm.patchValue({
          state: state.stateName
        });

        // ============================================================
        // LOAD DISTRICTS
        // ============================================================

        this.locationService
          .getDistricts(state.stateCd)
          .subscribe({

            next: (districts: any[]) => {

              console.log(
                'Districts:',
                districts
              );

              this.districts.set(districts);

              // Set district
              const district = districts.find(
                (d: any) =>
                  d.districtName?.trim().toLowerCase() ===
                  user.district?.trim().toLowerCase()
              );

              if (!district) {

                console.warn(
                  'District not found:',
                  user.district
                );

                this.talukas.set([]);

                this.addressForm.patchValue({
                  district: '',
                  taluka: ''
                });

                return;
              }

              // Set district code
              this.addressForm.patchValue({
                district: district.districtName
              });

              // ========================================================
              // LOAD TALUKAS
              // ========================================================

              this.locationService
                .getTalukas(district.districtCd)
                .subscribe({

                  next: (talukas: any[]) => {

                    console.log(
                      'Talukas:',
                      talukas
                    );

                    this.talukas.set(talukas);

                    // Find taluka
                    const taluka = talukas.find(
                      (t: any) =>
                        t.talukaName?.trim().toLowerCase() ===
                        user.taluka?.trim().toLowerCase()
                    );

                    if (!taluka) {

                      console.warn(
                        'Taluka not found:',
                        user.taluka
                      );

                      this.addressForm.patchValue({
                        taluka: ''
                      });

                      return;
                    }

                    // Set taluka code
                    this.addressForm.patchValue({
                      taluka: taluka.talukaName
                    });

                  },

                  error: (err) => {

                    console.error(
                      'Failed to load talukas:',
                      err
                    );

                    this.talukas.set([]);

                    this.addressForm.patchValue({
                      taluka: ''
                    });

                  }

                });

            },

            error: (err) => {

              console.error(
                'Failed to load districts:',
                err
              );

              this.districts.set([]);
              this.talukas.set([]);

              this.addressForm.patchValue({
                district: '',
                taluka: ''
              });

            }

          });

      },

      error: (err) => {

        console.error(
          'Failed to get user by mobile:',
          err
        );

        this.districts.set([]);
        this.talukas.set([]);

        this.addressForm.patchValue({
          district: '',
          taluka: ''
        });

      }

    });
}

onStateChange(stateName: string): void {
  const state = this.states().find(
    s => s.stateName === stateName
  );

  if (!state) {
    return;
  }

  const stateCd = state.stateCd;        // Clear districts and talukas
      this.districts.set([]);
      this.talukas.set([]);
  
      // Clear form values
      this.addressForm.patchValue({ district: '', taluka: '' });
  
      // Load districts
      this.locationService.getDistricts(stateCd).subscribe({
        next: (data) => {
          this.districts.set(data);
        },
        error: (err) => {
          console.error('Failed to load districts', err);
          this.districts.set([]);
        },
      });
    }
  

onDistrictChange(districtName: string): void {

  const district = this.districts().find(
    d => d.districtName === districtName
  );

  if (!district) {
    return;
  }
  const districtCd = district.districtCd;
      // Clear talukas
      this.talukas.set([]);
  
      // Clear selected taluka
      this.addressForm.patchValue({ taluka: '' });
  
      // Load talukas
      this.locationService.getTalukas(districtCd).subscribe({
        next: (data) => {
          this.talukas.set(data);
        },
        error: (err) => {
          console.error('Failed to load talukas', err);
          this.talukas.set([]);
        },
      });
    }
    placeOrder(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.placingOrder.set(true);

    const formValue = this.addressForm.getRawValue();

    // 1. Prepare data for tax calculation
    const taxRequest: TaxDto[] = this.cart.items().map((item) => ({
      productCd: Number(item.product.id),
      grossAmount: Number(item.product.price) * item.quantity,
    }));
    let add = formValue.address;
    if (formValue.address) {
      add =
        'At. ' +
        formValue.village +
        ' Tq. ' +
        formValue.taluka +
        ' Di. ' +
        formValue.district +
        ' ' +
        formValue.state +
        ' - ' +
        formValue.pin;
    }

    // 2. One call for ALL items
    this.http
      .post<any>(`${environment.apiBaseUrl}/v1/order/calculatetaxes`, taxRequest)
      .pipe(
        switchMap((res) => {
          const taxes: TaxDto[] = res.data[0];

          // Total gross amount
          let grossAmount = this.cart
            .items()
            .reduce((total, item) => total + Number(item.product.price) * item.quantity, 0);
          const mrpAmount = this.cart
            .items()
            .reduce((total, item) => total + Number(item.product.mrp) * item.quantity, 0);
          const discountAmount = mrpAmount > grossAmount ? mrpAmount - grossAmount : 0;
          // Total tax
          const taxAmount = taxes.reduce((total, tax) => total + Number(tax.taxAmount || 0), 0);
            const netAmount = taxes
            .filter(tax => tax.taxName == 'BASIC')
            .reduce((total, tax) => total + Number(tax.taxAmount || 0), 0);
          const shippingCharges=this.cart.deliveryCharge();
         // grossAmount=grossAmount+shippingCharges;
         // const netAmount = grossAmount - taxAmount;
          // 3. Create final order payload
          const payload = {
            userCd: formValue.userCd,
            userDto: formValue,
            paymentMode: 'COD',
            email: formValue.email,
            deliveryAddress: add,

            mobileNo: formValue.mobNo,

            grossAmount: grossAmount,

            discountAmount: discountAmount,

            taxAmount: taxAmount,
            shipingCharges:shippingCharges,
            // Your price is GST-inclusive
            netAmount: netAmount,

            orderStatus: 'PLACED',

            items: this.cart.items().map((i) => {
              // Taxes belonging to this product
              const itemTaxes = taxes
                .filter((tax) => Number(tax.productCd) == Number(i.product?.id))
                .map((tax) => ({
                  taxName: tax.taxName,
                  taxRate: tax.taxRate,
                  taxAmount: tax.taxAmount,
                }));
                console.log('prod',i.product);
               const batchDtlList: SalesOrderBatchDtl[] = [];

            batchDtlList.push({
              batchDtlCd: null,
              orderDtlCd: null,
              batchNo: '',
              mfgDate: '',
              expiryDate: '',
              batchQty: i.quantity,
              batchRate: i.product.price,
              uomCd: i.product.uomCd,
              packSize: i.product.packSize,
              discount:((i.product.mrp- i.product.price)*i.quantity),
              mrpRate: i.product.mrp
            });
                          return {
                            productCd: Number(i.product.id),

                            productName: i.product.name,

                            qty: i.quantity,

                            rate: Number(i.product.price),
                            packSize:Number(i.product.packSize),
                            uomCd:Number(i.product.uomCd),

                            discount: Math.max(
                              0,
                              Number(i.product.mrp || 0) * i.quantity -
                                Number(i.product.price || 0) * i.quantity,
                            ),
                            amount: Number(i.product.price) * i.quantity,

                            active: true,

                            taxes: itemTaxes,
                            batchDetails: batchDtlList,
              };
            }),
          };

          // 4. Book order
          return this.http.post<{ orderNumber: string }>(
            `${environment.apiBaseUrl}/v1/order/save`,
            payload,
          );
        }),

        finalize(() => this.placingOrder.set(false)),
      )
      .subscribe({
        next: (res) => {
          this.orderNumber.set(res.orderNumber);

          this.orderPlaced.set(true);

          this.cart.clear();
        },

        error: () => {
          // surfaced via global error interceptor snackbar
        },
      });
  }
}
