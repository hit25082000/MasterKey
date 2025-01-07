import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { Video, Course } from '../../../../core/models/course.model';
import { Exam, Answer, ExamTake } from '../../../../core/models/exam.model';
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
      @if (isLoading) {
        <div class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Carregando curso...</p>
        </div>
      } @else {
        <div class="player-container">
          <!-- Seção do Player -->
          <div class="player-section">
            <h2>{{ course.name }}</h2>
            <div class="video-player">
              <iframe
                #videoPlayer
                [src]="getEmbedUrl(currentVideo.webViewLink) | safe:'resourceUrl'"
                frameborder="0"
                allowfullscreen
                (load)="onVideoLoad()"
              ></iframe>
            </div>
            <div class="current-video-info">
              <h3>{{ currentVideo.name }}</h3>
              <span class="duration">
                <i class="fas fa-clock"></i>
                {{ currentVideo.duration }} minutos
              </span>
            </div>
          </div>

          <!-- Seção da Lista -->
          <div class="content-section">
            <div class="videos-section">
              <h3>
                <i class="fas fa-play-circle"></i>
                Vídeos do Curso
              </h3>
              <div class="video-list">
                @for (video of course?.videos; track video.id) {
                  <div
                    class="video-item"
                    [class.active]="video.id === currentVideo.id"
                    [class.watched]="watchedVideos.has(video.id)"
                    (click)="playVideo(video)"
                  >
                    <div class="video-info">
                      <span class="video-status">
                        @if (watchedVideos.has(video.id)) {
                          <i class="fas fa-check-circle"></i>
                        } @else if (video.id === currentVideo.id) {
                          <i class="fas fa-play-circle"></i>
                        } @else {
                          <i class="far fa-circle"></i>
                        }
                      </span>
                      <span class="video-name">{{ video.name }}</span>
                    </div>
                    <span class="video-duration">{{ video.duration }}min</span>
                  </div>
                }
              </div>
            </div>

            <div class="exams-section">
              <h3>
                <i class="fas fa-file-alt"></i>
                Provas Disponíveis
              </h3>
              <div class="exam-list">
                @for (exam of exams$ | async; track exam.id) {
                  <div class="exam-item">
                    <div class="exam-info">
                      <span class="exam-name">{{ exam.title }}</span>
                      @if (studentExams.has(exam.id)) {
                      <span class="exam-status completed">
                        Concluído
                      </span>
                      }@else {
                      <span class="exam-status available">
                        Disponível
                      </span>
                      }
                    </div>
                    <button class="btn-start" (click)="examModal.toggle()">
                      <i class="fas" [class.fa-eye]="studentExams.has(exam.id)" [class.fa-pencil-alt]="!studentExams.has(exam.id)"></i>
                      {{ studentExams.has(exam.id) ? 'Ver Resultado' : 'Iniciar Prova' }}
                    </button>

                    <app-modal #examModal>
                      <app-exam-take [examId]="exam.id"></app-exam-take>
                    </app-modal>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./course-player.component.scss']
})
export class CoursePlayerComponent implements OnInit {
  course!: Course;
  currentVideo!: Video;
  watchedVideos: Set<string> = new Set();
  studentExams: Set<string> = new Set();
  exams$!: Observable<ExamTake[]>;
  isLoading: boolean = true;
  private videoStarted: boolean = false;
  private videoWatchTimeout: any;
  private studentId: string;

  @ViewChild('videoPlayer') videoPlayer!: ElementRef;

  private studentService = inject(StudentService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private examService: ExamService
  ) {
    this.studentId = this.authService.getCurrentUserId()!;
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const courseId = params.get('id');
      if (courseId) {
        this.loadCourse(courseId);
        this.loadExams(courseId);
        this.loadWatchedVideos(courseId);
        this.loadStudentExams();
      } else {
        console.error('ID do curso não fornecido');
      }
    });
  }

  private async loadWatchedVideos(courseId: string) {
    try {
      const watched = await this.studentService.getWatchedVideos(this.studentId, courseId);
      this.watchedVideos = new Set(watched);
    } catch (error) {
      console.error('Erro ao carregar vídeos assistidos:', error);
    }
  }

  private async loadStudentExams() {
    try {
      const exams = await this.studentService.getStudentExams(this.studentId, this.course.id!);
      this.studentExams = new Set(exams.map(exam => exam.id!));
    } catch (error) {
      console.error('Erro ao carregar vídeos assistidos:', error);
    }
  }

  loadCourse(courseId: string) {
    from(this.courseService.getById(courseId)).subscribe(course => {
      this.course = course;
      console.log(this.course)
      this.currentVideo = course.videos![0];
      this.isLoading = false;
    });

  }

  loadExams(courseId: string) {
    this.exams$ = this.examService.getExamsTakeByCourse(courseId);
  }

  onVideoLoad() {
    // Limpa o timeout anterior se existir
    if (this.videoWatchTimeout) {
      clearTimeout(this.videoWatchTimeout);
    }

    // Inicia um novo timeout para marcar o vídeo como assistido
    this.videoWatchTimeout = setTimeout(() => {
      if (!this.watchedVideos.has(this.currentVideo.id)) {
        this.markVideoAsWatched(this.currentVideo.id);
      }
    }, 10000); // 10 segundos para considerar como assistido
  }

  async markVideoAsWatched(videoId: string) {
    try {
      await this.studentService.saveVideoProgress(this.studentId, this.course.id!, videoId);
      this.watchedVideos.add(videoId);
      this.notificationService.success('Progresso salvo');
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
      this.notificationService.error('Erro ao salvar progresso');
    }
  }

  playVideo(video: Video) {
    // Limpa o timeout do vídeo anterior
    if (this.videoWatchTimeout) {
      clearTimeout(this.videoWatchTimeout);
    }

    this.currentVideo = video;
    this.videoStarted = false;

    // Reinicia a verificação para o novo vídeo
    this.onVideoLoad();
  }

  ngOnDestroy() {
    // Limpa o timeout quando o componente é destruído
    if (this.videoWatchTimeout) {
      clearTimeout(this.videoWatchTimeout);
    }
  }

  getEmbedUrl(driveUrl: string): string {
    // Extrai o ID do arquivo do URL do Google Drive
    const fileId = this.extractFileId(driveUrl);
    // Retorna o URL de incorporação
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  private extractFileId(url: string): string {
    // Padrão para URLs do tipo compartilhamento
    const sharePattern = /\/file\/d\/([^\/]+)/;
    // Padrão para URLs do tipo visualização
    const viewPattern = /id=([^&]+)/;

    let match = url.match(sharePattern);
    if (match) return match[1];

    match = url.match(viewPattern);
    if (match) return match[1];

    // Se não encontrar o padrão, retorna a URL original
    // Você pode querer tratar isso de forma diferente
    return url;
  }
}
