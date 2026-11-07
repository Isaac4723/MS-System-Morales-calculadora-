import { PricingSettings, PricingResult, CommerceStoreInfo, PosSaleData } from '../types';

/**
 * Parses user input strings that might use commas or dots as decimal or thousand separators.
 */
export function parseFlexibleNumber(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value || typeof value !== 'string') return 0;
  let str = value.trim();
  if (!str) return 0;
  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format bolívares (VES)
 */
export function formatVes(amount: number, showSymbol = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) return showSymbol ? 'Bs. 0,00' : '0,00';
  const formatted = new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return showSymbol ? `Bs. ${formatted}` : formatted;
}

/**
 * Format US Dollars (USD)
 */
export function formatUsd(amount: number, showSymbol = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) return showSymbol ? '$0.00' : '0.00';
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return showSymbol ? `$${formatted}` : formatted;
}

/**
 * Format date in Spanish Venezuelan locale
 */
export function formatBcvDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

/**
 * Calculate pricing strictly based on Commercial Profit Margin on Selling Price:
 * Base Selling Price = Total Cost / (1 - (Margin% / 100))
 * This ensures that Margin% directly represents the net percentage of sales earned.
 */
export function calculateProductPricing(
  settings: PricingSettings,
  rateBcv: number
): PricingResult {
  const safeRate = rateBcv > 0 ? rateBcv : 1;
  const rawCost = Number(settings.cost) || 0;

  // Normalize cost to USD and VES
  const costUsd = settings.costCurrency === 'USD' ? rawCost : rawCost / safeRate;
  const costVes = costUsd * safeRate;

  // Add extra unit costs if any (shipping, packaging, logistics)
  const totalCostUsd = costUsd + (Number(settings.extraCostUsd) || 0);

  // Pure Commercial Profit Margin: P = Cost / (1 - M)
  const marginP = Math.min(99.9, Math.max(0, Number(settings.marginPercent) || 0));
  const factor = Math.max(0.001, 1 - marginP / 100);
  const basePriceUsd = totalCostUsd / factor;

  // IVA (16% en Venezuela)
  const ivaUsd = settings.applyIva ? basePriceUsd * ((Number(settings.ivaPercent) || 16) / 100) : 0;

  // Payment Commission (e.g. 1.5% - 3% por punto de venta o pago móvil)
  const priceWithIva = basePriceUsd + ivaUsd;
  const paymentFeeUsd = settings.applyPaymentFee
    ? priceWithIva * ((Number(settings.paymentFeePercent) || 2.5) / 100)
    : 0;

  const finalPriceUsd = priceWithIva + paymentFeeUsd;
  const basePriceVes = basePriceUsd * safeRate;
  const ivaVes = ivaUsd * safeRate;
  const paymentFeeVes = paymentFeeUsd * safeRate;
  const finalPriceVes = finalPriceUsd * safeRate;

  // Profits
  const grossProfitUsd = Math.max(0, basePriceUsd - totalCostUsd);
  const grossProfitVes = grossProfitUsd * safeRate;

  const netProfitUsd = grossProfitUsd;
  const netProfitVes = netProfitUsd * safeRate;

  const effectiveMarginPercent = basePriceUsd > 0 ? (grossProfitUsd / basePriceUsd) * 100 : 0;

  return {
    costUsd,
    costVes,
    basePriceUsd,
    basePriceVes,
    ivaUsd,
    ivaVes,
    paymentFeeUsd,
    paymentFeeVes,
    finalPriceUsd,
    finalPriceVes,
    grossProfitUsd,
    grossProfitVes,
    netProfitUsd,
    netProfitVes,
    effectiveMarginPercent,
  };
}

/**
 * Format phone number for WhatsApp link
 */
export function formatWhatsAppPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('0') && digits.length === 11) {
    return `58${digits.substring(1)}`;
  }
  if (digits.length === 10 && (digits.startsWith('4') || digits.startsWith('2'))) {
    return `58${digits}`;
  }
  return digits;
}

/**
 * Build WhatsApp click-to-chat URL
 */
export function buildWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(text);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Generate formatted text for currency conversion quote
 */
export function generateConversionMessage(
  fromAmount: number,
  fromCurrency: string,
  toAmount: number,
  toCurrency: string,
  rateBcv: number,
  updatedAt?: string,
  note?: string
): string {
  const dateStr = updatedAt ? formatBcvDate(updatedAt) : new Date().toLocaleDateString('es-VE');

  let text = `*MS MORALES SYSTEM SOLUCIONES*\n`;
  text += `*COTIZACIÓN AL CAMBIO OFICIAL BCV*\n\n`;

  if (fromCurrency === 'USD') {
    text += `💵 *Monto en Dólares:* ${formatUsd(fromAmount)}\n`;
    text += `🇻🇪 *Equivalente en Bolívares:* ${formatVes(toAmount)}\n`;
  } else {
    text += `🇻🇪 *Monto en Bolívares:* ${formatVes(fromAmount)}\n`;
    text += `💵 *Equivalente en Dólares:* ${formatUsd(toAmount)}\n`;
  }

  text += `\n🏦 *Tasa Oficial BCV:* Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 4 }).format(rateBcv)} / USD\n`;
  text += `📅 *Fecha de vigencia:* ${dateStr}\n`;

  if (note && note.trim()) {
    text += `\n📝 *Nota:* ${note.trim()}\n`;
  }

  text += `\n_MS Morales System Soluciones · Tecnología & Comercio_`;
  return text;
}

