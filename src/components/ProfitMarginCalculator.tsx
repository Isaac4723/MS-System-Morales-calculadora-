import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Percent,
  DollarSign,
  MessageCircle,
  Copy,
  Check,
  PlusCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calculator,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PricingSettings, PricingResult, ExchangeRateData, QuoteItem } from '../types';
import { calculateProductPricing, formatUsd, formatVes, generateProductQuoteMessage, parseFlexibleNumber } from '../utils/formatters';

interface ProfitMarginCalculatorProps {
  rateData: ExchangeRateData | null;
  effectiveRate: number;
  onOpenWhatsApp: (message: string) => void;
  onAddToQuote: (item: QuoteItem) => void;
}

export const ProfitMarginCalculator: React.FC<ProfitMarginCalculatorProps> = ({
  rateData,
  effectiveRate,
  onOpenWhatsApp,
  onAddToQuote,
}) => {
  const [productName, setProductName] = useState<string>('');
  const [cost, setCost] = useState<string>('50');
  const [costCurrency, setCostCurrency] = useState<'USD' | 'VES'>('USD');
  const [marginPercent, setMarginPercent] = useState<number>(30);
  const [applyIva, setApplyIva] = useState<boolean>(false);
  const [ivaPercent, setIvaPercent] = useState<number>(16);
  const [applyPaymentFee, setApplyPaymentFee] = useState<boolean>(false);
  const [paymentFeePercent, setPaymentFeePercent] = useState<number>(2.5);
  const [extraCostUsd, setExtraCostUsd] = useState<string>('0');
  const [clientNote, setClientNote] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [addedToQuote, setAddedToQuote] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const parsedCost = parseFlexibleNumber(cost);
  const parsedExtraCost = parseFlexibleNumber(extraCostUsd);

  const settings: PricingSettings = useMemo(() => ({
    productName,
    cost: parsedCost,
    costCurrency,
    marginPercent,
    applyIva,
    ivaPercent,
    applyPaymentFee,
    paymentFeePercent,
    extraCostUsd: parsedExtraCost,
  }), [
    productName,
    parsedCost,
    costCurrency,
    marginPercent,
    applyIva,
    ivaPercent,
    applyPaymentFee,
    paymentFeePercent,
    parsedExtraCost,
  ]);

  const result: PricingResult = useMemo(() => {
    return calculateProductPricing(settings, effectiveRate);
  }, [settings, effectiveRate]);

  const handleCopy = async () => {
    const message = generateProductQuoteMessage(
      productName,
      result,
      effectiveRate,
      rateData?.lastUpdated,
      applyIva || applyPaymentFee,
      clientNote
    );
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShareWhatsApp = () => {
    const message = generateProductQuoteMessage(
      productName,
      result,
      effectiveRate,
      rateData?.lastUpdated,
      applyIva || applyPaymentFee,
      clientNote
    );
    onOpenWhatsApp(message);
  };

  const handleAddQuoteItem = () => {
    const item: QuoteItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productName: productName.trim() || 'Producto sin nombre',
      quantity: 1,
      unitPriceUsd: result.finalPriceUsd,
      unitPriceVes: result.finalPriceVes,
      totalUsd: result.finalPriceUsd,
      totalVes: result.finalPriceVes,
    };
    onAddToQuote(item);
    setAddedToQuote(true);
    setTimeout(() => setAddedToQuote(false), 2000);
  };

  const quickMargins = [15, 20, 25, 30, 35, 40, 50, 60];
  const scaleQuantities = [1, 3, 6, 12, 24, 50];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            MS Morales System Soluciones
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-0.5">
          Fijador de Precios & Margen de Ganancia
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Ingresa el costo original de tu producto y determina automáticamente el precio de venta en dólares y bolívares al cambio oficial BCV, asegurando tu margen de ganancia comercial.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-7 shadow-xs space-y-5">
            {/* Product Name */}
            <div>
              <label htmlFor="product-name-input" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Nombre o Descripción del Producto (Opcional)
              </label>
              <input
                id="product-name-input"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ej: Repuesto automotriz / Aceite / Batería / Servicio"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Costo Original */}
            <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="original-cost-input" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Costo Original del Producto
                </label>
                <div className="flex items-center bg-white dark:bg-neutral-800 rounded-lg p-0.5 border border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={() => setCostCurrency('USD')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                      costCurrency === 'USD'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCostCurrency('VES')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                      costCurrency === 'VES'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
                    }`}
                  >
                    VES (Bs.)
                  </button>
                </div>
              </div>

              <div className="relative mt-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-neutral-400">
                  {costCurrency === 'USD' ? '$' : 'Bs.'}
                </span>
                <input
                  id="original-cost-input"
                  type="number"
                  step="any"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-11 pr-3 py-2 text-2xl font-mono font-bold text-neutral-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-0 tabular-nums"
                />
              </div>

              <div className="mt-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>Equivalente al cambio BCV:</span>
                <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                  {costCurrency === 'USD'
                    ? formatVes(result.costVes)
                    : formatUsd(result.costUsd)}
                </span>
              </div>
            </div>

            {/* Margen de Ganancia */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="desired-margin-input" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Margen de Ganancia Comercial
                </label>
                <div className="flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-lg tabular-nums">
                  <input
                    id="desired-margin-input"
                    type="number"
                    min="1"
                    max="99"
                    value={marginPercent}
                    onChange={(e) => setMarginPercent(parseFloat(e.target.value) || 0)}
                    className="w-16 text-right px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white text-base font-bold"
                  />
                  <span>%</span>
                </div>
              </div>

              {/* Slider */}
              <input
                aria-label="Margen de ganancia porcentaje"
                type="range"
                min="5"
                max="80"
                step="1"
                value={marginPercent}
                onChange={(e) => setMarginPercent(parseFloat(e.target.value) || 0)}
                className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {quickMargins.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setMarginPercent(p)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      marginPercent === p
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2">
                Con un <strong>{marginPercent}%</strong> de margen, exactamente el {marginPercent}% del total cobrado en la venta es tu ganancia neta.
              </p>
            </div>

            {/* Optional Taxes & Overheads (IVA, Payment commissions, Extra cost) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-xs font-semibold text-neutral-600 dark:text-neutral-300 py-2 border-t border-neutral-200 dark:border-neutral-800"
              >
                <span>Costos adicionales, IVA (16%) y comisiones de cobro</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="mt-3 p-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3.5">
                  {/* IVA Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                        Aplicar IVA ({ivaPercent}%)
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Se añade al precio final de venta al público
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyIva}
                        onChange={(e) => setApplyIva(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Payment Fee / Commission Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
                    <div>
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                        Comisión por Punto de Venta / Pago Móvil ({paymentFeePercent}%)
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Comisión bancaria absorbida en el precio
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyPaymentFee}
                        onChange={(e) => setApplyPaymentFee(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Extra Cost (Flete / Empaque) */}
                  <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between gap-4">
                    <label htmlFor="extra-logistics-cost" className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      Costo adicional por unidad (Flete / Empaque en USD):
                    </label>
                    <div className="w-24">
                      <input
                        id="extra-logistics-cost"
                        type="number"
                        min="0"
                        step="0.5"
                        value={extraCostUsd}
                        onChange={(e) => setExtraCostUsd(e.target.value)}
                        className="w-full text-xs font-mono px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Results & Commercial Outputs (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Price Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div>
                <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider block">
                  Precio de Venta Sugerido al Público
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-mono font-black tabular-nums">
                    {formatUsd(result.finalPriceUsd)}
                  </span>
                  <span className="text-emerald-200 text-xs font-semibold">USD</span>
                </div>
              </div>

              {/* Price in Bolívares */}
              <div className="pt-3 border-t border-white/20">
                <span className="text-xs text-emerald-100 font-medium block">
                  Equivalente en Bolívares (Tasa Oficial BCV):
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-black text-white tabular-nums mt-0.5">
                  {formatVes(result.finalPriceVes)}
                </div>
                <div className="text-[11px] text-emerald-200/80 mt-1">
                  1 USD = Bs. {effectiveRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </div>
              </div>

              {/* Profit Breakdown */}
              <div className="pt-3 border-t border-white/20 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-black/15 p-2.5 rounded-lg">
                  <span className="text-emerald-200 text-[11px] block">Ganancia Neta ($):</span>
                  <span className="font-mono font-bold text-base text-white tabular-nums">
                    +{formatUsd(result.netProfitUsd)}
                  </span>
                </div>
                <div className="bg-black/15 p-2.5 rounded-lg">
                  <span className="text-emerald-200 text-[11px] block">Ganancia Neta (Bs.):</span>
                  <span className="font-mono font-bold text-base text-white tabular-nums">
                    +{formatVes(result.netProfitVes)}
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex items-center justify-between text-xs text-emerald-100 pt-1">
                <span>Margen de ganancia real: <strong className="text-white font-mono">{result.effectiveMarginPercent.toFixed(1)}%</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons: WhatsApp, Add to Quote, Copy */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs space-y-3">
            <div>
              <label htmlFor="quote-note-input" className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Nota o condición comercial para WhatsApp:
              </label>
              <input
                id="quote-note-input"
                type="text"
                value={clientNote}
                onChange={(e) => setClientNote(e.target.value)}
                placeholder="Ej: Pago Móvil, entrega inmediata en tienda"
                className="w-full text-xs px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>

            <button
              onClick={handleShareWhatsApp}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar Precio por WhatsApp</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopy}
                type="button"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>

              <button
                onClick={handleAddQuoteItem}
                type="button"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold transition-colors"
              >
                {addedToQuote ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <PlusCircle className="w-3.5 h-3.5" />}
                <span>{addedToQuote ? '¡Agregado!' : '+ Presupuesto'}</span>
              </button>
            </div>
          </div>

          {/* Volume / Scaling Price Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-3">
              Escala de Precios por Cantidad / Mayor
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-medium">
                    <th className="text-left pb-2">Cant.</th>
                    <th className="text-right pb-2">Total ($)</th>
                    <th className="text-right pb-2">Total (Bs.)</th>
                    <th className="text-right pb-2">Ganancia ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
                  {scaleQuantities.map((qty) => {
                    const totalUsd = result.finalPriceUsd * qty;
                    const totalVes = result.finalPriceVes * qty;
                    const totalProfitUsd = result.netProfitUsd * qty;
                    return (
                      <tr key={qty} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-2 font-bold text-neutral-800 dark:text-neutral-200">{qty} {qty === 1 ? 'ud.' : 'uds.'}</td>
                        <td className="py-2 text-right text-neutral-900 dark:text-white tabular-nums">{formatUsd(totalUsd)}</td>
                        <td className="py-2 text-right text-emerald-600 dark:text-emerald-400 tabular-nums">{formatVes(totalVes)}</td>
                        <td className="py-2 text-right text-neutral-500 dark:text-neutral-400 tabular-nums">+{formatUsd(totalProfitUsd)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
