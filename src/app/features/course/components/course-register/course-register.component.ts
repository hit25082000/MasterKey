import { CourseManagementService } from './../../services/course-management.service';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { Video } from '../../../../core/models/course.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { VideoSelectorComponent } from '../../../video/components/video-selector/video-selector.component';

@Component({
  selector: 'app-course-register',
  standalone:true,
  imports:[ReactiveFormsModule,CommonModule,FormsModule,ModalComponent,VideoSelectorComponent],
  templateUrl: './course-register.component.html',
  styleUrls: ['./course-register.component.scss']
})
export class CourseRegisterComponent implements OnInit {
  courseForm!: FormGroup;
  selectedVideos : any[] = []

  constructor(private fb: FormBuilder, private courseManagementService : CourseManagementService) {}

  ngOnInit(): void {

    this.courseForm = this.fb.group({
      name: ['', Validators.required],
      videoCount: [0, Validators.required],
      price: [''],
      promoPrice: [0],
      portionCount: [0],
      hidePrice: [false],
      image: [''],
      status: [''],
      category: [''],
      categoryEcommerce: [''],
      highlight: [false],
      checkoutUrl: [''],
      description: [''],
      workHours: [0],
    });

  }

  onSubmit(selectorComponent: VideoSelectorComponent) {
    if (this.courseForm.valid) {
      const newCourse = {
        ...this.courseForm.value,
        videos: selectorComponent.selectedVideos()
      };

      this.courseManagementService.create(newCourse)
    }
  }
}
