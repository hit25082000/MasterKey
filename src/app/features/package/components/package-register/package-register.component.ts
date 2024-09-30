import { Component, OnInit, viewChild, signal, computed } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Role } from '../../../../core/models/role.model';
import { CommonModule } from '@angular/common';
import { PackageManagementService } from '../../services/package-management.service';
import { Package } from '../../../../core/models/package.model';
import { CourseService } from '../../../course/services/course.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { CourseSelectorComponent } from '../../../course/components/course-selector/course-selector.component';

@Component({
  selector: 'app-package-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    ModalComponent,
    CourseSelectorComponent,
  ],
  templateUrl: './package-register.component.html',
  styleUrls: ['./package-register.component.scss'],
})
export class PackageRegisterComponent implements OnInit {
  courseSelector = viewChild(CourseSelectorComponent);
  packageForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private packageManagementService: PackageManagementService
  ) {}

  ngOnInit(): void {
    this.packageForm = this.fb.group({
      name: ['', Validators.required], // Campo nome, obrigatório
      price: ['', Validators.required], // Campo nome, obrigatório
      description: ['', Validators.required], // Campo nome, obrigatório
      workHours: ['', Validators.required], // Campo nome, obrigatório
      courses: [[]], // Inicializa como array vazio
    });
  }

  onSubmit() {
    if (this.packageForm.valid) {
      const newPackage = this.packageForm.value as Package;

      newPackage.courses = Array.from(
        this.courseSelector()!.selectedCourseIds()
      );

      this.packageManagementService.create(newPackage);
    }
  }
}
