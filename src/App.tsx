/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { BcvBanner } from './components/BcvBanner';
import { CommerceCalculator } from './components/CommerceCalculator';
import { CurrencyConverter } from './components/CurrencyConverter';
import { ProfitMarginCalculator } from './components/ProfitMarginCalculator';
import { QuoteBuilder } from './components/QuoteBuilder';
import { ConversionHistory } from './components/ConversionHistory';
import { WhatsAppModal } from './components/WhatsAppModal';
import { ManualRateModal } from './components/ManualRateModal';
import { BcvBulletinModal } from './components/BcvBulletinModal';
import { ExchangeRateData, Currency, QuoteItem, ConversionHistoryItem } from './types';

const INITIAL_BCV: ExchangeRateData = {
  usd: 899.2705,
  eur: 1006.6074,
  cny: 134.7787,
  try: 17.9298,
  rub: 10.8997,
  fechaValor: 'Martes, 10 Noviembre 2026',
  fechaIso: '2026-11-10T00:00:00-04:00',
  bulletinTime: 'Publicación oficial vespertina de cierre (16:00 - 17:30 VET)',
  officialUrl: 'https://www.bcv.org.ve/',
  bulletinUrl: 'https://www.bcv.org.ve/tasas-informativas-sistema-bancario',
  lastUpdated: new Date().toISOString(),
  source: 'Banco Central de Venezuela (BCV Oficial - bcv.org.ve)',
  status: 'live',
};


