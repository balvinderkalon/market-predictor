'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export function NewsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: () => fetch('/api/news').then(r => r.json()),
  });

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-lg">Latest Market News</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)
        ) : (
          data?.slice?.(0, 8)?.map?.((n: any, i: number) => (
            <div key={i}>
              <a href={n.url} target="_blank" rel="noopener noreferrer" className="group block">
                <div className="flex items-start gap-2">
                  {n.symbol && <Badge variant="outline" className="text-xs shrink-0 mt-0.5">{n.symbol}</Badge>}
                  <div>
                    <p className="text-sm text-zinc-200 group-hover:text-white transition-colors leading-tight">{n.title}</p>
                    <p className="text-xs text-zinc-500 mt-1">{n.source} • {new Date(n.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </a>
              {i < 7 && <Separator className="mt-3 bg-zinc-800" />}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
