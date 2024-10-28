import { Component, Input, input, output, signal, effect } from '@angular/core';
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

  constructor(private fb: FormBuilder) {
    effect(() => {
      this.formConfig.set(this.config());
      this.initForm();
    });
  }

  trackByFn(index: number, item: FormFieldConfig): string {
    return item.name;
  }

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    const formGroupConfig: { [key: string]: any } = {};
    for (const field of this.formConfig()) {
      formGroupConfig[field.name] = [field.value || '', field.validators || []];
    }

    this.form.set(this.fb.group(formGroupConfig, {
      validators: this.hasPasswordFields() ? [passwordMatchValidator] : []
    }));
  }

  private hasPasswordFields(): boolean {
    return this.formConfig().some((field:any) => field.name === 'password') &&
           this.formConfig().some((field:any)  => field.name === 'confirmPassword');
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form().get(fieldName);
    if (control?.errors) {
      if (control.errors['passwordMismatch']) {
        return 'As senhas não coincidem';
      }
      return this.formConfig().find((f: any) => f.name === fieldName)?.errorMessage || 'Campo inválido';
    }
    return '';
  }

  onSubmit() {
    if (this.form().valid) {
      this.formSubmit.emit(this.form().value);
    }
  }
}
