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
import { CategoryService } from '../../../../services/category.service';

@Component({
  selector: 'app-category-master',
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
  templateUrl: './category-master.html',
  styleUrls: ['./category-master.scss'],
})
export class CategoryMasterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
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
      this.loadCategory(+id);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      categoryCd: [null],
      categoryName: ['', Validators.required],
      categoryDesc: [''],
      displayOrder: [null],
      active: [true],
    });
  }

  private loadCategory(id: number): void {
    this.categoryService.getById(id).subscribe({
      next: (cat) => {
        if (cat) {
          this.form.patchValue({
            categoryCd: cat.categoryCd,
            categoryName: cat.categoryName,
            categoryDesc: cat.categoryDesc,
            displayOrder: cat.displayOrder,
            active: cat.active ?? true,
          });
        }
      },
      error: () => {
        this.snackBar.open('Failed to load category', 'OK', { duration: 3000 });
      },
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const val = this.form.value;

    const req$ = this.isEdit()
      ? this.categoryService.update(val)
      : this.categoryService.save(val);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(
          this.isEdit() ? 'Category updated successfully' : 'Category saved successfully',
          'OK',
          { duration: 3000 }
        );
        this.router.navigate(['/admin/master/category']);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to save category', 'OK', { duration: 3000 });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/master/category']);
  }
}
