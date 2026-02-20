'use client';

import { useState } from 'react';
import { MarketOverview } from '@/components/MarketOverview';
import { CompanyCard } from '@/components/CompanyCard';
import { AlertFeed } from '@/components/AlertFeed';
import { TrendCard } from '@/components/TrendCard';
import { format } from 'date-fns';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const { data: companiesData, mutate: mutateCompanies } = useSWR('/api/companies', fetcher);
  const { data: newsData, mutate: mutateNews } = useSWR('/api/news?limit=30', fetcher);
  const { data: trendsData } = useSWR('/api/trends?limit=10', fetcher);

  const companies = companiesData?.companies || [];
  const stats = companiesData?.stats || { companyCount: 0, newsCount: 0, highAlertCount: 0, trendCount: 0 };
  const news = newsData?.news || [];
  const trends = trendsData?.trends || [];

  // Get latest news per company for cards
  const latestNewsByCompany = new Map<string, typeof news[0]>();
  news.forEach((item: any) => {
    if (!latestNewsByCompany.has(item.company_id)) {
      latestNewsByCompany.set(item.company_id, item);
    }
  });

  // Sort companies: target first, then competitors, then adjacent
  const sortedCompanies = [...companies].sort((a: any, b: any) => {
    const order: Record<string, number> = { target: 0, competitor: 1, adjacent: 2 };
    return (order[a.category] || 2) - (order[b.category] || 2);
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/news/refresh', { method: 'POST' });
      if (response.ok) {
        // Refresh all data
        await Promise.all([mutateCompanies(), mutateNews()]);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to refresh news:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Competitive Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Real-time insights on the process mining industry
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {format(lastRefresh, 'MMM d, yyyy h:mm a')}
        </div>
      </div>

      {/* Market Overview Stats */}
      <MarketOverview stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert Feed - Takes 2 columns */}
        <div className="lg:col-span-2">
          <AlertFeed
            news={news}
            maxHeight="700px"
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        </div>

        {/* Trends - Takes 1 column */}
        <div>
          <TrendCard trends={trends} />
        </div>
      </div>

      {/* Companies Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Companies Tracked</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCompanies.map((company: any) => (
            <CompanyCard
              key={company.id}
              company={company}
              latestNews={latestNewsByCompany.get(company.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
