import { NextResponse } from 'next/server';
import { FMP_BASE, FMP_KEY } from '@/lib/constants';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cached = getCache<any>('sentiment', 10 * 60 * 1000);
    if (cached) return NextResponse.json(cached);

    // Fetch VIX quote
    let vix = 0;
    try {
      const vixData = await fetch(`${FMP_BASE}/quote/^VIX?apikey=${FMP_KEY}`).then(r => r.json());
      vix = vixData?.[0]?.price || 0;
    } catch {}

    // Fear & Greed approximation from VIX + SPY movement
    let fearGreed = 50;
    try {
      const spy = await fetch(`${FMP_BASE}/quote/SPY?apikey=${FMP_KEY}`).then(r => r.json());
      const spyChange = spy?.[0]?.changesPercentage || 0;
      // Simple heuristic: VIX < 15 = greedy, > 25 = fearful; SPY movement adjusts
      fearGreed = Math.max(0, Math.min(100, 50 - (vix - 20) * 2.5 + spyChange * 5));
    } catch {}

    const data = { vix: Math.round(vix * 100) / 100, fearGreed: Math.round(fearGreed) };
    setCache('sentiment', data);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
