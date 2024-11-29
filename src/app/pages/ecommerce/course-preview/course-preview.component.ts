import { Component, OnInit } from '@angular/core';
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
  safeVideoUrl?: SafeResourceUrl;

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.route.params.subscribe(async params => {
      const courseId = params['id'];
      this.course = await this.courseService.getById(courseId);
      if (this.course!?.videos!?.length > 0) {
        this.previewVideo = this.course!.videos![0];
        this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewVideo.url);
      }
    });
  }
}
