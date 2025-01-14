export interface AsaasCustomer {
  id?: string;
  name: string;
  email: string;
  cpfCnpj: string;
  externalReference?: string;
}

export interface AsaasPayment {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  dueDate: string;
  description: string;
  externalReference?: string;
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

export interface AsaasPaymentResponse {
  id: string;
  dateCreated: string;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'FAILED' | 'CANCELLED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH';
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCodeUrl?: string;
  pixCopiaECola?: string;
  value: number;
  netValue: number;
  description?: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  customer: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  dueDate: string;
  externalReference?: string;
  creditCard?: {
    creditCardNumber: string;
    creditCardBrand: string;
    creditCardToken: string;
  };
}

export interface AsaasError {
  errors: Array<{
    code: string;
    description: string;
  }>;
}

export interface AsaasSubscriptionPayment {
  id: string;
  value: number;
  dueDate: string;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'FAILED' | 'CANCELLED';
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCodeUrl?: string;
  pixCopiaECola?: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  invoiceNumber: string;
  paymentDate?: string;
}

export interface AsaasSubscriptionResponse {
  subscription: {
    id: string;
    url?: string;
  };
  url?: string;
  payment?: {
    id: string;
    value: number;
    dueDate: string;
    status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'FAILED' | 'CANCELLED';
    invoiceUrl?: string;
    bankSlipUrl?: string;
    pixQrCodeUrl?: string;
    pixCopiaECola?: string;
  };
}
