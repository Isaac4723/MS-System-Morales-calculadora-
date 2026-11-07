import React, { useState, useEffect } from 'react';
import { ArrowUpDown, MessageCircle, Copy, Check, Calculator, Sparkles, Share2, Info } from 'lucide-react';
import { Currency, ExchangeRateData } from '../types';
import { formatUsd, formatVes, generateConversionMessage, parseFlexibleNumber } from '../utils/formatters';

interface CurrencyConverterProps {
  rateData: ExchangeRateData | null;
  effectiveRate: number;
  onOpenWhatsApp: (message: string) => void;
  onSaveToHistory: (fromAmount: number, fromCurrency: Currency, toAmount: number, toCurrency: Currency, rate: number) => void;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  rateData,
  effectiveRate,
  onOpenWhatsApp,
  onSaveToHistory,
}) => {
  const [amount, setAmount] = useState<string>('10');
  const [fromCurrency, setFromCurrency] = useState<Currency>('USD');
  const [toCurrency, setToCurrency] = useState<Currency>('VES');
  const [copied, setCopied] = useState<boolean>(false);
  const [customNote, setCustomNote] = useState<string>('');

  const numAmount = parseFlexibleNumber(amount);

  // Calculate conversion
  let convertedAmount = 0;
  if (fromCurrency === 'USD' && toCurrency === 'VES') {
    convertedAmount = numAmount * effectiveRate;
  } else if (fromCurrency === 'VES' && toCurrency === 'USD') {
    convertedAmount = effectiveRate > 0 ? numAmount / effectiveRate : 0;
  } else if (fromCurrency === 'EUR' && toCurrency === 'VES') {
    const eurRate = rateData?.eur || effectiveRate * 1.12;
    convertedAmount = numAmount * eurRate;
  } else if (fromCurrency === 'VES' && toCurrency === 'EUR') {
    const eurRate = rateData?.eur || effectiveRate * 1.12;
    convertedAmount = eurRate > 0 ? numAmount / eurRate : 0;
  } else if (fromCurrency === 'USD' && toCurrency === 'EUR') {
    const eurRate = rateData?.eur || effectiveRate * 1.12;
    convertedAmount = eurRate > 0 ? (numAmount * effectiveRate) / eurRate : 0;
  } else if (fromCurrency === 'EUR' && toCurrency === 'USD') {
    const eurRate = rateData?.eur || effectiveRate * 1.12;
    convertedAmount = effectiveRate > 0 ? (numAmount * eurRate) / effectiveRate : 0;
  } else {
    convertedAmount = numAmount;
  }

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleCopy = async () => {
    const message = generateConversionMessage(
      numAmount,
      fromCurrency,
      convertedAmount,
      toCurrency,
      effectiveRate,
      rateData?.lastUpdated,
      customNote
    );
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onSaveToHistory(numAmount, fromCurrency, convertedAmount, toCurrency, effectiveRate);
    } catch {
      // Fallback
    }
  };

  const handleShareWhatsApp = () => {
    const message = generateConversionMessage(
      numAmount,
      fromCurrency,
      convertedAmount,
      toCurrency,
      effectiveRate,
      rateData?.lastUpdated,
      customNote
    );
    onSaveToHistory(numAmount, fromCurrency, convertedAmount, toCurrency, effectiveRate);
    onOpenWhatsApp(message);
  };

  const usdPresets = [1, 5, 10, 20, 50, 100, 200];
  const vesPresets = [500, 1000, 2000, 5000, 10000, 20000];
  const currentPresets = fromCurrency === 'USD' ? usdPresets : vesPresets;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title & Introduction */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Conversor Oficial BCV
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Convierte bolívares a dólares y viceversa en tiempo real con la tasa oficial publicada por el Banco Central de Venezuela.
        </p>
      </div>

      {/* Main Converter Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* FROM Input Box */}
          <div className="md:col-span-5 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="amount-input" className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Tú entregas / Monto
              </label>
              <select
                aria-label="Moneda de origen"
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value as Currency)}
                className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs font-bold rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="USD">USD ($) Dólares</option>
                <option value="VES">VES (Bs.) Bolívares</option>
                <option value="EUR">EUR (€) Euros</option>
              </select>
            </div>

            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-neutral-400 dark:text-neutral-500">
                {fromCurrency === 'USD' ? '$' : fromCurrency === 'EUR' ? '€' : 'Bs.'}
              </span>
              <input
                id="amount-input"
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-3 py-2 text-2xl sm:text-3xl font-mono font-bold text-neutral-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 tabular-nums placeholder-neutral-300 dark:placeholder-neutral-700"
              />
            </div>

            {/* Quick Amount Presets */}
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60">
              <span className="text-[11px] text-neutral-400 self-center mr-1">Rápidos:</span>
              {currentPresets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="px-2 py-0.5 text-xs font-mono font-medium rounded bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors tabular-nums"
                >
                  {fromCurrency === 'USD' ? `$${val}` : `${val.toLocaleString()} Bs.`}
                </button>
              ))}
            </div>
          </div>

          {/* SWAP BUTTON */}
          <div className="md:col-span-1 flex justify-center">
            <button
              onClick={handleSwap}
              type="button"
              title="Invertir monedas"
              className="p-3 rounded-full bg-emerald-50 dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white border border-emerald-200 dark:border-neutral-700 transition-all shadow-xs"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>

          {/* TO Output Box */}
          <div className="md:col-span-5 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                Tú recibes / Total
              </span>
              <select
                aria-label="Moneda de destino"
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value as Currency)}
                className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs font-bold rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="VES">VES (Bs.) Bolívares</option>
                <option value="USD">USD ($) Dólares</option>
                <option value="EUR">EUR (€) Euros</option>
              </select>
            </div>

            <div className="mt-1">
              <span className="text-xs font-medium text-emerald-800 dark:text-emerald-400 block mb-0.5">
                Equivalente al cambio:
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-900 dark:text-emerald-300 tabular-nums break-words">
                {toCurrency === 'VES'
                  ? formatVes(convertedAmount)
                  : toCurrency === 'EUR'
                  ? `€ ${convertedAmount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : formatUsd(convertedAmount)}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/60 text-xs text-emerald-800/80 dark:text-emerald-400/80 flex items-center justify-between">
              <span>Tasa aplicada:</span>
              <span className="font-mono font-bold tabular-nums">
                1 USD = Bs. {effectiveRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
            </div>
          </div>
        </div>

        {/* Optional Note for Quote */}
        <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800">
          <label htmlFor="custom-note" className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
            Nota opcional para el cliente (ejemplo: &quot;Válido solo por hoy&quot;, &quot;Pago Móvil Banco Banesco&quot;):
          </label>
          <input
            id="custom-note"
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Ej: Aceptamos Pago Móvil, Zelle o Efectivo"
            className="w-full text-xs px-3.5 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Action Buttons: WhatsApp & Copy */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <button
            onClick={handleCopy}
            type="button"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600">¡Copiado al portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-neutral-500" />
                <span>Copiar Cotización</span>
              </>
            )}
          </button>

          <button
            onClick={handleShareWhatsApp}
            type="button"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar por WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Reference Card with Venezuelan Market Notes */}
      <div className="bg-neutral-100/70 dark:bg-neutral-900/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-neutral-900 dark:text-white">
              Cálculo transparente para comercios y consumidores en Venezuela
            </p>
            <p>
              La tasa oficial es provista por el Banco Central de Venezuela de acuerdo a la mesa de cambio interbancaria.
              Puedes compartir esta cotización por WhatsApp con tus clientes o proveedores para asegurar total claridad en el monto a pagar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
