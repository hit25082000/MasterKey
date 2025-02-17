import { AbstractControl, ValidationErrors } from '@angular/forms';

export function ValidatorPassword(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (!value) {
    return null;
  }

  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  const isLengthValid = value.length >= 8;

  const passwordErrors: ValidationErrors = {};

  if (!hasUpperCase) {
    passwordErrors['noUpperCase'] = true;
  }

  if (!hasLowerCase) {
    passwordErrors['noLowerCase'] = true;
  }

  if (!hasNumber) {
    passwordErrors['noNumber'] = true;
  }

  if (!hasSpecialChar) {
    passwordErrors['noSpecialChar'] = true;
  }

  if (!isLengthValid) {
    passwordErrors['minLength'] = true;
  }

  return Object.keys(passwordErrors).length > 0 ? passwordErrors : null;
} 