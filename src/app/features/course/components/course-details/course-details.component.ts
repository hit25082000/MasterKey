import { NotificationService } from './../../../../shared/components/notification/notification.service';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { NotificationType } from './../../../../shared/components/notification/notifications-enum';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CourseService } from '../../services/course.service';
import { CourseManagementService } from '../../services/course-management.service';
import { HandoutSelectorComponent } from '../../../ecommerce/components/handout-selector/handout-selector.component';
import { CourseReviewComponent } from '../course-review/course-review.component';
import { Video } from '../../../../core/models/course.model';
import { BookSelectorComponent } from '../../../library/components/book-selector/book-selector.component';

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    HandoutSelectorComponent,
    CourseReviewComponent,
    LoadingOverlayComponent,
    BookSelectorComponent,
    RouterLink,
  ],
  templateUrl: './course-details.component.html',
  styleUrls: ['./course-details.component.scss'],
})
export class CourseDetailsComponent implements OnInit {
  courseForm!: FormGroup;
  courseId!: string;
  loading: boolean = true;
  selectedFile: File | null = null;
  videos = signal<Video[]>([]);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private courseService: CourseService,
    private courseManagementService: CourseManagementService,
    private notificationService: NotificationService
  ) {}

  async ngOnInit() {
    this.courseId = this.route.snapshot.paramMap.get('id')!;

    if (!this.courseId) {
      this.notificationService.showNotification(
        'Curso não encontrado',
        NotificationType.ERROR
      );
      this.loading = false;
      return;
    }

    try {
      const course = await this.courseService.getById(this.courseId);
      this.videos.set(course.videos || []);

      this.courseForm = this.fb.group({
        id: [course.id],
        name: [course.name || '', Validators.required],
        videoCount: [course.videoCount || 0, Validators.required],
        price: [course.price || '', Validators.required],
        promoPrice: [course.promoPrice || 0, Validators.required],
        portionCount: [course.portionCount || 0, Validators.required],
        hidePrice: [course.hidePrice || false],
        image: [course.image || '', Validators.required],
        status: [course.status || '', Validators.required],
        category: [course.category || '', Validators.required],
        categoryEcommerce: [
          course.categoryEcommerce || '',
          Validators.required,
        ],
        highlight: [course.highlight || false],
        checkoutUrl: [course.checkoutUrl || '', Validators.required],
        description: [course.description || '', Validators.required],
        workHours: [course.workHours || 0, Validators.required],
        videos: this.fb.array(this.createVideoFormGroups(course.videos || [])),
      });

      this.loading = false;
    } catch (error) {
      this.notificationService.showNotification(
        'Erro ao consultar dados do curso: ' + error,
        NotificationType.ERROR
      );
      this.loading = false;
    }
  }

  createVideoFormGroups(videos: Video[]): FormGroup[] {
    return videos.map((video) =>
      this.fb.group({
        id: [video.id],
        title: [video.title, Validators.required],
        duration: [video.duration, Validators.required],
        url: [video.url, Validators.required],
      })
    );
  }

  get videosFormArray(): FormArray {
    return this.courseForm.get('videos') as FormArray;
  }

  addVideo(): void {
    this.videosFormArray.push(this.createVideo());
  }

  removeVideo(index: number): void {
    this.videosFormArray.removeAt(index);
  }

  createVideo(): FormGroup {
    return this.fb.group({
      id: [''],
      title: ['', Validators.required],
      duration: [0, Validators.required],
      url: ['', Validators.required],
    });
  }

  async onSubmit(): Promise<void> {
    this.loading = true;
    if (this.courseForm.valid && this.courseForm.dirty) {
      try {
        const success = await this.courseManagementService.update(
          this.courseForm.value
        );
        this.notificationService.showNotification(
          'Curso atualizado com sucedsso!',
          NotificationType.SUCCESS
        );

        this.loading = false;
      } catch (error) {
        console.error(error);
        this.notificationService.showNotification(
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao atualizar curso',
          NotificationType.ERROR
        );
        this.loading = false;
      }
    }
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }
}
