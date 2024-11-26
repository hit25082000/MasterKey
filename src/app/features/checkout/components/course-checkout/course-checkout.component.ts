import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../course/services/course.service';
import { Course } from '../../../../core/models/course.model';
import { StripeService } from '../../services/stripe.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-course-checkout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="checkout-container">
      @if (loading()) {
        <div class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Carregando informações do curso...</p>
        </div>
      } @else {
        <div class="checkout-content">
          <div class="course-info">
            <img [src]="course()?.image" [alt]="course()?.name">
            <h2>{{ course()?.name }}</h2>
            <p>{{ course()?.description }}</p>

            <div class="price-details">
              <div class="price">
                <span class="label">Preço:</span>
                <span class="amount">R$ {{ course()?.price!.toFixed(2) }}</span>
              </div>
              @if (course()?.promoPrice) {
                <div class="promo-price">
                  <span class="label">Preço Promocional:</span>
                  <span class="amount">R$ {{ course()?.promoPrice!.toFixed(2) }}</span>
                </div>
              }
            </div>
          </div>

          <div class="payment-section">
            <h3>Forma de Pagamento</h3>
            <div class="payment-options">
              <button
                class="payment-button credit-card"
                (click)="processPayment('card')"
                [disabled]="processing()"
              >
                <i class="fas fa-credit-card"></i>
                Cartão de Crédito
              </button>

              <button
                class="payment-button pix"
                (click)="processPayment('pix')"
                [disabled]="processing()"
              >
                <i class="fas fa-qrcode"></i>
                PIX
              </button>

              <button
                class="payment-button boleto"
                (click)="processPayment('boleto')"
                [disabled]="processing()"
              >
                <i class="fas fa-barcode"></i>
                Boleto
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./course-checkout.component.scss']
})
export class CourseCheckoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private stripeService = inject(StripeService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  course = signal<Course | null>(null);
  loading = signal(true);
  processing = signal(false);

  ngOnInit() {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (courseId) {
      this.loadCourse(courseId);
    } else {
      this.router.navigate(['/products']);
    }
  }

  private async loadCourse(courseId: string) {
    try {
      const course = await this.courseService.getById(courseId);
      this.course.set(course);
    } catch (error) {
      this.notificationService.error('Erro ao carregar curso');
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  async processPayment(method: 'card' | 'pix' | 'boleto') {
    if (!this.course()) return;

    this.processing.set(true);
    const userId = this.authService.getCurrentUserId();

    try {
      // Cria a sessão de checkout no Stripe
      const session = await this.stripeService.createCheckoutSession({
        courseId: this.course()!.id!,
        userId: userId!,
        paymentMethod: method,
        amount: this.course()!.promoPrice || this.course()!.price,
        courseName: this.course()!.name
      });

      // Carrega o Stripe
      const stripe = await loadStripe(environment.stripePublicKey);

      if (stripe) {
        // Redireciona para o checkout do Stripe
        const result = await stripe.redirectToCheckout({
          sessionId: session.id
        });

        if (result.error) {
          throw new Error(result.error.message);
        }
      }
    } catch (error) {
      this.notificationService.error('Erro ao processar pagamento');
      console.error(error);
    } finally {
      this.processing.set(false);
    }
  }
}
