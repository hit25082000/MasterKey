import { ValidatorFn } from "@angular/forms";
import { EventEmitter } from "@angular/core";
import { ModalComponent } from "../components/modal/modal.component";

export interface ErrorMessages {
  [key: string]: string;
}

export interface ModalComponentBase {
  [key: string]: any;
  categorySelected?: EventEmitter<any>;
}

export interface ModalConfig {
  component: new (...args: any[]) => ModalComponentBase;
  inputs?: { [key: string]: any };
  outputs?: { [key: string]: (event: any) => void };
  displayValue?: string | (() => string);
  onSelect?: (value: string) => void;
  container?: any;
  modal?: ModalComponent;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'file' | 'password' | 'select' | 'textarea' | 'checkbox' | 'modal-select';
  value: any;
  validators?: ValidatorFn[];
  errorMessages?: ErrorMessages;
  options?: { value: string; label: string }[];
  onFileChange?: (event: Event) => void;
  modalConfig?: ModalConfig;
}
