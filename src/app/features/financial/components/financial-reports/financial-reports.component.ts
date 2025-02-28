import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PaymentService } from '../../../../shared/services/payment.service';
import { SystemLogService, LogCategory } from '../../../../core/services/system-log.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { firstValueFrom } from 'rxjs';
import { PaymentTransaction } from '../../../../core/interfaces/payment.interface';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FirestorePayment } from '../../../../shared/models/asaas.model';

interface SystemLog {
  timestamp: string;
  details: {
    userId: string;
    logDetails: string;
  };
}

interface ReportFilter {
  startDate: Date;
  endDate: Date;
  type: 'paid' | 'overdue' | 'registrations' | 'all';
  paymentMethod?: string;
  status?: string;
}

@Component({
  selector: 'app-financial-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="reports-container">
      <mat-card class="filter-card">
        <mat-card-header>
          <mat-card-title>Relatórios Financeiros</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="filterForm" class="filter-form">
            <mat-form-field appearance="outline">
              <mat-label>Data Inicial</mat-label>
              <input matInput [matDatepicker]="startPicker" formControlName="startDate">
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Data Final</mat-label>
              <input matInput [matDatepicker]="endPicker" formControlName="endDate">
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Tipo de Relatório</mat-label>
              <mat-select formControlName="type">
                <mat-option value="all">Todos os Pagamentos</mat-option>
                <mat-option value="paid">Faturas Pagas</mat-option>
                <mat-option value="overdue">Faturas Vencidas</mat-option>
                <mat-option value="registrations">Cadastros de Usuários</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" *ngIf="showPaymentMethodFilter()">
              <mat-label>Método de Pagamento</mat-label>
              <mat-select formControlName="paymentMethod">
                <mat-option value="all">Todos</mat-option>
                <mat-option value="CREDIT_CARD">Cartão de Crédito</mat-option>
                <mat-option value="BOLETO">Boleto</mat-option>
                <mat-option value="PIX">PIX</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" *ngIf="showStatusFilter()">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="all">Todos</mat-option>
                <mat-option value="CONFIRMED">Confirmado</mat-option>
                <mat-option value="RECEIVED">Recebido</mat-option>
                <mat-option value="OVERDUE">Vencido</mat-option>
                <mat-option value="PENDING">Pendente</mat-option>
              </mat-select>
            </mat-form-field>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="generateReport()">
            <mat-icon>picture_as_pdf</mat-icon>
            Gerar Relatório PDF
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    '.reports-container { padding: 20px; max-width: 1200px; margin: 0 auto; }',
    '.filter-card { margin-bottom: 20px; }',
    '.filter-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; padding: 16px; }',
    'mat-card-actions { display: flex; justify-content: flex-end; padding: 16px; }'
  ]
})
export class FinancialReportsComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private systemLogService = inject(SystemLogService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  filterForm: FormGroup;
  payments = this.paymentService.payments;

  constructor() {
    this.filterForm = this.fb.group({
      startDate: [new Date()],
      endDate: [new Date()],
      type: ['all'],
      paymentMethod: ['all'],
      status: ['all']
    });
  }

  async ngOnInit() {
    try {
      this.loadingService.show();
      await firstValueFrom(this.paymentService.getAllTransactions());
    } catch (error) {
      console.error('Erro detalhado ao carregar pagamentos:', error);
      this.notificationService.error('Erro ao carregar pagamentos');
    } finally {
      this.loadingService.hide();
    }
  }

  showPaymentMethodFilter() {
    return this.filterForm.get('type')?.value !== 'registrations';
  }

  showStatusFilter() {
    return this.filterForm.get('type')?.value !== 'registrations';
  }

  async generateReport() {
    try {
      this.loadingService.show();
      const filters = this.filterForm.value as ReportFilter;
      
      let data: any[] = [];
      
      switch (filters.type) {
        case 'registrations':
          data = await this.getRegistrationsData(filters);
          break;
        default:
          data = await this.getPaymentsData(filters);
          break;
      }

      this.generatePDF(data, filters);
      this.notificationService.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro detalhado ao gerar relatório:', error);
      this.notificationService.error('Erro ao gerar relatório');
    } finally {
      this.loadingService.hide();
    }
  }

  private async getRegistrationsData(filters: ReportFilter) {
    const logs = await firstValueFrom(
      this.systemLogService.getLogsByDateRange(
        LogCategory.USER_REGISTRATION,
        'Registro',
        filters.startDate,
        filters.endDate
      )
    ) as SystemLog[];

    return logs.map(log => ({
      data: new Date(log.timestamp).toLocaleDateString(),
      usuario: log.details.userId,
      detalhes: log.details.logDetails
    }));
  }

  private async getPaymentsData(filters: ReportFilter) {
    try {
      const allPayments = this.payments();
      
      const filteredPayments = allPayments
        .filter((payment: FirestorePayment) => {
          const paymentDate = new Date(payment.createdAt);
          const matchesDate = paymentDate >= filters.startDate && paymentDate <= filters.endDate;
          const matchesMethod = filters.paymentMethod === 'all' || payment.paymentMethod === filters.paymentMethod;
          const matchesStatus = filters.status === 'all' || payment.status === filters.status;

          let matches = false;
          switch (filters.type) {
            case 'paid':
              matches = matchesDate && matchesMethod && 
                     ['CONFIRMED', 'RECEIVED'].includes(payment.status);
              break;
            case 'overdue':
              matches = matchesDate && matchesMethod && 
                     payment.status === 'OVERDUE';
              break;
            default:
              matches = matchesDate && matchesMethod && matchesStatus;
          }
          
          return matches;
        })
        .map((payment: FirestorePayment) => {
          const mappedPayment = {
            data: new Date(payment.createdAt).toLocaleDateString(),
            descricao: payment.description || 'Sem descrição',
            valor: payment.amount.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }),
            status: payment.status,
            metodo: payment.paymentMethod
          };
          return mappedPayment;
        });

      return filteredPayments;
    } catch (error) {
      console.error('Erro detalhado ao buscar pagamentos:', error);
      this.notificationService.error('Erro ao buscar pagamentos');
      return [];
    }
  }

  private generatePDF(data: any[], filters: ReportFilter) {
    const doc = new jsPDF();
    const title = this.getReportTitle(filters);
    
    // Adiciona a logo no canto superior direito
    doc.addImage('/assets/logo.png', 'PNG', 170, 10, 30, 15);
    
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    const periodoTexto = 'Período: ' + filters.startDate.toLocaleDateString() + ' - ' + filters.endDate.toLocaleDateString();
    doc.text(periodoTexto, 14, 30);

    const columns = this.getColumnsForReport(filters.type);
    const rows = data.map(item => Object.values(item));

    (doc as any).autoTable({
      head: [columns],
      body: rows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [33, 150, 243] }
    });

    const fileName = 'relatorio_' + filters.type + '_' + new Date().getTime() + '.pdf';
    doc.save(fileName);
  }

  private getReportTitle(filters: ReportFilter): string {
    switch (filters.type) {
      case 'paid': return 'Relatório de Faturas Pagas';
      case 'overdue': return 'Relatório de Faturas Vencidas';
      case 'registrations': return 'Relatório de Cadastros de Usuários';
      default: return 'Relatório de Pagamentos';
    }
  }

  private getColumnsForReport(type: string): string[] {
    switch (type) {
      case 'registrations':
        return ['Data', 'Usuário', 'Detalhes'];
      default:
        return ['Data', 'Descrição', 'Valor', 'Status', 'Método'];
    }
  }
} 