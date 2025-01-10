import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loading = signal(false);

  isLoading() {
    return this.loading();
  }

  show() {
    queueMicrotask(() => this.loading.set(true));
  }

  hide() {
    queueMicrotask(() => this.loading.set(false));
  }
}
