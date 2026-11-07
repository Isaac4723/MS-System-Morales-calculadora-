export type Currency = 'USD' | 'VES' | 'EUR';

export interface ExchangeRateData {
  usd: number;
  eur: number;
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
