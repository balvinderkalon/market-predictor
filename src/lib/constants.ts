export const ASSETS = {
  stocks: ['TSLA', 'NVDA', 'PLTR', 'AMZN', 'AAPL', 'AMD', 'GOOGL', 'META', 'MSFT', 'HOOD', 'SNOW'],
  crypto: ['BTCUSD', 'ETHUSD', 'SOLUSD'],
  indices: ['SPY', 'QQQ'],
} as const;

export const ALL_ASSETS = [...ASSETS.indices, ...ASSETS.stocks, ...ASSETS.crypto];

export const FMP_BASE = 'https://financialmodelingprep.com/api/v3';
export const FMP_KEY = process.env.FMP_API_KEY || '';
