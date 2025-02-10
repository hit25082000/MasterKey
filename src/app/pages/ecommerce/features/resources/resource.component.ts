import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-resource',
  standalone: true,
  imports: [],
  templateUrl: './resource.component.html',
  styleUrl: './resource.component.scss'
})
export class ResourceComponent {
  constructor(private router: Router) {}

  navigateToContact() {
    this.router.navigate(['/contact']).then(() => {
      window.scrollTo(0, 0);
    });
  }
}
