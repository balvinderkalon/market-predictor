'use client';

import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { ASSETS } from '@/lib/constants';
import { AssetCard } from './asset-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export function MarketDashboard() {
  const { filter, setFilter } = useAppStore();
  const { data, isLoading } = useQuery({
    queryKey: ['market'],
    queryFn: () => fetch('/api/market').then(r => r.json()),
  });

  const filtered = data?.filter?.((a: any) => {
    if (filter === 'all') return true;
    if (filter === 'stocks') return ASSETS.stocks.includes(a.symbol);
    if (filter === 'crypto') return ASSETS.crypto.includes(a.symbol);
    if (filter === 'indices') return ASSETS.indices.includes(a.symbol);
    return true;
  }) || [];

  // Overall sentiment from signals
  const sentimentScore = data?.reduce?.((acc: number, a: any) => {
    if (a.signal === 'strong_buy') return acc + 2;
    if (a.signal === 'buy') return acc + 1;
    if (a.signal === 'sell') return acc - 1;
    if (a.signal === 'strong_sell') return acc - 2;
    return acc;
  }, 0) || 0;
  const maxScore = (data?.length || 1) * 2;
  const sentimentPct = Math.round(((sentimentScore + maxScore) / (maxScore * 2)) * 100);
  const sentimentLabel = sentimentPct >= 65 ? 'Bullish' : sentimentPct >= 45 ? 'Neutral' : 'Bearish';
  const sentimentColor = sentimentPct >= 65 ? 'text-green-400' : sentimentPct >= 45 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="space-y-6">
      {/* Overall market sentiment */}
      {!isLoading && data && (
        <div className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="text-sm text-zinc-400">Market Sentiment</div>
          <div className={`text-2xl font-bold ${sentimentColor}`}>{sentimentLabel}</div>
          <div className="flex-1 bg-zinc-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${sentimentPct >= 65 ? 'bg-green-500' : sentimentPct >= 45 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${sentimentPct}%` }}
            />
          </div>
          <div className="text-sm text-zinc-500">{sentimentPct}%</div>
        </div>
      )}

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
          <TabsTrigger value="indices">Indices</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((a: any) => (
            <AssetCard key={a.symbol} {...a} />
          ))}
        </div>
      )}
    </div>
  );
}
