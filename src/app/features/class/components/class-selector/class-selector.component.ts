import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  signal,
  computed,
  input,
  forwardRef,
  inject,
  Output,
  EventEmitter,
} from '@angular/core';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { Class } from '../../../../core/models/class.model';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ClassService } from '../../services/class.service';
import { StudentService } from '../../../student/services/student.service';

@Component({
  selector: 'app-class-selector',
  standalone: true,
  imports: [CommonModule, SearchBarComponent],
  templateUrl: './class-selector.component.html',
  styleUrls: ['./class-selector.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ClassSelectorComponent),
      multi: true,
    },
  ],
})
export class ClassSelectorComponent implements OnInit, ControlValueAccessor {
  allClasses = signal<Class[]>([]);
  selectedClassesIds = signal<Set<string>>(new Set());
  classService = inject(ClassService);
  studentService = inject(StudentService);

  studentId = input<string>('');

  selectedClasses = computed(() => {
    return this.allClasses().filter((classItem) =>
      this.selectedClassesIds().has(classItem.id!)
    );
  });

  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  @Output() classesSelected = new EventEmitter<string[]>();

  async ngOnInit() {
    await this.loadAllClasses();
    if (this.studentId()) {
      await this.loadSelectedClasses();
    }
  }

  async loadAllClasses() {
    this.allClasses = this.classService.classes;
  }

  private async loadSelectedClasses() {
    const studentClasses = await this.classService.getStudentClasses(this.studentId());
    this.selectedClassesIds.set(new Set(studentClasses));
    this.onChange(Array.from(this.selectedClassesIds()));
  }

  onCheckboxChange(classId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const updatedSelection = new Set(this.selectedClassesIds());

    if (checkbox.checked) {
      updatedSelection.add(classId);
    } else {
      updatedSelection.delete(classId);
    }

    this.selectedClassesIds.set(updatedSelection);
    const selectedIds = Array.from(this.selectedClassesIds());
    this.onChange(selectedIds);
    this.classesSelected.emit(selectedIds);
  }

  writeValue(value: string[]): void {
    if (value) {
      this.selectedClassesIds.set(new Set(value));
    }
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
