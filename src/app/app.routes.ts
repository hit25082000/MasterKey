import { Routes } from '@angular/router';
import { AdminComponent } from './pages/admin/admin.component';
import { ClassroomComponent } from './pages/classroom/classroom.component';
import { EcommerceComponent } from './pages/ecommerce/ecommerce.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { LoginComponent } from './auth/login/login.component';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { RoleGuard } from './auth/guards/role.guard';
import { RoutePermission } from './features/role/components/permission-select/permission.enum';
import { ECOMMERCE_ROUTES } from './pages/ecommerce/ecommerce.routes';
import { CLASSROOM_ROUTES } from './pages/classroom/classroom.routes';
import { ADMIN_ROUTES } from './pages/admin/admin.routes';
import { ExamListComponent } from './features/exam/components/exam-list/exam-list.component';
import { ExamFormComponent } from './features/exam/components/exam-form/exam-form.component';
import { CourseFormComponent } from './features/course/components/course-form/course-form.component'; // Added import

export const routes: Routes = [
  {
    path: '',
    component: EcommerceComponent,
    children: ECOMMERCE_ROUTES
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { permission: RoutePermission.ADMIN },
    children: [
      {
        path: 'course-form',
        component: CourseFormComponent
      },
      {
        path: 'course-form/:id',
        component: CourseFormComponent
      },
      {
        path: 'course/auth',
        component: CourseFormComponent
      },
      ...ADMIN_ROUTES, // Added spread operator to include existing admin routes
    ],
  },
  { path: 'login', component: LoginComponent },
  {
    path: 'classroom',
    component: ClassroomComponent,
    canActivate: [AuthGuard],
    children: CLASSROOM_ROUTES,
  },
  { path: 'unauthorized', component: UnauthorizedComponent },
  {
    path: 'courses/:id/exams',
    children: [
      {
        path: '',
        component: ExamListComponent
      },
      {
        path: 'new',
        component: ExamFormComponent
      },
      {
        path: 'edit/:examId',
        component: ExamFormComponent
      }
    ]
  },
  { path: '**', component: NotFoundComponent },
];
