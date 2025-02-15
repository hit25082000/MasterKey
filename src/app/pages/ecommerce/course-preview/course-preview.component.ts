import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../features/course/services/course.service';
import { CategoryService } from '../../../features/category/services/category.service';
import { Course } from '../../../core/models/course.model';
import { NotificationService } from '../../../shared/services/notification.service';
import { LoadingService } from '../../../shared/services/loading.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-course-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./course-preview.component.html",
  styleUrl: "./course-preview.component.scss"
})
export class CoursePreviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private categoryService = inject(CategoryService);
  private notificationService = inject(NotificationService);
  private loadingService = inject(LoadingService);
  private sanitizer = inject(DomSanitizer);

  course = signal<Course | null>(null);
  categoryName = signal<string>('');
  safeVideoUrl = computed(() => {
    if (this.course()!.modules[0].videos[0].webViewLink!) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(this.course()!.modules[0].videos[0].webViewLink!);
    }
    return null;
  });

  async ngOnInit() {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (!courseId) {
      this.notificationService.error('Curso não encontrado');
      this.router.navigate(['/']);
      return;
    }

    try {
      const courseData = await this.courseService.getById(courseId);
      this.course.set(courseData);
      console.log(this.course()!.modules[0].videos[0].webViewLink!)
      // Buscar o nome da categoria
      if (courseData.category) {
        const category = await this.categoryService.getById(courseData.category);
        this.categoryName.set(category.name);
      }
    } catch (error) {
      this.notificationService.error('Erro ao carregar o curso');
      this.router.navigate(['/']);
    }
  }

  goToCheckout() {
    if (!this.course()) {
      this.notificationService.error('Curso não encontrado');
      return;
    }
    
    this.router.navigate(['/checkout', this.course()!.id]);
  }
}
