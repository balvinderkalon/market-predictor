import { NextResponse } from 'next/server';
import { ALL_ASSETS, FMP_BASE, FMP_KEY } from '@/lib/constants';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

function generateSummary(quotes: any[]): string {
  if (!quotes?.length) return 'Market data temporarily unavailable.';

  const sorted = [...quotes].sort((a, b) => (b.changesPercentage || 0) - (a.changesPercentage || 0));
  const topGainer = sorted[0];
  const topLoser = sorted[sorted.length - 1];

  const avgChange = quotes.reduce((s, q) => s + (q.changesPercentage || 0), 0) / quotes.length;
  const marketTrend = avgChange > 0.5 ? 'bullish' : avgChange < -0.5 ? 'bearish' : 'mixed';

  const upCount = quotes.filter(q => (q.changesPercentage || 0) > 0).length;
  const breadth = upCount / quotes.length;

  let brief = '';

  if (marketTrend === 'bullish') {
    brief = `Markets are trading higher with broad-based strength — ${upCount} of ${quotes.length} tracked assets in the green. `;
  } else if (marketTrend === 'bearish') {
    brief = `Markets are under pressure today with ${quotes.length - upCount} of ${quotes.length} assets declining. `;
  } else {
    brief = `Markets are showing mixed signals with ${upCount} gainers and ${quotes.length - upCount} decliners among tracked assets. `;
  }

  if (topGainer) {
    brief += `${topGainer.symbol} leads the pack at ${topGainer.changesPercentage > 0 ? '+' : ''}${topGainer.changesPercentage?.toFixed(2)}%. `;
  }
  if (topLoser && topLoser.changesPercentage < 0) {
    brief += `${topLoser.symbol} is the weakest link at ${topLoser.changesPercentage?.toFixed(2)}%. `;
  }

  if (breadth > 0.7) {
    brief += 'Overall market breadth is strong — risk appetite looks healthy.';
  } else if (breadth < 0.3) {
    brief += 'Broad weakness suggests caution — consider defensive positioning.';
  } else {
    brief += 'Selective opportunities exist — focus on relative strength leaders.';
  }

  return brief;
}

export async function GET() {
  try {
    const cached = getCache<any>('ai-summary');
    if (cached) return NextResponse.json(cached);

    const symbols = ALL_ASSETS.join(',');
    const quotes = await fetch(`${FMP_BASE}/quote/${symbols}?apikey=${FMP_KEY}`, { cache: 'no-store' }).then(r => r.json());

    const summary = generateSummary(quotes);
    const sorted = [...quotes].sort((a: any, b: any) => (b.changesPercentage || 0) - (a.changesPercentage || 0));

    const result = {
      summary,
      topMovers: sorted.slice(0, 3).map((q: any) => ({ symbol: q.symbol, changePct: q.changesPercentage })),
      bottomMovers: sorted.slice(-3).reverse().map((q: any) => ({ symbol: q.symbol, changePct: q.changesPercentage })),
      ts: Date.now(),
    };

    setCache('ai-summary', result);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
