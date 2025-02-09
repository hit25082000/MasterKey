export interface PaymentTransaction {
  id?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  courseId: string;
  paymentId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  type: 'PAYMENT' | 'SUBSCRIPTION' | 'INSTALLMENT';
  subscriptionId?: string;
  installmentId: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCodeUrl?: string;
  pixCopiaECola?: string;
  installments?: {
    total: number;
    current: number;
    value: number;
  };
  paymentDetails: {
    description?: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    pixQrCodeUrl?: string;
    pixCopiaECola?: string;
    installmentInfo?: {
      installmentNumber: number;
      totalInstallments: number;
      installmentValue: number;
    };
  };
  installmentNumber?: number;
  totalInstallments?: number;
}

export interface Subscription {
  id?: string;
  customerId: string;
  courseId: string;
  courseName?: string;
  status: string;
  paymentMethod: string;
  nextDueDate: string;
  cycle: string;
  value: number;
  maxInstallments: number;
  currentInstallment: number;
  createdAt: any;
  updatedAt: any;
  subscriptionDetails?: {
    paymentHistory: Array<{
      id: string;
      status: string;
      dueDate: string;
      value: number;
      installmentNumber: number;
      paymentMethod: string;
      invoiceUrl?: string;
      bankSlipUrl?: string;
      pixQrCodeUrl?: string;
    }>;
    nextPayments: Array<{
      dueDate: Date;
      installmentNumber: number;
    }>;
  };
}

export type PaymentStatus = 
  | 'PENDING' 
  | 'RECEIVED' 
  | 'CONFIRMED' 
  | 'OVERDUE' 
  | 'REFUNDED' 
  | 'RECEIVED_IN_CASH' 
  | 'REFUND_REQUESTED' 
  | 'CHARGEBACK_REQUESTED' 
  | 'CHARGEBACK_DISPUTE' 
  | 'AWAITING_CHARGEBACK_REVERSAL' 
  | 'DUNNING_REQUESTED' 
  | 'DUNNING_RECEIVED' 
  | 'AWAITING_RISK_ANALYSIS';

export type SubscriptionStatus = 
  | 'ACTIVE'
  | 'INACTIVE'
  | 'EXPIRED'
  | 'OVERDUE'
  | 'CANCELED';

export enum PaymentStatusTranslation {
  PENDING = 'Pendente',
  RECEIVED = 'Recebido',
  CONFIRMED = 'Confirmado',
  OVERDUE = 'Atrasado',
  REFUNDED = 'Reembolsado',
  RECEIVED_IN_CASH = 'Recebido em Dinheiro',
  REFUND_REQUESTED = 'Reembolso Solicitado',
  CHARGEBACK_REQUESTED = 'Estorno Solicitado',
  CHARGEBACK_DISPUTE = 'Disputa de Estorno',
  AWAITING_CHARGEBACK_REVERSAL = 'Aguardando Reversão de Estorno',
  DUNNING_REQUESTED = 'Cobrança Solicitada',
  DUNNING_RECEIVED = 'Cobrança Recebida',
  AWAITING_RISK_ANALYSIS = 'Aguardando Análise de Risco'
}

export enum PaymentMethodTranslation {
  BOLETO = 'Boleto',
  CREDIT_CARD = 'Cartão de Crédito',
  PIX = 'PIX'
}

export enum SubscriptionStatusTranslation {
  ACTIVE = 'Ativa',
  INACTIVE = 'Inativa',
  EXPIRED = 'Expirada',
  OVERDUE = 'Atrasada',
  CANCELED = 'Cancelada'
}

export enum SubscriptionCycleTranslation {
  WEEKLY = 'Semanal',
  BIWEEKLY = 'Quinzenal',
  MONTHLY = 'Mensal',
  QUARTERLY = 'Trimestral',
  SEMIANNUALLY = 'Semestral',
  YEARLY = 'Anual'
}

interface PaymentHistory {
  date: string;
  status: string;
  value: number;
  installment?: number;
  paymentMethod?: string;
} 