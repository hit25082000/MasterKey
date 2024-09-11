import { CommonModule } from '@angular/common';
import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-day-week-selector',
  templateUrl: './day-week-selector.component.html',
  styleUrls: ['./day-week-selector.component.scss'],
  standalone: true,
  imports:[ReactiveFormsModule, CommonModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DayWeekSelectorComponent),
    multi: true
  }]
})
export class DayWeekSelectorComponent implements ControlValueAccessor {
  weekDays: string[] = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  selectedDays: string[] = [];

  onChange = (days: string[]) => {};
  onTouched = () => {};

  writeValue(value: string[]): void {
    if (value) {
      this.selectedDays = value;
    }
  }

  registerOnChange(fn: (days: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  toggleDaySelection(day: string): void {
    if (this.selectedDays.includes(day)) {
      this.selectedDays = this.selectedDays.filter(d => d !== day);
    } else {
      this.selectedDays.push(day);
    }
    this.onChange(this.selectedDays);
  }

  isDaySelected(day: string): boolean {
    return this.selectedDays.includes(day);
  }
}
