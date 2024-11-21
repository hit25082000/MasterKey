import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CourseService } from '../../../course/services/course.service';
import { Course } from '../../../../core/models/course.model';
import { forkJoin, map, switchMap } from 'rxjs';

interface CourseProgress {
  course: Course;
  progress: number;
  watchedVideos: number;
  totalVideos: number;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h2>Dashboard</h2>
        <p class="welcome-message">Bem-vindo, {{ studentName() }}</p>
      </div>

      @if (isLoading()) {
        <div class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Carregando informações...</p>
        </div>
      } @else {
        <div class="dashboard-content">
          <!-- Resumo Geral -->
          <div class="summary-section">
            <div class="summary-card total-courses">
              <i class="fas fa-book"></i>
              <div class="card-content">
                <h3>Total de Cursos</h3>
                <p>{{ totalCourses() }}</p>
              </div>
            </div>
            <div class="summary-card total-watched">
              <i class="fas fa-play-circle"></i>
              <div class="card-content">
                <h3>Aulas Assistidas</h3>
                <p>{{ totalWatchedVideos() }}</p>
              </div>
            </div>
            <div class="summary-card average-progress">
              <i class="fas fa-chart-line"></i>
              <div class="card-content">
                <h3>Progresso Médio</h3>
                <p>{{ averageProgress().toFixed(1) }}%</p>
              </div>
            </div>
          </div>

          <!-- Lista de Cursos com Progresso -->
          <div class="courses-progress-section">
            <h3>Progresso dos Cursos</h3>
            <div class="courses-grid">
              @for (course of coursesProgress(); track course.course.id) {
                <div class="course-progress-card">
                  <div class="course-info">
                    <img [src]="course.course.image || 'assets/images/default-course.jpg'" [alt]="course.course.name">
                    <div class="course-details">
                      <h4>{{ course.course.name }}</h4>
                      <div class="progress-info">
                        <div class="progress-bar">
                          <div class="progress-fill" [style.width.%]="course.progress"></div>
                        </div>
                        <span class="progress-text">{{ course.progress.toFixed(1) }}%</span>
                      </div>
                      <p class="videos-count">
                        {{ course.watchedVideos }}/{{ course.totalVideos }} aulas concluídas
                      </p>
                    </div>
                  </div>
                  <a [routerLink]="['/classroom/course-player', course.course.id]" class="btn-continue">
                    <i class="fas fa-play"></i>
                    Continuar
                  </a>
                </div>
              } @empty {
                <div class="no-courses">
                  <i class="fas fa-book-open"></i>
                  <p>Você ainda não tem cursos em andamento</p>
                  <a routerLink="/classroom/course-catalog" class="btn-browse">
                    Explorar Cursos
                  </a>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit {
  private studentService = inject(StudentService);
  private authService = inject(AuthService);
  private courseService = inject(CourseService);

  isLoading = signal(true);
  studentName = signal('');
  coursesProgress = signal<CourseProgress[]>([]);

  // Computed values
  totalCourses = computed(() => this.coursesProgress().length);
  totalWatchedVideos = computed(() => 
    this.coursesProgress().reduce((total, course) => total + course.watchedVideos, 0)
  );
  averageProgress = computed(() => {
    const courses = this.coursesProgress();
    if (courses.length === 0) return 0;
    return courses.reduce((sum, course) => sum + course.progress, 0) / courses.length;
  });

  ngOnInit() {
    const studentId = this.authService.getCurrentUserId();
    if (!studentId) {
      this.isLoading.set(false);
      return;
    }

    // Carrega o nome do estudante
    const student = this.authService.getCurrentUser();
    if (student) {
      this.studentName.set(student.name);
    }

    // Carrega os cursos e seus progressos
    this.loadStudentProgress(studentId);
  }

  private loadStudentProgress(studentId: string) {
    this.authService.user$.pipe(
      switchMap(user => {
        if (!user) return [];
        return this.studentService.getCourses(user.uid);
      }),
      switchMap(courseIds => {
        if (!courseIds || courseIds.length === 0) {
          this.isLoading.set(false);
          return [];
        }

        const courseObservables = courseIds.map(courseId => 
          forkJoin({
            course: this.courseService.getById(courseId),
            watchedVideos: this.studentService.getWatchedVideos(studentId, courseId),
          }).pipe(
            map(({ course, watchedVideos }) => ({
              course,
              progress: (watchedVideos.length / (course.videos?.length || 1)) * 100,
              watchedVideos: watchedVideos.length,
              totalVideos: course.videos?.length || 0
            }))
          )
        );

        return forkJoin(courseObservables);
      })
    ).subscribe({
      next: (progress) => {
        this.coursesProgress.set(progress);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar progresso:', error);
        this.isLoading.set(false);
      }
    });
  }
} 