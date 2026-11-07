import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

interface ExchangeRateData {
  usd: number;
  eur: number;
  lastUpdated: string;
  source: string;
  status: 'live' | 'cached' | 'fallback';
}

let cachedRate: ExchangeRateData = {
  usd: 896.1225,
  eur: 1004.9565,
  lastUpdated: new Date().toISOString(),
  source: 'Banco Central de Venezuela (BCV Oficial)',
  status: 'cached'
};
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchBcvRates(): Promise<ExchangeRateData> {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_TTL_MS && cachedRate.status === 'live') {
    return cachedRate;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const [dolarRes, euroRes] = await Promise.allSettled([
      fetch('https://ve.dolarapi.com/v1/dolares/oficial', { signal: controller.signal }),
      fetch('https://ve.dolarapi.com/v1/euros/oficial', { signal: controller.signal })
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
      usd: usdRate,
      eur: eurRate,
      lastUpdated: updatedAt,
      source: 'Banco Central de Venezuela (BCV Oficial)',
      status: 'live'
    };
    lastFetchTime = now;
    return cachedRate;
  } catch (error) {
    console.warn('Error fetching BCV rates, using cached/fallback rate:', error);
    return {
      ...cachedRate,
      status: 'fallback'
    };
  }
}

// API endpoint for real-time BCV rates
app.get('/api/bcv', async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  if (forceRefresh) {
    lastFetchTime = 0;
  }
  const data = await fetchBcvRates();
  res.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
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
