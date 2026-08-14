import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/ auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/ product.service';
import { RoleService } from '../../../core/services/role.service';
import { RoleOption } from '../../../core/models/user.model';
import { INDIA_LOCATIONS, DistrictOption } from '../../../core/data/india-locations';
import { environment } from '../../../../environments/environment/environment';

@Component({
  selector: 'fp-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private products = inject(ProductService);
  private roleService = inject(RoleService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  submitting = false;
  errorMessage = '';

  states = INDIA_LOCATIONS;
  roles = signal<RoleOption[]>([]);
  photoPreview = signal<string | null>(null);

  districts = signal<DistrictOption[]>([]);
  talukas = signal<string[]>([]);

  isAdminRole = computed(() => {
    const selectedRoleCd = this.form?.controls.roleCd.value;
    const role = this.roles().find((r) => r.roleCd === selectedRoleCd);
    return role?.roleName === 'ADMIN';
  });

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    mobNo: ['', [Validators.required, Validators.pattern(/^[6-9][0-9]{9}$/)]],
    email: ['', [Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    roleCd: [null as number | null, Validators.required],
    village: ['', Validators.required],
    state: ['', Validators.required],
    district: ['', Validators.required],
    taluka: ['', Validators.required],
    pin: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    adharNo: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
    profilePhoto: [''],
    verified: [false],
    block: [false],
    optionalMobNo: ['', [Validators.required, Validators.pattern(/^[6-9][0-9]{9}$/)]],
    landmark: [''],
    address: [''],
  });

  constructor() {
    this.roles.set([{ roleCd: 5, roleName: 'FARMER' }]);
  }

  onStateChange(stateName: string): void {
    const state = this.states.find((s) => s.name === stateName);
    this.districts.set(state?.districts ?? []);
    this.talukas.set([]);
    this.form.patchValue({ district: '', taluka: '' });
  }

  onDistrictChange(districtName: string): void {
    const district = this.districts().find((d) => d.name === districtName);
    this.talukas.set(district?.talukas ?? []);
    this.form.patchValue({ taluka: '' });
  }

  onRoleChange(roleCd: number): void {
    const role = this.roles().find((r) => r.roleCd === roleCd);
    this.form.patchValue({ roleName: role?.roleName } as any);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.photoPreview.set(base64);
      this.form.patchValue({ profilePhoto: base64 });
    };
    reader.readAsDataURL(file);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage = '';
    this.submitting = true;

    const raw = this.form.getRawValue();
    const selectedRole = this.roles().find((r) => r.roleCd === raw.roleCd);

    const payload = {
      fullName: raw.fullName,
      mobNo: raw.mobNo,
      email: raw.email || undefined,
      password: raw.password,
      roleCd: raw.roleCd ?? undefined,
      roleName: selectedRole?.roleName,
      village: raw.village,
      taluka: raw.taluka,
      district: raw.district,
      state: raw.state,
      pin: raw.pin,
      adharNo: raw.adharNo,
      profilePhoto: raw.profilePhoto || undefined,
      verified: this.isAdminRole() ? raw.verified : undefined,
      block: this.isAdminRole() ? raw.block : undefined,
      active: true,
    };

    this.http
      .post(`${environment.apiBaseUrl}/v1/user/save`, payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => this.onRegisterSuccess(),
        error: () => (this.errorMessage = 'REGISTER_ERROR'),
      });
  }

  private onRegisterSuccess(): void {
    const pending = this.auth.consumePendingAction();
    if (pending) {
      this.products.getById(pending.productId).subscribe({
        next: (product) => {
          this.cart.addItem(product, pending.quantity);
          this.navigateAfter(pending.type === 'BUY_NOW' ? '/checkout' : '/cart');
        },
        error: () => this.navigateAfter(),
      });
      return;
    }
    this.navigateAfter();
  }

  private navigateAfter(fallback = '/'): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.router.navigateByUrl(returnUrl ?? fallback);
  }
}
