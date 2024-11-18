import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { DashboardComponent } from '../../features/dashboard/dashboard.component';
import { StudentListComponent } from '../../features/student/components/student-list/student-list.component';
import { StudentLoginListComponent } from '../../features/student/components/student-login-list/student-login-list.component';
import { LibraryCourseComponent } from '../../features/library/components/library-course/library-course.component';
import { StudentFormComponent } from '../../features/student/components/student-form/student-form.component';
import { CourseDetailsComponent } from '../../features/course/components/course-details/course-details.component';
import { ExamListComponent } from '../../features/exam/components/exam-list/exam-list.component';
import { CourseListComponent } from '../../features/course/components/course-list/course-list.component';
import { CourseRegisterComponent } from '../../features/course/components/course-register/course-register.component';
import { PackageFormComponent } from '../../features/package/components/package-form/package-form.component';
import { PackageListComponent } from '../../features/package/components/package-list/package-list.component';
import { ClassFormComponent } from '../../features/class/components/class-form/class-form.component';
import { ClassListComponent } from '../../features/class/components/class-list/class-list.component';
import { RoleFormComponent } from '../../features/role/components/role-form/role-form.component';
import { RoleListComponent } from '../../features/role/components/role-list/role-list.component';
import { EmployeeFormComponent } from '../../features/employees/components/employee-form/employee-form.component';
import { CategoryFormComponent } from '../../features/category/components/category-form/category-form.component';
import { CategoryListComponent } from '../../features/category/components/category-list/category-list.component';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RoleGuard } from '../../auth/guards/role.guard';
import { RoutePermission } from '../../features/role/components/permission-select/permission.enum';
import { CourseFormComponent } from '../../features/course/components/course-form/course-form.component';
import { MeetingComponent } from '../../features/meet/components/meet/meet.component';
import { JobVacancyFormComponent } from '../../features/student/components/job-vacancy-form/job-vacancy-form.component';
import { JobVacancyListComponent } from '../../features/student/components/job-vacancy-list/job-vacancy-list.component';
import { EmployeeListComponent } from '../../features/employees/components/employee-list/employee-list.component';

export const ADMIN_ROUTES: Routes = [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.ADMIN }
      },
      // Rotas de Estudantes
      {
        path: 'student-list',
        component: StudentListComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_STUDENTS }
      },
      {
        path: 'student-register',
        component: StudentFormComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.CREATE_STUDENT }
      },
      {
        path: 'student-register/:id',
        component: StudentFormComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.EDIT_STUDENT }
      },
      {
        path: 'student-login-list',
        component: StudentLoginListComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_STUDENT_LOGIN }
      },
      // Rotas de Cursos
      {
        path: 'course-list',
        component: CourseListComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_COURSES }
      },
      {
        path: 'course-form',
        component: CourseFormComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.CREATE_COURSE }
      },
      {
        path: 'course-form/:id',
        component: CourseFormComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.EDIT_COURSE }
      },
      {
        path: 'course-detail/:id',
        component: CourseDetailsComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_COURSES }
      },
      // Rotas de Pacotes
      {
        path: 'package-list',
        component: PackageListComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_PACKAGES }
      },
      {
        path: 'package-form',
        component: PackageFormComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.CREATE_PACKAGE }
      },
      {
        path: 'package-form/:id',
        component: PackageFormComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.EDIT_PACKAGE }
      },
      // Rotas de Categorias
      {
        path: 'category-list',
        component: CategoryListComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_CATEGORIES }
      },
      {
        path: 'category-form',
        component: CategoryFormComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.CREATE_CATEGORY }
      },
      {
        path: 'category-form/:id',
        component: CategoryFormComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.EDIT_CATEGORY }
      },
      // Rotas de Turmas
      {
        path: 'class-list',
        component: ClassListComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_CLASSES }
      },
      {
        path: 'class-form',
        component: ClassFormComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.CREATE_CLASS }
      },
      {
        path: 'class-form/:id',
        component: ClassFormComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.EDIT_CLASS }
      },
      // Rotas de Funcionários
      {
        path: 'employee-list',
        component: EmployeeListComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_EMPLOYEES }
      },
      {
        path: 'employee-form',
        component: EmployeeFormComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.CREATE_EMPLOYEE }
      },
      {
        path: 'employee-form/:id',
        component: EmployeeFormComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.EDIT_EMPLOYEE }
      },
      // Rotas de Funções
      {
        path: 'role-list',
        component: RoleListComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_ROLES }
      },
      {
        path: 'role-form',
        component: RoleFormComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.CREATE_ROLE }
      },
      {
        path: 'role-form/:id',
        component: RoleFormComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.EDIT_ROLE }
      },
      // Rotas de Vagas
      {
        path: 'job-vacancy',
        component: JobVacancyListComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_JOBS }
      },
      {
        path: 'create-vacancy',
        component: JobVacancyFormComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.CREATE_JOB }
      },
      {
        path: 'edit-vacancy/:id',
        component: JobVacancyFormComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.EDIT_JOB }
      },
      // Rotas de Exames
      {
        path: 'exams/:id',
        component: ExamListComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_EXAMS }
      },
      // Rotas de Biblioteca
      {
        path: 'course-library/:id',
        component: LibraryCourseComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_LIBRARY }
      },
      // Rotas de Aulas ao Vivo
      {
        path: 'meet',
        component: MeetingComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_MEETINGS }
      }
];
