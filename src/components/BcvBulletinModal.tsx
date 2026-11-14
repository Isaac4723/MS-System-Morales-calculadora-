import React from 'react';
import {
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  RefreshCw,
  MessageCircle,
  X,
  CheckCircle2,
  Info,
  ShieldCheck,
  TrendingUp,
  Globe
} from 'lucide-react';
import { ExchangeRateData } from '../types';
import { generateBcvBulletinMessage } from '../utils/formatters';

interface BcvBulletinModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateData: ExchangeRateData | null;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenWhatsApp: (message: string) => void;
}

export const BcvBulletinModal: React.FC<BcvBulletinModalProps> = ({
  isOpen,
  onClose,
  rateData,
  isLoading,
  onRefresh,
  onOpenWhatsApp,
}) => {
  if (!isOpen || !rateData) return null;

  const handleShare = () => {
    const message = generateBcvBulletinMessage(rateData);
    onOpenWhatsApp(message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 text-white flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Enlace Oficial Directo
                </span>
                <span className="text-xs text-neutral-400">bcv.org.ve</span>
              </div>
              <h3 className="text-base font-black text-white">
                Boletín Oficial Diario de Tipos de Cambio
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Status & Live Sync Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs">
                  Sincronizado con el Portal del Banco Central de Venezuela
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
                Los datos son extraídos directamente del portal oficial (<strong>www.bcv.org.ve</strong>) con actualización automática cada 3 minutos. Cada día hábil, el BCV emite su boletín fijando la tasa de cambio con su respectiva <strong>Fecha Valor</strong>.
              </p>
            </div>
          </div>

          {/* Official Currencies Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Cotizaciones Oficiales de las Mesas de Cambio (BCV):
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                100% Oficial
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* USD */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border-2 border-emerald-500/40 dark:border-emerald-500/50 space-y-1 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-700 dark:text-neutral-300 text-xs flex items-center gap-1.5">
                    💵 Dólar USA (USD)
                  </span>
                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Divisa Principal
                  </span>
                </div>
                <div className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  Bs. {rateData.usd.toLocaleString('es-VE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                </div>
                <span className="text-[10px] text-neutral-400 block">
                  Promedio ponderado de las mesas bancarias
                </span>
              </div>

              {/* EUR */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-700 dark:text-neutral-300 text-xs flex items-center gap-1.5">
                    💶 Euro (EUR)
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400">
                    Europa
                  </span>
                </div>
                <div className="text-2xl font-mono font-black text-neutral-900 dark:text-white tabular-nums">
                  Bs. {rateData.eur.toLocaleString('es-VE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                </div>
                <span className="text-[10px] text-neutral-400 block">
                  Tipo de cambio de referencia europeo
                </span>
              </div>
            </div>

            {/* Other Reference Currencies if available */}
            {(rateData.cny || rateData.try || rateData.rub) && (
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                {rateData.cny && (
                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block">Yuan (CNY)</span>
                    <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 text-xs tabular-nums">
                      Bs. {rateData.cny.toLocaleString('es-VE', { minimumFractionDigits: 4 })}
                    </span>
                  </div>
                )}
                {rateData.try && (
                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block">Lira (TRY)</span>
                    <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 text-xs tabular-nums">
                      Bs. {rateData.try.toLocaleString('es-VE', { minimumFractionDigits: 4 })}
                    </span>
                  </div>
                )}
                {rateData.rub && (
                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                    <span className="text-[10px] text-neutral-400 block">Rublo (RUB)</span>
                    <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 text-xs tabular-nums">
                      Bs. {rateData.rub.toLocaleString('es-VE', { minimumFractionDigits: 4 })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bulletin Metadata Breakdown (Fecha Valor & Hora de Publicación) */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
            <h4 className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Vigencia Oficial del Boletín & Horario BCV</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Fecha Valor */}
              <div className="space-y-0.5">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                  Fecha Valor Oficial (Vigencia Legal):
                </span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white block font-mono">
                  {rateData.fechaValor || 'Fecha vigente del día'}
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  Rige para operaciones y facturación en todo el país.
                </span>
              </div>

              {/* Hora de Publicación */}
              <div className="space-y-0.5">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                  Horario de Emisión del Boletín:
                </span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white block font-mono">
                  16:00 - 17:30 VET
                </span>
                <span className="text-[10px] text-neutral-500 block">
                  Lunes a Viernes al cierre de las mesas de cambio bancarias.
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 flex flex-wrap items-center justify-between text-[11px] text-neutral-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Última lectura en vivo: {new Date(rateData.lastUpdated).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </span>
              <span>Actualización automática cada 3 minutos</span>
            </div>
          </div>

          {/* Official Verification Links on BCV Portal */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block">
              Enlaces Directos para Cotejar en el Portal del BCV:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="https://www.bcv.org.ve/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-xs">Página Principal BCV</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              </a>

              <a
                href="https://www.bcv.org.ve/tasas-informativas-sistema-bancario"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-xs">Tasas del Sistema Bancario</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isLoading ? 'Consultando BCV...' : 'Sincronizar BCV Ahora'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs text-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Compartir Boletín por WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
