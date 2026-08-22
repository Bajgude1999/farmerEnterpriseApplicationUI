import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ProductDetails } from './product-details';
import { ProductService } from '../../core/services/ product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/ auth.service';
import { Product } from '../../core/models/product.model';

const mockProduct: Product = {
  id: '101',
  name: 'Bio Urea Fertilizer',
  productName: 'Bio Urea Fertilizer',
  slug: 'bio-urea-fertilizer',
  brand: 'UPL_LIMITED',
  brandName: 'UPL_LIMITED',
  category: 'Fertilizers',
  price: 450,
  mrp: 500,
  rating: 4.8,
  ratingCount: 120,
  stock: 15,
  unit: '50 kg bag',
  images: [{ thumbnail: 'a.jpg', medium: 'a.jpg', large: 'a.jpg' }],
  packsizes: [
    {
      packPriceId: 1,
      productCd: 101,
      sellingPrice: 450,
      mrpPrice: 500,
      packSize: 50,
      unitCd: 1,
      unitName: 'kg bag',
      inStock: true,
      defaultYn: true,
      active: true,
    },
  ],
};

describe('ProductDetails Component — Public Loading & Pack Selection', () => {
  let component: ProductDetails;
  let productServiceMock: {
    getById: ReturnType<typeof vi.fn>;
    getRelated: ReturnType<typeof vi.fn>;
  };
  let cartServiceMock: { addItem: ReturnType<typeof vi.fn> };
  let authServiceMock: { isLoggedIn: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    productServiceMock = {
      getById: vi.fn().mockReturnValue(of(mockProduct)),
      getRelated: vi.fn().mockReturnValue(of([])),
    };
    cartServiceMock = {
      addItem: vi.fn(),
    };
    authServiceMock = {
      isLoggedIn: vi.fn().mockReturnValue(false),
    };
    routerMock = {
      navigate: vi.fn(),
    };

    const activatedRouteMock = {
      paramMap: of(convertToParamMap({ id: '101' })),
    };

    const injector = Injector.create({
      providers: [
        { provide: ProductDetails, useClass: ProductDetails },
        { provide: ProductService, useValue: productServiceMock },
        { provide: CartService, useValue: cartServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    });

    component = injector.get(ProductDetails);
  });

  it('should load public product details by id using productService.getById', () => {
    component.ngOnInit();

    expect(productServiceMock.getById).toHaveBeenCalledWith('101');
    expect(component.product()?.name).toBe('Bio Urea Fertilizer');
    expect(component.loading()).toBe(false);
    expect(component.selectedPackSize()?.packPriceId).toBe(1);
    expect(component.getSelectedPrice()).toBe(450);
  });

  it('should calculate discount percent and stock availability accurately', () => {
    component.ngOnInit();

    expect(component.getDiscountPercent()).toBe(10);
    expect(component.isSelectedPackInStock()).toBe(true);
  });

  it('should increment and decrement quantity within stock bounds', () => {
    component.ngOnInit();
    expect(component.quantity()).toBe(1);

    component.incrementQuantity();
    expect(component.quantity()).toBe(2);

    component.decrementQuantity();
    expect(component.quantity()).toBe(1);

    // cannot decrement below 1
    component.decrementQuantity();
    expect(component.quantity()).toBe(1);
  });

  it('should add item to cart and update isInCart flag', () => {
    component.ngOnInit();
    component.addToCart();

    expect(cartServiceMock.addItem).toHaveBeenCalledWith(component.product(), 1);
    expect(component.isInCart).toBe(true);
  });
});