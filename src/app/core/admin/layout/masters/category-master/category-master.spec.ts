import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { CategoryMasterComponent } from './category-master';
import { CategoryService } from '../../../../services/category.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('CategoryMasterComponent', () => {
  let component: CategoryMasterComponent;
  let categoryServiceMock: {
    getById: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let snackBarMock: { open: ReturnType<typeof vi.fn> };

  const mockCategory = {
    categoryCd: 1,
    categoryName: 'Fertilizers',
    categoryDesc: 'Organic fertilizers',
    displayOrder: 1,
    active: true,
  };

  const setupTest = (routeParamId?: string) => {
    categoryServiceMock = {
      getById: vi.fn().mockReturnValue(of(mockCategory)),
      save: vi.fn().mockReturnValue(of(mockCategory)),
      update: vi.fn().mockReturnValue(of(mockCategory)),
    };
    routerMock = { navigate: vi.fn() };
    snackBarMock = { open: vi.fn() };
    const activatedRouteMock = {
      snapshot: {
        paramMap: convertToParamMap(routeParamId ? { id: routeParamId } : {}),
      },
    };

    const injector = Injector.create({
      providers: [
        { provide: CategoryMasterComponent, useClass: CategoryMasterComponent },
        { provide: FormBuilder, useClass: FormBuilder },
        { provide: CategoryService, useValue: categoryServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    });

    component = injector.get(CategoryMasterComponent);
  };

  it('should initialize and load existing category in edit mode', () => {
    setupTest('1');
    component.ngOnInit();
    expect(component.isEdit()).toBe(true);
    expect(categoryServiceMock.getById).toHaveBeenCalledWith(1);
    expect(component.form.value.categoryName).toBe('Fertilizers');
    expect(component.form.value.displayOrder).toBe(1);
  });

  it('should update existing category on submit', () => {
    setupTest('1');
    component.ngOnInit();
    component.submit();
    expect(categoryServiceMock.update).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/master/category']);
  });

  it('should cancel and navigate back to category list', () => {
    setupTest();
    component.cancel();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/master/category']);
  });
});
