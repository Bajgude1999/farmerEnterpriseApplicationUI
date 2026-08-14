import { TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner';
import { LoadingService } from '../../../core/services/loading.service';

describe('LoadingSpinnerComponent', () => {
  it('should show progress bar only when loading is active', () => {
    TestBed.configureTestingModule({ imports: [LoadingSpinnerComponent] });
    const fixture = TestBed.createComponent(LoadingSpinnerComponent);
    const loadingService = TestBed.inject(LoadingService);

    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-progress-bar')).toBeFalsy();

    loadingService.start();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-progress-bar')).toBeTruthy();
  });
});