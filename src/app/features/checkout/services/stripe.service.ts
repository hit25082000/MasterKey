import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { StudentManagementService } from '../../student/services/student-management.service';

interface CheckoutSessionRequest {
  courseId: string;
  userId: string;
  paymentMethod: 'card' | 'pix' | 'boleto';
  amount: number;
  courseName: string;
}

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private http = inject(HttpClient);
  private studentManagementService = inject(StudentManagementService);

  async createCheckoutSession(data: CheckoutSessionRequest) {
    const response = await firstValueFrom(
      this.http.post<{id: string}>(
        `${environment.apiUrlStripe}/create-checkout-session`,
        data
      )
    );

    return response;
  }

  async handleSuccessfulPayment(sessionId: string) {
    const session = await firstValueFrom(
      this.http.get<any>(`${environment.apiUrlStripe}/checkout-session/${sessionId}`)
    );

    if (session.payment_status === 'paid') {
      // Usa o novo serviço para adicionar o curso
      await this.studentManagementService.addCourseToStudent(
        session.metadata.userId,
        session.metadata.courseId
      );
    }

    return session;
  }
}
