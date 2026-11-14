import { PricingSettings, PricingResult, CommerceStoreInfo, PosSaleData, CustomerDebt, DebtPayment, DebtInvoice, CustomerProfile, ExchangeRateData } from '../types';

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
  text += `📅 *Fecha de vigencia (BCV):* ${dateStr}\n`;

  if (note && note.trim()) {
    text += `\n📝 *Nota:* ${note.trim()}\n`;
  }

  text += `\n🔗 *Boletín Oficial:* https://www.bcv.org.ve/\n`;
  text += `_MS Morales System Soluciones · Tecnología & Comercio_`;
  return text;
}

/**
 * Generate formatted official daily BCV bulletin message for WhatsApp
 */
export function generateBcvBulletinMessage(rateData: ExchangeRateData): string {
  const usdFormatted = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(rateData.usd);
  const eurFormatted = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(rateData.eur);

  let text = `🏛️ *BANCO CENTRAL DE VENEZUELA (BCV)*\n`;
  text += `📊 *BOLETÍN OFICIAL DIARIO DE TIPOS DE CAMBIO*\n`;
  text += `─────────────────────────\n\n`;

  text += `💵 *DÓLAR OFICIAL (USD):* Bs. ${usdFormatted}\n`;
  text += `💶 *EURO OFICIAL (EUR):* Bs. ${eurFormatted}\n`;
  if (rateData.cny) {
    text += `🇨🇳 *YUAN (CNY):* Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 4 }).format(rateData.cny)}\n`;
  }
  if (rateData.try) {
    text += `🇹🇷 *LIRA TURCA (TRY):* Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 4 }).format(rateData.try)}\n`;
  }
  if (rateData.rub) {
    text += `🇷🇺 *RUBLO (RUB):* Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 4 }).format(rateData.rub)}\n`;
  }

  text += `\n─────────────────────────\n`;
  if (rateData.fechaValor) {
    text += `📅 *FECHA VALOR DE VIGENCIA:* ${rateData.fechaValor}\n`;
  }
  text += `⏰ *Hora de emisión:* ${rateData.bulletinTime || 'Cierre de mesas de cambio bancarias (16:00 - 17:30 VET)'}\n`;
  text += `🔄 *Última sincronización:* ${new Date().toLocaleDateString('es-VE')} - ${new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}\n`;
  text += `🔗 *Verificar en portal oficial:* https://www.bcv.org.ve/\n\n`;

  text += `_Fuente directa: Banco Central de Venezuela (BCV Oficial - bcv.org.ve)_\n`;
  text += `_MS Morales System Soluciones · Tecnología & Comercio_`;
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

/**
 * Returns the normalized array of invoices for a customer debt (synthesizing the initial invoice if legacy)
 */
export function getDebtInvoices(debt: CustomerDebt): DebtInvoice[] {
  if (debt.invoices && debt.invoices.length > 0) {
    return debt.invoices;
  }
  return [
    {
      id: `${debt.id}-init`,
      invoiceNumber: 'FAC-001',
      description: debt.description || 'Factura inicial',
      amountUsd: debt.originalAmountUsd,
      rateBcvAtCreation: debt.originalRateBcv,
      date: debt.createdAt,
      dueDate: debt.dueDate,
      notes: debt.notes,
    },
  ];
}

/**
 * Calculate balance and status of a debt with real-time BCV conversion
 */
export function getDebtBalanceInfo(debt: CustomerDebt, currentRateBcv: number) {
  const safeRate = currentRateBcv > 0 ? currentRateBcv : 1;
  const totalPaidUsd = (debt.payments || []).reduce((acc, p) => acc + (Number(p.amountUsd) || 0), 0);
  const remainingUsd = Math.max(0, debt.originalAmountUsd - totalPaidUsd);
  const remainingVes = remainingUsd * safeRate;
  const originalVes = debt.originalAmountUsd * (debt.originalRateBcv || safeRate);

  // Determine calendar days until due
  let urgencyStatus: import('../types').DebtUrgencyStatus = 'active';
  let daysDiff = 0;

  if (remainingUsd <= 0.01) {
    urgencyStatus = 'paid';
  } else if (debt.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = debt.dueDate.split('-');
    if (parts.length === 3) {
      const due = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      due.setHours(0, 0, 0, 0);

      const diffTime = due.getTime() - today.getTime();
      daysDiff = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        urgencyStatus = 'due_tomorrow'; // 1 día antes del vencimiento
      } else if (daysDiff === 0) {
        urgencyStatus = 'due_today';
      } else if (daysDiff < 0) {
        urgencyStatus = 'overdue';
      } else {
        urgencyStatus = 'active';
      }
    }
  }

  return {
    totalPaidUsd,
    remainingUsd,
    remainingVes,
    originalVes,
    urgencyStatus,
    daysDiff,
  };
}

