import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Role } from '../../../../core/models/role.model';
import { CommonModule } from '@angular/common';
import { PackageManagementService } from '../../services/package-management.service';
import { Course } from '../../../../core/models/course.model';
import { CourseService } from '../../../course/services/course.service';

@Component({
  selector: 'app-package-create',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './package-register.component.html',
  styleUrls: ['./package-register.component.scss']
})
export class PackageRegisterComponent implements OnInit {
  roleForm!: FormGroup;
  courseList : Course[] = [];

  constructor(private fb: FormBuilder, private packageManagementService : PackageManagementService, private courseService : CourseService) {}

  ngOnInit(): void {
     this.courseService.getAll().then((courses)=>{
      this.courseList = courses
    })

    this.roleForm = this.fb.group({
      name: ['', Validators.required], // Campo nome, obrigatório
      price: ['', Validators.required], // Campo nome, obrigatório
      description: ['', Validators.required], // Campo nome, obrigatório
      status: ['', Validators.required], // Campo nome, obrigatório
      workHours: ['', Validators.required], // Campo nome, obrigatório
      courses: new FormControl([], Validators.required) // Permissões, também obrigatório
    });
  }

  onSubmit() {
    if (this.roleForm.valid) {
      this.packageManagementService.create(this.roleForm.value)
    }
  }
}
