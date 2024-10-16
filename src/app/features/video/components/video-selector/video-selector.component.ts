import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, WritableSignal, inject, effect, input, output } from '@angular/core';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';
import { Video } from '../../../../core/models/course.model';
import { NotificationService } from '../../../../shared/components/notification/notification.service';

@Component({
  selector: 'app-video-selector',
  standalone: true,
  imports: [CommonModule, SearchBarComponent],
  templateUrl: './video-selector.component.html',
  styleUrls: ['./video-selector.component.scss']
})
export class VideoSelectorComponent {
  allVideos = signal<Video[]>([]);
  selectedVideoIds = signal<string[]>([]);
  accessToken = input.required<string | null>();
  notificationService = inject(NotificationService);
  httpClient = inject(HttpClient);

  // Novo signal para os vídeos selecionados
  selectedVideos = computed(() => {
    return this.allVideos().filter(video => this.selectedVideoIds().includes(video.id));
  });

  // Novo output para os vídeos selecionados
  selectedVideosOutput = output<Video[]>();

  constructor() {
    effect(() => {
      if (this.accessToken()) {
        this.fetchDriveVideos();
      }
    });

    // Efeito para emitir os vídeos selecionados sempre que mudarem
    effect(() => {
      this.selectedVideosOutput.emit(this.selectedVideos());
    });
  }

  onCheckboxChange(videoId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      this.selectedVideoIds.set([...this.selectedVideoIds(), videoId]);
    } else {
      this.selectedVideoIds.set(this.selectedVideoIds().filter(id => id !== videoId));
    }
  }

  fetchDriveVideos() {
    if (!this.accessToken()) {
      this.notificationService.showNotification(
        'Autenticação necessária para buscar vídeos.',
        NotificationType.ERROR
      );
      return;
    }

    const endpoint = 'https://www.googleapis.com/drive/v3/files';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken()}`,
    });

    const params = {
      q: "mimeType contains 'video/'",
      fields: 'nextPageToken, files(id, name, mimeType, webViewLink, webContentLink)',
      pageSize: '100',
      orderBy: 'modifiedTime desc'
    };

    this.listFiles(endpoint, headers, params).subscribe(
      (files) => {
        this.allVideos.set(files);
        console.log(files)
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

  listFiles(endpoint: string, headers: HttpHeaders, params: any): Observable<any[]> {
    return this.httpClient.get(endpoint, { headers, params }).pipe(
      map((response: any) => {
        if (response.files && response.files.length > 0) {
          return response.files;
        } else {
          return [];
        }
      })
    );
  }
}
