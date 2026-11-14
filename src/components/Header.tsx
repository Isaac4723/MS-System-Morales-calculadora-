import React from 'react';
import { RefreshCw, Sun, Moon, Sliders, ArrowLeftRight, TrendingUp, Store, FileText, History, RotateCcw } from 'lucide-react';
import { ExchangeRateData } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: 'converter' | 'pricing' | 'commerce' | 'quotes' | 'history';
  setActiveTab: (tab: 'converter' | 'pricing' | 'commerce' | 'quotes' | 'history') => void;
  isDark: boolean;
  toggleTheme: () => void;
  rateData: ExchangeRateData | null;
  isLoadingRate: boolean;
  onRefreshRate: () => void;
  onOpenManualRate: () => void;
  onResetAllData?: () => void;
  quotesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  toggleTheme,
  rateData,
  isLoadingRate,
  onRefreshRate,
  onOpenManualRate,
  onResetAllData,
  quotesCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black shadow-sm">
              <span className="text-sm tracking-tight">MS</span>
            </div>
            <div>
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap block">
                MS Morales System Soluciones
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block -mt-1 font-semibold">
                Calculadora para Comercios & Tasa BCV
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links / Segmented Tabs */}
          <nav className="hidden lg:flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <button
              onClick={() => setActiveTab('commerce')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                activeTab === 'commerce'
                  ? 'bg-white dark:bg-neutral-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Comercios & CxC</span>
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                activeTab === 'pricing'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Precio & Margen</span>
            </button>
            <button
              onClick={() => setActiveTab('converter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                activeTab === 'converter'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Conversor BCV</span>
            </button>
            <button
              onClick={() => setActiveTab('quotes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap relative ${
                activeTab === 'quotes'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Presupuesto</span>
              {quotesCount > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded text-[10px] font-bold">
                  {quotesCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historial</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action & Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick BCV Rate indicator */}
            {rateData && (
              <button
                onClick={onOpenManualRate}
                title="Configurar o calibrar tasa oficial"
                className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-xs text-neutral-700 dark:text-neutral-200"
              >
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">BCV USD:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  Bs. {rateData.usd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
                <Sliders className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            )}

            {/* Refresh button */}
            <button
              onClick={onRefreshRate}
              disabled={isLoadingRate}
              title="Actualizar tasa desde BCV en tiempo real"
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingRate ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Reset Data to zero button */}
            {onResetAllData && (
              <button
                onClick={onResetAllData}
                type="button"
                title="Limpiar y restablecer base de datos local a cero"
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex items-center justify-around py-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
          <button
            onClick={() => setActiveTab('commerce')}
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold transition-colors ${
              activeTab === 'commerce'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <Store className="w-4 h-4 mb-0.5" />
            <span>Comercios & CxC</span>
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-colors ${
              activeTab === 'pricing'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <TrendingUp className="w-4 h-4 mb-0.5" />
            <span>Margen</span>
          </button>
          <button
            onClick={() => setActiveTab('converter')}
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-colors ${
              activeTab === 'converter'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 mb-0.5" />
            <span>Conversor</span>
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-colors relative ${
              activeTab === 'quotes'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <FileText className="w-4 h-4 mb-0.5" />
            <span>Presupuesto</span>
            {quotesCount > 0 && (
              <span className="absolute top-0 right-1 w-2 h-2 bg-emerald-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition-colors ${
              activeTab === 'history'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <History className="w-4 h-4 mb-0.5" />
            <span>Historial</span>
          </button>
        </div>
      </div>
    </header>
  );
};
