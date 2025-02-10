import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BenefitsComponent } from '../features/benefits/benefits.component';
import { TestimonialsComponent } from '../features/testimonials/testimonials.component';
import { OurSpaceComponent } from '../features/our-space/our-space.component';
import { SearchBarComponent } from "../../../shared/components/search-bar/search-bar.component";
import { CourseService } from '../../../features/course/services/course.service';
import { Course } from '../../../core/models/course.model';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../features/category/services/category.service';
import { Router } from '@angular/router';
import { LoadingService } from '../../../shared/services/loading.service';
import { NotificationService, NotificationType } from '../../../shared/services/notification.service';

interface Category {
  id: string;
  name: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BenefitsComponent,
    TestimonialsComponent,
    OurSpaceComponent,
    SearchBarComponent
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  router = inject(Router)
  courseService = inject(CourseService);
  categoryService = inject(CategoryService);
  private readonly loadingService = inject(LoadingService);
  private readonly notificationService = inject(NotificationService);
  
  courses = signal<Course[]>([]);
  allCourses = signal<Course[]>([]);
  categories = signal<Category[]>([{ id: 'todos', name: 'Todos' }]);
  selectedCategory = signal<string>('todos');
  selectedOrder = signal<string>('Alfabética');
  priceRange = signal<number>(5000);
  maxPrice = signal<number>(5000);
  searchTerm = signal<string>('');

  filteredCourses = computed(() => {
    let filtered = [...this.allCourses()];

    // Filtro por termo de busca
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(course => 
        course.name.toLowerCase().includes(term) ||
        course.description.toLowerCase().includes(term)
      );
    }

    // Filtro por categoria
    if (this.selectedCategory() !== 'todos') {
      filtered = filtered.filter(course => course.category === this.selectedCategory());
    }

    // Filtro por preço
    filtered = filtered.filter(course => !course.hidePrice && course.price <= this.priceRange());

    // Ordenação
    switch (this.selectedOrder()) {
      case 'Alfabética':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'Preço Crescente':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'Preço Decrescente':
        filtered.sort((a, b) => b.price - a.price);
        break;
    }

    return filtered;
  });

  async ngOnInit() {
    this.loadingService.show();
    try {    
      const [allCourses, allCategories] = await Promise.all([
        this.courseService.getAll(),
        this.categoryService.getAll()
      ]);
      
      this.allCourses.set(allCourses);
      this.courses.set(allCourses);
      
      // Transformar categorias em array de objetos com id e nome
      const categoryOptions: Category[] = [
        { id: 'todos', name: 'Todos' },
        ...allCategories.map(cat => ({
          id: cat.id,
          name: cat.name
        }))
      ];
      this.categories.set(categoryOptions);

      // Calcular o preço máximo com base nos cursos
      const maxCoursePrice = Math.max(...allCourses
        .filter(course => !course.hidePrice)
        .map(course => course.price));
      
      const roundedMaxPrice = Math.ceil(maxCoursePrice / 1000) * 1000;
      this.maxPrice.set(roundedMaxPrice);
      this.priceRange.set(roundedMaxPrice);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      this.loadingService.hide();
    }
  }

  onSearch(searchTerm: string) {
    this.searchTerm.set(searchTerm);
  }

  updateCategory(categoryId: string) {
    this.selectedCategory.set(categoryId);
  }

  updateOrder(order: string) {
    this.selectedOrder.set(order);
  }

  updatePriceRange(price: number) {
    this.priceRange.set(price);
  }

  redirectToCourse(courseId: string) {
    this.router.navigate(['/course', courseId]);
  }

  async buyCourse(course: Course) {
    if (!course.id) {
      this.notificationService.show(
        'Erro ao identificar o curso. Por favor, tente novamente.',
        NotificationType.ERROR
      );
      return;
    }

    this.router.navigate(['/checkout', course.id]);
  }
}
