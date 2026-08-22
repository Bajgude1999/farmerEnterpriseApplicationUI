import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector } from '@angular/core';
import { WishlistComponent } from './wishlist';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/ auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('WishlistComponent — Products Display & Continue Shopping', () => {
  let component: WishlistComponent;
  let wishlistServiceMock: {
    getWishlist: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let authServiceMock: {
    userCd: ReturnType<typeof vi.fn>;
  };
  let toastServiceMock: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    wishlistServiceMock = {
      getWishlist: vi.fn().mockReturnValue(
        of({
          data: [
            {
              wishlistCd: 1,
              userCd: 55,
              productCd: 101,
              productName: 'Organic Seeds',
              saleRate: 450,
              brandName: 'Velnexa',
              availableQty: 20,
              profilePhoto: 'https://example.com/seeds.jpg',
            },
            {
              wishlistCd: 2,
              userCd: 55,
              productCd: 102,
              productName: 'Bio Fertilizer',
              saleRate: 320,
              brandName: 'AgroStar',
              availableQty: 15,
              profilePhoto: 'https://example.com/fertilizer.jpg',
            },
          ],
        })
      ),
      remove: vi.fn().mockReturnValue(of({})),
    };
    authServiceMock = {
      userCd: vi.fn().mockReturnValue(55),
    };
    toastServiceMock = {
      success: vi.fn(),
      error: vi.fn(),
    };
    routerMock = {
      navigate: vi.fn(),
    };

    const injector = Injector.create({
      providers: [
        { provide: WishlistComponent, useClass: WishlistComponent },
        { provide: WishlistService, useValue: wishlistServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    component = injector.get(WishlistComponent);
  });

  it('should load ALL wishlist products (not just the first one)', () => {
    component.ngOnInit();
    expect(wishlistServiceMock.getWishlist).toHaveBeenCalledWith(55);
    expect(component.items().length).toBe(2);
    expect(component.items()[0].name).toBe('Organic Seeds');
    expect(component.items()[1].name).toBe('Bio Fertilizer');
  });

  it('should navigate to /products when continueShopping() is invoked', () => {
    component.continueShopping();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('should remove product from wishlist and update signal list', () => {
    component.ngOnInit();
    const item = component.items()[0];

    component.removeItem(item);

    expect(wishlistServiceMock.remove).toHaveBeenCalledWith(1);
    expect(component.items().length).toBe(1);
    expect(component.items()[0].wishlistCd).toBe(2);
    expect(toastServiceMock.success).toHaveBeenCalledWith('Item removed from wishlist');
  });

  it('should display empty list when user is not logged in or has 0 items', () => {
    authServiceMock.userCd.mockReturnValue(null);
    component.loadWishlist();
    expect(component.items().length).toBe(0);
    expect(component.loading()).toBe(false);
  });
});
