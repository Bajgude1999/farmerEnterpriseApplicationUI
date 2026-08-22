import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CategoryList } from './category-list';
import { CategoryService } from '../../../../services/category.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('CategoryList Component', () => {
  let component: CategoryList;
  let categoryServiceMock: { getAll: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let snackBarMock: { open: ReturnType<typeof vi.fn> };

  const mockCategories = [
    { categoryCd: 1, categoryName: 'Fertilizers', categoryDesc: 'Organic and chemical fertilizers', displayOrder: 1, active: true },
    { categoryCd: 2, categoryName: 'Pesticides', categoryDesc: 'Plant health products', displayOrder: 2, active: true },
  ];

  beforeEach(() => {
    categoryServiceMock = {
      getAll: vi.fn().mockReturnValue(of(mockCategories)),
      delete: vi.fn().mockReturnValue(of(undefined)),
    };
    routerMock = { navigate: vi.fn() };
    snackBarMock = { open: vi.fn() };

    const injector = Injector.create({
      providers: [
        { provide: CategoryList, useClass: CategoryList },
        { provide: CategoryService, useValue: categoryServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    });

    component = injector.get(CategoryList);
  });

  it('should load categories on init', () => {
    component.ngOnInit();
    expect(categoryServiceMock.getAll).toHaveBeenCalled();
    expect(component.categories()).toEqual(mockCategories);
    expect(component.loading()).toBe(false);
  });

  it('should navigate to add category page', () => {
    component.goToAdd();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/master/category/add']);
  });

  it('should navigate to edit category page', () => {
    component.goToEdit(mockCategories[0]);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/master/category/edit', 1]);
  });
});
