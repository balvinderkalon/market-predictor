'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

export function SentimentGauge() {
  const { data, isLoading } = useQuery({
    queryKey: ['sentiment'],
    queryFn: () => fetch('/api/sentiment').then(r => r.json()),
  });

  if (isLoading) return <div className="grid grid-cols-2 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;

  const fg = data?.fearGreed || 50;
  const vix = data?.vix || 0;
  const fgLabel = fg >= 75 ? 'Extreme Greed' : fg >= 55 ? 'Greed' : fg >= 45 ? 'Neutral' : fg >= 25 ? 'Fear' : 'Extreme Fear';
  const fgColor = fg >= 55 ? 'text-green-400' : fg >= 45 ? 'text-yellow-400' : 'text-red-400';
  const vixColor = vix < 15 ? 'text-green-400' : vix < 25 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400">Fear & Greed Index</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${fgColor}`}>{fg}</div>
          <div className={`text-sm ${fgColor}`}>{fgLabel}</div>
          <Progress value={fg} className="mt-3 h-2" />
        </CardContent>
      </Card>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400">VIX (Volatility Index)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${vixColor}`}>{vix}</div>
          <div className="text-sm text-zinc-500">{vix < 15 ? 'Low volatility' : vix < 25 ? 'Moderate' : 'High volatility'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
