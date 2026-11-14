import React from 'react';
import {
  Building2,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
  FileSpreadsheet,
  Globe,
  Calendar
} from 'lucide-react';
import { ExchangeRateData } from '../types';
import { formatBcvDate } from '../utils/formatters';

interface BcvBannerProps {
  rateData: ExchangeRateData | null;
  customRate: number | null;
  spreadPercent: number;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenBulletin: () => void;
}

export const BcvBanner: React.FC<BcvBannerProps> = ({
  rateData,
  customRate,
  spreadPercent,
  isLoading,
  onRefresh,
  onOpenSettings,
  onOpenBulletin,
}) => {
  const activeUsd = customRate !== null ? customRate : (rateData?.usd ?? 899.27);
  const activeWithSpread = activeUsd * (1 + (spreadPercent || 0) / 100);

  return (
    <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 text-xs">
        {/* Left: BCV Exchange Rate presentation & Fecha Valor */}
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 text-neutral-600 dark:text-neutral-300">
          <div className="flex items-center gap-2 font-black text-neutral-900 dark:text-white">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="tracking-tight">Banco Central de Venezuela (BCV)</span>
          </div>

          <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">|</span>

          {/* Dólar */}
          <div className="flex items-center gap-1.5 font-medium bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg">
            <span className="text-neutral-500 dark:text-neutral-400 font-bold">USD:</span>
            <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              Bs. {activeWithSpread.toLocaleString('es-VE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </span>
            {spreadPercent !== 0 && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                ({spreadPercent > 0 ? `+${spreadPercent}%` : `${spreadPercent}%`})
              </span>
            )}
            {customRate !== null && (
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                (Manual)
              </span>
            )}
          </div>

          {/* Euro */}
          {rateData?.eur && (
            <div className="flex items-center gap-1.5 font-medium bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg">
              <span className="text-neutral-500 dark:text-neutral-400 font-bold">EUR:</span>
              <span className="font-mono text-sm font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">
                Bs. {rateData.eur.toLocaleString('es-VE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
              </span>
            </div>
          )}

          <span className="text-neutral-300 dark:text-neutral-700 hidden lg:inline">·</span>

          {/* Fecha Valor Oficial */}
          <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-medium bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {rateData?.fechaValor ? (
                <>
                  <strong className="font-bold">Fecha Valor:</strong> {rateData.fechaValor}
                </>
              ) : (
                <>
                  <strong className="font-bold">Vigencia:</strong> {rateData ? formatBcvDate(rateData.lastUpdated) : 'Cargando...'}
                </>
              )}
            </span>
          </div>

          <span className="text-[10px] text-neutral-400 hidden xl:inline">
            (Boletín vespertino 16:00 - 17:30 VET)
          </span>
        </div>

        {/* Right: Actions, Official BCV Links & Modals */}
        <div className="flex flex-wrap items-center gap-2 self-stretch xl:self-auto justify-end shrink-0">
          {/* Official BCV External Link */}
          <a
            href="https://www.bcv.org.ve/"
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir página oficial del Banco Central de Venezuela en una nueva pestaña"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Enlace BCV.org.ve</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          {/* View Daily Bulletin Modal Button */}
          <button
            type="button"
            onClick={onOpenBulletin}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
            title="Ver detalle del boletín oficial emitido por el BCV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ver Boletín Oficial</span>
          </button>

          {/* Custom Rate Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Calibrar o ajustar margen sobre la tasa"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span className="hidden sm:inline">Ajustar Tasa</span>
          </button>

          {/* Refresh BCV */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            title="Sincronizar tasa oficial en tiempo real desde el BCV"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isLoading ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
