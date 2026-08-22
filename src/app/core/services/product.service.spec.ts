import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { ProductService } from './ product.service';
import { HttpClient } from '@angular/common/http';
import { Http } from '../common/http';
import { of } from 'rxjs';

describe('ProductService', () => {
  let service: ProductService;
  let httpClientMock: { get: ReturnType<typeof vi.fn> };
  let httpSecureMock: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };

  const mockProductList = [
    {
      productCd: 1,
      productName: 'Urea Fertilizer',
      categoryName: 'Fertilizers',
      brandName: 'UPL_LIMITED',
      sellingPrice: 400,
      mrp: 500,
      stockQty: 50,
      imagePath: 'https://example.com/urea.jpg',
      rating: 4.8,
      ratingCount: 120,
    },
    {
      productCd: 2,
      productName: 'Hybrid Cotton Seeds',
      categoryName: 'Seeds',
      brandName: 'BAYER_CROPSCIENCE',
      sellingPrice: 850,
      mrp: 1000,
      stockQty: 0,
      imagePath: '',
      rating: 4.2,
      ratingCount: 45,
    },
  ];

  beforeEach(() => {
    httpClientMock = {
      get: vi.fn().mockReturnValue(of({ data: mockProductList })),
    };
    httpSecureMock = {
      get: vi.fn().mockReturnValue(of([])),
      post: vi.fn().mockReturnValue(of({})),
      put: vi.fn().mockReturnValue(of({})),
    };

    const injector = Injector.create({
      providers: [
        { provide: ProductService, useClass: ProductService },
        { provide: HttpClient, useValue: httpClientMock },
        { provide: Http, useValue: httpSecureMock },
      ],
    });

    service = injector.get(ProductService);
  });

  it('should list all products from /v1/product/get-all with fallback image', () => {
    let result: any;
    service.list().subscribe((res) => (result = res));

    expect(httpClientMock.get).toHaveBeenCalledWith(expect.stringContaining('/v1/product/get-all'));
    expect(result.items.length).toBe(2);
    expect(result.total).toBe(2);
    expect(result.items[0].name).toBe('Urea Fertilizer');
    expect(result.items[0].imagePath).toBe('https://example.com/urea.jpg');
    // Fallback image for empty imagePath
    expect(result.items[1].imagePath).toBe('assets/images/logo.png');
  });

  it('should filter products by category and inStockOnly', () => {
    let result: any;
    service
      .list({ category: ['Fertilizers'], inStockOnly: true })
      .subscribe((res) => (result = res));

    expect(result.items.length).toBe(1);
    expect(result.items[0].name).toBe('Urea Fertilizer');
  });

  it('should sort products by PRICE_LOW_HIGH and PRICE_HIGH_LOW', () => {
    let ascResult: any;
    service.list({}, 'PRICE_LOW_HIGH').subscribe((res) => (ascResult = res));
    expect(ascResult.items[0].price).toBe(400);
    expect(ascResult.items[1].price).toBe(850);

    let descResult: any;
    service.list({}, 'PRICE_HIGH_LOW').subscribe((res) => (descResult = res));
    expect(descResult.items[0].price).toBe(850);
    expect(descResult.items[0].name).toBe('Hybrid Cotton Seeds');
  });

  it('should search products using /v1/product/search', () => {
    httpClientMock.get.mockReturnValue(of({ data: [mockProductList[0]] }));
    let result: any;
    service.searchProducts('urea').subscribe((res) => (result = res));

    expect(httpClientMock.get).toHaveBeenCalledWith(expect.stringContaining('/v1/product/search?keyword=urea'));
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Urea Fertilizer');
  });

  it('should get public product by id using raw HttpClient (unauthenticated getProduct/getById)', () => {
    httpClientMock.get.mockReturnValue(of({ data: [mockProductList[0]] }));
    let result: any;
    service.getProduct('1').subscribe((res) => (result = res));

    expect(httpClientMock.get).toHaveBeenCalledWith(expect.stringContaining('/v1/product/get/1'));
    expect(result.name).toBe('Urea Fertilizer');
  });

  it('should get authenticated product master detail using custom Http service (getProductMaster)', () => {
    httpSecureMock.get.mockReturnValue(of({ data: [mockProductList[0]] }));
    let result: any;
    service.getProductMaster(1).subscribe((res) => (result = res));

    expect(httpSecureMock.get).toHaveBeenCalledWith(expect.stringContaining('/v1/product/get/1'));
    expect(result.productName).toBe('Urea Fertilizer');
  });

  it('should call getAll using custom Http service (httpSecure)', () => {
    httpSecureMock.get.mockReturnValue(of({ data: mockProductList }));
    let result: any;
    service.getAll().subscribe((res) => (result = res));

    expect(httpSecureMock.get).toHaveBeenCalledWith(expect.stringContaining('/v1/product/get-all'));
    expect(result.length).toBe(2);
  });

  it('should call save using custom Http service (httpSecure)', () => {
    service.save({ productCd: 1 } as any).subscribe();
    expect(httpSecureMock.put).toHaveBeenCalledWith(expect.stringContaining('/v1/product/update'), expect.anything());

    service.save({ productCd: null } as any).subscribe();
    expect(httpSecureMock.post).toHaveBeenCalledWith(expect.stringContaining('/v1/product/save'), expect.anything());
  });
});
