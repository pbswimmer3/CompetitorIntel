'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

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

interface HighPriorityAlertsProps {
  news: NewsItem[];
}

const categoryStyles: Record<string, string> = {
  funding: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  product: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  partnership: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  hiring: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  executive: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  other: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export function HighPriorityAlerts({ news }: HighPriorityAlertsProps) {
  const highPriorityItems = news.filter(
    (item) => item.ai_significance === 'high'
  );

  if (highPriorityItems.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border border-red-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          High Priority Alerts
          <Badge variant="outline" className="ml-auto text-xs bg-red-500/10 text-red-400 border-red-500/20">
            {highPriorityItems.length} alert{highPriorityItems.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {highPriorityItems.map((item) => {
          const category = item.ai_category || 'other';
          const hasValidUrl = item.url && !item.url.includes('example.com');

          return (
            <div
              key={item.id}
              className="p-4 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <Link
                  href={`/company/${item.company_slug}`}
                  className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                >
                  {item.company_name}
                </Link>
                <Badge
                  variant="outline"
                  className={cn('text-xs capitalize flex-shrink-0', categoryStyles[category])}
                >
                  {category}
                </Badge>
              </div>

              {hasValidUrl ? (
                <a
                  href={item.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sm mb-2 line-clamp-2 hover:text-primary transition-colors flex items-start gap-1 group"
                >
                  {item.title}
                  <ExternalLink className="w-3 h-3 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </a>
              ) : (
                <h4 className="font-medium text-sm mb-2 line-clamp-2">{item.title}</h4>
              )}

              {item.ai_implications && (
                <p className="text-sm text-amber-400/80 bg-amber-500/10 p-2 rounded border border-amber-500/20 mb-2">
                  <span className="font-medium">Implication:</span> {item.ai_implications}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                {item.source && (
                  <span className="flex items-center gap-1">
                    Source: {item.source}
                  </span>
                )}
                {item.published_at && (
                  <span>
                    {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
