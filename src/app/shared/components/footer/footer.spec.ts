import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { FooterComponent } from './footer';

describe('FooterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideRouter([]), provideTranslateService()],
    }).compileComponents();
  });

  it('should create and expose the current year', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    expect(fixture.componentInstance.year).toBe(new Date().getFullYear());
  });
});