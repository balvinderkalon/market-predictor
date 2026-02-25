'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const signalColors: Record<string, string> = {
  strong_buy: 'bg-green-600',
  buy: 'bg-green-500/80',
  neutral: 'bg-zinc-500',
  sell: 'bg-red-500/80',
  strong_sell: 'bg-red-600',
};

const signalLabels: Record<string, string> = {
  strong_buy: 'Strong Buy',
  buy: 'Buy',
  neutral: 'Neutral',
  sell: 'Sell',
  strong_sell: 'Strong Sell',
};

interface Props {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  rsi: number;
  signal: string;
  emaCross: string;
  sparkline: number[];
}

export function AssetCard({ symbol, price, change, changePct, rsi, signal, emaCross, sparkline }: Props) {
  const isUp = change >= 0;
  const chartData = sparkline.map((v, i) => ({ v, i }));
  const rsiColor = rsi > 70 ? 'text-red-400' : rsi < 30 ? 'text-green-400' : 'text-zinc-400';

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors">
      <CardHeader className="pb-1 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">{symbol}</CardTitle>
        <Badge className={`${signalColors[signal] || 'bg-zinc-500'} text-white text-xs`}>
          {signalLabels[signal] || signal}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold">${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className={`text-sm font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {isUp ? '+' : ''}{changePct.toFixed(2)}%
          </span>
        </div>
        {chartData.length > 1 && (
          <div className="h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line type="monotone" dataKey="v" stroke={isUp ? '#4ade80' : '#f87171'} dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex justify-between text-xs text-zinc-500">
          <span className={rsiColor}>RSI: {rsi}</span>
          <span className={emaCross === 'bullish' ? 'text-green-400' : 'text-red-400'}>
            EMA: {emaCross === 'bullish' ? '↑' : '↓'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
