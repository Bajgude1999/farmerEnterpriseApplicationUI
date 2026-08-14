import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ProductCard } from './product-card';
import { AuthService } from '../../../core/services/ auth.service';
import { CartService } from '../../../core/services/cart.service';
import { Product } from '../../../core/models/product.model';

const mockProduct: Product = {
  id: 'p1',
  name: 'Urea 50kg Bag',
  slug: 'urea-50kg',
  brand: 'IFFCO',
  category: 'fertilizers',
  price: 300,
  mrp: 350,
  rating: 4.2,
  ratingCount: 120,
  stock: 25,
  unit: '50 kg bag',
  images: [{ thumbnail: 'a.jpg', medium: 'a.jpg', large: 'a.jpg' }],
};

describe('ProductCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCard],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideTranslateService()],
    }).compileComponents();
  });

  it('should compute discount percent', () => {
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentInstance.product = mockProduct;
    expect(fixture.componentInstance.discountPercent).toBe(14);
  });

  it('should redirect guest to login and store pending action on Add to Cart', () => {
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentInstance.product = mockProduct;
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    vi.spyOn(auth, 'isLoggedIn').mockReturnValue(false as any);
    vi.spyOn(auth, 'setPendingAction').mockImplementation(() => {});
    vi.spyOn(router, 'navigate').mockImplementation(async () => true);

    fixture.componentInstance.addToCart();

    expect(auth.setPendingAction).toHaveBeenCalledWith({ type: 'ADD_TO_CART', productId: 'p1', quantity: 1 });
    expect(router.navigate).toHaveBeenCalled();
  });

  it('should add directly to cart when already logged in', () => {
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentInstance.product = mockProduct;
    const auth = TestBed.inject(AuthService);
    const cart = TestBed.inject(CartService);
    vi.spyOn(auth, 'isLoggedIn').mockReturnValue(true as any);
    vi.spyOn(cart, 'addItem').mockImplementation(() => {});

    fixture.componentInstance.addToCart();

    expect(cart.addItem).toHaveBeenCalledWith(mockProduct, 1);
  });
});