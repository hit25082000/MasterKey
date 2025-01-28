import { Component } from '@angular/core';
import { BannerComponent } from '../features/banner/banner.component';
import { BenefitsComponent } from "../features/benefits/benefits.component";
import { TestimonialsComponent } from "../features/testimonials/testimonials.component";
import { OurSpaceComponent } from "../features/our-space/our-space.component";
import { FaqComponent } from "../features/faq/faq.component";
import { CourseCarrosselComponent } from '../features/course-carrossel/course-carrossel.component';
import { Benefits2Component } from '../features/benefits-2/benefits-2.component';
import { ResourceComponent } from "../features/resources/resource.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [BannerComponent, BenefitsComponent, CourseCarrosselComponent, TestimonialsComponent, OurSpaceComponent, FaqComponent, Benefits2Component, ResourceComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
