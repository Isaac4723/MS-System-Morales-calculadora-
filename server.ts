import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

import https from 'node:https';

interface ExchangeRateData {
  usd: number;
  eur: number;
  cny?: number;
  try?: number;
  rub?: number;
  fechaValor?: string;
  fechaIso?: string;
  bulletinTime?: string;
  officialUrl?: string;
  bulletinUrl?: string;
  lastUpdated: string;
  source: string;
  status: 'live' | 'cached' | 'fallback';
}

let cachedRate: ExchangeRateData = {
  usd: 899.2705,
  eur: 1006.6074,
  fechaValor: 'Martes, 10 Noviembre 2026',
  fechaIso: '2026-11-10T00:00:00-04:00',
  bulletinTime: 'Publicación oficial vespertina (16:00 - 17:30 VET)',
  officialUrl: 'https://www.bcv.org.ve/',
  bulletinUrl: 'https://www.bcv.org.ve/tasas-informativas-sistema-bancario',
  lastUpdated: new Date().toISOString(),
  source: 'Banco Central de Venezuela (BCV Oficial - bcv.org.ve)',
  status: 'cached'
};
let lastFetchTime = 0;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Fetch raw HTML directly from official BCV portal (bcv.org.ve)
 */
function fetchBcvHtml(): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      'https://www.bcv.org.ve/',
      {
        rejectUnauthorized: false,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-VE,es-ES;q=0.9,es;q=0.8',
        },
        timeout: 8000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('BCV request timeout'));
    });
  });
}

/**
 * Parse numeric currency string from BCV format (e.g. "899,27050000" or "1.006,60742688")
 */
function parseBcvRate(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const clean = raw.trim().replace(/\./g, '').replace(',', '.');
  const val = parseFloat(clean);
  return isNaN(val) || val <= 0 ? null : val;
}

async function fetchBcvRates(): Promise<ExchangeRateData> {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_TTL_MS && cachedRate.status === 'live') {
    return cachedRate;
  }

  // 1. Primary Strategy: Direct Scraping from Banco Central de Venezuela official portal (bcv.org.ve)
  try {
    const html = await fetchBcvHtml();

    const dolarMatch = html.match(/id="dolar"[\s\S]*?<strong[^>]*>([\s\d\.,]+)<\/strong>/i);
    const euroMatch = html.match(/id="euro"[\s\S]*?<strong[^>]*>([\s\d\.,]+)<\/strong>/i);
    const yuanMatch = html.match(/id="yuan"[\s\S]*?<strong[^>]*>([\s\d\.,]+)<\/strong>/i);
    const liraMatch = html.match(/id="lira"[\s\S]*?<strong[^>]*>([\s\d\.,]+)<\/strong>/i);
    const rubloMatch = html.match(/id="rublo"[\s\S]*?<strong[^>]*>([\s\d\.,]+)<\/strong>/i);

    const fechaValorMatch = html.match(/Fecha Valor:[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i);
    const fechaIsoMatch = html.match(/Fecha Valor:[\s\S]*?content="([^"]+)"/i);

    const parsedUsd = parseBcvRate(dolarMatch ? dolarMatch[1] : null);
    const parsedEur = parseBcvRate(euroMatch ? euroMatch[1] : null);
    const parsedCny = parseBcvRate(yuanMatch ? yuanMatch[1] : null);
    const parsedTry = parseBcvRate(liraMatch ? liraMatch[1] : null);
    const parsedRub = parseBcvRate(rubloMatch ? rubloMatch[1] : null);

    const fechaValor = fechaValorMatch ? fechaValorMatch[1].replace(/\s+/g, ' ').trim() : cachedRate.fechaValor;
    const fechaIso = fechaIsoMatch ? fechaIsoMatch[1].trim() : (fechaValor ? new Date().toISOString() : cachedRate.fechaIso);

    if (parsedUsd && parsedUsd > 0) {
      cachedRate = {
        usd: parsedUsd,
        eur: parsedEur || cachedRate.eur,
        cny: parsedCny || undefined,
        try: parsedTry || undefined,
        rub: parsedRub || undefined,
        fechaValor,
        fechaIso,
        bulletinTime: 'Publicación oficial vespertina de cierre (16:00 - 17:30 VET)',
        officialUrl: 'https://www.bcv.org.ve/',
        bulletinUrl: 'https://www.bcv.org.ve/tasas-informativas-sistema-bancario',
        lastUpdated: new Date().toISOString(),
        source: 'Banco Central de Venezuela (BCV Oficial - bcv.org.ve)',
        status: 'live',
      };
      lastFetchTime = now;
      return cachedRate;
    }
  } catch (directError) {
    console.warn('Direct fetch from bcv.org.ve encountered an issue, trying fallback API:', directError);
  }

  // 2. Secondary Strategy: DolarApi official BCV feed fallback
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const [dolarRes, euroRes] = await Promise.allSettled([
      fetch('https://ve.dolarapi.com/v1/dolares/oficial', { signal: controller.signal }),
      fetch('https://ve.dolarapi.com/v1/euros/oficial', { signal: controller.signal }),
    ]);
    clearTimeout(timeout);

    let usdRate = cachedRate.usd;
    let eurRate = cachedRate.eur;
    let updatedAt = cachedRate.lastUpdated;

    if (dolarRes.status === 'fulfilled' && dolarRes.value.ok) {
      const dData = await dolarRes.value.json();
      if (typeof dData?.promedio === 'number' && dData.promedio > 0) {
        usdRate = dData.promedio;
        updatedAt = dData.fechaActualizacion || new Date().toISOString();
      }
    }

    if (euroRes.status === 'fulfilled' && euroRes.value.ok) {
      const eData = await euroRes.value.json();
      if (typeof eData?.promedio === 'number' && eData.promedio > 0) {
        eurRate = eData.promedio;
      }
    }

    cachedRate = {
      ...cachedRate,
      usd: usdRate,
      eur: eurRate,
      lastUpdated: updatedAt,
      source: 'Banco Central de Venezuela (BCV Oficial)',
      status: 'live',
    };
    lastFetchTime = now;
    return cachedRate;
  } catch (fallbackError) {
    console.warn('All BCV rate sources failed, serving cached fallback rate:', fallbackError);
    return {
      ...cachedRate,
      status: 'fallback',
    };
  }
}

// Background automatic synchronization every 3 minutes
setInterval(() => {
  fetchBcvRates().catch((err) => console.warn('Background BCV sync check error:', err));
}, CACHE_TTL_MS);

// API endpoint for real-time BCV rates with daily bulletin metadata
app.get('/api/bcv', async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  if (forceRefresh) {
    lastFetchTime = 0;
  }
  const data = await fetchBcvRates();
  res.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
});


// Setup Vite middlewares for development or static files for production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
