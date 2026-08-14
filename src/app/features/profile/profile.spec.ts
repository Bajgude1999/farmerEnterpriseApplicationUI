// import { TestBed } from '@angular/core/testing';
// import { provideHttpClient } from '@angular/common/http';
// import { provideHttpClientTesting } from '@angular/common/http/testing';
// import { provideRouter, Router } from '@angular/router';
// import { provideTranslateService } from '@ngx-translate/core';
// import { ProfileComponent } from './profile';
// import { AuthService } from '../../core/services/ auth.service';

// describe('ProfileComponent', () => {
//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [ProfileComponent],
//       providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideTranslateService()],
//     }).compileComponents();
//   });

//   it('should not save an invalid profile form', () => {
//     const fixture = TestBed.createComponent(ProfileComponent);
//     fixture.componentInstance.profileForm.controls.mobile.setValue('123');
//     fixture.componentInstance.saveProfile();
//     expect(fixture.componentInstance.profileForm.invalid).toBe(true);
//   });

//   it('should log out and navigate home', () => {
//     const fixture = TestBed.createComponent(ProfileComponent);
//     const auth = TestBed.inject(AuthService);
//     const router = TestBed.inject(Router);
//     vi.spyOn(auth, 'logout').mockImplementation(() => {});
//     vi.spyOn(router, 'navigate').mockImplementation(async () => true);

//     fixture.componentInstance.logout();

//     expect(auth.logout).toHaveBeenCalled();
//     expect(router.navigate).toHaveBeenCalledWith(['/']);
//   });
// });