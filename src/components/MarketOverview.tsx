'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Newspaper, AlertTriangle, TrendingUp, Briefcase, Scale } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Stats {
  companyCount: number;
  newsCount: number;
  highAlertCount: number;
  trendCount: number;
  jobCount?: number;
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
      bgColor: 'bg-blue-500/10',
      href: '#companies',
      scrollTo: true
    },
    {
      title: 'News Items',
      value: stats.newsCount,
      icon: Newspaper,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      href: null,
      scrollTo: false
    },
    {
      title: 'High Priority Alerts',
      value: stats.highAlertCount,
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      href: null,
      scrollTo: false
    },
    {
      title: 'Active Trends',
      value: stats.trendCount,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      href: null,
      scrollTo: false
    },
    {
      title: 'Open Jobs Tracked',
      value: stats.jobCount || 0,
      icon: Briefcase,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      href: '/jobs',
      scrollTo: false
    },
    {
      title: 'SEC Filings',
      value: 'View',
      icon: Scale,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      href: '/sec',
      scrollTo: false
    }
  ];

  const handleClick = (scrollTo: boolean, href: string | null) => {
    if (scrollTo && href) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        const isClickable = stat.href !== null;

        const cardContent = (
          <Card
            className={cn(
              "bg-card border-border",
              isClickable && "cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
            )}
            onClick={() => stat.scrollTo && handleClick(stat.scrollTo, stat.href)}
          >
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

        if (stat.href && !stat.scrollTo) {
          return (
            <Link key={stat.title} href={stat.href}>
              {cardContent}
            </Link>
          );
        }

        return <div key={stat.title}>{cardContent}</div>;
      })}
    </div>
  );
}
