import React from 'react';
import { Building2, Clock, CheckCircle2, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { ExchangeRateData } from '../types';
import { formatBcvDate } from '../utils/formatters';

interface BcvBannerProps {
  rateData: ExchangeRateData | null;
  customRate: number | null;
  spreadPercent: number;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export const BcvBanner: React.FC<BcvBannerProps> = ({
  rateData,
  customRate,
  spreadPercent,
  isLoading,
  onRefresh,
  onOpenSettings,
}) => {
  const activeUsd = customRate !== null ? customRate : (rateData?.usd ?? 896.12);
  const activeWithSpread = activeUsd * (1 + (spreadPercent || 0) / 100);

  return (
    <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 py-3.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        {/* Left: BCV Exchange Rate presentation */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-neutral-600 dark:text-neutral-300">
          <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Banco Central de Venezuela (BCV)</span>
          </div>

          <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">|</span>

          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-neutral-500 dark:text-neutral-400">1 USD =</span>
            <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              Bs. {activeWithSpread.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
            {spreadPercent !== 0 && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                ({spreadPercent > 0 ? `+${spreadPercent}%` : `${spreadPercent}%`})
              </span>
            )}
            {customRate !== null && (
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                (Manual)
              </span>
            )}
          </div>

          {rateData?.eur && (
            <>
              <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">·</span>
              <div className="flex items-center gap-1.5 font-medium text-neutral-500 dark:text-neutral-400">
                <span>1 EUR =</span>
                <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-200 tabular-nums">
                  Bs. {rateData.eur.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
              </div>
            </>
          )}

          <span className="text-neutral-300 dark:text-neutral-700 hidden lg:inline">·</span>

          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Vigencia: {rateData ? formatBcvDate(rateData.lastUpdated) : 'Cargando...'}</span>
          </div>
        </div>

        {/* Right: Actions and Status */}
        <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Tasa Oficial Verificada</span>
          </div>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Ajustar Tasa</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
