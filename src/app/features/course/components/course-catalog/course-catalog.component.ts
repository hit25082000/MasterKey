import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { AuthService } from '../../../../core/services/auth.service';
import { forkJoin, of, switchMap, take } from 'rxjs';
import { Course } from '../../../../core/models/course.model';
import { Package } from '../../../../core/models/package.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-course-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="catalog-container">
      <div class="catalog-header">
        <h2>Seus Cursos</h2>
      </div>

      <div class="course-grid">
        @for (course of studentCourses; track course.id) {
          <div class="course-card">
            <div class="course-image">
              <img [src]="course.image || 'assets/images/default-course.jpg'" [alt]="course.name">
            </div>
            <div class="course-content">
              <h3>{{ course.name }}</h3>
              <p>{{ course.description }}</p>
              <div class="course-info">
                <span><i class="fas fa-clock"></i> {{ course.workHours }}h</span>
                <span><i class="fas fa-video"></i> {{ course.modules.length || 0 }} modulos</span>
              </div>
              <a [routerLink]="['/classroom/course-player/', course.id]" class="btn-access">
                <i class="fas fa-play-circle"></i>
                Acessar Curso
              </a>
            </div>
          </div>
        } @empty {
          <div class="no-courses">
            <i class="fas fa-book-open"></i>
            <p>Você ainda não tem cursos disponíveis</p>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./course-catalog.component.scss']
})
export class CourseCatalogComponent implements OnInit {
  studentCourses: Course[] = [];

  constructor(
    private firestoreService: FirestoreService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadStudentCoursesAndPackages();
  }

  async loadStudentCoursesAndPackages() {
    this.authService.user$.pipe(
      take(1),
      switchMap(user => {
        if (user && user.uid) {
          return forkJoin({
            courseIds: this.firestoreService.getDocument('student_courses', user.uid),
          });
        }
        return of({ courseIds: [] });
      }),
      switchMap(({ courseIds }) => {

        const coursesObservables = courseIds.courses.map((id: string) =>
          this.firestoreService.getDocument('courses', id)
        );


        return forkJoin({
          courses: forkJoin(coursesObservables),
        });
      })
    ).subscribe(({ courses }) => {
      this.studentCourses = courses as Course[];
    });
  }
}
