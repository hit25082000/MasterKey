import { CategoryService } from './../../../category/services/category.service';
import { Package } from './../../../../core/models/package.model';
import { PackageService } from './../../../package/services/package.service';
import { StudentManagementService } from '../../../student/services/student-management.service';
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  signal,
  computed,
  input,
  inject,
  Output,
  EventEmitter,
  output,
} from '@angular/core';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { Course } from '../../../../core/models/course.model';
import { CourseService } from '../../services/course.service';
import { StudentService } from '../../../student/services/student.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { LoadingService } from '../../../../shared/services/loading.service';

@Component({
  selector: 'app-course-selector',
  standalone: true,
  imports: [CommonModule, SearchBarComponent],
  templateUrl: './course-selector.component.html',
  styleUrls: ['./course-selector.component.scss'],
})
export class CourseSelectorComponent implements OnInit {
  singleSelection = input(false);
  studentId = input<string>('');
  packageId = input<string>('');
  categoryId = input<string>('');
  allCourses = signal<Course[]>([]);
  selectedCourseIds = signal<Set<string>>(new Set());

  private courseService = inject(CourseService);
  private studentManagementService = inject(StudentManagementService);
  private studentService = inject(StudentService);
  private packageService = inject(PackageService);
  private categoryService = inject(CategoryService);
  private notificationService = inject(NotificationService);
  private loadingService = inject(LoadingService);

  selectedCourses = computed(() => {
    return this.allCourses().filter((course) =>
      this.selectedCourseIds().has(course.id)
    );
  });

  nonSelectedCourses = computed(() => {
    return this.allCourses().filter(
      (course) => !this.selectedCourseIds().has(course.id)
    );
  });

  isSaving = signal(false);

  courseSelected = output<Course>();

  async ngOnInit() {
    await this.loadAllCourses();
    if (this.studentId()) {
      await this.loadStudentCourses();
    }
    if (this.packageId()) {
      await this.loadPackageCourses();
    }
    if (this.categoryId()) {
      await this.loadCategoryCourses();
    }
  }

  private async loadAllCourses() {
    this.loadingService.show();
    try {
      this.allCourses.set(await this.courseService.getAll());
    } finally {
      this.loadingService.hide();
    }
  }

  private async loadStudentCourses() {
    this.loadingService.show();
    try {
      await this.studentService.selectStudent(this.studentId())
      const courses = this.studentService.selectedStudentCourses;
      if (courses() != undefined) {
        this.selectedCourseIds.set(new Set(Array.from(courses()) || []));
      }
    } finally {
      this.loadingService.hide();
    }
  }

  private async loadPackageCourses() {
    this.loadingService.show();
    try {
     await this.packageService.selectPackage(this.packageId())!;
     const courses = this.packageService.selectedPackage()?.courses;
    if (courses != undefined) {
      this.selectedCourseIds.set(new Set(Array.from(courses) || []));
    }
    } finally {
      this.loadingService.hide();
    }
  }

  private async loadCategoryCourses() {
    const courses = await this.categoryService.getCourses(this.categoryId());
    if (courses != undefined) {
      this.selectedCourseIds.set(new Set(Array.from(courses) || []));
    }
  }

  onCourseSelect(course: Course): void {
    if (this.singleSelection()) {
      this.selectedCourseIds.set(new Set([course.id]));
      this.courseSelected.emit(course);
    } else {
      const updatedSelection = new Set(this.selectedCourseIds());
      if (updatedSelection.has(course.id)) {
        updatedSelection.delete(course.id);
      } else {
        updatedSelection.add(course.id);
      }
      this.selectedCourseIds.set(updatedSelection);
      this.courseSelected.emit(course);
    }
  }

  isCourseSelected(courseId: string): boolean {
    return this.selectedCourseIds().has(courseId);
  }

  async updateStudentCourses() {
    const studentId = this.studentId();
    if (!studentId) return;

    this.isSaving.set(true);
    this.loadingService.show();

    try {
      await this.studentManagementService.updateStudentCourses(
        studentId,
        Array.from(this.selectedCourseIds())
      );

      this.notificationService.success(
        'Cursos atualizados com sucesso',
        3000
      );
      await this.loadAllCourses();
      await this.loadStudentCourses();
    } catch (error) {
      this.notificationService.error(
        'Erro ao atualizar cursos',
        3000
      );
    } finally {
      this.loadingService.hide();
      this.isSaving.set(false);
    }
  }

  async removeCourseFromStudent(courseId: string) {
    const updatedSelection = new Set(this.selectedCourseIds());
    updatedSelection.delete(courseId);
    this.selectedCourseIds.set(updatedSelection);
    await this.updateStudentCourses();
  }

  async removeCourse(courseId: string) {
    const updatedSelection = new Set(this.selectedCourseIds());
    updatedSelection.delete(courseId);
    this.selectedCourseIds.set(updatedSelection);
  }

  async updateCategoryCourses(categoryId: string) {
    if (!categoryId) return;

    this.isSaving.set(true);
    this.loadingService.show();

    try {
      await this.studentManagementService.updateStudentCourses(
        categoryId,
        Array.from(this.selectedCourseIds())
      );

      this.notificationService.success('Cursos atualizados com sucesso');
      await this.loadAllCourses();
      await this.loadStudentCourses();
    } catch (error) {
      this.notificationService.error('Erro ao atualizar cursos');
    } finally {
      this.loadingService.hide();
      this.isSaving.set(false);
    }
  }
}
