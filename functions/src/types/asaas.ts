export type AsaasEventType =
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_DELETED'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_OVERDUE';

export interface AsaasPayment {
  id: string;
  customer: string;
  value: number;
  netValue: number;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'DELETED';
  dueDate: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  invoiceUrl: string;
  bankSlipUrl?: string;
  postalService: boolean;
  description?: string;
  installment?: {
    total: number;
    current: number;
    value: number;
  };
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'OVERDUE' | 'CANCELED';
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  description?: string;
}

export interface AsaasWebhookEvent {
  event: AsaasEventType;
  payment?: AsaasPayment;
  subscription?: AsaasSubscription;
  createdAt: string;
}

export interface AsaasCustomer {
  name: string;
  email: string;
  phone: string;
  mobilePhone?: string;
  cpfCnpj: string;
  postalCode: string;
  address?: string;
  addressNumber: string;
  complement?: string;
  province?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
}

export interface AsaasPaymentRequest {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

export interface AsaasSubscriptionRequest {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  nextDueDate: string;
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
} 