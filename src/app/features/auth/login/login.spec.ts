import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { LoginComponent } from './login';
import { AuthService } from '../../../core/services/ auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/ product.service';
import { Product } from '../../../core/models/product.model';

const mockProduct: Product = {
  id: 'p1',
  name: 'Urea',
  slug: 'urea',
  brand: 'IFFCO',
  category: 'fertilizers',
  price: 300,
  mrp: 300,
  rating: 4,
  ratingCount: 10,
  stock: 5,
  unit: 'bag',
  images: [],
};

describe('LoginComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should mark form invalid when fields are empty', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.submitPasswordLogin();
    expect(fixture.componentInstance.passwordForm.invalid).toBe(true);
  });

  it('should replay a pending Add to Cart action and navigate to /cart after login', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const auth = TestBed.inject(AuthService);
    const cart = TestBed.inject(CartService);
    const productService = TestBed.inject(ProductService);
    const router = TestBed.inject(Router);

    vi.spyOn(auth, 'login').mockReturnValue(
      of({ token: 't', user: { id: 'u1', fullName: 'F', mobile: '9999999999', addresses: [] } })
    );
    vi.spyOn(auth, 'consumePendingAction').mockReturnValue({ type: 'ADD_TO_CART', productId: 'p1', quantity: 1 });
    vi.spyOn(productService, 'getById').mockReturnValue(of(mockProduct));
    const addItemSpy = vi.spyOn(cart, 'addItem').mockImplementation(() => {});
    const navigateByUrlSpy = vi.spyOn(router, 'navigateByUrl').mockImplementation(async () => true);

    fixture.componentInstance.passwordForm.setValue({ identifier: '9999999999', password: 'secret1' });
    fixture.componentInstance.submitPasswordLogin();

    expect(addItemSpy).toHaveBeenCalledWith(mockProduct, 1);
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/cart');
  });
});