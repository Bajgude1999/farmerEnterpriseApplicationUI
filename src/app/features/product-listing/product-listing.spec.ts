import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { ProductListing } from './product-listing';
import { ProductService } from '../../core/services/ product.service';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

describe('ProductListing Component — Route Handling & Stale Filter Resets', () => {
  let component: ProductListing;
  let productServiceMock: {
    list: ReturnType<typeof vi.fn>;
    searchProducts: ReturnType<typeof vi.fn>;
    getProductsByCategory: ReturnType<typeof vi.fn>;
    getProductsByBrand: ReturnType<typeof vi.fn>;
  };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let queryParamMapSubject: BehaviorSubject<any>;

  const mockProducts = [
    {
      id: '1',
      name: 'Organic Urea',
      price: 300,
      mrp: 350,
      rating: 4.5,
      ratingCount: 10,
      stock: 20,
      images: [{ thumbnail: 'urea.jpg', medium: 'urea.jpg', large: 'urea.jpg' }],
      category: 'Fertilizers',
      brand: 'UPL_LIMITED',
    },
    {
      id: '2',
      name: 'Wheat Seeds',
      price: 600,
      mrp: 700,
      rating: 4.8,
      ratingCount: 25,
      stock: 10,
      images: [{ thumbnail: 'wheat.jpg', medium: 'wheat.jpg', large: 'wheat.jpg' }],
      category: 'Seeds',
      brand: 'BAYER_CROPSCIENCE',
    },
  ];

  beforeEach(() => {
    queryParamMapSubject = new BehaviorSubject(convertToParamMap({}));

    productServiceMock = {
      list: vi.fn().mockReturnValue(
        of({
          items: mockProducts,
          total: 2,
          page: 1,
          pageSize: 12,
        })
      ),
      searchProducts: vi.fn().mockReturnValue(of([mockProducts[0]])),
      getProductsByCategory: vi.fn().mockReturnValue(of({ items: [mockProducts[0]], total: 1 })),
      getProductsByBrand: vi.fn().mockReturnValue(of({ items: [mockProducts[1]], total: 1 })),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    const injector = Injector.create({
      providers: [
        { provide: ProductListing, useClass: ProductListing },
        { provide: ProductService, useValue: productServiceMock },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: queryParamMapSubject.asObservable() },
        },
        { provide: Router, useValue: routerMock },
      ],
    });

    component = injector.get(ProductListing);
  });

  it('should load all products and reset stale filters on clean navigation (from Wishlist)', () => {
    // Set a dirty filter state first
    component.filter = {
      category: ['PESTICIDES'],
      brand: ['FMC_INDIA'],
      inStockOnly: true,
      minPrice: 1000,
      maxPrice: 5000,
      minRating: 4,
    };
    component.page.set(3);

    // Navigate to /products without query params (as from Continue Shopping)
    queryParamMapSubject.next(convertToParamMap({}));
    component.ngOnInit();

    expect(productServiceMock.list).toHaveBeenCalled();
    expect(component.products().length).toBe(2);
    expect(component.filter.category).toEqual([]);
    expect(component.filter.brand).toEqual([]);
    expect(component.page()).toBe(0);
    expect(component.loading()).toBe(false);
  });

  it('should call searchProducts when search keyword is in query params', () => {
    queryParamMapSubject.next(convertToParamMap({ keyword: 'urea' }));
    component.ngOnInit();

    expect(productServiceMock.searchProducts).toHaveBeenCalledWith('urea');
    expect(component.products().length).toBe(1);
    expect(component.products()[0].name).toBe('Organic Urea');
  });

  it('should call getProductsByCategory when categoryCd is in query params', () => {
    queryParamMapSubject.next(convertToParamMap({ categoryCd: '11' }));
    component.ngOnInit();

    expect(productServiceMock.getProductsByCategory).toHaveBeenCalledWith(11);
    expect(component.products().length).toBe(1);
  });

  it('should call getProductsByBrand when brandCd is in query params', () => {
    queryParamMapSubject.next(convertToParamMap({ brandCd: '2' }));
    component.ngOnInit();

    expect(productServiceMock.getProductsByBrand).toHaveBeenCalledWith(2);
    expect(component.products().length).toBe(1);
  });
});