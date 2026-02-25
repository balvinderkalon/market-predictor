import { ALL_ASSETS, FMP_BASE, FMP_KEY } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const fetchQuotes = async () => {
        try {
          const symbols = ALL_ASSETS.join(',');
          const res = await fetch(`${FMP_BASE}/quote/${symbols}?apikey=${FMP_KEY}`, { cache: 'no-store' });
          if (!res.ok) return;
          const quotes = await res.json();
          send({
            type: 'quotes',
            data: quotes.map((q: Record<string, unknown>) => ({
              symbol: q.symbol,
              price: q.price,
              change: q.change,
              changePct: q.changesPercentage,
            })),
            ts: Date.now(),
          });
        } catch {
          // silently skip
        }
      };

      // Send initial data
      await fetchQuotes();

      // Send updates every 10 seconds (max ~30 iterations = 5 min then close)
      let count = 0;
      const interval = setInterval(async () => {
        count++;
        if (count > 30) {
          clearInterval(interval);
          controller.close();
          return;
        }
        await fetchQuotes();
      }, 10_000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
