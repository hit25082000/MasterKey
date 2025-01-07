import { Routes } from '@angular/router';
import { ClassFormComponent } from './components/class-form/class-form.component';
import { ClassAttendanceComponent } from './components/class-attendance/class-attendance.component';

export const classRoutes: Routes = [
  {
    path: 'classes',
    children: [
      {
        path: '',
        component: ClassFormComponent
      },
      {
        path: 'new',
        component: ClassFormComponent
      },
      {
        path: 'edit/:id',
        component: ClassFormComponent
      },
      {
        path: 'attendance',
        component: ClassAttendanceComponent
      }
    ]
  }
];
