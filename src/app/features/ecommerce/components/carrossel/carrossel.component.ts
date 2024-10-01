import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EcommerceService } from '../../services/ecommerce.service';
import { CarrosselCourse } from '../../../../core/models/carrossel-course.model';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-carrossel',
  standalone: true,
  imports: [CommonModule, LoadingOverlayComponent],
  templateUrl: './carrossel.component.html',
  styleUrl: './carrossel.component.scss',
})
export class CarrosselComponent implements OnInit {
  carrosselCourses: CarrosselCourse[] = [];
  isLoading: boolean = false;

  constructor(private ecommerceService: EcommerceService) {}

  ngOnInit() {
    this.loadCarrosselCourses();
  }

  async loadCarrosselCourses() {
    this.isLoading = true;
    try {
      this.carrosselCourses = await this.ecommerceService.getAll();
    } catch (error) {
      console.error('Erro ao carregar os cursos do carrossel:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
