import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StudentNavComponent } from "../../shared/components/student-nav/student-nav.component";

@Component({
  selector: 'app-classroom',
  standalone: true,
  imports: [RouterOutlet, StudentNavComponent],
  template: `
    <div class="classroom-container">
      <app-student-nav></app-student-nav>
      <main class="classroom-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrls: ['./classroom.component.scss']
})
export class ClassroomComponent {}
