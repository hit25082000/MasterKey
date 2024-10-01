import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Student } from '../../core/models/student.model';
import { Course } from '../../core/models/course.model';
import { Package } from '../../core/models/package.model';
@Component({
  selector: 'app-ecommerce',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './ecommerce.component.html',
  styleUrl: './ecommerce.component.scss',
})
export class EcommerceComponent implements OnInit {
  courses: Course[] = [];
  packages: Package[] = [];

  ngOnInit() {}
}
