import { EcommerceManagementService } from './../../services/ecommerce-management.service';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CarrosselCourse } from '../../../../core/models/carrossel-course.model';
import { CourseService } from '../../../course/services/course.service';
import { Course } from '../../../../core/models/course.model';

@Component({
  selector: 'app-course-carrossel',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './course-carrossel.component.html',
  styleUrls: ['./course-carrossel.component.css'],
})
export class CourseCarrosselComponent implements OnInit {
  carrosselForm!: FormGroup;
  availableCourses: Course[] = [];
  courseService = inject(CourseService);
  ecommerceManagementService = inject(EcommerceManagementService);

  constructor(private fb: FormBuilder) {}

  async ngOnInit() {
    this.carrosselForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      hidePrice: [false],
      promotion: [false],
      courses: ['', Validators.required],
    });

    this.availableCourses = await this.courseService.getAll();
  }

  onSubmit() {
    if (this.carrosselForm.valid) {
      const carrosselCourse: CarrosselCourse = this.carrosselForm.value;

      this.ecommerceManagementService.create(carrosselCourse);
    }
  }
}
