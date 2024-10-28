import { ValidatorFn } from "@angular/forms";

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'file' | 'password' | 'select' | 'textarea';
  value: any;
  validators?: ValidatorFn[];
  errorMessage?: string;
  options?: { value: string; label: string }[];
  onFileChange?: (event: Event) => void;
}
