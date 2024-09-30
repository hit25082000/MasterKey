import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  signal,
  computed,
  input,
  forwardRef,
  inject,
} from '@angular/core';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { Student } from '../../../../core/models/student.model';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { StudentService } from '../../../student/services/student.service';
import { ClassService } from '../../../class/services/class.service';

@Component({
  selector: 'app-student-selector',
  standalone: true,
  imports: [CommonModule, SearchBarComponent],
  templateUrl: './students-selector.component.html',
  styleUrls: ['./students-selector.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StudentsSelectorComponent),
      multi: true,
    },
  ],
})
export class StudentsSelectorComponent implements OnInit {
  allStudents = signal<Student[]>([]);
  selectedStudentsIds = signal<Set<string>>(new Set());
  studentService = inject(StudentService);
  classService = inject(ClassService);

  classId = input<string>('');

  selectedStudents = computed(() => {
    return this.allStudents().filter((student) =>
      this.selectedStudentsIds().has(student.id)
    );
  });

  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  async ngOnInit() {
    await this.loadAllStudents();
    if (this.classId()) {
      await this.loadSelectedStudents();
    }
  }

  async loadAllStudents() {
    this.allStudents.set(await this.studentService.getAll());
  }

  private async loadSelectedStudents() {
    const students = await this.classService.getClassStudents(this.classId());
    this.selectedStudentsIds.set(new Set(students.map((s: Student) => s.id)));
    this.onChange(Array.from(this.selectedStudentsIds()));
  }

  autoSelect(defaultSelect: string[]) {
    this.selectedStudentsIds.set(new Set(defaultSelect));
  }

  onCheckboxChange(studentId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const updatedSelection = new Set(this.selectedStudentsIds());

    if (checkbox.checked) {
      updatedSelection.add(studentId);
    } else {
      updatedSelection.delete(studentId);
    }

    this.selectedStudentsIds.set(updatedSelection);
    this.onChange(Array.from(this.selectedStudentsIds()));
  }

  writeValue(value: string[]): void {
    if (value) {
      this.selectedStudentsIds.set(new Set(value));
    }
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
