import React from 'react';
import { History, Trash2, ArrowRight, Share2, Copy, Check } from 'lucide-react';
import { ConversionHistoryItem } from '../types';
import { formatUsd, formatVes, formatBcvDate, generateConversionMessage } from '../utils/formatters';

interface ConversionHistoryProps {
  history: ConversionHistoryItem[];
  onClearHistory: () => void;
  onOpenWhatsApp: (message: string) => void;
  onSelectHistoryItem: (item: ConversionHistoryItem) => void;
}

export const ConversionHistory: React.FC<ConversionHistoryProps> = ({
  history,
  onClearHistory,
  onOpenWhatsApp,
  onSelectHistoryItem,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = async (item: ConversionHistoryItem) => {
    const text = generateConversionMessage(
      item.fromAmount,
      item.fromCurrency,
      item.toAmount,
      item.toCurrency,
      item.rateUsed,
      item.timestamp
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShare = (item: ConversionHistoryItem) => {
    const text = generateConversionMessage(
      item.fromAmount,
      item.fromCurrency,
      item.toAmount,
      item.toCurrency,
      item.rateUsed,
      item.timestamp
    );
    onOpenWhatsApp(text);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Historial de Cálculos
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Registro de conversiones y cotizaciones recientes guardadas en este dispositivo.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Borrar historial</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xs">
        {history.length === 0 ? (
          <div className="text-center py-12 px-4">
            <History className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Aún no hay cálculos guardados
            </p>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Al realizar conversiones o enviar cotizaciones por WhatsApp, aparecerán aquí para que puedas reutilizarlas rápidamente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {history.map((item) => (
              <div
                key={item.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 px-2 rounded-xl transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-mono font-bold text-neutral-900 dark:text-white tabular-nums">
                    <span>
                      {item.fromCurrency === 'USD' ? formatUsd(item.fromAmount) : formatVes(item.fromAmount)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {item.toCurrency === 'USD' ? formatUsd(item.toAmount) : formatVes(item.toAmount)}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                    <span>Tasa: Bs. {item.rateUsed.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                    <span>·</span>
                    <span>{formatBcvDate(item.timestamp)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => onSelectHistoryItem(item)}
                    type="button"
                    className="px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                  >
                    Cargar
                  </button>
                  <button
                    onClick={() => handleCopy(item)}
                    type="button"
                    className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-md transition-colors"
                    title="Copiar texto"
                  >
                    {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleShare(item)}
                    type="button"
                    className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-colors"
                    title="Enviar por WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
