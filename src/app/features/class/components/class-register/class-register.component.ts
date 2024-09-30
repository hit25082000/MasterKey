import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClassManagementService } from '../../services/class-management.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { DayWeekSelectorComponent } from '../day-week-selector/day-week-selector.component';
import { StudentsSelectorComponent } from './../../../student/components/students-selector/students-selector.component';
import { TeacherSelectorComponent } from '../../../employees/components/teacher-selector/teacher-selector.component';

@Component({
  selector: 'app-class-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DayWeekSelectorComponent,
    ModalComponent,
    StudentsSelectorComponent,
    CommonModule,
    TeacherSelectorComponent,
    TeacherSelectorComponent,
    ModalComponent,
  ],
  templateUrl: './class-register.component.html',
  styleUrls: ['./class-register.component.scss'],
})
export class ClassRegisterComponent implements OnInit {
  classForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private classManagementService: ClassManagementService
  ) {}

  ngOnInit(): void {
    this.classForm = this.fb.group({
      name: ['', Validators.required],
      time: ['', Validators.required],
      dayWeek: [[], Validators.required],
      startDate: ['', Validators.required],
      finishDate: ['', Validators.required],
      status: [false, Validators.required],
      room: ['', Validators.required],
      teacher: ['', Validators.required],
      students: [[], Validators.required],
    });
  }

  onSubmit() {
    if (this.classForm.valid) {
      this.classManagementService.create(this.classForm.value);
    }
  }
}
