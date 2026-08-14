import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { EmptyState } from './empty-state';

describe('EmptyStateComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyState],
      providers: [provideTranslateService()],
    }).compileComponents();
  });

  it('should render provided icon', () => {
    const fixture = TestBed.createComponent(EmptyState);
    fixture.componentInstance.icon = 'shopping_cart';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-icon').textContent).toContain('shopping_cart');
  });
});