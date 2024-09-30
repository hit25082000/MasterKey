import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, input, forwardRef, inject } from '@angular/core';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { Student } from '../../../../core/models/student.model';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { StudentService } from '../../../student/services/student.service';

@Component({
  selector: 'app-student-selector',
  standalone: true,
  imports: [CommonModule,SearchBarComponent],
  templateUrl: './students-selector.component.html',
  styleUrls: ['./students-selector.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => StudentsSelectorComponent),
    multi: true
  }]
})
export class StudentsSelectorComponent implements OnInit {
  allStudents = signal<Student[]>([]); // Signal para a lista de vídeos
  selectedStudentsIds = signal<string[]>([]);
  studentService = inject(StudentService)

  selectedStudents = computed(() => {
    return this.allStudents().filter(student => this.selectedStudentsIds().includes(student.id));
  });

  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  async ngOnInit() {
    await this.loadAllStudents();
  }

  async loadAllStudents() {
    this.allStudents.set(await this.studentService.getAll());
  }

  autoSelect(defaultSelect : string[]){
    this.selectedStudentsIds.set([...defaultSelect])
  }

  onCheckboxChange(studentId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      this.selectedStudentsIds.set([...this.selectedStudentsIds(), studentId]);
    } else {
      this.selectedStudentsIds.set(this.selectedStudentsIds().filter(id => id !== studentId));
    }

    this.onChange(this.selectedStudentsIds());
  }

  writeValue(value: string[]): void {
    if (value) {
      this.selectedStudentsIds.set(value);
    }
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Implementar desabilitação se necessário
  }
}
