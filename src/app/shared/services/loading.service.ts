import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingStack = signal<number>(0);
  public isLoading = computed(() => this.loadingStack() > 0);

  show(): void {
    this.loadingStack.update(count => count + 1);
  }

  hide(): void {
    this.loadingStack.update(count => Math.max(0, count - 1));
  }
}
