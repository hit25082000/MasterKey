import { Component } from '@angular/core';
import { BenefitsComponent } from '../features/benefits/benefits.component';
import { TestimonialsComponent } from '../features/testimonials/testimonials.component';
import { OurSpaceComponent } from '../features/our-space/our-space.component';
import { FaqComponent } from '../features/faq/faq.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [ BenefitsComponent,TestimonialsComponent, OurSpaceComponent, FaqComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  redirectToCourse(){
    
  }
}
