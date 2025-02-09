export interface PaymentTransaction {
  id: string;
  customerId: string;
  courseId: string;
  status: string;
  type: string;
  paymentMethod: string;
  amount: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  installmentId: string;
  installmentNumber?: number;
  totalInstallments?: number;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCodeUrl?: string;
  description?: string;
  paymentDetails?: {
    description: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    pixQrCodeUrl?: string;
    pixCopiaECola?: string;
    dueDate: string;
    installmentInfo?: {
      installmentNumber: number;
      totalInstallments: number;
      installmentValue: number;
    }
  }
}

export interface InstallmentGroup {
  [key: string]: PaymentTransaction[];
} 