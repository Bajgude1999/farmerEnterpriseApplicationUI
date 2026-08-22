import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { BrandList } from './brand-list';
import { BrandService } from '../../../../services/brand.service';
import { UploadService } from '../../../../services/upload.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('BrandList Component', () => {
  let component: BrandList;
  let brandServiceMock: { getAll: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let uploadMock: { getFileUrl: ReturnType<typeof vi.fn> };
  let snackBarMock: { open: ReturnType<typeof vi.fn> };

  const mockBrands = [
    { brandCd: 1, brandName: 'Bayer', brandDesc: 'Agro chemicals', active: true },
    { brandCd: 2, brandName: 'Syngenta', brandDesc: 'Crop protection', active: true },
  ];

  beforeEach(() => {
    brandServiceMock = {
      getAll: vi.fn().mockReturnValue(of(mockBrands)),
      delete: vi.fn().mockReturnValue(of(undefined)),
    };
    routerMock = { navigate: vi.fn() };
    uploadMock = { getFileUrl: vi.fn((path) => `http://api/${path}`) };
    snackBarMock = { open: vi.fn() };

    const injector = Injector.create({
      providers: [
        { provide: BrandList, useClass: BrandList },
        { provide: BrandService, useValue: brandServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: UploadService, useValue: uploadMock },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    });

    component = injector.get(BrandList);
  });

  it('should load brands on init', () => {
    component.ngOnInit();
    expect(brandServiceMock.getAll).toHaveBeenCalled();
    expect(component.brands()).toEqual(mockBrands);
    expect(component.loading()).toBe(false);
  });

  it('should navigate to add brand page', () => {
    component.goToAdd();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/master/brand/add']);
  });

  it('should navigate to edit brand page', () => {
    component.goToEdit(mockBrands[0]);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/master/brand/edit', 1]);
  });
});
