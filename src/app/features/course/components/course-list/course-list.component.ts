import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Course } from '../../../../core/models/course.model';
import { CourseService } from '../../services/course.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    ConfirmationDialogComponent
  ],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss']
})
export class CourseListComponent implements OnInit {
  private router = inject(Router);
  private courseService = inject(CourseService);
  private notificationService = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);

  courses = signal<Course[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadCourses();
  }

  private async loadCourses() {
    try {
      const courses = await this.courseService.getAll();
      this.courses.set(courses);
      this.loading.set(false);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      this.notificationService.error('Erro ao carregar cursos');
      this.loading.set(false);
    }
  }

  getTotalDuration(course: Course): number {
    let totalMinutes = 0;
    course.modules?.forEach(module => {
      module.videos?.forEach(video => {
        totalMinutes += video.duration || 0;
      });
    });
    return Math.round(totalMinutes / 60 * 10) / 10;
  }

  getTotalVideos(course: Course): number {
    let totalVideos = 0;
    course.modules?.forEach(module => {
      totalVideos += module.videos?.length || 0;
    });
    return totalVideos;
  }

  createCourse() {
    this.router.navigate(['/admin/course-form']);
  }

  editCourse(course: Course) {
    this.router.navigate(['/admin/course-form', course.id]);
  }

  deleteCourse(course: Course) {
    this.confirmationService.confirm({
      message: `Tem certeza que deseja excluir o curso "${course.name}"?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await this.courseService.delete(course.id!);
          this.courses.update(courses => courses.filter(c => c.id !== course.id));
          this.notificationService.success('Curso excluído com sucesso');
        } catch (error) {
          console.error('Erro ao excluir curso:', error);
          this.notificationService.error('Erro ao excluir curso');
        }
      }
    });
  }
}
