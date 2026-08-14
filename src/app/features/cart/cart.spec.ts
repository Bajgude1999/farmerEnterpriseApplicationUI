import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { CartComponent } from './cart';
import { AuthService } from '../../core/services/ auth.service';

describe('CartComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartComponent],
      providers: [provideRouter([]), provideTranslateService()],
    }).compileComponents();
  });

  it('should redirect guests to login with returnUrl=/checkout', () => {
    const fixture = TestBed.createComponent(CartComponent);
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    vi.spyOn(auth, 'isLoggedIn').mockReturnValue(false as any);
    vi.spyOn(router, 'navigate').mockImplementation(async () => true);

    fixture.componentInstance.goToCheckout();

    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/checkout' } });
  });

  it('should go straight to checkout when logged in', () => {
    const fixture = TestBed.createComponent(CartComponent);
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    vi.spyOn(auth, 'isLoggedIn').mockReturnValue(true as any);
    vi.spyOn(router, 'navigate').mockImplementation(async () => true);

    fixture.componentInstance.goToCheckout();

    expect(router.navigate).toHaveBeenCalledWith(['/checkout']);
  });
});