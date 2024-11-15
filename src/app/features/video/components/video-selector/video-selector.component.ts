import { CommonModule } from '@angular/common';
import { Component, signal, computed, OnInit, Output, EventEmitter } from '@angular/core';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, switchMap } from 'rxjs';
import { Video } from '../../../../core/models/course.model';
import { NotificationService } from '../../../../shared/services/notification.service';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';

@Component({
  selector: 'app-video-selector',
  standalone: true,
  imports: [CommonModule, SearchBarComponent],
  templateUrl: './video-selector.component.html',
  styleUrls: ['./video-selector.component.scss']
})
export class VideoSelectorComponent implements OnInit {
  allVideos = signal<Video[]>([]);
  selectedVideoIds = signal<Set<string>>(new Set());
  selectedVideos = computed(() =>
    this.allVideos().filter(video => this.selectedVideoIds().has(video.id))
  );
  isLoading = signal<boolean>(false);

  @Output() videosSelected = new EventEmitter<Video[]>();

  constructor(
    private httpClient: HttpClient,
    private notificationService: NotificationService,
    private googleAuthService: GoogleAuthService
  ) {}

  ngOnInit() {
    this.fetchDriveVideos();
  }

  onCheckboxChange(videoId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const currentSelected = new Set(this.selectedVideoIds());

    if (checkbox.checked) {
      currentSelected.add(videoId);
    } else {
      currentSelected.delete(videoId);
    }
    this.selectedVideoIds.set(currentSelected);
    this.videosSelected.emit(this.selectedVideos());
  }

  removeVideo(videoId: string) {
    const currentSelected = new Set(this.selectedVideoIds());
    currentSelected.delete(videoId);
    this.selectedVideoIds.set(currentSelected);
    this.videosSelected.emit(this.selectedVideos());
  }

  fetchDriveVideos() {
    this.googleAuthService.getAccessToken().pipe(
      switchMap(token => {
        if (!token) {
          throw new Error('Token não disponível');
        }

        const endpoint = 'https://www.googleapis.com/drive/v3/files';
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
        });

        const params = {
          q: "mimeType contains 'video/'",
          fields: 'files(id, name, mimeType, webViewLink)',
          pageSize: '100',
          orderBy: 'modifiedTime desc'
        };

        return this.listFiles(endpoint, headers, params);
      })
    ).subscribe({
      next: (files) => {
        this.allVideos.set(files.map(file => ({
          id: file.id,
          name: file.name,
          duration: 0,
          webViewLink: this.formatVideoLink(file.webViewLink),
          active: true
        })));
      },
      error: (error) => {
        this.notificationService.error('Erro ao buscar vídeos do Google Drive: ' + error.message, 5000);
      }
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

  private listFiles(endpoint: string, headers: HttpHeaders, params: any): Observable<any[]> {
    return this.httpClient.get(endpoint, { headers, params }).pipe(
      map((response: any) => response.files || [])
    );
  }

  // Método público para desselecionar um vídeo
  deselectVideo(videoId: string) {
    this.selectedVideoIds.set(new Set([...this.selectedVideoIds()].filter(id => id !== videoId)));
  }
}
