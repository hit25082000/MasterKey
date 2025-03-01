import { Component, input, output, signal, effect } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { passwordMatchValidator } from '../../Validators/password-math.validator';
import { FormFieldConfig } from '../../models/form-field-config';

@Component({
  selector: 'app-generic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './generic-form.component.html',
  styleUrls: ['./generic-form.component.scss']
})
export class GenericFormComponent {
  formConfig = signal<FormFieldConfig[]>([]);
  form = signal<FormGroup>(new FormGroup({}));
  submitButtonText = input('Salvar');
  formSubmit = output<any>();
  config = input<FormFieldConfig[]>([]);
  submitted = signal(false);
  formTitle = input.required<string>();

  constructor(private fb: FormBuilder) {
    effect(() => {
      const newConfig = this.config();
      if (newConfig.length > 0) {
        queueMicrotask(() => {
          this.formConfig.set(newConfig);
          this.initForm();
        });
      }
    });
  }

  trackByFn(index: number, item: FormFieldConfig): string {
    return item.name;
  }

  private initForm() {
    const formGroupConfig: { [key: string]: any } = {};


    for (const field of this.formConfig()) {
      // Não define valor inicial para campos do tipo file
      const value = field.type === 'file' ? null : (field.value !== undefined ? field.value : '');
      formGroupConfig[field.name] = [value, field.validators || []];

    }

    const newForm = this.fb.group(formGroupConfig, {
      validators: this.hasPasswordFields() ? [passwordMatchValidator] : []
    });

    queueMicrotask(() => {
      this.form.set(newForm);
    });
  }

  private hasPasswordFields(): boolean {
    return this.formConfig().some(field => field.name === 'password') &&
           this.formConfig().some(field => field.name === 'confirmPassword');
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form().get(fieldName);
    const field = this.formConfig().find(f => f.name === fieldName);

    if (control?.errors && field?.errorMessages) {
      // Verifica primeiro o erro de senha
      if (control.errors['passwordMismatch']) {
        return 'As senhas não coincidem';
      }

      // Procura pela primeira chave de erro presente no control.errors
      const errorKey = Object.keys(control.errors)[0];

      // Retorna a mensagem específica para esse erro se existir
      if (field.errorMessages[errorKey]) {
        return field.errorMessages[errorKey];
      }
    }

    return 'Campo inválido';
  }

  onSubmit() {
    this.submitted.set(true);
    if (this.form().valid) {
      this.formSubmit.emit(this.form().value);
    } else {
      this.markAllFieldsAsTouched();
    }
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.form().controls).forEach(key => {
      const control = this.form().get(key);
      control?.markAsTouched();
    });
  }

  shouldBeMediumWidth(fieldName: string): boolean {
    const mediumWidthFields = [
      'email',
      'street',
      'responsible'
    ];
    return mediumWidthFields.includes(fieldName);
  }

  shouldBeLargeWidth(fieldName: string): boolean {
    const largeWidthFields = [
      'description'
    ];
    return largeWidthFields.includes(fieldName);
  }

  getFieldClass(field: FormFieldConfig): string {
    if (field.type === 'textarea') return 'large-width';
    if (this.shouldBeLargeWidth(field.name)) return 'large-width';
    if (this.shouldBeMediumWidth(field.name)) return 'medium-width';
    return '';
  }

  isOptionSelected(fieldName: string, value: string): boolean {
    const control = this.form().get(fieldName);
    if (!control) return false;

    const selectedValues = control.value as string[];
    return selectedValues?.includes(value) || false;
  }

  toggleOption(fieldName: string, value: string): void {
    const control = this.form().get(fieldName);
    if (!control) return;

    const currentValues = (control.value as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    control.setValue(newValues);
    control.markAsTouched();
  }
}
