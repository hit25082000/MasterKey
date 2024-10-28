import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Course } from '../../../../core/models/course.model';
import { Package } from '../../../../core/models/package.model';
import { CourseService } from '../../../course/services/course.service';
import { CategoryManagementService } from '../../services/category-management.service';
import { Category } from '../../../../core/models/category.model';
import { Router } from '@angular/router';
import { NotificationType } from '../../../../shared/models/notifications-enum';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { CourseSelectorComponent } from '../../../course/components/course-selector/course-selector.component';
import { PackageSelectorComponent } from '../../../package/components/package-selector/package-selector.component';
import { ViewChild } from '@angular/core';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-category-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    ModalComponent,
    CourseSelectorComponent,
    PackageSelectorComponent,
  ],
  templateUrl: './category-register.component.html',
  styleUrls: ['./category-register.component.scss'],
})
export class CategoryRegisterComponent implements OnInit {
  categoryForm!: FormGroup;
  courseList: Course[] = [];
  selectedFile: File | null = null;
  loading = false;

  @ViewChild('courseSelector') courseSelector!: CourseSelectorComponent;
  @ViewChild('packageSelector') packageSelector!: PackageSelectorComponent;

  categoryId: string = '';

  constructor(
    private fb: FormBuilder,
    private categoryManagementService: CategoryManagementService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      image: [null]
    });
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onSubmit() {
    this.loading = true;
    if (this.categoryForm.valid) {
      const newCategory: Category = {
        ...this.categoryForm.value,
      };

      this.categoryManagementService
        .create(newCategory, this.selectedFile)
        .then((response) => {
          this.notificationService.success(
            response,
            1
          );
          setTimeout(() => {
            this.loading = false;
            this.router.navigate(['/admin/category-list']);
          }, 1000);
        })
        .catch((error) => {
          this.notificationService.success(
            'Erro ao criar categoria. Por favor, tente novamente: ' + error,
            1
          );
          this.loading = false;
        });
    } else {
      this.notificationService.success(
        'Por favor, preencha todos os campos obrigatórios corretamente.',
        1
      );
      this.loading = false;
    }
  }
}
