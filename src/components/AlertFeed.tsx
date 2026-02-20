'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { AlertCircle, TrendingUp, Handshake, Users, UserCheck, MoreHorizontal, ExternalLink, RefreshCw } from 'lucide-react';

interface NewsItem {
  id: number;
  company_id: string;
  company_name: string;
  company_slug: string;
  title: string;
  url: string | null;
  source: string | null;
  published_at: string | null;
  ai_summary: string | null;
  ai_category: string | null;
  ai_significance: string | null;
  ai_implications: string | null;
}

interface AlertFeedProps {
  news: NewsItem[];
  maxHeight?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const significanceStyles = {
  high: 'bg-red-500/10 text-red-400 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
};

const categoryIcons = {
  funding: TrendingUp,
  product: AlertCircle,
  partnership: Handshake,
  hiring: Users,
  executive: UserCheck,
  other: MoreHorizontal
};

const categoryStyles = {
  funding: 'text-emerald-400',
  product: 'text-blue-400',
  partnership: 'text-purple-400',
  hiring: 'text-amber-400',
  executive: 'text-cyan-400',
  other: 'text-slate-400'
};

export function AlertFeed({ news, maxHeight = '600px', onRefresh, isRefreshing }: AlertFeedProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            Live Intelligence Feed
          </CardTitle>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Refreshing...' : 'Refresh News'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ height: maxHeight }}>
          <div className="space-y-1 p-4 pt-0">
            {news.map((item) => {
              const CategoryIcon = categoryIcons[item.ai_category as keyof typeof categoryIcons] || MoreHorizontal;
              const significance = item.ai_significance || 'low';
              const category = item.ai_category || 'other';
              const hasValidUrl = item.url && !item.url.includes('example.com');

              return (
                <div
                  key={item.id}
                  className={cn(
                    'p-4 rounded-lg border transition-colors hover:bg-muted/50',
                    significance === 'high' ? 'border-red-500/30 bg-red-500/5' : 'border-border'
                  )}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className={cn('w-4 h-4', categoryStyles[category as keyof typeof categoryStyles])} />
                      <Link
                        href={`/company/${item.company_slug}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {item.company_name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={cn('text-xs capitalize', significanceStyles[significance as keyof typeof significanceStyles])}
                      >
                        {significance}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize text-muted-foreground">
                        {category}
                      </Badge>
                    </div>
                  </div>

                  {hasValidUrl ? (
                    <a
                      href={item.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium mb-2 line-clamp-2 hover:text-primary transition-colors flex items-start gap-1 group"
                    >
                      {item.title}
                      <ExternalLink className="w-3 h-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </a>
                  ) : (
                    <h4 className="font-medium mb-2 line-clamp-2">{item.title}</h4>
                  )}

                  {item.ai_summary && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {item.ai_summary}
                    </p>
                  )}

                  {item.ai_implications && significance === 'high' && (
                    <div className="text-sm text-amber-400/80 bg-amber-500/10 p-2 rounded border border-amber-500/20 mb-2">
                      <span className="font-medium">Implication:</span> {item.ai_implications}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    {item.source && <span>{item.source}</span>}
                    {item.published_at && (
                      <span>
                        {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
