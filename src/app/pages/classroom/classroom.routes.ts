import { Routes } from '@angular/router';
import { ClassroomComponent } from './classroom.component';
import { CoursePlayerComponent } from '../../features/course/components/course-player/course-player.component';
import { StudentExamsComponent } from '../../features/student/components/student-exams/student-exams.component';
import { ExamDetailsComponent } from '../../features/student/components/exam-details/exam-details.component';
import { StudentDashboardComponent } from '../../features/student/components/student-dashboard/student-dashboard.component';
import { StudentJobVacancyListComponent } from '../../features/student/components/student-job-vacancy-list/student-job-vacancy-list.component';
import { StudentIdCardComponent } from '../../features/student/components/student-id-card/student-id-card.component';
import { PackageCatalogComponent } from '../../features/package/components/package-catalog/package-catalog.component';
import { CourseCatalogComponent } from '../../features/course/components/course-catalog/course-catalog.component';
import { StudentFinancialComponent } from '../../features/student/components/student-financial/student-financial.component';
// import { JobVacancyDetailsComponent } from '../../features/student/components/job-vacancy-details/job-vacancy-details.component';

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
      {
        path: 'student-job-vacancies',
        component: StudentJobVacancyListComponent,
      },
      {
        path: 'student-id-card',
        component: StudentIdCardComponent,
      },
      {
        path: 'student-financial',
        component: StudentFinancialComponent,
      },
      // {
      //   path: 'job-vacancy-details/:id',
      //   component: JobVacancyDetailsComponent,
      // },
];
