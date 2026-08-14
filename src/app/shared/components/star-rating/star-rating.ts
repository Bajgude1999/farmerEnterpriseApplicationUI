import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'fp-star-rating',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './star-rating.html',
  styleUrl: './star-rating.scss',
})
export class StarRatingComponent {
  private ratingSignal = signal(0);

  @Input() set rating(value: number) {
    this.ratingSignal.set(value);
  }
  @Input() count?: number;

  readonly stars = computed(() =>
    Array.from({ length: 5 }, (_, i) => {
      const diff = this.ratingSignal() - i;
      if (diff >= 1) return 'star';
      if (diff >= 0.5) return 'star_half';
      return 'star_border';
    })
  );
}