/**
 * Generate formatted text for product price quote
 */
export function generateProductQuoteMessage(
  productName: string,
  result: PricingResult,
  rateBcv: number,
  updatedAt?: string,
  includeBreakdown = false,
  note?: string
): string {
  const name = productName.trim() || 'Producto';
  const dateStr = updatedAt ? formatBcvDate(updatedAt) : new Date().toLocaleDateString('es-VE');

  let text = `*MS MORALES SYSTEM SOLUCIONES*\n`;
  text += `📦 *COTIZACIÓN DE PRODUCTO*\n`;
  text += `🔹 *${name}*\n\n`;

  text += `💵 *Precio en USD:* ${formatUsd(result.finalPriceUsd)}\n`;
  text += `🇻🇪 *Precio en Bolívares:* ${formatVes(result.finalPriceVes)}\n\n`;

  text += `🏦 *Tasa Oficial BCV:* Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(rateBcv)} / USD\n`;
  text += `📅 *Vigencia:* ${dateStr}\n`;

  if (includeBreakdown) {
    text += `\n📋 *Detalle:*`;
    text += `\n• Precio base: ${formatUsd(result.basePriceUsd)} (${formatVes(result.basePriceVes)})`;
    if (result.ivaUsd > 0) {
      text += `\n• IVA (16%): ${formatUsd(result.ivaUsd)} (${formatVes(result.ivaVes)})`;
    }
    if (result.paymentFeeUsd > 0) {
      text += `\n• Comisión de cobro: ${formatUsd(result.paymentFeeUsd)} (${formatVes(result.paymentFeeVes)})`;
    }
  }

  if (note && note.trim()) {
    text += `\n\n📌 *Condiciones:* ${note.trim()}`;
  }

  text += `\n\n_Para pagos en Bolívares vía Pago Móvil o Punto de Venta, se liquida a la tasa oficial BCV del día._`;
  text += `\n_MS Morales System Soluciones_`;
  return text;
}

/**
 * Generate receipt for MS Morales System Soluciones Commerce Calculator
 */
export function generateCommerceReceiptMessage(
  sale: PosSaleData,
  store: CommerceStoreInfo,
  rateBcv: number,
  changeVes: number,
  changeUsd: number
): string {
  let text = `*COMPROBANTE DE COMPRA / RECIBO*\n`;
  text += `🏪 *${store.storeName || 'MS Morales System Soluciones'}*\n`;
  if (store.rif) text += `📋 RIF: ${store.rif}\n`;
  if (store.phone) text += `📞 Teléfono: ${store.phone}\n`;
  text += `📅 Fecha: ${new Date().toLocaleDateString('es-VE')} - ${new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}\n`;

  if (sale.clientName.trim()) {
    text += `👤 Cliente: ${sale.clientName.trim()}\n`;
  }
  if (sale.referenceNumber.trim()) {
    text += `🔖 Referencia: ${sale.referenceNumber.trim()}\n`;
  }

  text += `\n─────────────────────\n`;
  text += `💵 *TOTAL A PAGAR:* ${formatUsd(sale.totalUsd)} / ${formatVes(sale.totalVes)}\n`;
  text += `🏦 *Tasa Oficial BCV:* Bs. ${rateBcv.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}\n`;
  text += `─────────────────────\n\n`;

  text += `💳 *Método de Pago:* ${sale.paymentMethod.replace('_', ' ').toUpperCase()}\n`;
  if (sale.paidUsd > 0) text += `• Monto abonado ($): ${formatUsd(sale.paidUsd)}\n`;
  if (sale.paidVes > 0) text += `• Monto abonado (Bs.): ${formatVes(sale.paidVes)}\n`;

  if (changeVes > 0 || changeUsd > 0) {
    text += `\n💰 *VUELTO / CAMBIO AL CLIENTE:*\n`;
    if (changeVes > 0) text += `• En Bolívares: ${formatVes(changeVes)}\n`;
    if (changeUsd > 0) text += `• En Dólares: ${formatUsd(changeUsd)}\n`;
  }

  if (store.pagoMovilPhone && store.bankName) {
    text += `\n📱 *Datos Pago Móvil:*\n`;
    text += `• Banco: ${store.bankName}\n`;
    text += `• Teléfono: ${store.pagoMovilPhone}\n`;
    if (store.pagoMovilId) text += `• C.I./RIF: ${store.pagoMovilId}\n`;
  }

  text += `\n¡Gracias por su compra!\n`;
  text += `_MS Morales System Soluciones_`;
  return text;
}
