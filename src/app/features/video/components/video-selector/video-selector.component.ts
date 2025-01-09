import { CommonModule } from '@angular/common';
import { Component, signal, OnInit, Output, EventEmitter } from '@angular/core';
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
  isLoading = signal<boolean>(false);

  @Output() videoSelected = new EventEmitter<Video>();

  constructor(
    private httpClient: HttpClient,
    private notificationService: NotificationService,
    private googleAuthService: GoogleAuthService
  ) {}

  ngOnInit() {
    this.fetchDriveVideos();
  }

  selectVideo(video: Video): void {
    this.videoSelected.emit(video);
  }

  fetchDriveVideos() {
    this.isLoading.set(true);
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
          fields: 'files(id, name, mimeType, webViewLink, videoMediaMetadata)',
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
          duration: file.videoMediaMetadata?.durationMillis ? Math.floor(file.videoMediaMetadata.durationMillis / 1000) : 0,
          webViewLink: this.formatVideoLink(file.webViewLink),
          active: true,
          description: '',
          thumbnail: '',
        })));
        this.isLoading.set(false);
      },
      error: (error) => {
        this.notificationService.error('Erro ao buscar vídeos do Google Drive: ' + error.message);
        this.isLoading.set(false);
      }
    });
  }

  private listFiles(endpoint: string, headers: HttpHeaders, params: any): Observable<any[]> {
    return this.httpClient.get(endpoint, { headers, params }).pipe(
      map((response: any) => response.files || [])
    );
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
