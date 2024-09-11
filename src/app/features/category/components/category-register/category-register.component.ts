import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Course } from '../../../../core/models/course.model';
import { CourseService } from '../../../course/services/course.service';
import { CategoryManagementService } from '../../services/category-management.service';

@Component({
  selector: 'app-category-create',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './category-register.component.html',
  styleUrls: ['./category-register.component.scss']
})
export class CategoryRegisterComponent implements OnInit {
  categoryForm!: FormGroup;
  courseList : Course[] = [];
  selectedFile: File | null = null;

  constructor(private fb: FormBuilder, private categoryManagementService : CategoryManagementService, private courseService : CourseService) {}

  ngOnInit(): void {
     this.courseService.getAll().then((courses)=>{
      this.courseList = courses
    })

    this.categoryForm = this.fb.group({
      name: ['', Validators.required], // Campo nome, obrigatório
      profilePic: [null],
      courses: new FormControl([], Validators.required) // Permissões, também obrigatório
    });
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onSubmit() {
    if (this.categoryForm.valid) {
      this.categoryManagementService.create(this.categoryForm.value, this.selectedFile)
    }
  }
}
