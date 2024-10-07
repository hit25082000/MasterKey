import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-course-catalog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-catalog.component.html',
  styleUrl: './course-catalog.component.scss'
})
export class CourseCatalogComponent implements OnInit {
  studentCourses: any[] = [];
  studentPackages: any[] = [];

  constructor(
    private firestoreService: FirestoreService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadStudentCoursesAndPackages();
  }

  async loadStudentCoursesAndPackages() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      this.studentCourses = await this.firestoreService.getDocumentsByAttribute('student_courses', 'studentId', currentUser.id);
      this.studentPackages = await this.firestoreService.getDocumentsByAttribute('student_packages', 'studentId', currentUser.id);
    }
  }
}
