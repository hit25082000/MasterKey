import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-student-nav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-nav.component.html',
  styleUrls: ['./student-nav.component.scss']
})
export class StudentNavComponent {

}
