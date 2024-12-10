import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Course } from '../models/course.model';
import { Observable } from 'rxjs';
import { FirestoreService } from './firestore.service';

interface MercadoPagoPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

interface SalesSummary {
  totalSales: number;
  salesByMonth: { [key: string]: number };
  salesByCourse: { [key: string]: number };
  totalRevenue: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.adminUrl;
  private readonly accessToken = environment.mercadoPagoAccessToken;
  private readonly firestoreService = inject(FirestoreService);

  createPayment(course: Course): Observable<MercadoPagoPreference> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`
    });

    return this.http.post<MercadoPagoPreference>(
      `${this.apiUrl}/createPaymentPreference`,
      {
        title: course.name,
        price: course.price,
        quantity: 1,
        courseId: course.id,
        description: course.description,
        picture_url: course.image,
        test_mode: !environment.production
      },
      {
        headers,
        withCredentials: true
      }
    );
  }

  checkPaymentStatus(transactionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/checkPaymentStatus?transactionId=${transactionId}`);
  }

  async getSalesSummary(): Promise<SalesSummary> {
    try {
      const transactions = await this.firestoreService.getDocumentsByAttribute(
        'transactions',
        'status',
        'approved'
      );

      const summary: SalesSummary = {
        totalSales: 0,
        salesByMonth: {},
        salesByCourse: {},
        totalRevenue: 0
      };

      transactions.forEach(transaction => {
        const date = new Date(transaction.updatedAt);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

        // Incrementa vendas totais
        summary.totalSales++;

        // Incrementa vendas por mês
        summary.salesByMonth[monthKey] = (summary.salesByMonth[monthKey] || 0) + 1;

        // Incrementa vendas por curso
        summary.salesByCourse[transaction.courseId] =
          (summary.salesByCourse[transaction.courseId] || 0) + 1;

        // Soma receita total
        summary.totalRevenue += transaction.paymentDetails?.transaction_amount || 0;
      });

      return summary;
    } catch (error) {
      console.error('Erro ao buscar resumo de vendas:', error);
      throw error;
    }
  }
}
