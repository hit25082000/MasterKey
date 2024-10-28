import { Video } from './../../../../core/models/course.model';
import { Component, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { environment } from '../../../../../environments/environment';
import { NotificationType } from '../../../../shared/models/notifications-enum';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { VideoSelectorComponent } from "../../../video/components/video-selector/video-selector.component";
import { LoadingService } from '../../../../shared/services/loading.service';
import { StorageService } from '../../../../core/services/storage.service';
import { HandoutSelectorComponent } from '../../../ecommerce/components/handout-selector/handout-selector.component';
import { BookSelectorComponent } from '../../../library/components/book-selector/book-selector.component';
import { CategoryService } from '../../../category/services/category.service';
import { CategorySelectorComponent } from '../../../category/components/category-register/category-selector/category-selector.component';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-course-register',
  standalone: true,
  imports: [CommonModule, CategorySelectorComponent, ReactiveFormsModule, SearchBarComponent, ModalComponent, VideoSelectorComponent, HandoutSelectorComponent, BookSelectorComponent],
  templateUrl: './course-register.component.html',
  styleUrls: ['./course-register.component.scss'],
})
export class CourseRegisterComponent implements OnInit {
  courseForm!: FormGroup;
  accessToken = signal<string | null>(null);
  isAuthenticated: boolean = false;
  selectedVideos = signal<Video[]>([]);
  isLoading = signal<boolean>(true);
  selectedFile: File | null = null;
  videos = signal<Video[]>([]);

  constructor(
    private fb: FormBuilder,
    private firestoreService: FirestoreService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private googleAuthService: GoogleAuthService,
    private loadingService: LoadingService,
    private storageService: StorageService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.courseForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: ['', Validators.required],
      promoPrice: [0, [Validators.required, Validators.min(0)]],
      portionCount: [1, [Validators.required, Validators.min(1)]],
      hidePrice: [false],
      imageUrl: [''],
      category: ['', Validators.required],
      highlight: [false],
      checkoutUrl: ['', Validators.required],
      videos: this.fb.array([]),
    });

    this.route.queryParams.subscribe((params) => {
      const code = params['code'] as string;
      if (code) {
        this.exchangeCodeForToken(code).then(() => {
          this.isAuthenticated = true;
          this.router.navigate(['/admin/course-register']);
          this.isLoading.set(false);
        });
      }
    });

    this.googleAuthService.accessToken$.subscribe(token => {
      if (token) {
        this.accessToken.set(token);
        this.isAuthenticated = true;
        this.isLoading.set(false);
      } else {
        this.isAuthenticated = false;
        this.isLoading.set(false);
      }
    });
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  async onSubmit() {
    if (
      this.courseForm.valid &&
      this.isAuthenticated &&
      this.videosFormArray.length > 0
    ) {
      try {
        let imageUrl = this.courseForm.get('image')?.value;

        if (this.selectedFile) {
          imageUrl = await this.storageService.uploadCourseImage(this.selectedFile, Date.now().toString());
        }

        const courseData = {
          ...this.courseForm.value,
          image: imageUrl,
          videos: this.videosFormArray.value,
        };

        const course = await this.firestoreService.addToCollection('courses', courseData);
        await this.categoryService.addCourseToCategory(this.courseForm.get('category')?.value, course.id);

        this.notificationService.success(
          'Curso criado com sucesso!',
         1
        );

        this.router.navigate(['/admin/course-list']);
      } catch (error) {
        console.error('Erro ao criar curso:', error);
        this.notificationService.success(
          'Erro ao criar curso. Por favor, tente novamente.',
          1
        );
      }
    } else if (!this.isAuthenticated) {
      this.notificationService.success(
        'Por favor, autentique-se antes de criar um curso.',
        1
      );
    } else {
      this.notificationService.success(
        'Por favor, preencha todos os campos obrigatórios e selecione pelo menos um vídeo.',
        1
      );
    }
  }

  initiateOAuthFlow() {
    const clientId = environment.googleClientId;
    const redirectUri = 'http://localhost:4200/admin/course-register';
    const scope = 'https://www.googleapis.com/auth/drive.readonly';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?scope=${encodeURIComponent(scope)}&access_type=offline&include_granted_scopes=true&response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    localStorage.setItem(
      'courseFormData',
      JSON.stringify(this.courseForm.value)
    );
    window.location.href = authUrl;
  }

  async exchangeCodeForToken(code: string) {
    const redirectUri = 'http://localhost:4200/admin/course-register';
    this.loadingService.show();
    const expiresIn = 3600 * 1000;
    const expirationTime = Date.now() + expiresIn;

    this.googleAuthService.exchangeCodeForToken(code, redirectUri).subscribe(
      (response: any) => {
        this.googleAuthService.setAccessToken(response.access_token, expirationTime);
        this.loadingService.hide();
      },
      (error) => {
        this.loadingService.hide();
      }
    );
  }

  authenticateWithGoogle() {
    this.loadingService.show();
    const redirectUri = 'http://localhost:4200/admin/course-register';
    this.googleAuthService.initiateOAuthFlow(redirectUri);
  }

  removeVideo(index: number): void {
    this.videosFormArray.removeAt(index);
    this.videos.set(this.videos().filter((_, i) => i !== index));
  }

  get videosFormArray(): FormArray {
    return this.courseForm.get('videos') as FormArray || [];
  }

  updateSelectedVideos(videos: any[]) {
    const formattedVideos = videos.map(video => ({
      ...video,
      webViewLink: this.formatVideoLink(video.webViewLink)
    }));

    this.videos.set([...this.videos(), ...formattedVideos]);
    formattedVideos.forEach((video: Video) => {
      this.videosFormArray.push(this.fb.group({
        id: [video.id],
        name: [video.name, Validators.required],
        duration: [video.duration, Validators.required],
        webViewLink: [video.webViewLink, Validators.required],
      }));
    });
  }

  private formatVideoLink(webViewLink: string): string {
    if (webViewLink) {
      const match = webViewLink.match(/\/d\/(.+?)\/view/);
      if (match && match[1]) {
        const videoId = match[1];
        return `https://drive.google.com/file/d/${videoId}/preview`;
      }
    }
    return webViewLink;
  }
}
