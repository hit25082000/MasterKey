import { EmployeeService } from './../../../employees/services/employee.service';
import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, input, inject, forwardRef } from '@angular/core';
import BaseUser from '../../../../core/models/base-user.model';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-teacher-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-selector.component.html',
  styleUrls: ['./teacher-selector.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => TeacherSelectorComponent),
    multi: true,
  }]
})
export class TeacherSelectorComponent implements OnInit {
  allTeachers = signal<BaseUser[]>([]);
  selectedTeacherId = signal<string>('');
  employeeService = inject(EmployeeService)

  selectedClasses = computed(() => {
    return this.allTeachers().filter(studentClass => this.selectedTeacherId().includes(studentClass.id));
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  async ngOnInit() {
    await this.loadallTeachers();
  }

  async loadallTeachers() {
    this.allTeachers.set(await this.employeeService.getAllTeachers());
  }

  autoSelect(defaultSelect : string){
    this.selectedTeacherId.set(defaultSelect)
    this.onChange(defaultSelect);
  }

  onSelectTeacher(teacherId: string): void {
    this.selectedTeacherId.set(teacherId);
    this.onChange(teacherId);
  }

  writeValue(value: string): void {
    if (value) {
      this.selectedTeacherId.set(value);
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Implementar lógica de desabilitação, se necessário
  }
}
