'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Newspaper, AlertTriangle, TrendingUp } from 'lucide-react';

interface Stats {
  companyCount: number;
  newsCount: number;
  highAlertCount: number;
  trendCount: number;
}

interface MarketOverviewProps {
  stats: Stats;
}

export function MarketOverview({ stats }: MarketOverviewProps) {
  const statCards = [
    {
      title: 'Companies Tracked',
      value: stats.companyCount,
      icon: Building2,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'News Items',
      value: stats.newsCount,
      icon: Newspaper,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    {
      title: 'High Priority Alerts',
      value: stats.highAlertCount,
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10'
    },
    {
      title: 'Active Trends',
      value: stats.trendCount,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
