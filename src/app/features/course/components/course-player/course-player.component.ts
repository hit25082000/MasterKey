import { Component, OnInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { Course, CourseModule, CourseVideo } from '../../../../core/models/course.model';
import { Exam } from '../../../../core/models/exam.model';
import { ExamService } from '../../../../core/services/exam.service';
import { from, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SafePipe } from '../../../../shared/pipes/safe.pipe';
import { ModalComponent } from "../../../../shared/components/modal/modal.component";
import { ExamTakeComponent } from '../../../exam/components/exam-take/exam-take.component';
import { StudentService } from '../../../student/services/student.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [CommonModule, SafePipe, ModalComponent, ExamTakeComponent],
  template: `
    <div class="course-player">
      @if (isLoading()) {
        <div class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Carregando curso...</p>
        </div>
      } @else if (!course()) {
        <div class="error-message">
          <p>Curso não encontrado ou sem conteúdo disponível.</p>
        </div>
      } @else {
        <div class="player-container">
          <!-- Seção do Player -->
          <div class="player-section">
            <h2>{{ course()?.name }}</h2>
            @if (currentVideo()) {
              <div class="video-player">
                <iframe
                  #videoPlayer
                  [src]="getEmbedUrl(currentVideo()!.webViewLink) | safe:'resourceUrl'"
                  frameborder="0"
                  allowfullscreen
                  (load)="onVideoLoad()"
                ></iframe>
              </div>
              <div class="current-video-info">
                <h3>{{ currentVideo()?.name }}</h3>
                <span class="duration">
                  <i class="fas fa-clock"></i>
                  {{ currentVideo()?.duration }} minutos
                </span>
              </div>
            } @else {
              <div class="no-video-message">
                <p>Selecione um vídeo para começar.</p>
              </div>
            }
          </div>

          <!-- Seção da Lista -->
          <div class="content-section">
            <div class="modules-list">
              <h3>Módulos do Curso</h3>
              @if (course()?.modules?.length) {
                @for (module of course()?.modules; track module.name) {
                  <div class="module-item">
                    <div class="module-header" (click)="toggleModule(module)">
                      <i class="fas" [class.fa-chevron-down]="expandedModules().has(module.name)" 
                         [class.fa-chevron-right]="!expandedModules().has(module.name)"></i>
                      <h4>{{ module.name }}</h4>
                    </div>
                    @if (expandedModules().has(module.name) && module.videos?.length) {
                      <div class="video-list">
                        @for (video of module.videos; track video.videoId) {
                          @if (video.active) {
                            <div class="video-item" 
                                 [class.active]="currentVideo()?.videoId === video.videoId"
                                 [class.watched]="watchedVideos().has(video.videoId)"
                                 (click)="playVideo(video)">
                              <i class="fas" [class.fa-play]="currentVideo()?.videoId !== video.videoId" 
                                 [class.fa-pause]="currentVideo()?.videoId === video.videoId"></i>
                              <span class="video-title">{{ video.name }}</span>
                              <span class="video-duration">{{ video.duration }} min</span>
                              @if (watchedVideos().has(video.videoId)) {
                                <i class="fas fa-check"></i>
                              }
                            </div>
                          }
                        }
                      </div>
                    }
                  </div>
                }
              } @else {
                <p class="no-modules">Nenhum módulo disponível neste curso.</p>
              }
            </div>

            @if (exams()?.length) {
              <div class="exams">
                <h3>Provas Disponíveis</h3>
                <ul>
                  @for (exam of exams(); track exam.id) {
                    <li>
                      {{ exam.title }}
                      <button (click)="examModal.toggle()">Iniciar Prova</button>
                      <app-modal #examModal>
                        <app-exam-take [examId]="exam.id"></app-exam-take>
                      </app-modal>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./course-player.component.scss']
})
export class CoursePlayerComponent implements OnInit {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef;

  private courseService = inject(CourseService);
  private examService = inject(ExamService);
  private route = inject(ActivatedRoute);
  private studentService = inject(StudentService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  course = signal<Course | null>(null);
  currentVideo = signal<CourseVideo | null>(null);
  isLoading = signal(true);
  watchedVideos = signal<Set<string>>(new Set());
  expandedModules = signal<Set<string>>(new Set());
  exams = signal<Exam[]>([]);

  async ngOnInit() {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (!courseId) {
      this.notificationService.error('ID do curso não encontrado');
      return;
    }

    await this.loadCourse(courseId);
    await this.loadExams(courseId);
    await this.loadWatchedVideos(courseId);
  }

  private async loadCourse(courseId: string) {
    try {
      const course = await this.courseService.getById(courseId);
      // Validar se o curso tem dados válidos
      if (!course || !course.modules) {
        this.notificationService.error('Curso não encontrado ou sem conteúdo');
        this.course.set(null);
        this.isLoading.set(false);
        return;
      }

      // Filtrar módulos vazios e vídeos inativos
      course.modules = course.modules
        .filter(module => module.videos && module.videos.length > 0)
        .map(module => ({
          ...module,
          videos: module.videos.filter(video => video.active)
        }))
        .filter(module => module.videos.length > 0);

      this.course.set(course);

      // Seleciona o primeiro vídeo do primeiro módulo como inicial
      if (course.modules?.length && course.modules[0].videos?.length) {
        this.currentVideo.set(course.modules[0].videos[0]);
        this.expandedModules.update(set => {
          set.add(course.modules[0].name);
          return set;
        });
      }

      this.isLoading.set(false);
    } catch (error) {
      this.notificationService.error('Erro ao carregar curso');
      console.error('Erro ao carregar curso:', error);
      this.course.set(null);
      this.isLoading.set(false);
    }
  }

  private async loadExams(courseId: string) {
    try {
      const examsObservable = this.examService.getExamsByCourse(courseId);
      examsObservable.subscribe(exams => {
        this.exams.set(exams);
      });
    } catch (error) {
      console.error('Erro ao carregar exames:', error);
    }
  }

  private async loadWatchedVideos(courseId: string) {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    try {
      const watched = await this.studentService.getWatchedVideos(userId, courseId);
      this.watchedVideos.set(new Set(watched));
    } catch (error) {
      console.error('Erro ao carregar vídeos assistidos:', error);
    }
  }

  toggleModule(module: CourseModule) {
    this.expandedModules.update(set => {
      if (set.has(module.name)) {
        set.delete(module.name);
      } else {
        set.add(module.name);
      }
      return set;
    });
  }

  async playVideo(video: CourseVideo) {
    this.currentVideo.set(video);
    
    // Marca o vídeo como assistido
    const userId = this.authService.getCurrentUserId();
    const courseId = this.course()?.id;
    
    if (userId && courseId && video.videoId) {
      try {
        await this.studentService.saveVideoProgress(userId, courseId, video.videoId);
        this.watchedVideos.update(set => {
          set.add(video.videoId);
          return set;
        });
      } catch (error) {
        console.error('Erro ao marcar vídeo como assistido:', error);
      }
    }
  }

  getEmbedUrl(url: string): string {
    // Verifica se é uma URL do Google Drive
    const driveMatch = url.match(/\/d\/([^/]+)/);
    if (driveMatch) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    return url;
  }

  onVideoLoad() {
    // Implementar lógica adicional quando o vídeo carregar
  }
}
