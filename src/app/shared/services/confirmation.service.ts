import { Injectable, signal } from '@angular/core';

export interface ConfirmationOptions {
  message: string;
  accept?: () => void;
  reject?: () => void;
  header?: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  visible = signal(false);
  options = signal<ConfirmationOptions | null>(null);

  confirm(options: ConfirmationOptions) {
    this.options.set(options);
    this.visible.set(true);
  }

  accept() {
    if (this.options()?.accept) {
      this.options()?.accept?.();
    }
    this.hide();
  }

  reject() {
    if (this.options()?.reject) {
      this.options()?.reject?.();
    }
    this.hide();
  }

  hide() {
    this.visible.set(false);
    this.options.set(null);
  }
}