export interface DebtNotificationCheckResult {
  shouldNotifyToday: boolean;
  alertType: 'due_tomorrow' | 'due_today' | 'overdue_followup' | 'scheduled_future' | 'paid';
  attemptNumber: number;
  daysSinceLastAlert: number | null;
  daysDiff: number;
  alreadyNotifiedToday: boolean;
  nextScheduledDate: string | null;
  reasonLabel: string;
  badgeColor: string;
}

/**
 * Checks if a customer debt qualifies for an automated notification today:
 * 1. Exactly 1 day before due date (due_tomorrow)
 * 2. On the due date (due_today)
 * 3. Overdue with recurring follow-up every 2 to 3 days if unpaid/no contact
 */
export function checkDebtNotificationEligibility(
  debt: CustomerDebt,
  currentRateBcv: number,
  globalCadenceDays: 2 | 3 = 2
): DebtNotificationCheckResult {
  const { remainingUsd, daysDiff } = getDebtBalanceInfo(debt, currentRateBcv);

  // If already paid
  if (remainingUsd <= 0.01) {
    return {
      shouldNotifyToday: false,
      alertType: 'paid',
      attemptNumber: 0,
      daysSinceLastAlert: null,
      daysDiff,
      alreadyNotifiedToday: false,
      nextScheduledDate: null,
      reasonLabel: 'Cuenta solvente / pagada',
      badgeColor: 'emerald',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if notification was already sent today
  let alreadyNotifiedToday = false;
  let daysSinceLastAlert: number | null = null;

  if (debt.lastNotificationSentAt) {
    const lastDate = new Date(debt.lastNotificationSentAt);
    if (!isNaN(lastDate.getTime())) {
      const lastDateMidnight = new Date(lastDate);
      lastDateMidnight.setHours(0, 0, 0, 0);
      alreadyNotifiedToday = lastDateMidnight.getTime() === today.getTime();
      daysSinceLastAlert = Math.floor((today.getTime() - lastDateMidnight.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  const cadence = debt.followupCadenceDays || globalCadenceDays || 2;
  const previousAttempts = debt.notificationHistory?.length || (debt.lastNotificationSentAt ? 1 : 0);
  const attemptNumber = previousAttempts + 1;

  // Case 1: Exactly 1 day before due date
  if (daysDiff === 1) {
    if (alreadyNotifiedToday) {
      return {
        shouldNotifyToday: false,
        alertType: 'due_tomorrow',
        attemptNumber: Math.max(1, previousAttempts),
        daysSinceLastAlert,
        daysDiff,
        alreadyNotifiedToday: true,
        nextScheduledDate: 'Mañana (Día de cobro)',
        reasonLabel: 'Alerta preventiva de vencimiento enviada hoy',
        badgeColor: 'amber',
      };
    }
    return {
      shouldNotifyToday: true,
      alertType: 'due_tomorrow',
      attemptNumber,
      daysSinceLastAlert,
      daysDiff,
      alreadyNotifiedToday: false,
      nextScheduledDate: 'Hoy (1 día antes)',
      reasonLabel: '🚨 Vence mañana: Alerta automática preventiva requerida',
      badgeColor: 'amber',
    };
  }

  // Case 2: Due today
  if (daysDiff === 0) {
    if (alreadyNotifiedToday) {
      return {
        shouldNotifyToday: false,
        alertType: 'due_today',
        attemptNumber: Math.max(1, previousAttempts),
        daysSinceLastAlert,
        daysDiff,
        alreadyNotifiedToday: true,
        nextScheduledDate: `En ${cadence} días (si continúa impaga)`,
        reasonLabel: 'Aviso de vencimiento hoy enviado al cliente',
        badgeColor: 'orange',
      };
    }
    return {
      shouldNotifyToday: true,
      alertType: 'due_today',
      attemptNumber,
      daysSinceLastAlert,
      daysDiff,
      alreadyNotifiedToday: false,
      nextScheduledDate: 'Hoy (Día de vencimiento)',
      reasonLabel: '⚠️ Vence hoy: Alerta de cobro requerida',
      badgeColor: 'orange',
    };
  }

  // Case 3: Overdue (Mora) - Follow up every 2 to 3 days
  if (daysDiff < 0) {
    const overdueDays = Math.abs(daysDiff);

    // If never notified yet
    if (!debt.lastNotificationSentAt || daysSinceLastAlert === null) {
      return {
        shouldNotifyToday: true,
        alertType: 'overdue_followup',
        attemptNumber: 1,
        daysSinceLastAlert: null,
        daysDiff,
        alreadyNotifiedToday: false,
        nextScheduledDate: 'Hoy (Inmediata)',
        reasonLabel: `❗ Vencida hace ${overdueDays}d: Requiere 1ra alerta de mora`,
        badgeColor: 'red',
      };
    }

    // If already notified today
    if (alreadyNotifiedToday) {
      const nextDate = new Date(today.getTime() + cadence * 24 * 60 * 60 * 1000);
      return {
        shouldNotifyToday: false,
        alertType: 'overdue_followup',
        attemptNumber: Math.max(1, previousAttempts),
        daysSinceLastAlert,
        daysDiff,
        alreadyNotifiedToday: true,
        nextScheduledDate: nextDate.toLocaleDateString('es-VE'),
        reasonLabel: `✓ Alerta #${previousAttempts} enviada hoy. Próxima en ${cadence} días`,
        badgeColor: 'neutral',
      };
    }

    // If days since last notification reached or exceeded the 2-3 days cycle
    if (daysSinceLastAlert >= cadence) {
      return {
        shouldNotifyToday: true,
        alertType: 'overdue_followup',
        attemptNumber,
        daysSinceLastAlert,
        daysDiff,
        alreadyNotifiedToday: false,
        nextScheduledDate: 'Hoy (Ciclo cumplido)',
        reasonLabel: `🚨 Seguimiento #${attemptNumber} requerido (hace ${daysSinceLastAlert}d del último aviso - ciclo cada ${cadence}d)`,
        badgeColor: 'red',
      };
    }

    // Overdue but within the 2-3 days waiting interval
    const daysRemaining = Math.max(1, cadence - daysSinceLastAlert);
    const nextDate = new Date(today.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
    return {
      shouldNotifyToday: false,
      alertType: 'overdue_followup',
      attemptNumber: Math.max(1, previousAttempts),
      daysSinceLastAlert,
      daysDiff,
      alreadyNotifiedToday: false,
      nextScheduledDate: nextDate.toLocaleDateString('es-VE'),
      reasonLabel: `⏳ Próximo recordatorio en ${daysRemaining} día(s) (ciclo cada ${cadence}d)`,
      badgeColor: 'neutral',
    };
  }

  // Case 4: Future debt (> 1 day left)
  // Calculate 1 day before due date
  const parts = debt.dueDate.split('-');
  let alertEveDateStr = '';
  if (parts.length === 3) {
    const due = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const dayBefore = new Date(due.getTime() - 24 * 60 * 60 * 1000);
    alertEveDateStr = dayBefore.toLocaleDateString('es-VE');
  }

  return {
    shouldNotifyToday: false,
    alertType: 'scheduled_future',
    attemptNumber: 0,
    daysSinceLastAlert,
    daysDiff,
    alreadyNotifiedToday: false,
    nextScheduledDate: alertEveDateStr || `En ${daysDiff - 1} días`,
    reasonLabel: `Programada para el ${alertEveDateStr} (1 día antes)`,
    badgeColor: 'neutral',
  };
}

export interface DebtReminderOptions {
  attemptNumber?: number;
  cadenceDays?: number;
  customNote?: string;
  overrideType?: 'due_tomorrow' | 'due_today' | 'overdue_followup';
}

/**
 * Generate official alert WhatsApp reminder for debts with itemized accumulated debt,
 * real-time BCV conversion, Pago Móvil details, and recurring follow-up notice (every 2-3 days).
 */
export function generateDebtReminderMessage(
  debt: CustomerDebt,
  currentRateBcv: number,
  store: CommerceStoreInfo,
  options?: DebtReminderOptions
): string {
  const { remainingUsd, remainingVes, originalVes, totalPaidUsd, urgencyStatus, daysDiff } =
    getDebtBalanceInfo(debt, currentRateBcv);

  const cadence = options?.cadenceDays || debt.followupCadenceDays || 2;
  const previousHistoryCount = debt.notificationHistory?.length || (debt.lastNotificationSentAt ? 1 : 0);
  const attemptNum = options?.attemptNumber ?? (previousHistoryCount + 1);
  const type = options?.overrideType || (urgencyStatus === 'due_tomorrow' ? 'due_tomorrow' : urgencyStatus === 'due_today' ? 'due_today' : 'overdue_followup');

  let headerBanner = '';
  let urgencyStatement = '';

  if (type === 'due_tomorrow' || urgencyStatus === 'due_tomorrow') {
    headerBanner = `🚨 *ALERTA DE PAGO: VENCIMIENTO MAÑANA* 🚨`;
    urgencyStatement = `⏰ *AVISO PREVENTIVO:* Le recordamos cordialmente que el día de *MAÑANA* (${debt.dueDate}) se cumple el plazo para la cancelación de su cuenta.`;
  } else if (type === 'due_today' || urgencyStatus === 'due_today') {
    headerBanner = `⚠️ *ALERTA DE COBRO: VENCE HOY* ⚠️`;
    urgencyStatement = `⚠️ *AVISO URGENTE:* Le notificamos que el día de *HOY* (${debt.dueDate}) vence el plazo acordado para la liquidación de su crédito comercial.`;
  } else if (daysDiff < 0 || type === 'overdue_followup') {
    const absDays = Math.abs(daysDiff);
    headerBanner = `🚨 *NOTIFICACIÓN DE COBRO: CUENTA EN RETRASO [AVISO #${attemptNum}]* 🚨`;
    urgencyStatement = `❗ *ESTADO DE RETRASO:* Su cuenta registra un retraso acumulado de *${absDays} día(s)* (fecha límite: ${debt.dueDate}) y no hemos recibido abono ni confirmación de pago.`;
  } else {
    headerBanner = `📋 *RECORDATORIO DE ESTADO DE CUENTA* 📋`;
    urgencyStatement = `📅 *Fecha de Vencimiento Programada:* ${debt.dueDate}`;
  }

  let text = `${headerBanner}\n`;
  text += `🏢 *${store.storeName || 'MS MORALES SYSTEM SOLUCIONES'}*\n`;
  text += `────────────────────────\n\n`;

  text += `Estimado(a) *${debt.customerName}*,\n`;
  text += `Esperamos se encuentre bien. Le compartimos el estado consolidado de su saldo pendiente a la fecha:\n\n`;

  text += `${urgencyStatement}\n\n`;

  const invoices = getDebtInvoices(debt);

  text += `📊 *DETALLE DE LA DEUDA ACUMULADA:*\n`;
  text += `• *Concepto General:* ${debt.description}\n`;
  if (debt.customerId) {
    text += `• *C.I. / RIF:* ${debt.customerId}\n`;
  }
  if (invoices.length > 1) {
    text += `\n🧾 *FACTURAS INCLUIDAS (${invoices.length}):*\n`;
    invoices.forEach((inv, idx) => {
      text += `  ${idx + 1}. *${inv.invoiceNumber || `Factura #${idx + 1}`}* (${inv.date}) — ${inv.description}: *${formatUsd(inv.amountUsd)}*\n`;
    });
    text += `\n`;
  }
  text += `• *Total Facturado Acumulado:* ${formatUsd(debt.originalAmountUsd)} (aprox. ${formatVes(originalVes)})\n`;
  if (totalPaidUsd > 0) {
    text += `• *Total Abonado a la Fecha:* ${formatUsd(totalPaidUsd)} (${debt.payments.length} abono(s) registrado(s))\n`;
  }
  text += `────────────────────────\n`;
  text += `🔥 *TOTAL SALDO PENDIENTE ACUMULADO:* *${formatUsd(remainingUsd)} USD*\n`;
  text += `🇻🇪 *TOTAL EN BOLÍVARES (TASA BCV HOY):* *${formatVes(remainingVes)}*\n`;
  text += `🏦 *Tasa Oficial BCV de Hoy:* Bs. ${currentRateBcv.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / USD\n`;
  text += `📅 *Liquidación calculada al:* ${new Date().toLocaleDateString('es-VE')} - ${new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}\n`;
  text += `────────────────────────\n\n`;

  if (store.pagoMovilPhone && store.bankName) {
    text += `💳 *DATOS BANCARIOS PARA PAGO MÓVIL:*\n`;
    text += `• *Banco:* ${store.bankName}\n`;
    text += `• *Teléfono:* ${store.pagoMovilPhone}\n`;
    if (store.pagoMovilId) {
      text += `• *C.I. / RIF:* ${store.pagoMovilId}\n`;
    }
    text += `• *Monto exacto a transferir:* ${formatVes(remainingVes)}\n\n`;
  }

  if (options?.customNote && options.customNote.trim()) {
    text += `📝 *Nota especial:* ${options.customNote.trim()}\n\n`;
  }

  text += `📲 *NOTIFICACIÓN DE PAGO:*\n`;
  text += `Al realizar su pago o abono, por favor compártanos el número de referencia o comprobante por este chat para conciliar y descargar su saldo en el sistema.\n\n`;

  text += `🔔 *Seguimiento Automático:* Nuestro sistema emite notificaciones periódicas cada ${cadence} a 3 días a cuentas pendientes hasta que el saldo sea cancelado o se acuerde una fecha de abono.\n\n`;

  text += `_Agradecemos su atención y puntual compromiso._\n`;
  text += `_${store.storeName || 'MS Morales System Soluciones'} · Gestión de Cobranzas_`;

  return text;
}


/**
 * Generate payment receipt message for an installment / abono
 */
export function generateDebtPaymentReceiptMessage(
  debt: CustomerDebt,
  payment: DebtPayment,
  currentRateBcv: number,
  store: CommerceStoreInfo
): string {
  const { remainingUsd, remainingVes, totalPaidUsd } = getDebtBalanceInfo(debt, currentRateBcv);

  let text = `*COMPROBANTE DE ABONO RECIBIDO*\n`;
  text += `🏪 *${store.storeName || 'MS Morales System Soluciones'}*\n`;
  text += `📅 Fecha: ${new Date(payment.date).toLocaleDateString('es-VE')} - ${new Date(payment.date).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}\n\n`;

  text += `👤 *Cliente:* ${debt.customerName}\n`;
  text += `📋 *Concepto:* ${debt.description}\n\n`;

  text += `─────────────────────\n`;
  text += `💵 *Abono Recibido ($):* ${formatUsd(payment.amountUsd)}\n`;
  text += `🇻🇪 *Abono en Bolívares:* ${formatVes(payment.amountVes)}\n`;
  text += `💳 *Método de Pago:* ${payment.paymentMethod.replace('_', ' ').toUpperCase()}\n`;
  if (payment.referenceNumber) {
    text += `🔖 *N° Referencia:* ${payment.referenceNumber}\n`;
  }
  text += `🏦 *Tasa BCV del abono:* Bs. ${payment.rateUsed.toLocaleString('es-VE', { minimumFractionDigits: 2 })}\n`;
  text += `─────────────────────\n\n`;

  text += `📊 *ESTADO DE CUENTA ACTUALIZADO:*\n`;
  text += `• Deuda Original: ${formatUsd(debt.originalAmountUsd)}\n`;
  text += `• Total Abonado a la fecha: ${formatUsd(totalPaidUsd)}\n`;

  if (remainingUsd <= 0.01) {
    text += `\n🎉 *¡CUENTA TOTALMENTE SALDADA!* Muchas gracias por su pago puntual.\n`;
  } else {
    text += `• *Saldo Restante en USD:* ${formatUsd(remainingUsd)}\n`;
    text += `• *Saldo Restante en Bolívares (Tasa BCV hoy):* ${formatVes(remainingVes)}\n`;
  }

  text += `\n¡Gracias por su preferencia!\n`;
  text += `_${store.storeName || 'MS Morales System Soluciones'}_`;
  return text;
}

/**
 * Generate comprehensive General Accounts Receivable Balance Report
 * for business management (Total por cobrar en $ y equivalente a la fecha en Bs.)
 */
export function generateGeneralReceivablesReportMessage(
  debts: CustomerDebt[],
  rateBcv: number,
  store: CommerceStoreInfo
): string {
  const safeRate = rateBcv > 0 ? rateBcv : 1;
  let totalOriginalUsd = 0;
  let totalPaidUsd = 0;
  let totalPendingUsd = 0;
  let countActive = 0;
  let countDueTomorrow = 0;
  let countOverdue = 0;
  let countDueToday = 0;

  const activeDebtsSummary: { name: string; pendingUsd: number; pendingVes: number; status: string }[] = [];

  debts.forEach((d) => {
    const balance = getDebtBalanceInfo(d, safeRate);
    totalOriginalUsd += d.originalAmountUsd;
    totalPaidUsd += balance.totalPaidUsd;
    totalPendingUsd += balance.remainingUsd;

    if (balance.remainingUsd > 0.01) {
      countActive++;
      let statusStr = 'Al día';
      if (balance.urgencyStatus === 'due_tomorrow') {
        countDueTomorrow++;
        statusStr = 'Vence mañana';
      } else if (balance.urgencyStatus === 'due_today') {
        countDueToday++;
        statusStr = 'Vence hoy';
      } else if (balance.urgencyStatus === 'overdue') {
        countOverdue++;
        statusStr = `Mora (${Math.abs(balance.daysDiff)}d)`;
      }

      activeDebtsSummary.push({
        name: d.customerName,
        pendingUsd: balance.remainingUsd,
        pendingVes: balance.remainingVes,
        status: statusStr,
      });
    }
  });

  const totalPendingVes = totalPendingUsd * safeRate;
  const totalOriginalVes = totalOriginalUsd * safeRate;
  const totalPaidVes = totalPaidUsd * safeRate;
  const recoveryPercent = totalOriginalUsd > 0 ? ((totalPaidUsd / totalOriginalUsd) * 100).toFixed(1) : '0';

  let text = `*MS MORALES SYSTEM SOLUCIONES*\n`;
  text += `📊 *REPORTE GENERAL DE COBRANZAS Y CARTERA*\n`;
  text += `📅 Fecha: ${new Date().toLocaleDateString('es-VE')} - ${new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}\n`;
  text += `🏦 *Tasa Oficial BCV:* Bs. ${safeRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / USD\n`;
  text += `─────────────────────────\n\n`;

  text += `🔥 *SALDO TOTAL GENERAL POR COBRAR:*\n`;
  text += `💵 *Dólares:* ${formatUsd(totalPendingUsd)}\n`;
  text += `🇻🇪 *Equivalente en Bolívares:* ${formatVes(totalPendingVes)}\n\n`;

  text += `📈 *RESUMEN DE CARTERA:*\n`;
  text += `• Total Facturado en Créditos: ${formatUsd(totalOriginalUsd)} (${formatVes(totalOriginalVes)})\n`;
  text += `• Total Recuperado en Abonos: ${formatUsd(totalPaidUsd)} (${formatVes(totalPaidVes)})\n`;
  text += `• % de Recuperación de Cartera: ${recoveryPercent}%\n`;
  text += `• Clientes Activos con Deuda: ${countActive}\n`;
  text += `• Cuentas que Vencen Mañana: ${countDueTomorrow}\n`;
  text += `• Cuentas en Mora (Vencidas): ${countOverdue}\n\n`;

  if (activeDebtsSummary.length > 0) {
    text += `📋 *DESGLOSE DE CLIENTES CON SALDO PENDIENTE:*\n`;
    activeDebtsSummary.forEach((c, idx) => {
      text += `${idx + 1}. *${c.name}* [${c.status}]\n`;
      text += `   ↳ ${formatUsd(c.pendingUsd)}  |  ${formatVes(c.pendingVes)}\n`;
    });
    text += `\n`;
  }

  text += `_Reporte emitido desde la plataforma de MS Morales System Soluciones_`;
  return text;
}

/**
 * Generate WhatsApp notification when a new invoice is included in an existing customer's account
 */
export function generateNewInvoiceAddedMessage(
  debt: CustomerDebt,
  newInvoice: DebtInvoice,
  currentRateBcv: number,
  store: CommerceStoreInfo
): string {
  const safeRate = currentRateBcv > 0 ? currentRateBcv : 1;
  const { remainingUsd, remainingVes, totalPaidUsd } = getDebtBalanceInfo(debt, safeRate);
  const invoices = getDebtInvoices(debt);
  const newInvoiceVes = newInvoice.amountUsd * safeRate;

  let text = `🧾 *NUEVA FACTURA INCLUIDA EN SU ESTADO DE CUENTA*\n`;
  text += `🏪 *${store.storeName || 'MS Morales System Soluciones'}*\n`;
  text += `📅 Fecha: ${new Date().toLocaleDateString('es-VE')} - ${new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}\n`;
  text += `────────────────────────\n\n`;

  text += `👤 *Cliente:* ${debt.customerName}\n`;
  if (debt.customerId) text += `🆔 *C.I. / RIF:* ${debt.customerId}\n`;
  text += `\n`;

  text += `🆕 *DETALLE DE LA NUEVA FACTURA ANEXADA:*\n`;
  text += `• *N° Factura / Nota:* ${newInvoice.invoiceNumber}\n`;
  text += `• *Concepto:* ${newInvoice.description}\n`;
  text += `• *Monto Factura ($):* *${formatUsd(newInvoice.amountUsd)}*\n`;
  text += `• *Equivalente en Bs. (BCV):* *${formatVes(newInvoiceVes)}*\n`;
  if (newInvoice.dueDate || debt.dueDate) {
    text += `• *Fecha de Vencimiento:* ${newInvoice.dueDate || debt.dueDate}\n`;
  }
  text += `────────────────────────\n\n`;

  text += `📊 *RESUMEN ACTUALIZADO DE SU CUENTA (${invoices.length} ${invoices.length === 1 ? 'Factura' : 'Facturas'}):*\n`;
  invoices.forEach((inv, idx) => {
    text += `  ${idx + 1}. *${inv.invoiceNumber}* (${inv.date}) - ${inv.description}: ${formatUsd(inv.amountUsd)}\n`;
  });
  text += `\n`;
  text += `• *Total Facturado Acumulado:* ${formatUsd(debt.originalAmountUsd)}\n`;
  if (totalPaidUsd > 0) {
    text += `• *Total Abonos Recibidos:* -${formatUsd(totalPaidUsd)}\n`;
  }
  text += `🔥 *SALDO TOTAL PENDIENTE A LA FECHA:* *${formatUsd(remainingUsd)} USD*\n`;
  text += `🇻🇪 *EQUIVALENTE EN BOLÍVARES (BCV HOY):* *${formatVes(remainingVes)}*\n`;
  text += `🏦 *Tasa Oficial BCV:* Bs. ${safeRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / USD\n\n`;

  if (store.pagoMovilPhone && store.bankName) {
    text += `💳 *Datos Pago Móvil para Abonos:*\n`;
    text += `• Banco: ${store.bankName}\n`;
    text += `• Teléfono: ${store.pagoMovilPhone}\n`;
    if (store.pagoMovilId) text += `• C.I./RIF: ${store.pagoMovilId}\n\n`;
  }

  text += `_Gracias por su confianza comercial._\n`;
  text += `_${store.storeName || 'MS Morales System Soluciones'}_`;
  return text;
}

/**
 * Generate full historical statement of account for a saved client from the Client History Directory
 */
export function generateCustomerHistoryStatementMessage(
  profile: CustomerProfile,
  clientDebts: CustomerDebt[],
  currentRateBcv: number,
  store: CommerceStoreInfo
): string {
  const safeRate = currentRateBcv > 0 ? currentRateBcv : 1;
  let totalBilledUsd = 0;
  let totalPaidUsd = 0;
  let totalPendingUsd = 0;
  let totalInvoicesCount = 0;

  let text = `📋 *ESTADO DE CUENTA E HISTORIAL DE CLIENTE*\n`;
  text += `🏢 *${store.storeName || 'MS Morales System Soluciones'}*\n`;
  text += `📅 Emisión: ${new Date().toLocaleDateString('es-VE')} - ${new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}\n`;
  text += `────────────────────────\n\n`;

  text += `👤 *Cliente:* ${profile.name}\n`;
  if (profile.customerId) text += `🆔 *C.I. / RIF:* ${profile.customerId}\n`;
  if (profile.phone) text += `📞 *Teléfono:* ${profile.phone}\n`;
  if (profile.address) text += `📍 *Dirección:* ${profile.address}\n`;
  text += `\n`;

  if (clientDebts.length === 0) {
    text += `✅ *El cliente se encuentra solvente y sin facturas pendientes.*\n\n`;
  } else {
    text += `🧾 *HISTORIAL DE FACTURAS Y CUENTAS:*\n`;
    clientDebts.forEach((d) => {
      const bal = getDebtBalanceInfo(d, safeRate);
      const invs = getDebtInvoices(d);
      totalBilledUsd += d.originalAmountUsd;
      totalPaidUsd += bal.totalPaidUsd;
      totalPendingUsd += bal.remainingUsd;
      totalInvoicesCount += invs.length;

      invs.forEach((inv) => {
        text += `• *${inv.invoiceNumber}* (${inv.date}): ${inv.description} — *${formatUsd(inv.amountUsd)}*\n`;
      });
    });
    text += `\n`;
  }

  const totalPendingVes = totalPendingUsd * safeRate;

  text += `────────────────────────\n`;
  text += `📊 *BALANCE CONSOLIDADO DEL CLIENTE:*\n`;
  text += `• *Total Facturas Registradas:* ${totalInvoicesCount}\n`;
  text += `• *Total Histórico Facturado:* ${formatUsd(totalBilledUsd)}\n`;
  text += `• *Total Histórico Abonado:* ${formatUsd(totalPaidUsd)}\n`;
  text += `🔥 *SALDO PENDIENTE ACTUAL (USD):* *${formatUsd(totalPendingUsd)}*\n`;
  text += `🇻🇪 *EQUIVALENTE EN BOLÍVARES (BCV HOY):* *${formatVes(totalPendingVes)}*\n`;
  text += `🏦 *Tasa Oficial BCV:* Bs. ${safeRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / USD\n`;
  text += `────────────────────────\n\n`;

  if (totalPendingUsd > 0.01 && store.pagoMovilPhone && store.bankName) {
    text += `💳 *Datos Pago Móvil:*\n`;
    text += `• Banco: ${store.bankName} | Tel: ${store.pagoMovilPhone} ${store.pagoMovilId ? `| RIF/CI: ${store.pagoMovilId}` : ''}\n\n`;
  }

  text += `_${store.storeName || 'MS Morales System Soluciones'}_`;
  return text;
}


