import { TestBed } from '@angular/core/testing';
import { StarRatingComponent } from './star-rating';

describe('StarRatingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StarRatingComponent] }).compileComponents();
  });

  it('should render 5 stars total', () => {
    const fixture = TestBed.createComponent(StarRatingComponent);
    fixture.componentInstance.rating = 3.5;
    fixture.detectChanges();
    expect(fixture.componentInstance.stars().length).toBe(5);
  });

  it('should show correct full/half/empty stars for 3.5 rating', () => {
    const fixture = TestBed.createComponent(StarRatingComponent);
    fixture.componentInstance.rating = 3.5;
    fixture.detectChanges();
    expect(fixture.componentInstance.stars()).toEqual(['star', 'star', 'star', 'star_half', 'star_border']);
  });
});