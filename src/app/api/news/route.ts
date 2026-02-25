import { NextResponse } from 'next/server';
import { FMP_BASE, FMP_KEY } from '@/lib/constants';
import { getCache, setCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cached = getCache<any>('news', 10 * 60 * 1000);
    if (cached) return NextResponse.json(cached);

    const data = await fetch(`${FMP_BASE}/stock_news?limit=10&apikey=${FMP_KEY}`).then(r => r.json());
    const news = (data || []).map((n: any) => ({
      title: n.title,
      url: n.url,
      source: n.site,
      date: n.publishedDate,
      symbol: n.symbol,
      image: n.image,
    }));
    setCache('news', news);
    return NextResponse.json(news);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
