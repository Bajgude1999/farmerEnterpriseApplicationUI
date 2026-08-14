import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../app/core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../app/core/services/product.service';
import { Product } from '../../../core/models/product.model';

const mockProduct: Product = {
  id: 'p1', name: 'Urea', slug: 'urea', brand: 'IFFCO', category: 'fertilizers',
  price: 300, mrp: 300, rating: 4, ratingCount: 10, stock: 5, unit: 'bag', images: [],
};

describe('RegisterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    }).compileComponents();
  });

  it('should not submit an invalid form', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.form.invalid).toBeTrue();
  });

  it('should replay pending Buy Now action after registration and go to checkout', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const auth = TestBed.inject(AuthService);
    const cart = TestBed.inject(CartService);
    const productService = TestBed.inject(ProductService);
    const router = TestBed.inject(Router);

    spyOn(auth, 'register').and.returnValue(of({ token: 't', user: { id: 'u1', fullName: 'F', mobile: '9999999999', addresses: [] } }));
    spyOn(auth, 'consumePendingAction').and.returnValue({ type: 'BUY_NOW', productId: 'p1', quantity: 1 });
    spyOn(productService, 'getById').and.returnValue(of(mockProduct));
    spyOn(cart, 'addItem');
    spyOn(router, 'navigateByUrl');

    fixture.componentInstance.form.setValue({ fullName: 'Farmer Jones', mobile: '9999999999', email: '', password: 'secret1' });
    fixture.componentInstance.submit();

    expect(cart.addItem).toHaveBeenCalledWith(mockProduct, 1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/checkout');
  });
});