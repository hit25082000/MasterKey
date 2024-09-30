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

  ngOnInit() {
    // Aqui você deve carregar os cursos e pacotes de um serviço
    // Por enquanto, vamos usar dados de exemplo
    this.courses = [
      {
        id: '1',
        name: 'Curso de Angular',
        description: 'Aprenda Angular do zero',
        price: '199,99',
        image: '',
        videoCount: 10,
        promoPrice: 150,
        portionCount: 10,
        hidePrice: false,
        status: 'ativo',
        category: 'Desenvolvimento',
        categoryEcommerce: 'Front-end',
        highlight: true,
        checkoutUrl: 'https://checkout.masterkey.com.br/curso-angular',
        workHours: 40,
        videos: [], // Adicione uma lista de vídeos
      },
      // ... mais cursos
    ];

    this.packages = [
      {
        id: '1',
        name: 'Pacote Desenvolvimento Web',
        description: 'Inclui cursos de HTML, CSS e JavaScript',
        price: 299.99,
        courses: [], // Adicione uma lista de cursos
        workHours: 40, // Defina as horas de trabalho
      },
      // ... mais pacotes
    ];
  }
}
