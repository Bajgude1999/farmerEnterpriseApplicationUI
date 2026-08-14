// import { TestBed } from '@angular/core/testing';
// import { provideHttpClient } from '@angular/common/http';
// import { provideHttpClientTesting } from '@angular/common/http/testing';
// import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
// import { provideTranslateService } from '@ngx-translate/core';
// import { of } from 'rxjs';
// import { ProductListingComponent } from './product-listing';
// import { ProductService } from '../../core/services/ product.service';

// describe('ProductListingComponent', () => {
//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [ProductListingComponent],
//       providers: [
//         provideHttpClient(),
//         provideHttpClientTesting(),
//         provideRouter([]),
//         provideTranslateService(),
//         {
//           provide: ActivatedRoute,
//           useValue: { queryParamMap: of(convertToParamMap({ category: 'seeds' })) },
//         },
//       ],
//     }).compileComponents();
//   });

//   it('should apply category from query params and fetch products', () => {
//     const fixture = TestBed.createComponent(ProductListingComponent);
//     const productService = TestBed.inject(ProductService);
//     vi.spyOn(productService, 'list').mockReturnValue(of({ items: [], total: 0, page: 1, pageSize: 12 }));

//     fixture.detectChanges();

//     expect(fixture.componentInstance.filter.category).toEqual(['seeds']);
//     expect(productService.list).toHaveBeenCalled();
//   });

//   it('should reset page to 0 on sort change', () => {
//     const fixture = TestBed.createComponent(ProductListingComponent);
//     const productService = TestBed.inject(ProductService);
//     vi.spyOn(productService, 'list').mockReturnValue(of({ items: [], total: 0, page: 1, pageSize: 12 }));
//     fixture.detectChanges();

//     fixture.componentInstance.page.set(3);
//     fixture.componentInstance.onSortChange();

//     expect(fixture.componentInstance.page()).toBe(0);
//   });
// });