import { Routes } from '@angular/router';
import { AdminComponent } from './pages/admin/admin.component';
import { ClassroomComponent } from './pages/classroom/classroom.component';
import { EcommerceComponent } from './pages/ecommerce/ecommerce.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { StudentDetailsComponent } from './features/student/components/student-details/student-details.component';
import { StudentListComponent } from './features/student/components/student-list/student-list.component';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { StudentRegisterComponent } from './features/student/components/student-register/student-register.component';
import { CourseRegisterComponent } from './features/course/components/course-register/course-register.component';
import { CourseListComponent } from './features/course/components/course-list/course-list.component';
import { CourseDetailsComponent } from './features/course/components/course-details/course-details.component';
import { RoleListComponent } from './features/role/components/role-list/role-list.component';
import { RoleDetailsComponent } from './features/role/components/role-details/role-details.component';
import { RoleRegisterComponent } from './features/role/components/role-register/role-register.component';
import { ClassRegisterComponent } from './features/class/components/class-register/class-register.component';
import { ClassListComponent } from './features/class/components/class-list/class-list.component';
import { ClassDetailsComponent } from './features/class/components/class-details/class-details.component';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { RoleGuard } from './auth/guards/role.guard';
import { EmployeeListComponent } from './features/employees/components/employee-list/employee-list.component';
import { EmployeeDetailsComponent } from './features/employees/components/employee-details/employee-details.component';
import { EmployeeRegisterComponent } from './features/employees/components/employee-register/employee-register.component';
import { PackageListComponent } from './features/package/components/package-list/package-list.component';
import { PackageDetailsComponent } from './features/package/components/package-details/package-details.component';
import { PackageRegisterComponent } from './features/package/components/package-register/package-register.component';
import { CategoryDetailsComponent } from './features/category/components/category-details/category-details.component';
import { CategoryListComponent } from './features/category/components/category-list/category-list.component';
import { CategoryRegisterComponent } from './features/category/components/category-register/category-register.component';
import { RoutePermission } from './features/role/components/permission-select/permission.enum';
import { StudentLoginListComponent } from './features/student/components/student-login-list/student-login-list.component';
import { MeetingComponent } from './features/meet/components/meet/meet.component';
import { JobVacancyListComponent } from './features/student/components/job-vacancy-list/job-vacancy-list.component';
import { JobVacancyFormComponent } from './features/student/components/job-vacancy-form/job-vacancy-form.component';
import { LibraryCourseComponent } from './features/library/components/library-course/library-course.component';
import { CourseCatalogComponent } from './features/course/components/course-catalog/course-catalog.component';
export const routes: Routes = [
  { path: '', component: EcommerceComponent },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { permission: RoutePermission.ADMIN_PANEL },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'student-detail/:id',
        component: StudentDetailsComponent,
      },
      {
        path: 'student-list',
        component: StudentListComponent,
      },
      {
        path: 'student-login-list',
        component: StudentLoginListComponent,
      },
      {
        path: 'meet',
        component: MeetingComponent,
      },
      {
        path: 'course-library/:id',
        component: LibraryCourseComponent,
      },
      {
        path: 'job-vacancy',
        component: JobVacancyListComponent,
      },
      {
        path: 'create-vacancy',
        component: JobVacancyFormComponent,
      },
      {
        path: 'edit-vacancy/:id',
        component: JobVacancyFormComponent,
      },
      {
        path: 'student-register',
        component: StudentRegisterComponent,
      },
      {
        path: 'course-detail/:id',
        component: CourseDetailsComponent,
      },
      {
        path: 'course-list',
        component: CourseListComponent,
      },
      {
        path: 'course-register',
        component: CourseRegisterComponent,
      },
      {
        path: 'package-detail/:id',
        component: PackageDetailsComponent,
      },
      {
        path: 'package-list',
        component: PackageListComponent,
      },
      {
        path: 'package-register',
        component: PackageRegisterComponent,
      },
      {
        path: 'class-detail/:id',
        component: ClassDetailsComponent,
      },
      {
        path: 'class-list',
        component: ClassListComponent,
      },
      {
        path: 'class-register',
        component: ClassRegisterComponent,
      },
      {
        path: 'role-detail/:id',
        component: RoleDetailsComponent,
      },
      {
        path: 'role-list',
        component: RoleListComponent,
      },
      {
        path: 'role-register',
        component: RoleRegisterComponent,
      },
      {
        path: 'employee-detail/:id',
        component: EmployeeDetailsComponent,
      },
      {
        path: 'employee-list',
        component: EmployeeListComponent,
      },
      {
        path: 'employee-register',
        component: EmployeeRegisterComponent,
      },
      {
        path: 'category-detail/:id',
        component: CategoryDetailsComponent,
      },
      {
        path: 'category-list',
        component: CategoryListComponent,
      },
      {
        path: 'category-register',
        component: CategoryRegisterComponent,
      },
    ],
  },
  { path: 'login', component: LoginComponent },
  {
    path: 'classroom',
    component: ClassroomComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'course-catalog',
        component: CourseCatalogComponent,
      },
    ]
  },
  { path: 'ecommerce', component: EcommerceComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', component: NotFoundComponent },
];
