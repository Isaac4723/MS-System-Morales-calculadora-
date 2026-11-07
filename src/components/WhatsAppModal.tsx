import React, { useState, useEffect } from 'react';
import { X, Send, Copy, Check, MessageSquare, Phone, ExternalLink } from 'lucide-react';
import { buildWhatsAppUrl, formatWhatsAppPhone } from '../utils/formatters';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage: string;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  initialMessage,
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('58');
  const [editableMessage, setEditableMessage] = useState<string>(initialMessage);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    setEditableMessage(initialMessage);
  }, [initialMessage]);

  if (!isOpen) return null;

  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
  };

  const fullPhoneToDial = () => {
    const raw = phoneNumber.trim();
    if (!raw) return '';
    // If user already typed with country code or Venezuelan 04XX
    return formatWhatsAppPhone(raw.startsWith('+') ? raw : (raw.startsWith('0') ? raw : `${countryCode}${raw}`));
  };

  const phoneToDial = fullPhoneToDial();
  const whatsappUrl = buildWhatsAppUrl(phoneToDial, editableMessage);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Enviar por WhatsApp
              </h3>
              <p className="text-[11px] text-neutral-500">
                Comparte la cotización con cualquier cliente o contacto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Phone number field */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Número de Teléfono del Destinatario (Opcional):
            </label>
            <div className="flex items-center gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-xl px-2.5 py-2 text-xs font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="58">🇻🇪 +58 (Venezuela)</option>
                <option value="1">🇺🇸 +1 (USA / Canadá)</option>
                <option value="57">🇨🇴 +57 (Colombia)</option>
                <option value="34">🇪🇸 +34 (España)</option>
                <option value="56">🇨🇱 +56 (Chile)</option>
                <option value="51">🇵🇪 +51 (Perú)</option>
                <option value="507">🇵🇦 +507 (Panamá)</option>
              </select>
              <div className="relative flex-1">
                <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="0414 1234567 o déjalo vacío para elegir chat"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
              Si lo dejas en blanco, WhatsApp te permitirá seleccionar cualquier contacto o grupo al abrir.
            </p>
          </div>

          {/* Editable message preview (WhatsApp Bubble style) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Vista Previa y Edición del Mensaje:
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado' : 'Copiar texto'}</span>
              </button>
            </div>

            <div className="bg-[#efeae2] dark:bg-[#0b141a] p-3.5 rounded-xl border border-neutral-300 dark:border-neutral-800 relative">
              <div className="bg-white dark:bg-[#1f2c34] p-3 rounded-lg shadow-xs text-neutral-900 dark:text-neutral-100 text-xs">
                <textarea
                  rows={9}
                  value={editableMessage}
                  onChange={(e) => setEditableMessage(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-xs leading-relaxed font-sans focus:outline-none focus:ring-0 resize-none whitespace-pre-wrap selection:bg-emerald-500/30"
                />
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 text-right mt-1 flex items-center justify-end gap-1">
                  <span>Ahora</span>
                  <span className="text-emerald-500 font-bold">✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition-all shadow-sm flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Abrir en WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
