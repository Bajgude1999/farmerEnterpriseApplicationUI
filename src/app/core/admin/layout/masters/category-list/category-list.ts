import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { CategoryService } from '../../../../services/category.service';
import { Category } from '../../../../models/category.model';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    TranslatePipe,
  ],
  templateUrl: './category-list.html',
  styleUrls: ['./category-list.scss', '../../shared/admin-table.scss'],
})
export class CategoryList implements OnInit {
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  categories = signal<Category[]>([]);
  loading = signal(true);
  columns = ['categoryName', 'categoryDesc', 'displayOrder', 'active', 'actions'];

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToAdd(): void {
    this.router.navigate(['/admin/master/category/add']);
  }

  goToEdit(category: Category): void {
    this.router.navigate(['/admin/master/category/edit', category.categoryCd]);
  }

  deleteCategory(category: Category): void {
    if (!category.categoryCd) return;
    if (confirm(`Are you sure you want to delete category "${category.categoryName}"?`)) {
      this.categoryService.delete(category.categoryCd).subscribe({
        next: () => {
          this.snackBar.open('Category deleted successfully', 'OK', { duration: 3000 });
          this.loadCategories();
        },
        error: () => {
          this.snackBar.open('Failed to delete category', 'OK', { duration: 3000 });
        },
      });
    }
  }
}
