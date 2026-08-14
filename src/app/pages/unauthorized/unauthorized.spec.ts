import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { UnauthorizedComponent } from './unauthorized';

describe('UnauthorizedComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [UnauthorizedComponent],
      providers: [provideRouter([]), provideTranslateService()],
    }).compileComponents();
    const fixture = TestBed.createComponent(UnauthorizedComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});