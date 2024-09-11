import { routes } from './../../../../app.routes';
import { Component, OnInit } from '@angular/core';
import { Course } from '../../../../core/models/course.model';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-course-list',
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss']
})
export class CourseListComponent implements OnInit {
  courses: Course[] = [];

  constructor(private router : Router){}

  ngOnInit(): void {
    this.loadCourses();
  }

  // Simula o carregamento dos cursos (substitua por uma chamada a um serviço)
  loadCourses(): void {
    this.courses = [
      {
        id: "1",
        name: 'Curso 1',
        videoCount: 3,
        price: '200.00',
        promoPrice: 150,
        portionCount: 5,
        hidePrice: false,
        image: 'url-da-imagem-1',
        status: 'ativo',
        category: 'Categoria 1',
        categoryEcommerce: 'E-commerce 1',
        highlight: true,
        checkoutUrl: 'url-do-checkout-1',
        description: 'Descrição do curso 1',
        workHours: 10,
        videos: [
          { id: "1", title: 'Introdução', duration: 10, url: 'url-do-video-1' },
          { id: "2", title: 'Aula 1', duration: 20, url: 'url-do-video-2' }
        ]
      },
    ];
  }

  editCourse(courseId: string): void {
    this.router.navigate(['/course-detail', courseId]);
  }
}
