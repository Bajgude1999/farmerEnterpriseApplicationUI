import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { UnitService } from '../../../../services/unit.service';

@Component({
  selector: 'app-unit-master',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSnackBarModule,
    TranslatePipe,
  ],
  templateUrl: './unit-master.html',
  styleUrls: ['./unit-master.scss'],
})
export class UnitMasterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private unitService = inject(UnitService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  isEdit = signal(false);
  saving = signal(false);

  ngOnInit(): void {
    this.initForm();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.loadUnit(+id);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      unitCd: [null],
      unitName: ['', Validators.required],
      unitShortName: [''],
      active: [true],
    });
  }

  private loadUnit(id: number): void {
    this.unitService.getById(id).subscribe({
      next: (unit) => {
        if (unit) {
          this.form.patchValue({
            unitCd: unit.unitCd,
            unitName: unit.unitName,
            unitShortName: unit.unitShortName,
            active: unit.active ?? true,
          });
        }
      },
      error: () => {
        this.snackBar.open('Failed to load unit', 'OK', { duration: 3000 });
      },
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const val = this.form.value;

    const req$ = this.isEdit()
      ? this.unitService.update(val)
      : this.unitService.save(val);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(
          this.isEdit() ? 'Unit updated successfully' : 'Unit saved successfully',
          'OK',
          { duration: 3000 }
        );
        this.router.navigate(['/admin/master/unit']);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to save unit', 'OK', { duration: 3000 });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/master/unit']);
  }
}
