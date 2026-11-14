import React, { useState } from 'react';
import { Download, Check, X, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'banner' | 'modal';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install, markAsInstalled } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already installed or saved for this device, do not activate or show button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  const handleDoneInstalled = () => {
    markAsInstalled();
    setShowGuide(false);
  };

  if (variant === 'banner') {
    return (
      <>
        <div className="bg-emerald-700 dark:bg-emerald-950 text-white p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-emerald-500/30 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-xs font-bold">
                Instalar MS Morales en tu Computadora, Tablet o Celular
              </p>
              <p className="text-[11px] text-emerald-100/80">
                Funciona de forma 100% independiente. Una vez instalada, este botón se desactiva permanentemente en este dispositivo.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleInstallClick}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-emerald-900 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar / Instalar App</span>
            </button>
          </div>
        </div>

        {/* Modal Guide */}
        {showGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 max-w-md w-full shadow-xl space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Instalar en este Dispositivo
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isIOS ? (
                <div className="space-y-2 text-neutral-600 dark:text-neutral-300">
                  <p className="font-semibold text-neutral-900 dark:text-white">Para iPhone / iPad (Safari):</p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-xs">
                    <li>Presiona el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba <Share className="w-3.5 h-3.5 inline text-blue-500" />) en la barra inferior de Safari.</li>
                    <li>Baja en las opciones y selecciona <strong>&quot;Agregar a pantalla de inicio&quot;</strong>.</li>
                    <li>Presiona <strong>&quot;Agregar&quot;</strong> arriba a la derecha.</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-2 text-neutral-600 dark:text-neutral-300">
                  <p className="font-semibold text-neutral-900 dark:text-white">Para Computadora o Android (Chrome / Edge):</p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-xs">
                    <li>En Chrome / Edge en tu PC o laptop, busca el icono de <strong>Instalar</strong> <Download className="w-3.5 h-3.5 inline text-emerald-600" /> en la barra de direcciones (a la derecha de la URL).</li>
                    <li>O haz clic en los <strong>3 puntos del menú del navegador</strong> &gt; <strong>&quot;Instalar MS Morales System Soluciones&quot;</strong>.</li>
                    <li>La app se descargará como un programa nativo independiente en tu escritorio o pantalla de inicio.</li>
                  </ol>
                </div>
              )}

              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                🔒 <strong>Privacidad y Guardado:</strong> Al instalarla en este dispositivo, la aplicación queda guardada localmente y este aviso se desactivará permanentemente.
              </p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleDoneInstalled}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Ya la instalé en este dispositivo (No volver a mostrar)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="w-full py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Header compact button
  return (
    <>
      <button
        onClick={handleInstallClick}
        type="button"
        title="Descargar e instalar en tu celular, tablet o computadora"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Descargar App</span>
      </button>

      {/* Modal Guide */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 max-w-md w-full shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Instalar en tu Computadora, Tablet o Celular
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-2 text-neutral-600 dark:text-neutral-300">
                <p className="font-semibold text-neutral-900 dark:text-white">Para iPhone / iPad (Safari):</p>
                <ol className="list-decimal pl-4 space-y-1.5 text-xs">
                  <li>Toca el botón <strong>Compartir</strong> (cuadrado con flecha <Share className="w-3.5 h-3.5 inline text-blue-500" />).</li>
                  <li>Selecciona <strong>&quot;Agregar a pantalla de inicio&quot;</strong>.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2 text-neutral-600 dark:text-neutral-300">
                <p className="font-semibold text-neutral-900 dark:text-white">Para Computadora (PC / Mac) o Android:</p>
                <ol className="list-decimal pl-4 space-y-1.5 text-xs">
                  <li>Haz clic en el icono de <strong>Instalar</strong> en la barra de direcciones o menú del navegador (3 puntos).</li>
                  <li>Elige <strong>&quot;Instalar aplicación&quot;</strong>.</li>
                  <li>Se abrirá como una ventana de programa propia sin barra de navegador.</li>
                </ol>
              </div>
            )}

            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
              🔒 <strong>Guardado en este dispositivo:</strong> Al instalar la app, queda guardada en tu teléfono, PC o tablet y este botón no volverá a activarse ni mostrarse.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleDoneInstalled}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Ya la instalé en este dispositivo (No volver a mostrar)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
