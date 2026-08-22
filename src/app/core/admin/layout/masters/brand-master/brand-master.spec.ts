import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { BrandMasterComponent } from './brand-master';
import { BrandService } from '../../../../services/brand.service';
import { UploadService } from '../../../../services/upload.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('BrandMasterComponent', () => {
  let component: BrandMasterComponent;
  let brandServiceMock: {
    getById: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let uploadServiceMock: {
    uploadFile: ReturnType<typeof vi.fn>;
    getFileUrl: ReturnType<typeof vi.fn>;
  };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let snackBarMock: { open: ReturnType<typeof vi.fn> };

  const mockBrand = {
    brandCd: 1,
    brandName: 'Bayer',
    brandDesc: 'Agro chemicals',
    logo: 'uploads/bayer.png',
    active: true,
  };

  const setupTest = (routeParamId?: string) => {
    brandServiceMock = {
      getById: vi.fn().mockReturnValue(of(mockBrand)),
      save: vi.fn().mockReturnValue(of(mockBrand)),
      update: vi.fn().mockReturnValue(of(mockBrand)),
    };
    uploadServiceMock = {
      uploadFile: vi.fn().mockReturnValue(of('uploads/new-logo.png')),
      getFileUrl: vi.fn((path) => `http://api/${path}`),
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
        { provide: BrandMasterComponent, useClass: BrandMasterComponent },
        { provide: FormBuilder, useClass: FormBuilder },
        { provide: BrandService, useValue: brandServiceMock },
        { provide: UploadService, useValue: uploadServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    });

    component = injector.get(BrandMasterComponent);
  };

  it('should initialize and load existing brand in edit mode', () => {
    setupTest('1');
    component.ngOnInit();
    expect(component.isEdit()).toBe(true);
    expect(brandServiceMock.getById).toHaveBeenCalledWith(1);
    expect(component.form.value.brandName).toBe('Bayer');
    expect(component.logoUrl()).toBe('http://api/uploads/bayer.png');
  });

  it('should update existing brand on submit', () => {
    setupTest('1');
    component.ngOnInit();
    component.submit();
    expect(brandServiceMock.update).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/master/brand']);
  });

  it('should cancel and navigate back to brand list', () => {
    setupTest();
    component.cancel();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/master/brand']);
  });
});
