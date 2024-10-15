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
  templateUrl: './course-catalog.component.html',
  styleUrl: './course-catalog.component.scss'
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
