'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Package, Users, DollarSign, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RelatedCompany {
  id: string;
  name: string;
}

interface Trend {
  id: number;
  title: string;
  description: string | null;
  trend_type: string | null;
  detected_at: string;
  related_companies_parsed: RelatedCompany[];
}

interface TrendCardProps {
  trends: Trend[];
}

const trendTypeIcons = {
  product: Package,
  market: BarChart3,
  hiring: Users,
  funding: DollarSign
};

const trendTypeStyles = {
  product: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  market: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  hiring: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  funding: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
};

export function TrendCard({ trends }: TrendCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          Emerging Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {trends.map((trend) => {
          const trendType = trend.trend_type || 'market';
          const TrendIcon = trendTypeIcons[trendType as keyof typeof trendTypeIcons] || TrendingUp;

          return (
            <div
              key={trend.id}
              className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'p-2 rounded-lg flex-shrink-0',
                  trendTypeStyles[trendType as keyof typeof trendTypeStyles] || 'bg-slate-500/10'
                )}>
                  <TrendIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium">{trend.title}</h4>
                    <Badge
                      variant="outline"
                      className={cn('text-xs capitalize flex-shrink-0', trendTypeStyles[trendType as keyof typeof trendTypeStyles])}
                    >
                      {trendType}
                    </Badge>
                  </div>
                  {trend.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {trend.description}
                    </p>
                  )}
                  {trend.related_companies_parsed.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {trend.related_companies_parsed.map((company) => (
                        <Badge
                          key={company.id}
                          variant="outline"
                          className="text-xs bg-muted/50"
                        >
                          {company.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
