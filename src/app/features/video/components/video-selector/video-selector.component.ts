import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, WritableSignal } from '@angular/core';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';

export interface Video {
  id: string;
  title: string;
  duration: number; // Duração em minutos
  url: string;
}

@Component({
  selector: 'app-video-selector',
  standalone: true,
  imports: [CommonModule,SearchBarComponent],
  templateUrl: './video-selector.component.html',
  styleUrls: ['./video-selector.component.scss']
})
export class VideoSelectorComponent implements OnInit {
  allVideos = signal<Video[]>([]); // Signal para a lista de vídeos
  selectedVideoIds = signal<string[]>([]); // Signal para os IDs dos vídeos selecionados

  selectedVideos = computed(() => {
    return this.allVideos().filter(video => this.selectedVideoIds().includes(video.id));
  });

  ngOnInit(): void {
    this.loadAllVideos();
  }

  loadAllVideos(): void {
    const videos: Video[] = [
      { id: '1', title: 'Introdução', duration: 10, url: 'url-do-video-1' },
      { id: '2', title: 'Aula 1', duration: 20, url: 'url-do-video-2' },
      { id: '3', title: 'Aula 2', duration: 15, url: 'url-do-video-3' },
      // Mais vídeos...
    ];
    this.allVideos.set(videos);
  }

  onCheckboxChange(videoId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      this.selectedVideoIds.set([...this.selectedVideoIds(), videoId]);
    } else {
      this.selectedVideoIds.set(this.selectedVideoIds().filter(id => id !== videoId));
    }
  }
}
