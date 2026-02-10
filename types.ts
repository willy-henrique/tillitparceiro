
export enum ReferralStatus {
  PENDENTE = 'PENDENTE',
  EM_NEGOCIACAO = 'EM_NEGOCIACAO',
  CONVERTIDA = 'CONVERTIDA',
  PAGO = 'PAGO'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'PARTNER' | 'ADMIN';
  status: 'PENDING_APPROVAL' | 'APPROVED';
}

export interface Referral {
  id: string;
  partnerId: string;
  partnerName: string;
  companyName: string;
  cnpj: string;
  contactName: string;
  phone: string;
  email: string;
  status: ReferralStatus;
  createdAt: string;
  updatedAt: string;
  implementationPaidAt?: string;
  bonusAmount: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
