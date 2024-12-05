import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CourseService } from '../../../features/course/services/course.service';
import { Course, Video } from '../../../core/models/course.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-course-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-preview.component.html',
  styleUrl: './course-preview.component.scss'
})
export class CoursePreviewComponent implements OnInit {
  course?: Course;
  previewVideo?: Video;
  safeVideoUrl = signal<SafeResourceUrl | undefined>(undefined);

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.route.params.subscribe(async params => {
      const courseId = params['id'];
      this.course = await this.courseService.getById(courseId);

      if (this.course?.videos?.length > 0) {
        this.previewVideo = this.course.videos[0];

        // Verifica se a URL é do YouTube e ajusta se necessário
        if (this.previewVideo.webViewLink) {
          const videoUrl = this.processVideoUrl(this.previewVideo.webViewLink);
          this.safeVideoUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl));
        }
      }
    });
  }

  private processVideoUrl(url: string): string {
    // Processa URLs do YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // Extrai o ID do vídeo
      let videoId = '';

      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v') || '';
      } else if (url.includes('youtu.be')) {
        videoId = url.split('/').pop() || '';
      }

      if (videoId) {
        // Retorna URL de embed do YouTube
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // Processa URLs do Vimeo
    if (url.includes('vimeo.com')) {
      const vimeoId = url.split('/').pop();
      if (vimeoId) {
        return `https://player.vimeo.com/video/${vimeoId}`;
      }
    }

    // Se não for YouTube nem Vimeo, retorna a URL original
    return url;
  }
}
