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
} from '@angular/core';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { Course } from '../../../../core/models/course.model';
import { CourseService } from '../../services/course.service';
import { StudentService } from '../../../student/services/student.service';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';

@Component({
  selector: 'app-course-selector',
  standalone: true,
  imports: [CommonModule, SearchBarComponent],
  templateUrl: './course-selector.component.html',
  styleUrls: ['./course-selector.component.scss'],
})
export class CourseSelectorComponent implements OnInit {
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
    this.allCourses.set(await this.courseService.getAll());
  }

  private async loadStudentCourses() {
    const { courses } = await this.studentService.getCourses(this.studentId());
    if (courses != undefined) {
      this.selectedCourseIds.set(new Set(Array.from(courses) || []));
    }
  }

  private async loadPackageCourses() {
    const courses = await this.packageService.getCourses(this.packageId());
    if (courses != undefined) {
      this.selectedCourseIds.set(new Set(Array.from(courses) || []));
    }
  }

  private async loadCategoryCourses() {
    const courses = await this.categoryService.getCourses(this.categoryId());
    if (courses != undefined) {
      this.selectedCourseIds.set(new Set(Array.from(courses) || []));
    }
  }

  onCheckboxChange(courseId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const updatedSelection = new Set(this.selectedCourseIds());
    checkbox.checked
      ? updatedSelection.add(courseId)
      : updatedSelection.delete(courseId);
    this.selectedCourseIds.set(updatedSelection);
  }

  async updateStudentCourses() {
    const studentId = this.studentId();
    if (!studentId) return;

    this.isSaving.set(true);

    try {
      await this.studentManagementService.updateStudentCourses(
        studentId,
        Array.from(this.selectedCourseIds())
      );

      this.notificationService.showNotification(
        'Pacotes atualizados com sucesso',
        NotificationType.SUCCESS
      );
      await this.loadAllCourses();
      await this.loadStudentCourses();
    } catch (error) {
      this.notificationService.showNotification(
        'Erro ao atualizar pacotes',
        NotificationType.ERROR
      );
    } finally {
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

    try {
      await this.studentManagementService.updateStudentCourses(
        categoryId,
        Array.from(this.selectedCourseIds())
      );

      this.notificationService.showNotification(
        'Pacotes atualizados com sucesso',
        NotificationType.SUCCESS
      );
      await this.loadAllCourses();
      await this.loadStudentCourses();
    } catch (error) {
      this.notificationService.showNotification(
        'Erro ao atualizar pacotes',
        NotificationType.ERROR
      );
    } finally {
      this.isSaving.set(false);
    }
  }
}
