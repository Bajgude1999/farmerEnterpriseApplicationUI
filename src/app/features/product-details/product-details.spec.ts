// import { TestBed } from '@angular/core/testing';
// import { provideHttpClient } from '@angular/common/http';
// import { provideHttpClientTesting } from '@angular/common/http/testing';
// import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
// import { provideTranslateService } from '@ngx-translate/core';
// import { of } from 'rxjs';
// import { ProductDetailsComponent } from './product-details';
// import { ProductService } from '../../core/services/ product.service';
// import { AuthService } from '../../core/services/ auth.service';
// import { Product } from '../../core/models/product.model';

// const mockProduct: Product = {
//   id: 'p1', name: 'DAP Fertilizer', slug: 'dap', brand: 'Coromandel', category: 'fertilizers',
//   price: 1200, mrp: 1350, rating: 4.5, ratingCount: 88, stock: 3, unit: '50 kg bag',
//   images: [{ thumbnail: 'a.jpg', medium: 'a.jpg', large: 'a.jpg' }],
// };

// describe('ProductDetailsComponent', () => {
//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [ProductDetailsComponent],
//       providers: [
//         provideHttpClient(),
//         provideHttpClientTesting(),
//         provideRouter([]),
//         provideTranslateService(),
//         { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 'p1' })) } },
//       ],
//     }).compileComponents();
//   });

//   it('should load product and related products by id', () => {
//     const fixture = TestBed.createComponent(ProductDetailsComponent);
//     const productService = TestBed.inject(ProductService);
//     vi.spyOn(productService, 'getById').mockReturnValue(of(mockProduct));
//     vi.spyOn(productService, 'getRelated').mockReturnValue(of([]));

//     fixture.detectChanges();

//     expect(fixture.componentInstance.product()?.id).toBe('p1');
//   });

//   it('should not increase quantity beyond available stock', () => {
//     const fixture = TestBed.createComponent(ProductDetailsComponent);
//     const productService = TestBed.inject(ProductService);
//     vi.spyOn(productService, 'getById').mockReturnValue(of(mockProduct));
//     vi.spyOn(productService, 'getRelated').mockReturnValue(of([]));
//     fixture.detectChanges();

//     for (let i = 0; i < 10; i++) fixture.componentInstance.incrementQuantity();

//     expect(fixture.componentInstance.quantity()).toBe(mockProduct.stock);
//   });

//   it('should redirect a guest to login and remember the intended Buy Now action', () => {
//     const fixture = TestBed.createComponent(ProductDetailsComponent);
//     const productService = TestBed.inject(ProductService);
//     const auth = TestBed.inject(AuthService);
//     const router = TestBed.inject(Router);
//     vi.spyOn(productService, 'getById').mockReturnValue(of(mockProduct));
//     vi.spyOn(productService, 'getRelated').mockReturnValue(of([]));
//     fixture.detectChanges();

//     vi.spyOn(auth, 'isLoggedIn').mockReturnValue(false as any);
//     vi.spyOn(auth, 'setPendingAction').mockImplementation(() => {});
//     vi.spyOn(router, 'navigate').mockImplementation(async () => true);

//     fixture.componentInstance.buyNow();

//     expect(auth.setPendingAction).toHaveBeenCalledWith({ type: 'BUY_NOW', productId: 'p1', quantity: 1 });
//     expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/checkout' } });
//   });
// });