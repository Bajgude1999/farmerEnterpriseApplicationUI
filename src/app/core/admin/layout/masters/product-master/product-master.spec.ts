import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ProductMasterComponent } from './product-master';
import { ProductService } from '../../../../services/ product.service';
import { CategoryService } from '../../../../services/category.service';
import { BrandService } from '../../../../services/brand.service';
import { UnitService } from '../../shared/unit.service';
import { UploadService } from '../../../../services/upload.service';
import { ToastService } from '../../../../services/toast.service';

describe('ProductMasterComponent — Navigation & Load by ProductCd', () => {
  let component: ProductMasterComponent;
  let productServiceMock: {
    getByProductCd: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let categoryServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let brandServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let unitServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let uploadServiceMock: { getFileUrl: ReturnType<typeof vi.fn>; uploadFileWithPayload: ReturnType<typeof vi.fn> };
  let toastServiceMock: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const mockProductMaster = {
    productCd: 101,
    productName: 'Organic Neem Oil',
    productDesc: 'Natural pesticide',
    categoryCd: 1,
    categoryName: 'Pesticides',
    brandCd: 2,
    brandName: 'AgroStar',
    unitCd: 3,
    unitName: 'Litre',
    hsnCode: '38089190',
    mrp: 600,
    sellingPrice: 500,
    purchasePrice: 350,
    stockQty: 50,
    minStockQty: 5,
    gstPercent: 18,
    active: true,
    productTaxMstDtos: [
      { productTaxCd: 1, productCd: 101, taxName: 'CGST', taxRate: 9, active: true },
      { productTaxCd: 2, productCd: 101, taxName: 'SGST', taxRate: 9, active: true },
    ],
    packsizes: [
      {
        packPriceId: 1,
        productCd: 101,
        sellingPrice: 500,
        mrpPrice: 600,
        packSize: 1,
        unitCd: 3,
        unitName: 'Litre',
        inStock: true,
        defaultYn: true,
        active: true,
      },
    ],
    imagePath: 'products/neem.jpg',
  };

  const setupTest = (routeParamId: string | null) => {
    productServiceMock = {
      getProductMaster: vi.fn().mockReturnValue(of(mockProductMaster)),
      save: vi.fn().mockReturnValue(of({ status: 'SUCCESS', message: 'Product saved' })),
    };
    categoryServiceMock = {
      getAll: vi.fn().mockReturnValue(of([{ categoryCd: 1, categoryName: 'Pesticides' }])),
    };
    brandServiceMock = {
      getAll: vi.fn().mockReturnValue(of([{ brandCd: 2, brandName: 'AgroStar' }])),
    };
    unitServiceMock = {
      getAll: vi.fn().mockReturnValue(of([{ unitCd: 3, unitName: 'Litre' }])),
    };
    uploadServiceMock = {
      getFileUrl: vi.fn().mockReturnValue('http://localhost/images/neem.jpg'),
      uploadFileWithPayload: vi.fn().mockReturnValue(of('products/neem.jpg')),
    };
    toastServiceMock = {
      success: vi.fn(),
      error: vi.fn(),
    };
    routerMock = {
      navigate: vi.fn(),
    };

    const activatedRouteMock = {
      snapshot: {
        paramMap: convertToParamMap(routeParamId ? { id: routeParamId } : {}),
      },
    };

    const injector = Injector.create({
      providers: [
        { provide: ProductMasterComponent, useClass: ProductMasterComponent },
        { provide: FormBuilder, useClass: FormBuilder },
        { provide: ProductService, useValue: productServiceMock },
        { provide: CategoryService, useValue: categoryServiceMock },
        { provide: BrandService, useValue: brandServiceMock },
        { provide: UnitService, useValue: unitServiceMock },
        { provide: UploadService, useValue: uploadServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    });

    component = injector.get(ProductMasterComponent);
  };

  it('should load product details when navigated with route id (edit mode)', () => {
    setupTest('101');
    component.ngOnInit();

    expect(component.isEdit()).toBe(true);
    expect(productServiceMock.getProductMaster).toHaveBeenCalledWith(101);
    expect(component.form.controls.productName.value).toBe('Organic Neem Oil');
    expect(component.form.controls.categoryName.value).toBe('Pesticides');
    expect(component.taxRows.length).toBe(2);
    expect(component.packRows.length).toBe(1);
    expect(component.imagePreviewUrl()).toBe('http://localhost/images/neem.jpg');
  });

  it('should mark productName as touched and NOT call save API when productName is empty', () => {
    setupTest(null);
    component.ngOnInit();
    component.form.controls.productName.setValue('');

    component.submit();

    expect(component.form.invalid).toBe(true);
    expect(component.form.controls.productName.hasError('required')).toBe(true);
    expect(component.form.controls.productName.touched).toBe(true);
    expect(productServiceMock.save).not.toHaveBeenCalled();
  });

  it('should call save API when productName is valid', () => {
    setupTest(null);
    component.ngOnInit();
    component.form.controls.productName.setValue('Bio Liquid Fertilizer');

    component.submit();

    expect(component.form.valid).toBe(true);
    expect(productServiceMock.save).toHaveBeenCalled();
  });
});
