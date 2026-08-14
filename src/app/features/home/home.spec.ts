// import { TestBed } from '@angular/core/testing';
// import { provideHttpClient } from '@angular/common/http';
// import { provideHttpClientTesting } from '@angular/common/http/testing';
// import { provideRouter } from '@angular/router';
// import { provideTranslateService } from '@ngx-translate/core';
// import { of } from 'rxjs';
// import { HomeComponent } from './home';
// import { ProductService } from '../../core/services/ product.service';

// describe('HomeComponent', () => {
//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [HomeComponent],
//       providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideTranslateService()],
//     }).compileComponents();
//   });

//   it('should load home sections on init', () => {
//     const fixture = TestBed.createComponent(HomeComponent);
//     const productService = TestBed.inject(ProductService);
//     vi.spyOn(productService, 'getHomeSections').mockReturnValue(
//       of({ featured: [], trending: [], recentlyAdded: [], bestSellers: [] })
//     );

//     fixture.detectChanges();

//     expect(fixture.componentInstance.loading()).toBe(false);
//   });
// });