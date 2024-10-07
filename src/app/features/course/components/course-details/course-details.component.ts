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
import { Course, Video } from '../../../../core/models/course.model';
import { BookSelectorComponent } from '../../../library/components/book-selector/book-selector.component';
import { StorageService } from '../../../../core/services/storage.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { LoadingService } from '../../../../shared/services/loading.service';
import { CategorySelectorComponent } from '../../../category/components/category-register/category-selector/category-selector.component';

import { GoogleAuthService } from '../../../../core/services/google-auth.service';
import { VideoSelectorComponent } from "../../../video/components/video-selector/video-selector.component";

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    HandoutSelectorComponent,
    CourseReviewComponent,
    BookSelectorComponent,
    RouterLink,
    ModalComponent,
    CategorySelectorComponent,
    VideoSelectorComponent
  ],
  templateUrl: './course-details.component.html',
  styleUrls: ['./course-details.component.scss'],
})
export class CourseDetailsComponent implements OnInit {
  courseForm!: FormGroup;
  courseId!: string;
  categoryId = signal<string>('');
  loading: boolean = true;
  selectedFile: File | null = null;
  videos = signal<Video[]>([]);
  accessToken = signal<string | null>(null);
  isAuthenticated: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private courseService: CourseService,
    private courseManagementService: CourseManagementService,
    private notificationService: NotificationService,
    private storageService: StorageService,
    private loadingService: LoadingService,
    private googleAuthService: GoogleAuthService
  ) {}

  async ngOnInit() {
    this.loadingService.show();
    this.courseId = this.route.snapshot.paramMap.get('id')!;
    if (!this.courseId) {
      this.notificationService.showNotification(
        'Curso não encontrado',
        NotificationType.ERROR
      );
      this.loading = false;
      this.loadingService.hide();
      return;
    }

    try {
      const course = await this.courseService.getById(this.courseId);
      this.videos.set(course.videos || []);

      this.courseForm = this.fb.group({
        id: [course.id],
        name: [course.name || '', Validators.required],
        description: [course.description || '', Validators.required],
        price: [course.price || '', Validators.required],
        promoPrice: [course.promoPrice || 0, Validators.required],
        portionCount: [course.portionCount || 0, Validators.required],
        hidePrice: [course.hidePrice || false],
        image: [course.image || '', Validators.required],
        active: [course.active || false, Validators.required],
        category: [course.category || ''],
        highlight: [course.highlight || false],
        checkoutUrl: [course.checkoutUrl || ''],
        videos: this.fb.array(this.createVideoFormGroups(course.videos || [])),
      });

      this.loading = false;
      this.loadingService.hide();

      this.googleAuthService.accessToken$.subscribe(token => {
        if (token) {
          this.accessToken.set(token);
          this.isAuthenticated = true;
        } else {
          this.isAuthenticated = false;
        }
      });
    } catch (error) {
      this.notificationService.showNotification(
        'Erro ao consultar dados do curso: ' + error,
        NotificationType.ERROR
      );
      this.loading = false;
      this.loadingService.hide();
    }
  }

  createVideoFormGroups(videos: Video[]): FormGroup[] {
    return videos.map((video) =>
      this.fb.group({
        id: [video.id],
        name: [video.name, Validators.required],
        duration: [video.duration, Validators.required],
        webViewLink: [video.webViewLink, Validators.required],
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
    this.loadingService.show();
    if (this.courseForm.valid && (this.courseForm.dirty || this.selectedFile)) {
      try {
        let imageUrl = this.courseForm.get('image')?.value;

        if (this.selectedFile) {
          imageUrl = await this.storageService.uploadCourseImage(
            this.selectedFile,
            this.courseId
          );
        }

        const courseData : Course = {
          ...this.courseForm.value,
          image: imageUrl,
          videos: this.videosFormArray.value
        };

        await this.courseManagementService.update(courseData);
        this.notificationService.showNotification(
          'Curso atualizado com sucesso!',
          NotificationType.SUCCESS
        );
      } catch (error) {

        this.notificationService.showNotification(
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao atualizar curso',
          NotificationType.ERROR
        );
      } finally {
        this.loading = false;
        this.loadingService.hide();
      }
    } else {
      this.notificationService.showNotification(
        'Por favor, faça alguma alteração antes de salvar.',
        NotificationType.ERROR
      );
      this.loading = false;
      this.loadingService.hide();
    }
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  authenticateWithGoogle() {
    this.loadingService.show();
    const redirectUri = 'http://localhost:4200/admin/course-details/' + this.courseId;
    this.googleAuthService.initiateOAuthFlow(redirectUri);
  }

  updateSelectedVideos(videos: any[]) {
    this.videos.set([...this.videos(), ...videos]);
    this.videosFormArray.clear();
    this.videos().forEach((video: Video) => {
      this.videosFormArray.push(this.fb.group({
        id: [video.id],
        name: [video.name, Validators.required],
        duration: [video.duration, Validators.required],
        webViewLink: [video.webViewLink, Validators.required],
      }));
    });
  }
}
