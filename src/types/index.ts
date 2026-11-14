export type Currency = 'USD' | 'VES' | 'EUR';

export interface ExchangeRateData {
  usd: number;
  eur: number;
  cny?: number;
  try?: number;
  rub?: number;
  fechaValor?: string;
  fechaIso?: string;
  bulletinTime?: string;
  officialUrl?: string;
  bulletinUrl?: string;
  lastUpdated: string;
  source: string;
  status: 'live' | 'cached' | 'fallback';
}


export interface PricingSettings {
  productName: string;
  cost: number;
  costCurrency: 'USD' | 'VES';
  marginPercent: number;
  applyIva: boolean;
  ivaPercent: number;
  applyPaymentFee: boolean;
  paymentFeePercent: number;
  extraCostUsd: number;
}

export interface PricingResult {
  costUsd: number;
  costVes: number;
  basePriceUsd: number;
  basePriceVes: number;
  ivaUsd: number;
  ivaVes: number;
  paymentFeeUsd: number;
  paymentFeeVes: number;
  finalPriceUsd: number;
  finalPriceVes: number;
  grossProfitUsd: number;
  grossProfitVes: number;
  netProfitUsd: number;
  netProfitVes: number;
  effectiveMarginPercent: number;
}

export interface QuoteItem {
  id: string;
  productName: string;
  quantity: number;
  unitPriceUsd: number;
  unitPriceVes: number;
  totalUsd: number;
  totalVes: number;
}

export interface ConversionHistoryItem {
  id: string;
  timestamp: string;
  fromAmount: number;
  fromCurrency: Currency;
  toAmount: number;
  toCurrency: Currency;
  rateUsed: number;
  label?: string;
}

export interface CommerceStoreInfo {
  storeName: string;
  rif: string;
  phone: string;
  bankName: string;
  pagoMovilPhone: string;
  pagoMovilId: string;
  address?: string;
}

export interface PosSaleData {
  totalUsd: number;
  totalVes: number;
  paidUsd: number;
  paidVes: number;
  paymentMethod: 'pago_movil' | 'efectivo_usd' | 'efectivo_ves' | 'punto_venta' | 'mixto' | 'zelle' | 'transferencia';
  clientName: string;
  referenceNumber: string;
}

export interface DebtPayment {
  id: string;
  date: string;
  amountUsd: number;
  amountVes: number;
  rateUsed: number;
  paymentMethod: 'pago_movil' | 'efectivo_usd' | 'efectivo_ves' | 'punto_venta' | 'zelle' | 'transferencia';
  referenceNumber?: string;
  notes?: string;
}

export interface DebtNotificationRecord {
  id: string;
  sentAt: string; // ISO date string
  type: 'due_tomorrow' | 'due_today' | 'overdue_followup' | 'manual';
  attemptNumber: number;
  balanceUsdAtAlert: number;
  balanceVesAtAlert: number;
  rateBcvUsed: number;
  note?: string;
}

export interface DebtInvoice {
  id: string;
  invoiceNumber: string;
  description: string;
  amountUsd: number;
  rateBcvAtCreation: number;
  date: string; // YYYY-MM-DD or ISO
  dueDate?: string; // YYYY-MM-DD
  notes?: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  customerId?: string; // C.I. / RIF
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDebt {
  id: string;
  customerProfileId?: string;
  customerName: string;
  customerPhone: string;
  customerId?: string;
  customerAddress?: string;
  description: string;
  originalAmountUsd: number;
  originalRateBcv: number;
  createdAt: string;
  dueDate: string; // YYYY-MM-DD
  invoices?: DebtInvoice[];
  payments: DebtPayment[];
  notes?: string;
  lastNotificationSentAt?: string;
  notificationHistory?: DebtNotificationRecord[];
  followupCadenceDays?: 2 | 3;
}

export type DebtUrgencyStatus = 'paid' | 'due_tomorrow' | 'due_today' | 'overdue' | 'active';


