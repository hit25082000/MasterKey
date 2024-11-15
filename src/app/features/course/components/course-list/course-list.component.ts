import { routes } from './../../../../app.routes';
import { Component, inject, OnInit } from '@angular/core';
import { Course } from '../../../../core/models/course.model';
import { Route, Router } from '@angular/router';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss'],
})
export class CourseListComponent implements OnInit {
  courses$!: Observable<Course[]>;
  firestore = inject(FirestoreService);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses() {
    this.courses$ = this.firestore.getCollectionObservable('courses');
  }

  editCourse(courseId: string): void {
    this.router.navigate(['/admin/course-form', courseId]);
  }
}
