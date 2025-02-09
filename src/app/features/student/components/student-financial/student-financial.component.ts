import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { PaymentService } from '../../../../shared/services/payment.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, map, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CourseService } from '../../../course/services/course.service';
import { Course } from '../../../../core/models/course.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { StudentService } from '../../services/student.service';
import { ActivatedRoute } from '@angular/router';
import { PaymentHistoryComponent } from "../../../../shared/components/payment-history/payment-history.component";
import { PaymentTestComponent } from "../../../../shared/components/payment-test/payment-test.component";

@Component({
  selector: 'app-student-financial',
  templateUrl: './student-financial.component.html',
  styleUrls: ['./student-financial.component.scss'],
  imports: [CommonModule, MatProgressSpinnerModule, PaymentHistoryComponent, PaymentTestComponent],
  standalone: true
})
export class StudentFinancialComponent {
  
} 