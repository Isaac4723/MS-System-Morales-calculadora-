import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PWA_INSTALLED_STORAGE_KEY = 'ms_morales_pwa_installed_device';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(PWA_INSTALLED_STORAGE_KEY) === 'true';
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    return stored || isStandalone;
  });
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed or running as standalone app)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const stored = localStorage.getItem(PWA_INSTALLED_STORAGE_KEY) === 'true';

    if (isStandalone || stored) {
      setIsInstalled(true);
      if (isStandalone && !stored) {
        localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
      }
    }

    // Detect iOS devices (iPhone, iPad, iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      // If already recorded as installed on this device, do not activate prompt
      if (localStorage.getItem(PWA_INSTALLED_STORAGE_KEY) === 'true') {
        return;
      }
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const markAsInstalled = () => {
    setIsInstalled(true);
    localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
    setDeferredPrompt(null);
  };

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !isInstalled && !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
    markAsInstalled,
  };
}
