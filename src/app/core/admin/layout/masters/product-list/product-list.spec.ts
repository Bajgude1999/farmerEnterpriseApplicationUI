import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ProductList } from './product-list';
import { ProductService } from '../../../../services/ product.service';
import { Http } from '../../../../common/http';

describe('ProductList Component', () => {
  let component: ProductList;
  let productServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let httpMock: { getWithBlob: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

  const mockProducts = [
    {
      productCd: 101,
      productName: 'Organic Neem Oil',
      brandName: 'AgroStar',
      categoryName: 'Pesticides',
      mrp: 600,
      stockQty: 50,
    },
  ];

  beforeEach(() => {
    productServiceMock = {
      getAll: vi.fn().mockReturnValue(of(mockProducts)),
    };
    routerMock = {
      navigate: vi.fn(),
    };
    httpMock = {
      getWithBlob: vi.fn().mockReturnValue(of(new Blob())),
      post: vi.fn().mockReturnValue(of({ successRows: 1, errorRows: 0 })),
    };

    const injector = Injector.create({
      providers: [
        { provide: ProductList, useClass: ProductList },
        { provide: ProductService, useValue: productServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: Http, useValue: httpMock },
      ],
    });

    component = injector.get(ProductList);
  });

  it('should load all products on init via productService.getAll()', () => {
    component.ngOnInit();
    expect(productServiceMock.getAll).toHaveBeenCalled();
    expect(component.products().length).toBe(1);
    expect(component.products()[0].productName).toBe('Organic Neem Oil');
    expect(component.loading()).toBe(false);
  });

  it('should navigate to add product screen on goToAdd()', () => {
    component.goToAdd();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/master/product/add']);
  });

  it('should navigate to edit product screen with productCd on goToEdit()', () => {
    component.goToEdit(mockProducts[0] as any);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/master/product/edit', 101]);
  });
});
