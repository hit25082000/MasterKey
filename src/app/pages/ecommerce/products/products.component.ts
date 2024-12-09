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
import { PaymentService } from '../../../core/services/payment.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
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
  courses = signal<Course[]>([]);
  categories = signal<string[]>(['Todos']);
  selectedCategory = signal<string>('Todos');
  selectedOrder = signal<string>('Alfabética');
  priceRange = signal<number>(1000);
  private readonly paymentService = inject(PaymentService);

  filteredCourses = computed(() => {
    let filtered = [...this.courses()];

    // Filtro por categoria
    if (this.selectedCategory() !== 'Todos') {
      filtered = filtered.filter(course => course.category === this.selectedCategory());
    }

    // Filtro por preço
    filtered = filtered.filter(course => course.price <= this.priceRange());

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

  constructor(
    private courseService: CourseService,
    private categoryService: CategoryService
  ) {}

  async ngOnInit() {
    // Buscar cursos e categorias
    const [allCourses, allCategories] = await Promise.all([
      this.courseService.getAll(),
      this.categoryService.getAll()
    ]);

    this.courses.set(allCourses);
    this.categories.set(['Todos', ...allCategories.map(cat => cat.name)]);
  }

  onSearch(searchTerm: string) {
    const filtered = this.courses().filter(course =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.courses.set(filtered);
  }

  updateCategory(category: string) {
    this.selectedCategory.set(category);
  }

  updateOrder(order: string) {
    this.selectedOrder.set(order);
  }

  updatePriceRange(price: number) {
    this.priceRange.set(price);
  }

  redirectToCourse(courseId : string){
    this.router.navigate(['/course', courseId]);
  }

  async buyCourse(course: Course) {
    try {
      const preference = await firstValueFrom(this.paymentService.createPayment(course));

      if (preference?.init_point) {
        // Salvar informações da compra no localStorage para recuperar depois
        localStorage.setItem('currentPurchase', JSON.stringify({
          courseId: course.id,
          timestamp: new Date().getTime()
        }));

        // Redirecionar para o Mercado Pago
        window.location.href = environment.production
          ? preference.init_point
          : preference.sandbox_init_point;
      } else {
        console.error('Erro: Link de pagamento não gerado');
        // Adicione aqui sua lógica de notificação de erro
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      // Adicione aqui sua lógica de notificação de erro
    }
  }

}
