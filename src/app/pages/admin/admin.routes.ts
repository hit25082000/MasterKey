import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { DashboardComponent } from '../../features/dashboard/dashboard.component';
import { StudentListComponent } from '../../features/student/components/student-list/student-list.component';
import { StudentLoginListComponent } from '../../features/student/components/student-login-list/student-login-list.component';
import { LibraryCourseComponent } from '../../features/library/components/library-course/library-course.component';
import { StudentFormComponent } from '../../features/student/components/student-form/student-form.component';
import { ExamListComponent } from '../../features/exam/components/exam-list/exam-list.component';
import { CourseListComponent } from '../../features/course/components/course-list/course-list.component';
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
import { JobVacancyFormComponent } from '../../features/student/components/job-vacancy-form/job-vacancy-form.component';
import { JobVacancyListComponent } from '../../features/student/components/job-vacancy-list/job-vacancy-list.component';
import { EmployeeListComponent } from '../../features/employees/components/employee-list/employee-list.component';
import { LibraryListComponent } from '../../features/library/components/library-list/library-list.component';
import { ExamFormComponent } from '../../features/exam/components/exam-form/exam-form.component';
import { MeetComponent } from '../../features/meet/components/meet/meet.component';
import { ClassAttendanceComponent } from '../../features/class/components/class-attendance/class-attendance.component';
import { ClassAttendanceListComponent } from '../../features/class/components/class-attendance-list/class-attendance-list.component';
import { StudentFinancialComponent } from '../../features/student/components/student-financial/student-financial.component';
import { StudentFinancialListComponent } from '../../features/student/components/student-financial-list/student-financial-list.component';
import { FinancialReportsComponent } from '../../features/financial/components/financial-reports/financial-reports.component';
import { PaymentCreateComponent } from '../../features/financial/components/payment-create/payment-create.component';

export const ADMIN_ROUTES: Routes = [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.ADMIN }
      },
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
        path: 'student-financial/:id',
        component: StudentFinancialComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_STUDENT_FINANCIAL }
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
      {
        path: 'class-attendance',
        component: ClassAttendanceListComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_ATTENDANCE }
      },
      {
        path: 'class-attendance/:id',
        component: ClassAttendanceComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.EDIT_ATTENDANCE }
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
      {
        path: 'exams-form/:id',
        component: ExamFormComponent,
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
      {
        path: 'meet',
        component: MeetComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_MEETINGS }
      },
      {
        path: 'student-financial-list',
        component: StudentFinancialListComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_STUDENT_FINANCIAL }
      },
      {
        path: 'library-list',
        component: LibraryListComponent,
        data: { permission: RoutePermission.ADMIN }
      },
      {
        path: 'financial-reports',
        component: FinancialReportsComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_STUDENT_FINANCIAL }
      },
      {
        path: 'payment-create',
        component: PaymentCreateComponent,
        canActivate: [RoleGuard],
        data: { permission: RoutePermission.VIEW_STUDENT_FINANCIAL }
      },
];
