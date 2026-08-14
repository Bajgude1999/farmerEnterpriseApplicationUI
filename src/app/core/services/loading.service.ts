import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private activeRequests = signal(0);
  readonly isLoading = signal(false);

  start(): void {
    this.activeRequests.update((n) => n + 1);
    this.isLoading.set(true);
  }

  stop(): void {
    this.activeRequests.update((n) => Math.max(0, n - 1));
    this.isLoading.set(this.activeRequests() > 0);
  }
}