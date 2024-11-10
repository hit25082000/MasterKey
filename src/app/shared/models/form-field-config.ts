import { ValidatorFn } from "@angular/forms";

export interface ErrorMessages {
  [key: string]: string;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'file' | 'password' | 'select' | 'textarea';
  value: any;
  validators?: ValidatorFn[];
  errorMessages?: ErrorMessages;
  options?: { value: string; label: string }[];
  onFileChange?: (event: Event) => void;
}
