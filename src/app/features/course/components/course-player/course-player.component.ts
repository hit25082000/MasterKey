import { Component, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Course, CourseModule, CourseVideo } from '../../../../core/models/course.model';
import { CourseService } from '../../services/course.service';
import { StudentService } from '../../../student/services/student.service';
import { Exam, StudentExam } from '../../../../core/models/exam.model';
import { SafePipe } from '../../../../shared/pipes/safe.pipe';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { DomSanitizer } from '@angular/platform-browser';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ExamTakeComponent } from '../../../exam/components/exam-take/exam-take.component';
import { firstValueFrom } from 'rxjs';
import { ExamService } from '../../../../core/services/exam.service';
import { HandoutService } from '../../../ecommerce/services/handout.service';
import { BookService } from '../../../library/services/book.service';
import { Book } from '../../../../core/models/book.model';
import { Handout } from '../../../../core/models/handout.model';

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [
    CommonModule,
    SafePipe,
    ModalComponent,
    ExamTakeComponent
  ],
  templateUrl: './course-player.component.html',
  styleUrls: ['./course-player.component.scss']
})
export class CoursePlayerComponent implements OnInit, OnDestroy {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef;
  @ViewChild('examModal') examModal!: ModalComponent;
  private courseService = inject(CourseService);
  private examService = inject(ExamService);
  private route = inject(ActivatedRoute);
  private studentService = inject(StudentService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private handoutService = inject(HandoutService);
  private bookService = inject(BookService);
  private videoTimer: any;
  private readonly WATCH_TIME_THRESHOLD = 10; // 10 segundos

  course = signal<Course | null>(null);
  currentVideo = signal<CourseVideo | null>(null);
  isLoading = signal(true);
  watchedVideos = signal<Set<string>>(new Set());
  expandedModules = signal<Set<string>>(new Set());
  exams = signal<Exam[]>([]);
  examResults = signal<{[key: string]: StudentExam}>({});
  currentExamId = signal<string | null>(null);
  books = signal<Book[]>([]);
  handouts = signal<Handout[]>([]);

  async ngOnInit() {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (!courseId) {
      this.notificationService.error('ID do curso não encontrado');
      return;
    }

    await this.loadCourse(courseId);
    await this.loadExams(courseId);
    await this.loadWatchedVideos(courseId);
    await this.loadExamResults();
    await this.loadBooks(courseId);
    await this.loadHandouts(courseId);
  }

  async loadCourse(courseId: string) {
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

  async loadExams(courseId: string) {
    try {
      const examsObservable = this.examService.getExamsByCourse(courseId);
      examsObservable.subscribe(exams => {
        this.exams.set(exams);
      });
    } catch (error) {
      console.error('Erro ao carregar exames:', error);
    }
  }

  async loadWatchedVideos(courseId: string) {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.notificationService.error('Usuário não autenticado');
      return;
    }

    try {
      const watchedVideoIds = await this.studentService.getWatchedVideos(userId, courseId);
      const watchedSet = new Set<string>(watchedVideoIds);
      this.watchedVideos.set(watchedSet);
    } catch (error) {
      console.error('Erro ao carregar vídeos assistidos:', error);
      this.notificationService.error('Erro ao carregar progresso do curso');
    }
  }

  async loadExamResults() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      try {
        const results = await firstValueFrom(this.examService.getStudentExams(userId));
        this.examResults.set(results.reduce((acc, result) => {
          acc[result.examId] = {
            id: result.id,
            examId: result.examId,
            studentId: result.studentId,
            answers: result.answers,
            score: result.score,
            submittedAt: result.submittedAt
          };
          return acc;
        }, {} as {[key: string]: StudentExam}));
      } catch (error) {
        console.error('Erro ao carregar resultados dos exames:', error);
        this.notificationService.error('Erro ao carregar resultados dos exames');
      }
    }
  }

  toggleModule(moduleName: string) {
    const expanded = this.expandedModules();
    if (expanded.has(moduleName)) {
      expanded.delete(moduleName);
    } else {
      expanded.add(moduleName);
    }
    this.expandedModules.set(expanded);
  }

  selectVideo(video: CourseVideo) {
    this.currentVideo.set(video);
    this.startVideoTimer(video);
  }

  onVideoLoad() {
    // Verifica se o elemento do vídeo existe antes de iniciar o timer
    if (this.videoPlayer?.nativeElement) {
      const video = this.currentVideo();
      if (video) {
        this.startVideoTimer(video);
      }
    }
  }

  startVideoTimer(video: CourseVideo) {
    if (this.videoTimer) {
      clearTimeout(this.videoTimer);
    }

    this.videoTimer = setTimeout(async () => {
      const userId = this.authService.getCurrentUserId();
      if (!userId) {
        this.notificationService.error('Usuário não autenticado');
        return;
      }

      try {
        await this.studentService.saveVideoProgress(
          userId,
          this.course()!.id,
          video.videoId
        );

        const watched = this.watchedVideos();
        watched.add(video.videoId);
        this.watchedVideos.set(watched);
      } catch (error) {
        console.error('Erro ao marcar vídeo como assistido:', error);
        this.notificationService.error('Erro ao salvar progresso do vídeo');
      }
    }, this.WATCH_TIME_THRESHOLD * 1000);
  }

  getTotalVideos(): number {
    let total = 0;
    this.course()?.modules?.forEach(module => {
      total += module.videos?.length || 0;
    });
    return total;
  }

  getProgressPercentage(): number {
    const total = this.getTotalVideos();
    if (!total) return 0;
    return (this.watchedVideos().size / total) * 100;
  }

  getModuleProgress(module: CourseModule): string {
    if (!module.videos?.length) return '0/0';
    const watched = module.videos.filter(v => this.watchedVideos().has(v.videoId)).length;
    return `${watched}/${module.videos.length}`;
  }

  getCurrentModuleExams(): Exam[] {
    if (!this.course() || !this.exams().length || !this.currentVideo()) return [];
    
    const currentModule = this.course()?.modules.find(
      m => m.videos.some(v => v.videoId === this.currentVideo()?.videoId)
    );

    if (!currentModule) return [];

    return this.exams().filter(e => e.moduleId === currentModule.name);
  }

  canTakeModuleExams(): boolean {
    if (!this.currentVideo()) return false;
    
    const currentModule = this.course()?.modules.find(
      m => m.videos.some(v => v.videoId === this.currentVideo()?.videoId)
    );

    if (!currentModule) return false;

    // Verifica se todos os vídeos do módulo foram assistidos
    return currentModule.videos.every(v => 
      !v.active || this.watchedVideos().has(v.videoId)
    );
  }

  hasModuleExams(): boolean {
    return this.getCurrentModuleExams().length > 0;
  }

  getExamStatusClass(examId: string): string {
    const status = this.getExamStatus(examId);
    return status.status;
  }

  getExamStatusText(examId: string): string {
    const status = this.getExamStatus(examId);
    switch (status.status) {
      case 'not-taken': return 'Não realizado';
      case 'passed': return `Aprovado (${status.score}%)`;
      case 'failed': return `Reprovado (${status.score}%)`;
      default: return 'Pendente';
    }
  }

  getExamStatus(examId: string): { status: 'not-taken' | 'passed' | 'failed', score?: number } {
    const result = this.examResults()[examId];
    if (!result) {
      return { status: 'not-taken' };
    }
    return {
      status: result.score >= 70 ? 'passed' : 'failed',
      score: result.score
    };
  }

  async startExam(examId: string) {
    if (!this.canTakeModuleExams()) {
      this.notificationService.error('Complete todos os vídeos do módulo antes de fazer a avaliação');
      return;
    }

    const exam = this.getCurrentModuleExams().find(e => e.id === examId);
    if (!exam) {
      this.notificationService.error('Avaliação não encontrada');
      return;
    }

    this.currentExamId.set(examId);
    this.examModal.show = true;
  }

  async onExamComplete() {
    try {
      // Atualiza os resultados dos exames
      await this.loadExamResults();
      this.notificationService.success('Avaliação concluída com sucesso!');
      this.examModal.show = false;
      this.currentExamId.set(null);
    } catch (error) {
      console.error('Erro ao finalizar exame:', error);
      this.notificationService.error('Erro ao finalizar exame');
    }
  }

  onExamCancel() {
    this.examModal.show = false;
    this.currentExamId.set(null);
  }

  ngOnDestroy() {
    // Limpa o timer quando o componente é destruído
    if (this.videoTimer) {
      clearTimeout(this.videoTimer);
    }
  }

  async loadBooks(courseId: string) {
    try {
      const courseBooks = await this.bookService.getBooksByCourseId(courseId);
      this.books.set(courseBooks);
    } catch (error) {
      console.error('Erro ao carregar livros:', error);
      this.notificationService.error('Erro ao carregar livros do curso');
    }
  }

  async loadHandouts(courseId: string) {
    try {
      const handoutIds = await this.courseService.getHandouts(courseId);
      const handoutPromises = handoutIds.map(id => this.handoutService.getById(id));
      const handouts = await Promise.all(handoutPromises);
      this.handouts.set(handouts);
    } catch (error) {
      console.error('Erro ao carregar apostilas:', error);
      this.notificationService.error('Erro ao carregar apostilas do curso');
    }
  }
}
