import { Routes } from '@angular/router';
import { ClassroomComponent } from './classroom.component';
import { CoursePlayerComponent } from '../../features/course/components/course-player/course-player.component';
import { CourseCatalogComponent } from '../../features/course/components/course-catalog/course-catalog.component';
import { PackageCatalogComponent } from '../../features/package/components/package-catalog/package-catalog.component';
import { StudentExamsComponent } from '../../features/student/components/student-exams/student-exams.component';
import { ExamDetailsComponent } from '../../features/student/components/exam-details/exam-details.component';
import { StudentDashboardComponent } from '../../features/student/components/student-dashboard/student-dashboard.component';

export const CLASSROOM_ROUTES: Routes = [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: StudentDashboardComponent,
      },
      {
        path: 'course-player/:id',
        component: CoursePlayerComponent,
      },
      {
        path: 'course-catalog',
        component: CourseCatalogComponent,
      },
      {
        path: 'package-catalog',
        component: PackageCatalogComponent,
      },
      {
        path: 'student-exams',
        component: StudentExamsComponent,
      },
      {
        path: 'exam-details/:id',
        component: ExamDetailsComponent,
      },
];
