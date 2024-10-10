import { Component, inject, input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <label>{{ label() }}</label>
    <input
      [type]="type()"
      [(ngModel)]="inputValue"
      (focus)="onTouched && onTouched()"
      (input)="onChange && onChange(inputValue)"
      [disabled]="isDisabled"
      [class.error]="shouldShowError()"
    />
    @if (shouldShowError()) {
    <div class="error-message" [@errorAnimation]>
      {{ getErrorMessage() }}
    </div>
    }
  `,
  styleUrl: './input.component.scss',
  animations: [
    trigger('errorAnimation', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'translateY(-10px)',
        })
      ),
      transition(':enter', [
        animate(
          '300ms ease-out',
          style({
            opacity: 1,
            transform: 'translateY(0)',
          })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-in',
          style({
            opacity: 0,
            transform: 'translateY(-10px)',
          })
        ),
      ]),
    ]),
  ],
})
export class InputComponent implements ControlValueAccessor {
  label = input.required<string>();
  type = input.required<string>();
  inputValue = '';

  private ngControl = inject(NgControl, { optional: true });
  protected onTouched?: () => void;
  protected onChange?: (value: string) => void;
  protected isDisabled = false;

  writeValue(obj: any): void {
    this.inputValue = obj;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  shouldShowError(): boolean {
    return !!(
      this.ngControl?.invalid &&
      (this.ngControl.touched || this.ngControl.dirty)
    );
  }

  getErrorMessage(): string {
    if (!this.ngControl || !this.ngControl.errors) return '';

    if (this.ngControl.errors['required']) {
      return `${this.label()} é obrigatório.`;
    }
    if (this.ngControl.errors['minlength']) {
      return `${this.label()} deve ter pelo menos ${
        this.ngControl.errors['minlength'].requiredLength
      } caracteres.`;
    }
    if (this.ngControl.errors['maxlength']) {
      return `${this.label()} não pode ter mais de ${
        this.ngControl.errors['maxlength'].requiredLength
      } caracteres.`;
    }
    if (this.ngControl.errors['email']) {
      return 'Por favor, insira um e-mail válido.';
    }

    // Mensagem genérica para outros tipos de erro
    return 'Este campo contém um erro.';
  }
}
