import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Course } from '../models/course.model';
import { Observable } from 'rxjs';

interface MercadoPagoPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.adminUrl;
  private readonly accessToken = environment.mercadoPagoAccessToken;

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
}
