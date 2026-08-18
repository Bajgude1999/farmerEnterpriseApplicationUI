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
//import { RoleOption } from '../../../../models/';
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
    userId: [null as number | null],
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
     this.locationService.getStates().subscribe({
      next: (data) => {
        this.states.set(data);
      },
      error: (err) => {
        console.error('Failed to load states', err);
      },
    });
    this.roleService.getAll().subscribe({
      next: (roles) => this.roles.set(roles),
      error: () => this.roles.set([]),
    });

    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.isEdit.set(true);
      this.loadUser(Number(userId));
    }
  }
private loadUser(userId: number): void {
  this.userService.getById(userId).subscribe({
    next: (user) => {
      // Patch user details
      this.form.patchValue(user);

      // Profile photo
      this.photoUrl.set(
        this.uploadService.getFileUrl(user.profilePhoto)
      );

      // Find selected state
      const state = this.states().find(
        (s: State) => s.stateName === user.state
      );

      if (!state) {
        this.districts.set([]);
        this.talukas.set([]);
        return;
      }

      // Load districts for selected state
      this.locationService.getDistricts(state.stateCd).subscribe({
        next: (districts: District[]) => {
          this.districts.set(districts);

          // Find selected district
          const district = districts.find(
            (d: District) => d.districtName === user.district
          );

          if (!district) {
            this.talukas.set([]);
            return;
          }

          // Load talukas for selected district
          this.locationService.getTalukas(district.districtCd).subscribe({
            next: (talukas: Taluka[]) => {
              this.talukas.set(talukas);
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
    },
    error: (err) => {
      console.error('Failed to load user', err);
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

  const stateCd = state.stateCd;    // Clear districts and talukas
    this.districts.set([]);
    this.talukas.set([]);

    // Clear form values
    this.form.patchValue({ district: '', taluka: '' });

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
    this.form.patchValue({ taluka: '' });

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

    this.userService
      .save(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.router.navigate(['/admin/master/user']),
      });
  }

  cancel(): void {
    this.router.navigate(['/admin/master/user']);
  }
}