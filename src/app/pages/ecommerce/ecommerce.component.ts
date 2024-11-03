import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Student } from '../../core/models/student.model';
import { Course } from '../../core/models/course.model';
import { Package } from '../../core/models/package.model';
import { HeaderComponent } from "./header/header.component";
import { FooterComponent } from "./footer/footer.component";
@Component({
  selector: 'app-ecommerce',
  standalone: true,
  imports: [RouterLink, CommonModule, HeaderComponent, FooterComponent, RouterOutlet],
  templateUrl: './ecommerce.component.html',
  styleUrl: './ecommerce.component.scss',
})
export class EcommerceComponent implements OnInit {
  courses: Course[] = [];
  packages: Package[] = [];

  ngOnInit() {}
}
