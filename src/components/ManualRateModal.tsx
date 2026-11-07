import React, { useState } from 'react';
import { X, RotateCcw, Check, SlidersHorizontal, Info } from 'lucide-react';
import { ExchangeRateData } from '../types';

interface ManualRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateData: ExchangeRateData | null;
  customRate: number | null;
  setCustomRate: (rate: number | null) => void;
  spreadPercent: number;
  setSpreadPercent: (spread: number) => void;
}

export const ManualRateModal: React.FC<ManualRateModalProps> = ({
  isOpen,
  onClose,
  rateData,
  customRate,
  setCustomRate,
  spreadPercent,
  setSpreadPercent,
}) => {
  const officialBcv = rateData?.usd ?? 896.12;
  const [inputRate, setInputRate] = useState<string>(
    customRate !== null ? customRate.toString() : officialBcv.toString()
  );
  const [localSpread, setLocalSpread] = useState<number>(spreadPercent);
  const [useCustom, setUseCustom] = useState<boolean>(customRate !== null);

  if (!isOpen) return null;

  const handleSave = () => {
    if (useCustom) {
      const val = parseFloat(inputRate.replace(/,/g, '')) || officialBcv;
      setCustomRate(val);
    } else {
      setCustomRate(null);
    }
    setSpreadPercent(localSpread);
    onClose();
  };

  const handleResetToOfficial = () => {
    setUseCustom(false);
    setInputRate(officialBcv.toString());
    setLocalSpread(0);
    setCustomRate(null);
    setSpreadPercent(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-md shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Ajustar Tasa de Cambio
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Official Rate reminder */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
            <span className="text-emerald-900 dark:text-emerald-300 font-medium">Tasa Oficial BCV:</span>
            <span className="font-mono font-bold text-emerald-950 dark:text-emerald-200 text-sm tabular-nums">
              Bs. {officialBcv.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          </div>

          {/* Toggle Custom Rate */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustom}
                onChange={(e) => setUseCustom(e.target.checked)}
                className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                Personalizar tasa fija manualmente
              </span>
            </label>

            {useCustom && (
              <div className="pl-6 pt-1">
                <label className="block text-[11px] text-neutral-500 mb-1">
                  Ingresa el valor en Bs. por cada 1 USD:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-neutral-400">Bs.</span>
                  <input
                    type="number"
                    step="any"
                    value={inputRate}
                    onChange={(e) => setInputRate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 font-mono font-bold text-sm rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Spread / Porcentaje de ajuste */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                Recargo adicional por comisión o riesgo:
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {localSpread > 0 ? `+${localSpread}%` : `${localSpread}%`}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Útil si aplicas un porcentaje por costo de intermediación o reposición bancaria.
            </p>
            <div className="flex gap-1.5 pt-1">
              {[0, 1.5, 2, 3, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setLocalSpread(val)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors ${
                    localSpread === val
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  +{val}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToOfficial}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer BCV Oficial</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              Aplicar Tasa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
