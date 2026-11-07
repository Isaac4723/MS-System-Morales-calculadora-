import React, { useState } from 'react';
import { Trash2, Plus, MessageCircle, Copy, Check, FileText, ArrowRight } from 'lucide-react';
import { QuoteItem, ExchangeRateData } from '../types';
import { formatUsd, formatVes, formatBcvDate, parseFlexibleNumber } from '../utils/formatters';

interface QuoteBuilderProps {
  items: QuoteItem[];
  setItems: React.Dispatch<React.SetStateAction<QuoteItem[]>>;
  rateData: ExchangeRateData | null;
  effectiveRate: number;
  onOpenWhatsApp: (message: string) => void;
  onNavigateToPricing: () => void;
}

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({
  items,
  setItems,
  rateData,
  effectiveRate,
  onOpenWhatsApp,
  onNavigateToPricing,
}) => {
  const [clientName, setClientName] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('Pago Móvil, Zelle o Efectivo');
  const [copied, setCopied] = useState<boolean>(false);

  // Manual new item addition
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemPriceUsd, setNewItemPriceUsd] = useState<string>('');

  const totalUsd = items.reduce((acc, item) => acc + item.totalUsd, 0);
  const totalVes = items.reduce((acc, item) => acc + item.totalVes, 0);

  const handleUpdateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((it) => {
          if (it.id === id) {
            const newQty = Math.max(1, it.quantity + delta);
            return {
              ...it,
              quantity: newQty,
              totalUsd: it.unitPriceUsd * newQty,
              totalVes: it.unitPriceVes * newQty,
            };
          }
          return it;
        })
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFlexibleNumber(newItemPriceUsd);
    if (!newItemName.trim() || price <= 0) return;

    const newItem: QuoteItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productName: newItemName.trim(),
      quantity: 1,
      unitPriceUsd: price,
      unitPriceVes: price * effectiveRate,
      totalUsd: price,
      totalVes: price * effectiveRate,
    };

    setItems((prev) => [...prev, newItem]);
    setNewItemName('');
    setNewItemPriceUsd('');
  };

  const generateBudgetWhatsAppText = () => {
    const dateStr = rateData ? formatBcvDate(rateData.lastUpdated) : new Date().toLocaleDateString('es-VE');
    let text = `*MS MORALES SYSTEM SOLUCIONES*\n`;
    text += `*PRESUPUESTO COMERCIAL*\n`;
    if (clientName.trim()) {
      text += `👤 *Cliente:* ${clientName.trim()}\n`;
    }
    text += `📅 *Fecha:* ${new Date().toLocaleDateString('es-VE')}\n\n`;

    text += `📋 *PRODUCTOS / SERVICIOS:*\n`;
    items.forEach((item, index) => {
      text += `${index + 1}. *${item.productName}*\n`;
      text += `   • Cant: ${item.quantity} x ${formatUsd(item.unitPriceUsd)} (${formatVes(item.unitPriceVes)})\n`;
      text += `   • Subtotal: ${formatUsd(item.totalUsd)} / ${formatVes(item.totalVes)}\n`;
    });

    text += `\n─────────────────────\n`;
    text += `💵 *TOTAL USD:* ${formatUsd(totalUsd)}\n`;
    text += `🇻🇪 *TOTAL BOLÍVARES (BCV):* ${formatVes(totalVes)}\n`;
    text += `─────────────────────\n`;

    text += `\n🏦 *Tasa Oficial BCV aplicable:* Bs. ${effectiveRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / USD\n`;
    text += `📅 *Vigencia de Tasa:* ${dateStr}\n`;

    if (paymentTerms.trim()) {
      text += `\n💳 *Formas de pago aceptadas:* ${paymentTerms.trim()}\n`;
    }

    text += `\n_Para pagos en Bs. vía Pago Móvil o Transferencia bancaria, favor confirmar tasa antes de transferir._`;
    return text;
  };

  const handleShareWhatsApp = () => {
    const text = generateBudgetWhatsAppText();
    onOpenWhatsApp(text);
  };

  const handleCopy = async () => {
    const text = generateBudgetWhatsAppText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Cotizador & Presupuesto Multidivisa
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Arma presupuestos con varios productos, calcula totales en dólares y bolívares a tasa oficial BCV, y envíalos formalmente por WhatsApp.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xs space-y-6">
        {/* Client details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="client-name" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Nombre del Cliente (Opcional):
            </label>
            <input
              id="client-name"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ej: Juan Pérez / Taller Auto Centro"
              className="w-full text-xs px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="payment-terms" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Condiciones de Pago:
            </label>
            <input
              id="payment-terms"
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="Ej: Pago Móvil Banesco / Zelle / Efectivo"
              className="w-full text-xs px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Quick add product row */}
        <form onSubmit={handleAddManualItem} className="p-3.5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Añadir ítem rápido (ej: Mano de obra, Aceite 20W50)..."
            className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
          />
          <div className="w-full sm:w-32 relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">$</span>
            <input
              type="number"
              step="any"
              min="0"
              value={newItemPriceUsd}
              onChange={(e) => setNewItemPriceUsd(e.target.value)}
              placeholder="Precio USD"
              className="w-full pl-6 pr-2 py-1.5 text-xs font-mono rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </form>

        {/* Items Table */}
        {items.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
            <FileText className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              No hay productos en el presupuesto
            </p>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Puedes calcular productos en la pestaña de <strong>Precio & Margen</strong> y agregarlos con un clic, o escribir un ítem arriba.
            </p>
            <button
              onClick={onNavigateToPricing}
              type="button"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>Ir al Calculador de Precios y Margen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="text-left pb-2.5">Producto</th>
                  <th className="text-center pb-2.5 w-24">Cant.</th>
                  <th className="text-right pb-2.5">Precio Unit. ($)</th>
                  <th className="text-right pb-2.5">Total ($)</th>
                  <th className="text-right pb-2.5">Total (Bs.)</th>
                  <th className="text-center pb-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 font-sans font-semibold text-neutral-900 dark:text-white">
                      {item.productName}
                    </td>
                    <td className="py-3 text-center">
                      <div className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-md p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-neutral-900 dark:text-white tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-right text-neutral-600 dark:text-neutral-300 tabular-nums">
                      {formatUsd(item.unitPriceUsd)}
                    </td>
                    <td className="py-3 text-right font-bold text-neutral-900 dark:text-white tabular-nums">
                      {formatUsd(item.totalUsd)}
                    </td>
                    <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatVes(item.totalVes)}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        title="Eliminar producto"
                        className="p-1 text-neutral-400 hover:text-red-500 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals Section */}
        {items.length > 0 && (
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => setItems([])}
              type="button"
              className="text-xs text-neutral-400 hover:text-red-600 transition-colors"
            >
              Vaciar presupuesto
            </button>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[11px] text-neutral-400 block font-medium">TOTAL EN DÓLARES:</span>
                <span className="text-2xl font-mono font-black text-neutral-900 dark:text-white tabular-nums">
                  {formatUsd(totalUsd)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">TOTAL EN BOLÍVARES (BCV):</span>
                <span className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatVes(totalVes)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {items.length > 0 && (
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              onClick={handleCopy}
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-neutral-400" />}
              <span>{copied ? '¡Presupuesto Copiado!' : 'Copiar Texto Formal'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              type="button"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar Presupuesto por WhatsApp</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
