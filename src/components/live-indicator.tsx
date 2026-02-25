'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function LiveIndicator() {
  const [connected, setConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let es: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout;

    const connect = () => {
      es = new EventSource('/api/stream');

      es.onopen = () => setConnected(true);

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'quotes' && parsed.data) {
            // Update TanStack Query cache with live data
            queryClient.setQueryData(['market'], (old: any) => {
              if (!old || !Array.isArray(old)) return old;
              return old.map((asset: any) => {
                const update = parsed.data.find((q: any) => q.symbol === asset.symbol);
                if (update) {
                  return { ...asset, price: update.price, change: update.change, changePct: update.changePct };
                }
                return asset;
              });
            });
          }
        } catch {}
      };

      es.onerror = () => {
        setConnected(false);
        es?.close();
        retryTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, [queryClient]);

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
      <span className={`text-xs font-medium ${connected ? 'text-green-400' : 'text-zinc-500'}`}>
        {connected ? 'LIVE' : 'OFFLINE'}
      </span>
    </div>
  );
}
