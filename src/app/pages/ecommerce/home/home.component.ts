import { Component } from '@angular/core';
import { BannerComponent } from '../features/banner/banner.component';
import { BenefitsComponent } from "../features/benefits/benefits.component";
import { TestimonialsComponent } from "../features/testimonials/testimonials.component";
import { OurSpaceComponent } from "../features/our-space/our-space.component";
import { FaqComponent } from "../features/faq/faq.component";
import { CourseCarrosselComponent } from '../features/course-carrossel/course-carrossel.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [BannerComponent, BenefitsComponent, CourseCarrosselComponent, TestimonialsComponent, OurSpaceComponent, FaqComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
