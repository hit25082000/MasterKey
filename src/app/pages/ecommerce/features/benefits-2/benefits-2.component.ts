import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-benefits-2',
  standalone: true,
  imports: [],
  templateUrl: './benefits-2.component.html',
  styleUrl: './benefits-2.component.scss'
})
export class Benefits2Component {
  constructor(private router: Router) {}

  navigateToContact() {
    this.router.navigate(['/contact']).then(() => {
      window.scrollTo(0, 0);
    });
  }
}
