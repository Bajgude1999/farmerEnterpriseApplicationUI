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
import { INDIA_LOCATIONS, DistrictOption } from '../../../../data/india-locations';

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

  isEdit = signal(false);
  saving = signal(false);
  uploadingPhoto = signal(false);

  states = INDIA_LOCATIONS;
  roles = signal<RoleOption[]>([]);
  districts = signal<DistrictOption[]>([]);
  talukas = signal<string[]>([]);

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
    this.userService.getById(userId).subscribe((user) => {
      this.form.patchValue(user);
      this.photoUrl.set(this.uploadService.getFileUrl(user.profilePhoto));

      const state = this.states.find((s) => s.name === user.state);
      this.districts.set(state?.districts ?? []);
      const district = state?.districts.find((d) => d.name === user.district);
      this.talukas.set(district?.talukas ?? []);
    });
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