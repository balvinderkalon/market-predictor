'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function MarketBrief() {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-summary'],
    queryFn: () => fetch('/api/ai-summary').then(r => r.json()),
    refetchInterval: 5 * 60_000,
  });

  if (isLoading) return <Skeleton className="h-32" />;
  if (!data?.summary) return null;

  return (
    <Card className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 border-zinc-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
          <span className="text-lg">🧠</span> Market Brief
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-zinc-200 leading-relaxed">{data.summary}</p>
        <div className="flex gap-2 flex-wrap">
          {data.topMovers?.map((m: any) => (
            <Badge key={m.symbol} variant="outline" className="text-green-400 border-green-800 text-xs">
              {m.symbol} {m.changePct > 0 ? '+' : ''}{m.changePct?.toFixed(2)}%
            </Badge>
          ))}
          {data.bottomMovers?.filter((m: any) => m.changePct < 0).map((m: any) => (
            <Badge key={m.symbol} variant="outline" className="text-red-400 border-red-800 text-xs">
              {m.symbol} {m.changePct?.toFixed(2)}%
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
