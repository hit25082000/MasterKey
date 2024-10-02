import { routes } from './../../../../app.routes';
import { Component, OnInit } from '@angular/core';
import { Course } from '../../../../core/models/course.model';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-course-list',
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss'],
})
export class CourseListComponent implements OnInit {
  courses: Course[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {}

  editCourse(courseId: string): void {
    this.router.navigate(['/course-detail', courseId]);
  }
}
