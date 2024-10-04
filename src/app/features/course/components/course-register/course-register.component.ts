import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { environment } from '../../../../../environments/environment';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './course-register.component.html',
  styleUrls: ['./course-register.component.scss'],
})
export class CourseRegisterComponent implements OnInit {
  courseForm!: FormGroup;
  private accessToken: string | null = null;
  isAuthenticated: boolean = false;
  driveVideos: any[] = [];
  selectedVideos: any[] = [];

  constructor(
    private fb: FormBuilder,
    private firestoreService: FirestoreService,
    private router: Router,
    private httpClient: HttpClient,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.courseForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
    });

    this.route.queryParams.subscribe((params) => {
      const code = params['code'] as string;
      if (code) {
        this.exchangeCodeForToken(code);
      }
    });

    const savedToken = localStorage.getItem('googleAccessToken');
    if (savedToken) {
      this.accessToken = savedToken;
      this.isAuthenticated = true;
      this.fetchDriveVideos();
    }
  }

  async onSubmit() {
    if (
      this.courseForm.valid &&
      this.isAuthenticated &&
      this.selectedVideos.length > 0
    ) {
      try {
        const courseData = {
          ...this.courseForm.value,
          videos: this.selectedVideos,
        };

        await this.firestoreService.addToCollection('courses', courseData);

        this.notificationService.showNotification(
          'Curso criado com sucesso!',
          NotificationType.SUCCESS
        );

        this.router.navigate(['/admin/courses']);
      } catch (error) {
        console.error('Erro ao criar curso:', error);
        this.notificationService.showNotification(
          'Erro ao criar curso. Por favor, tente novamente.',
          NotificationType.ERROR
        );
      }
    } else if (!this.isAuthenticated) {
      this.notificationService.showNotification(
        'Por favor, autentique-se antes de criar um curso.',
        NotificationType.ERROR
      );
    } else {
      this.notificationService.showNotification(
        'Por favor, preencha todos os campos obrigatórios e selecione pelo menos um vídeo.',
        NotificationType.ERROR
      );
    }
  }

  private initiateOAuthFlow() {
    const clientId = environment.googleClientId;
    const redirectUri = 'http://localhost:4200/admin/course-register';
    const scope = 'https://www.googleapis.com/auth/drive.readonly';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?scope=${scope}&access_type=offline&include_granted_scopes=true&response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;

    localStorage.setItem(
      'courseFormData',
      JSON.stringify(this.courseForm.value)
    );
    window.location.href = authUrl;
  }

  private exchangeCodeForToken(code: string) {
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const body = {
      code: code,
      client_id: environment.googleClientId,
      client_secret: environment.googleClientSecret,
      redirect_uri: 'http://localhost:4200/admin/course',
      grant_type: 'authorization_code',
    };
    this.httpClient.post(tokenEndpoint, body).subscribe(
      (response: any) => {
        this.accessToken = response.access_token;
        this.isAuthenticated = true;
        localStorage.setItem('googleAccessToken', this.accessToken!);

        const savedFormData = localStorage.getItem('courseFormData');
        if (savedFormData) {
          this.courseForm.patchValue(JSON.parse(savedFormData));
          localStorage.removeItem('courseFormData');
        }

        this.fetchDriveVideos();
      },
      (error) => {
        this.isAuthenticated = false;
        console.error('Erro na autenticação:', error);
        this.notificationService.showNotification(
          'Erro na autenticação. Por favor, tente novamente.',
          NotificationType.ERROR
        );
      }
    );
  }

  authenticateWithGoogle() {
    this.initiateOAuthFlow();
  }

  fetchDriveVideos() {
    if (!this.accessToken) {
      this.notificationService.showNotification(
        'Autenticação necessária para buscar vídeos.',
        NotificationType.ERROR
      );
      return;
    }

    const endpoint = 'https://www.googleapis.com/drive/v3/files';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
    });

    const params = {
      q: 'mimeType contains "video/"',
      fields: 'files(id,name,mimeType,webViewLink,webContentLink)',
    };

    this.httpClient.get(endpoint, { headers, params }).subscribe(
      (response: any) => {
        this.driveVideos = response.files;
      },
      (error) => {
        console.error('Erro ao buscar vídeos:', error);
        this.notificationService.showNotification(
          'Erro ao buscar vídeos do Google Drive.',
          NotificationType.ERROR
        );
      }
    );
  }

  toggleVideoSelection(video: any) {
    const index = this.selectedVideos.findIndex((v) => v.id === video.id);
    if (index > -1) {
      this.selectedVideos.splice(index, 1);
    } else {
      this.selectedVideos.push(video);
    }
  }
}
