import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { UserMasterService } from '../../shared/user-master.service';
import { UploadService } from '../../../../services/upload.service';
import { RoleService } from '../../../../services/role.service';
import { RoleOption, UserMaster } from '../../../../models/user.model';
import { District, State, Taluka } from '../../../../models/location.model';
import { LocationService } from '../../../../services/location.service';

@Component({
  selector: 'app-user-master',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    TranslatePipe,
  ],
  templateUrl: './user-master.html',
  styleUrl: './user-master.scss',
})
export class UserMasterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserMasterService);
  private uploadService = inject(UploadService);
  private roleService = inject(RoleService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private locationService = inject(LocationService);

  isEdit = signal(false);
  saving = signal(false);
  uploadingPhoto = signal(false);
  states = signal<State[]>([]);
  districts = signal<District[]>([]);
  talukas = signal<Taluka[]>([]);
  roles = signal<RoleOption[]>([]);

  photoUrl = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    userCd: [null as number | null],
    fullName: ['', Validators.required],
    mobNo: ['', [Validators.required, Validators.pattern(/^[6-9][0-9]{9}$/)]],
    optionalMobNo: ['', [Validators.pattern(/^[6-9][0-9]{9}$/)]],
    email: ['', [Validators.email]],
    password: [''],
    roleCd: [null as number | null, Validators.required],
    roleName: [''],
    village: ['', Validators.required],
    taluka: ['', Validators.required],
    district: ['', Validators.required],
    state: ['', Validators.required],
    pin: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    landmark: [''],
    address: [''],
    profilePhoto: [''],
    verified: [false],
    block: [false],
    active: [true],
  });

  ngOnInit(): void {
    this.roleService.getAll().subscribe({
      next: (roles) => this.roles.set(roles),
      error: (err) => {
        console.error('Failed to load roles', err);
        this.roles.set([]);
      },
    });

    const userCd = this.route.snapshot.paramMap.get('id');
    if (userCd) {
      this.isEdit.set(true);
      this.loadUser(Number(userCd));
    } else {
      this.loadStates();
    }
  }

  private loadStates(callback?: (states: State[]) => void): void {
    this.locationService.getStates().subscribe({
      next: (data) => {
        const statesList = Array.isArray(data) ? data : ((data as any)?.data ?? []);
        this.states.set(statesList);
        if (callback) {
          callback(statesList);
        }
      },
      error: (err) => {
        console.error('Failed to load states', err);
        this.states.set([]);
      },
    });
  }

  private loadUser(userCd: number): void {
    this.userService.getById(userCd).subscribe({
      next: (user) => {
        if (!user) return;
        this.form.patchValue(user);

        if (user.profilePhoto) {
          this.photoUrl.set(this.uploadService.getFileUrl(user.profilePhoto));
        }

        this.loadStates((states) => {
          this.populateLocationCascades(user, states);
        });
      },
      error: (err) => {
        console.error('Failed to load user', err);
      }
    });
  }

  private populateLocationCascades(user: UserMaster, states: State[]): void {
    if (!user.state) {
      this.districts.set([]);
      this.talukas.set([]);
      return;
    }

    const state = states.find(
      (s: State) => s.stateName?.trim().toLowerCase() === user.state?.trim().toLowerCase()
    );

    if (!state) {
      this.districts.set([]);
      this.talukas.set([]);
      return;
    }

    this.locationService.getDistricts(state.stateCd).subscribe({
      next: (districtsData) => {
        const districtList = Array.isArray(districtsData) ? districtsData : ((districtsData as any)?.data ?? []);
        this.districts.set(districtList);
        this.form.patchValue({ district: user.district });

        if (!user.district) {
          this.talukas.set([]);
          return;
        }

        const district = districtList.find(
          (d: District) => d.districtName?.trim().toLowerCase() === user.district?.trim().toLowerCase()
        );

        if (!district) {
          this.talukas.set([]);
          return;
        }

        this.locationService.getTalukas(district.districtCd).subscribe({
          next: (talukasData) => {
            const talukasList = Array.isArray(talukasData) ? talukasData : ((talukasData as any)?.data ?? []);
            this.talukas.set(talukasList);
            this.form.patchValue({ taluka: user.taluka });
          },
          error: (err) => {
            console.error('Failed to load talukas', err);
            this.talukas.set([]);
          }
        });
      },
      error: (err) => {
        console.error('Failed to load districts', err);
        this.districts.set([]);
        this.talukas.set([]);
      }
    });
  }

  onStateChange(stateName: string): void {
    const state = this.states().find(
      (s) => s.stateName === stateName
    );

    this.districts.set([]);
    this.talukas.set([]);
    this.form.patchValue({ district: '', taluka: '' });

    if (!state) {
      return;
    }

    this.locationService.getDistricts(state.stateCd).subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : ((data as any)?.data ?? []);
        this.districts.set(list);
      },
      error: (err) => {
        console.error('Failed to load districts', err);
        this.districts.set([]);
      },
    });
  }

  onDistrictChange(districtName: string): void {
    const district = this.districts().find(
      (d) => d.districtName === districtName
    );

    this.talukas.set([]);
    this.form.patchValue({ taluka: '' });

    if (!district) {
      return;
    }

    this.locationService.getTalukas(district.districtCd).subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : ((data as any)?.data ?? []);
        this.talukas.set(list);
      },
      error: (err) => {
        console.error('Failed to load talukas', err);
        this.talukas.set([]);
      },
    });
  }

  onRoleChange(roleCd: number): void {
    const role = this.roles().find((r) => r.roleCd === roleCd);
    this.form.patchValue({ roleName: role?.roleName ?? '' });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingPhoto.set(true);
    this.uploadService.uploadFile(file).subscribe({
      next: (uploadedPath) => {
        this.form.patchValue({ profilePhoto: uploadedPath });
        this.photoUrl.set(this.uploadService.getFileUrl(uploadedPath));
        this.uploadingPhoto.set(false);
      },
      error: () => this.uploadingPhoto.set(false),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const payload = this.form.getRawValue() as unknown as UserMaster;

    const request$ = this.isEdit() && payload.userCd
      ? this.userService.update(payload)
      : this.userService.save(payload);

    request$
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.router.navigate(['/admin/master/user']),
        error: (err) => console.error('Failed to save user', err),
      });
  }

  cancel(): void {
    this.router.navigate(['/admin/master/user']);
  }
}