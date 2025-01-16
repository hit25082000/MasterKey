import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../features/course/services/course.service';
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
  private notificationService = inject(NotificationService);
  private loadingService = inject(LoadingService);
  private sanitizer = inject(DomSanitizer);

  course = signal<Course | null>(null);
  safeVideoUrl = signal<SafeResourceUrl | null>(null);

  async ngOnInit() {
    const courseId = this.route.snapshot.params['id'];
    if (!courseId) {
      this.notificationService.error('Curso não encontrado');
      this.router.navigate(['/courses']);
      return;
    }

    try {
      const course = await this.courseService.getById(courseId);
      this.course.set(course);
      
      if (course.modules[0].videos[0].webViewLink) {
        this.safeVideoUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(course.modules[0].videos[0].webViewLink));
      }
    } catch (error) {
      this.notificationService.error('Erro ao carregar o curso');
      this.router.navigate(['/courses']);
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
