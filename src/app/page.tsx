import { SentimentGauge } from '@/components/sentiment-gauge';
import { MarketDashboard } from '@/components/market-dashboard';
import { NewsSection } from '@/components/news-section';

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Market Predictor <span className="text-zinc-500 text-lg">V3</span></h1>
        <div className="text-xs text-zinc-500">Auto-refreshes every 3 min</div>
      </div>
      <SentimentGauge />
      <MarketDashboard />
      <NewsSection />
    </main>
  );
}
