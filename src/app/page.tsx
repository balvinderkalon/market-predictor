import { SentimentGauge } from '@/components/sentiment-gauge';
import { MarketDashboard } from '@/components/market-dashboard';
import { NewsSection } from '@/components/news-section';
import { MarketBrief } from '@/components/market-brief';
import { LiveIndicator } from '@/components/live-indicator';

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Market Genius <span className="text-zinc-500 text-lg">V4</span></h1>
        <div className="flex items-center gap-3">
          <LiveIndicator />
          <div className="text-xs text-zinc-500">Live streaming</div>
        </div>
      </div>
      <MarketBrief />
      <SentimentGauge />
      <MarketDashboard />
      <NewsSection />
      <footer className="text-center text-xs text-zinc-600 py-4">Market Genius © {new Date().getFullYear()}</footer>
    </main>
  );
}
