import { NextResponse } from 'next/server';
import { ALL_ASSETS, FMP_BASE, FMP_KEY } from '@/lib/constants';
import { rsi, macd, bollingerBands, emaCrossover, overallSignal, sma, ema } from '@/lib/indicators';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

interface AssetData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  rsi: number;
  macd: { macd: number; signal: number; histogram: number };
  bollinger: { upper: number; middle: number; lower: number };
  emaCross: string;
  signal: string;
  sma20: number;
  ema9: number;
  sparkline: number[];
}

async function fetchFMP(url: string) {
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`FMP error: ${res.status}`);
  return res.json();
}

export async function GET() {
  try {
    const cached = getCache<AssetData[]>('market-data', 3 * 60 * 1000);
    if (cached) return NextResponse.json(cached);

    // Fetch quotes
    const symbols = ALL_ASSETS.join(',');
    const quotes = await fetchFMP(`${FMP_BASE}/quote/${symbols}?apikey=${FMP_KEY}`);
    const quoteMap = new Map(quotes.map((q: any) => [q.symbol, q]));

    // Fetch historical for each asset (last 60 days for indicators)
    const results: AssetData[] = await Promise.all(
      ALL_ASSETS.map(async (sym) => {
        const q: any = quoteMap.get(sym) || {};
        let closes: number[] = [];
        let sparkline: number[] = [];
        try {
          const hist = await fetchFMP(
            `${FMP_BASE}/historical-price-full/${sym}?timeseries=60&apikey=${FMP_KEY}`
          );
          const prices = (hist.historical || []).reverse();
          closes = prices.map((p: any) => p.close);
          sparkline = closes.slice(-20);
        } catch { /* use empty */ }

        const rsiVal = closes.length > 14 ? rsi(closes) : 50;
        const macdVal = closes.length > 26 ? macd(closes) : { macd: 0, signal: 0, histogram: 0 };
        const bbVal = closes.length > 20 ? bollingerBands(closes) : { upper: 0, middle: 0, lower: 0 };
        const cross = emaCrossover(closes);
        const smaVals = closes.length > 20 ? sma(closes, 20) : [];
        const emaVals = closes.length > 9 ? ema(closes, 9) : [];

        return {
          symbol: sym,
          name: q.name || sym,
          price: q.price || 0,
          change: q.change || 0,
          changePct: q.changesPercentage || 0,
          rsi: Math.round(rsiVal * 100) / 100,
          macd: macdVal,
          bollinger: bbVal,
          emaCross: cross,
          signal: overallSignal(rsiVal, macdVal.histogram, cross),
          sma20: smaVals.length ? smaVals[smaVals.length - 1] : 0,
          ema9: emaVals.length ? emaVals[emaVals.length - 1] : 0,
          sparkline,
        };
      })
    );

    setCache('market-data', results);
    return NextResponse.json(results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
