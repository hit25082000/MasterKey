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
  type: 'PAYMENT' | 'SUBSCRIPTION';
  subscriptionId?: string;
  createdAt: string;
  updatedAt: string;
  paymentDetails: {
    invoiceUrl?: string;
    bankSlipUrl?: string;
    pixQrCodeUrl?: string;
    pixCopiaECola?: string;
    description?: string;
    installments?: {
      total: number;
      current: number;
      value: number;
    };
  };
}

export interface Subscription {
  id?: string;
  courseId: string;
  courseName: string;
  customerId: string;
  customerEmail: string;
  asaasSubscriptionId: string;
  value: number;
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  paymentMethod: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  status: SubscriptionStatus;
  nextDueDate: string;
  createdAt: string;
  updatedAt: string;
  subscriptionDetails: {
    description: string;
    installments?: {
      total: number;
      current: number;
      value: number;
    };
    paymentHistory?: {
      date: string;
      status: string;
      value: number;
      installment?: number;
    }[];
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