export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme_preference');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Navigation tab: Default to 'commerce' for MS Morales System Soluciones
  const [activeTab, setActiveTab] = useState<'commerce' | 'converter' | 'pricing' | 'quotes' | 'history'>('commerce');

  // Rates state
  const [rateData, setRateData] = useState<ExchangeRateData | null>(INITIAL_BCV);
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(false);
  const [customRate, setCustomRate] = useState<number | null>(() => {
    const saved = localStorage.getItem('custom_rate_override');
    return saved ? parseFloat(saved) : null;
  });
  const [spreadPercent, setSpreadPercent] = useState<number>(() => {
    const saved = localStorage.getItem('custom_spread_percent');
    return saved ? parseFloat(saved) : 0;
  });

  // Modals state
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState<boolean>(false);
  const [whatsAppMessage, setWhatsAppMessage] = useState<string>('');
  const [isManualRateOpen, setIsManualRateOpen] = useState<boolean>(false);
  const [isBulletinModalOpen, setIsBulletinModalOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);


  // Quotes and History state
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>(() => {
    try {
      const saved = localStorage.getItem('quote_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [historyItems, setHistoryItems] = useState<ConversionHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('conversion_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Apply dark mode class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme_preference', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme_preference', 'light');
    }
  }, [isDark]);

  // Save custom rate overrides
  useEffect(() => {
    if (customRate !== null) {
      localStorage.setItem('custom_rate_override', customRate.toString());
    } else {
      localStorage.removeItem('custom_rate_override');
    }
    localStorage.setItem('custom_spread_percent', spreadPercent.toString());
  }, [customRate, spreadPercent]);

  // Save quote items
  useEffect(() => {
    localStorage.setItem('quote_items', JSON.stringify(quoteItems));
  }, [quoteItems]);

  // Save history items
  useEffect(() => {
    localStorage.setItem('conversion_history', JSON.stringify(historyItems));
  }, [historyItems]);

  // Fetch real-time BCV rates from backend API with fallback
  const fetchRate = useCallback(async (forceRefresh = false) => {
    setIsLoadingRate(true);
    try {
      const res = await fetch(`/api/bcv${forceRefresh ? '?refresh=true' : ''}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.usd) {
          setRateData(json.data);
          setIsLoadingRate(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend /api/bcv failed, falling back to direct API:', err);
    }

    try {
      const direct = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      if (direct.ok) {
        const d = await direct.json();
        if (d?.promedio) {
          setRateData((prev) => ({
            usd: d.promedio,
            eur: prev?.eur || 1004.95,
            lastUpdated: d.fechaActualizacion || new Date().toISOString(),
            source: 'Banco Central de Venezuela (BCV Oficial)',
            status: 'live',
          }));
        }
      }
    } catch (directErr) {
      console.warn('Direct fetch failed, keeping active cached rate:', directErr);
    } finally {
      setIsLoadingRate(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();

    // Auto-sync with BCV every 3 minutes
    const interval = setInterval(() => {
      fetchRate();
    }, 3 * 60 * 1000);

    const handleFocus = () => fetchRate();
    const handleOnline = () => fetchRate(true);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchRate]);

  // Effective dollar rate in Bs.
  const baseRate = customRate !== null ? customRate : (rateData?.usd ?? 899.27);

  const effectiveRate = baseRate * (1 + (spreadPercent || 0) / 100);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const handleOpenWhatsApp = (message: string) => {
    setWhatsAppMessage(message);
    setIsWhatsAppOpen(true);
  };

  const handleSaveToHistory = (
    fromAmount: number,
    fromCurrency: Currency,
    toAmount: number,
    toCurrency: Currency,
    rate: number
  ) => {
    const newItem: ConversionHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      fromAmount,
      fromCurrency,
      toAmount,
      toCurrency,
      rateUsed: rate,
    };
    setHistoryItems((prev) => [newItem, ...prev.slice(0, 49)]);
  };

  const handleAddToQuote = (item: QuoteItem) => {
    setQuoteItems((prev) => [...prev, item]);
  };

  const handleSelectHistoryItem = (_item: ConversionHistoryItem) => {
    setActiveTab('converter');
  };

  const handleConfirmReset = () => {
    localStorage.removeItem('ms_morales_customer_debts');
    localStorage.removeItem('quote_items');
    localStorage.removeItem('conversion_history');
    localStorage.removeItem('ms_morales_store_info');
    localStorage.removeItem('custom_rate_override');
    localStorage.removeItem('custom_spread_percent');
    setQuoteItems([]);
    setHistoryItems([]);
    setCustomRate(null);
    setSpreadPercent(0);
    setIsResetConfirmOpen(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* 3-Zone Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
        rateData={rateData}
        isLoadingRate={isLoadingRate}
        onRefreshRate={() => fetchRate(true)}
        onOpenManualRate={() => setIsManualRateOpen(true)}
        onResetAllData={() => setIsResetConfirmOpen(true)}
        quotesCount={quoteItems.length}
      />

      {/* BCV Official Rate Banner */}
      <BcvBanner
        rateData={rateData}
        customRate={customRate}
        spreadPercent={spreadPercent}
        isLoading={isLoadingRate}
        onRefresh={() => fetchRate(true)}
        onOpenSettings={() => setIsManualRateOpen(true)}
        onOpenBulletin={() => setIsBulletinModalOpen(true)}
      />


      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'commerce' && (
          <CommerceCalculator
            rateData={rateData}
            effectiveRate={effectiveRate}
            onOpenWhatsApp={handleOpenWhatsApp}
          />
        )}

        {activeTab === 'pricing' && (
          <ProfitMarginCalculator
            rateData={rateData}
            effectiveRate={effectiveRate}
            onOpenWhatsApp={handleOpenWhatsApp}
            onAddToQuote={handleAddToQuote}
          />
        )}

        {activeTab === 'converter' && (
          <CurrencyConverter
            rateData={rateData}
            effectiveRate={effectiveRate}
            onOpenWhatsApp={handleOpenWhatsApp}
            onSaveToHistory={handleSaveToHistory}
          />
        )}

        {activeTab === 'quotes' && (
          <QuoteBuilder
            items={quoteItems}
            setItems={setQuoteItems}
            rateData={rateData}
            effectiveRate={effectiveRate}
            onOpenWhatsApp={handleOpenWhatsApp}
            onNavigateToPricing={() => setActiveTab('pricing')}
          />
        )}

        {activeTab === 'history' && (
          <ConversionHistory
            history={historyItems}
            onClearHistory={() => setHistoryItems([])}
            onOpenWhatsApp={handleOpenWhatsApp}
            onSelectHistoryItem={handleSelectHistoryItem}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-6 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-800 dark:text-neutral-200">MS Morales System Soluciones</span>
            <span>·</span>
            <span>Calculadora para Comercios & Tasa Oficial BCV</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Compatible con Pago Móvil, Biopago y Punto de Venta</span>
            <span>·</span>
            <span>Envío de recibos por WhatsApp</span>
          </div>
        </div>
      </footer>

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        initialMessage={whatsAppMessage}
      />

      {/* Manual Rate / Spread Adjustment Modal */}
      <ManualRateModal
        isOpen={isManualRateOpen}
        onClose={() => setIsManualRateOpen(false)}
        rateData={rateData}
        customRate={customRate}
        setCustomRate={setCustomRate}
        spreadPercent={spreadPercent}
        setSpreadPercent={setSpreadPercent}
      />

      {/* BCV Daily Bulletin Modal */}
      <BcvBulletinModal
        isOpen={isBulletinModalOpen}
        onClose={() => setIsBulletinModalOpen(false)}
        rateData={rateData}
        isLoading={isLoadingRate}
        onRefresh={() => fetchRate(true)}
        onOpenWhatsApp={handleOpenWhatsApp}
      />


      {/* Reset Local Data to Zero Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 max-w-md w-full shadow-xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              ¿Restablecer Base de Datos Local a Cero?
            </h3>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Esta acción borrará todas las cuentas por cobrar, abonos registrados, cotizaciones y configuraciones almacenadas en este navegador o dispositivo, dejándolo completamente en cero.
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
              💡 <strong>Privacidad e Independencia:</strong> Al publicar la aplicación, cada usuario que la use o instale en su teléfono, tablet o computadora tendrá su propia base de datos local independiente y vacía desde el primer día.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs"
              >
                Sí, Restablecer a Cero
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
