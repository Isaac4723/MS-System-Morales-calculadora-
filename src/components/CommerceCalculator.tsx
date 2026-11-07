import React, { useState, useEffect } from 'react';
import {
  Store,
  DollarSign,
  ArrowRightLeft,
  CreditCard,
  MessageCircle,
  Copy,
  Check,
  Building,
  Phone,
  QrCode,
  Receipt,
  RotateCcw,
  Sparkles,
  Sliders
} from 'lucide-react';
import { CommerceStoreInfo, ExchangeRateData, PosSaleData } from '../types';
import { formatUsd, formatVes, generateCommerceReceiptMessage, parseFlexibleNumber } from '../utils/formatters';

interface CommerceCalculatorProps {
  rateData: ExchangeRateData | null;
  effectiveRate: number;
  onOpenWhatsApp: (message: string) => void;
}

const DEFAULT_STORE: CommerceStoreInfo = {
  storeName: 'MS Morales System Soluciones',
  rif: 'J-50123456-7',
  phone: '0414-1234567',
  bankName: 'Banesco / Banco de Venezuela',
  pagoMovilPhone: '04141234567',
  pagoMovilId: 'V-12345678',
  address: 'Venezuela',
};

export const CommerceCalculator: React.FC<CommerceCalculatorProps> = ({
  rateData,
  effectiveRate,
  onOpenWhatsApp,
}) => {
  // Store info stored in localStorage
  const [store, setStore] = useState<CommerceStoreInfo>(() => {
    try {
      const saved = localStorage.getItem('ms_morales_store_info');
      return saved ? JSON.parse(saved) : DEFAULT_STORE;
    } catch {
      return DEFAULT_STORE;
    }
  });

  const [isEditingStore, setIsEditingStore] = useState<boolean>(false);

  // Sale transaction state
  const [saleTotalInput, setSaleTotalInput] = useState<string>('25');
  const [saleCurrency, setSaleCurrency] = useState<'USD' | 'VES'>('USD');
  const [clientName, setClientName] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PosSaleData['paymentMethod']>('pago_movil');

  // Amounts received from client (Bimonetary)
  const [receivedUsd, setReceivedUsd] = useState<string>('0');
  const [receivedVes, setReceivedVes] = useState<string>('0');

  // Copy states
  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);
  const [copiedPagoMovil, setCopiedPagoMovil] = useState<boolean>(false);

  // Save store info
  useEffect(() => {
    localStorage.setItem('ms_morales_store_info', JSON.stringify(store));
  }, [store]);

  // Calculations
  const rawSaleTotal = parseFlexibleNumber(saleTotalInput);
  const totalUsd = saleCurrency === 'USD' ? rawSaleTotal : (effectiveRate > 0 ? rawSaleTotal / effectiveRate : 0);
  const totalVes = saleCurrency === 'VES' ? rawSaleTotal : rawSaleTotal * effectiveRate;

  const paidUsdVal = parseFlexibleNumber(receivedUsd);
  const paidVesVal = parseFlexibleNumber(receivedVes);

  // Total paid equivalent in USD & VES
  const totalPaidInUsd = paidUsdVal + (effectiveRate > 0 ? paidVesVal / effectiveRate : 0);
  const totalPaidInVes = (paidUsdVal * effectiveRate) + paidVesVal;

  const differenceUsd = totalPaidInUsd - totalUsd;
  const differenceVes = totalPaidInVes - totalVes;

  const isFullyPaid = differenceUsd >= -0.01;
  const changeUsd = Math.max(0, differenceUsd);
  const changeVes = Math.max(0, differenceVes);
  const remainingUsd = Math.max(0, -differenceUsd);
  const remainingVes = Math.max(0, -differenceVes);

  // Quick fill paid with exact amount
  const handlePayExactUsd = () => {
    setReceivedUsd(totalUsd.toFixed(2));
    setReceivedVes('0');
  };

  const handlePayExactVes = () => {
    setReceivedVes(totalVes.toFixed(2));
    setReceivedUsd('0');
  };

  const handleBillPresetUsd = (bill: number) => {
    setReceivedUsd(bill.toString());
    setReceivedVes('0');
  };

  const handleShareWhatsApp = () => {
    const saleData: PosSaleData = {
      totalUsd,
      totalVes,
      paidUsd: paidUsdVal,
      paidVes: paidVesVal,
      paymentMethod,
      clientName,
      referenceNumber,
    };
    const message = generateCommerceReceiptMessage(saleData, store, effectiveRate, changeVes, changeUsd);
    onOpenWhatsApp(message);
  };

  const handleCopyReceipt = async () => {
    const saleData: PosSaleData = {
      totalUsd,
      totalVes,
      paidUsd: paidUsdVal,
      paidVes: paidVesVal,
      paymentMethod,
      clientName,
      referenceNumber,
    };
    const message = generateCommerceReceiptMessage(saleData, store, effectiveRate, changeVes, changeUsd);
    try {
      await navigator.clipboard.writeText(message);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyPagoMovil = async () => {
    const text = `*DATOS PARA PAGO MÓVIL*\n🏪 ${store.storeName}\n🏦 Banco: ${store.bankName}\n📱 Teléfono: ${store.pagoMovilPhone}\n📋 C.I./RIF: ${store.pagoMovilId}\n💵 Monto a transferir: ${formatVes(totalVes)}\n(Tasa BCV: Bs. ${effectiveRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPagoMovil(true);
      setTimeout(() => setCopiedPagoMovil(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleResetSale = () => {
    setSaleTotalInput('0');
    setReceivedUsd('0');
    setReceivedVes('0');
    setClientName('');
    setReferenceNumber('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Commerce Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-950 text-white rounded-2xl p-6 sm:p-7 border border-neutral-700 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0 font-black text-xl">
              MS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {store.storeName || 'MS Morales System Soluciones'}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                  Comercios
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5">
                Caja Registradora & Cobro Bimonetario con Tasa Oficial BCV
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setIsEditingStore(!isEditingStore)}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isEditingStore ? 'Cerrar Ajustes' : 'Datos del Negocio'}</span>
            </button>
            <button
              onClick={handleCopyPagoMovil}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
            >
              {copiedPagoMovil ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPagoMovil ? '¡Copiado!' : 'Copiar Pago Móvil'}</span>
            </button>
          </div>
        </div>

        {/* Store Settings Drawer (Editable in-place) */}
        {isEditingStore && (
          <div className="mt-5 pt-5 border-t border-neutral-700/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label htmlFor="cfg-store-name" className="block text-[11px] font-medium text-neutral-400 mb-1">Nombre del Comercio:</label>
              <input
                id="cfg-store-name"
                type="text"
                value={store.storeName}
                onChange={(e) => setStore({ ...store, storeName: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
              />
            </div>
            <div>
              <label htmlFor="cfg-bank-name" className="block text-[11px] font-medium text-neutral-400 mb-1">Banco para Pago Móvil:</label>
              <input
                id="cfg-bank-name"
                type="text"
                value={store.bankName}
                onChange={(e) => setStore({ ...store, bankName: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
              />
            </div>
            <div>
              <label htmlFor="cfg-pago-phone" className="block text-[11px] font-medium text-neutral-400 mb-1">Teléfono Pago Móvil:</label>
              <input
                id="cfg-pago-phone"
                type="text"
                value={store.pagoMovilPhone}
                onChange={(e) => setStore({ ...store, pagoMovilPhone: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
              />
            </div>
            <div>
              <label htmlFor="cfg-pago-id" className="block text-[11px] font-medium text-neutral-400 mb-1">C.I. / RIF Pago Móvil:</label>
              <input
                id="cfg-pago-id"
                type="text"
                value={store.pagoMovilId}
                onChange={(e) => setStore({ ...store, pagoMovilId: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
              />
            </div>
            <div>
              <label htmlFor="cfg-rif" className="block text-[11px] font-medium text-neutral-400 mb-1">RIF de la Empresa:</label>
              <input
                id="cfg-rif"
                type="text"
                value={store.rif}
                onChange={(e) => setStore({ ...store, rif: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
              />
            </div>
            <div>
              <label htmlFor="cfg-contact-phone" className="block text-[11px] font-medium text-neutral-400 mb-1">Teléfono Contacto / WhatsApp:</label>
              <input
                id="cfg-contact-phone"
                type="text"
                value={store.phone}
                onChange={(e) => setStore({ ...store, phone: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Register POS Input (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-7 shadow-xs space-y-5">
            {/* Monto de la Venta */}
            <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="commerce-sale-amount" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Total de la Cuenta a Cobrar
                </label>
                <div className="flex items-center bg-white dark:bg-neutral-800 rounded-lg p-0.5 border border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={() => setSaleCurrency('USD')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                      saleCurrency === 'USD'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleCurrency('VES')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                      saleCurrency === 'VES'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    VES (Bs.)
                  </button>
                </div>
              </div>

              <div className="relative mt-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-bold text-neutral-400">
                  {saleCurrency === 'USD' ? '$' : 'Bs.'}
                </span>
                <input
                  id="commerce-sale-amount"
                  type="number"
                  step="any"
                  min="0"
                  value={saleTotalInput}
                  onChange={(e) => setSaleTotalInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-3 py-2 text-3xl font-mono font-black text-neutral-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 tabular-nums"
                />
              </div>

              {/* Real-time parallel currency equivalent */}
              <div className="mt-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Equivalente al BCV ({effectiveRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })}):</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
                  {saleCurrency === 'USD' ? formatVes(totalVes) : formatUsd(totalUsd)}
                </span>
              </div>
            </div>

            {/* Método de Pago */}
            <div>
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block mb-2">
                Método de Pago Principal del Cliente:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'pago_movil', label: 'Pago Móvil (Bs.)' },
                  { id: 'efectivo_usd', label: 'Efectivo Dólares' },
                  { id: 'punto_venta', label: 'Punto de Venta (Bs.)' },
                  { id: 'mixto', label: 'Pago Mixto ($ + Bs.)' },
                  { id: 'zelle', label: 'Zelle ($)' },
                  { id: 'transferencia', label: 'Transferencia (Bs.)' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as PosSaleData['paymentMethod'])}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left transition-colors ${
                      paymentMethod === m.id
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cobro Bimonetario / Abonos del Cliente */}
            <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Dinero Recibido del Cliente
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handlePayExactUsd}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Exacto en $
                  </button>
                  <span className="text-neutral-400 text-xs">·</span>
                  <button
                    type="button"
                    onClick={handlePayExactVes}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Exacto en Bs.
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Received in USD */}
                <div>
                  <label htmlFor="received-usd" className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Billete o Abono en Dólares ($):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-neutral-400">$</span>
                    <input
                      id="received-usd"
                      type="number"
                      step="any"
                      min="0"
                      value={receivedUsd}
                      onChange={(e) => setReceivedUsd(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-2 py-1.5 font-mono font-bold text-base rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white tabular-nums"
                    />
                  </div>
                  {/* Billete presets */}
                  <div className="flex gap-1 mt-1.5">
                    {[5, 10, 20, 50, 100].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => handleBillPresetUsd(b)}
                        className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-emerald-500"
                      >
                        ${b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Received in VES */}
                <div>
                  <label htmlFor="received-ves" className="block text-[11px] font-medium text-neutral-500 mb-1">
                    Abono en Bolívares (Pago Móvil / Punto):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-neutral-400">Bs.</span>
                    <input
                      id="received-ves"
                      type="number"
                      step="any"
                      min="0"
                      value={receivedVes}
                      onChange={(e) => setReceivedVes(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-2 py-1.5 font-mono font-bold text-base rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white tabular-nums"
                    />
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1.5">
                    Equivalente: {formatUsd(paidVesVal / (effectiveRate || 1))}
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Customer info for receipt */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label htmlFor="pos-client-name" className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Nombre del Cliente (Opcional):
                </label>
                <input
                  id="pos-client-name"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Carlos Gómez"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="pos-ref-number" className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  N° Referencia Pago Móvil / Punto:
                </label>
                <input
                  id="pos-ref-number"
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Últimos 4 o 6 dígitos (ej: 4892)"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Vuelto / Balance & Recibo MS Morales (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Vuelto / Cambio Display Card */}
          <div
            className={`rounded-2xl p-6 text-white shadow-md transition-all ${
              isFullyPaid
                ? changeVes > 0
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-800'
                  : 'bg-gradient-to-br from-neutral-800 to-neutral-950'
                : 'bg-gradient-to-br from-amber-600 to-orange-700'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                  {isFullyPaid ? (changeVes > 0 ? 'Vuelto / Cambio a Entregar' : 'Cuenta Pagada Exacta') : 'Monto Faltante por Cobrar'}
                </span>
                <span className="text-[11px] font-mono bg-black/20 px-2 py-0.5 rounded text-white">
                  BCV: {effectiveRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {isFullyPaid ? (
                <div>
                  <div className="text-3xl sm:text-4xl font-mono font-black tabular-nums">
                    {formatVes(changeVes)}
                  </div>
                  <div className="text-sm font-mono font-bold text-white/90 mt-1">
                    Equivalente en Divisas: {formatUsd(changeUsd)}
                  </div>
                  {changeVes > 0 && (
                    <p className="text-[11px] text-white/80 mt-2">
                      💡 Puedes transferir este vuelto en bolívares por Pago Móvil o entregarlo en efectivo si tienes cambio.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-3xl sm:text-4xl font-mono font-black tabular-nums">
                    Faltan {formatUsd(remainingUsd)}
                  </div>
                  <div className="text-sm font-mono font-bold text-white/90 mt-1">
                    Faltan en Bolívares: {formatVes(remainingVes)}
                  </div>
                </div>
              )}

              {/* Total Summary Breakdown */}
              <div className="pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/20 p-2 rounded-lg">
                  <span className="text-white/70 text-[10px] block">Total de la Venta:</span>
                  <span className="font-mono font-bold text-white">{formatUsd(totalUsd)}</span>
                </div>
                <div className="bg-black/20 p-2 rounded-lg">
                  <span className="text-white/70 text-[10px] block">Total Abonado:</span>
                  <span className="font-mono font-bold text-white">{formatUsd(totalPaidInUsd)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Card: WhatsApp & Reset */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-3">
            <button
              onClick={handleShareWhatsApp}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar Recibo MS Morales por WhatsApp</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyReceipt}
                type="button"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                {copiedReceipt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
                <span>{copiedReceipt ? '¡Copiado!' : 'Copiar Recibo'}</span>
              </button>

              <button
                onClick={handleResetSale}
                type="button"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nueva Venta</span>
              </button>
            </div>
          </div>

          {/* Quick Payment info card for the store */}
          <div className="bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900 dark:text-white">Datos Rápidos del Comercio</span>
              <button
                type="button"
                onClick={handleCopyPagoMovil}
                className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] hover:underline"
              >
                Copiar
              </button>
            </div>
            <div className="space-y-1 text-neutral-600 dark:text-neutral-400">
              <p><strong>Comercio:</strong> {store.storeName}</p>
              <p><strong>Banco:</strong> {store.bankName}</p>
              <p><strong>Pago Móvil:</strong> {store.pagoMovilPhone} ({store.pagoMovilId})</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
