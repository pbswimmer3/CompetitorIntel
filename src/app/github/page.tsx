'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GitBranch,
  Star,
  GitFork,
  Code2,
  RefreshCw,
  ExternalLink,
  Activity,
  Cpu,
  TrendingUp,
  Building2,
  Calendar
} from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface GitHubRepo {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  updatedAt: string;
  pushedAt: string;
}

interface GitHubActivity {
  companyId: string;
  orgName: string;
  totalPublicRepos: number;
  totalStars: number;
  topRepos: GitHubRepo[];
  recentlyUpdated: GitHubRepo[];
  signals: string[];
}

interface Company {
  id: string;
  name: string;
  slug: string;
}

// Language colors for badges
const languageColors: Record<string, string> = {
  'TypeScript': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'JavaScript': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Python': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Java': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Go': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Rust': 'bg-red-500/20 text-red-400 border-red-500/30',
  'C#': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Scala': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Kotlin': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
};

function getLanguageColor(language: string | null): string {
  if (!language) return 'bg-muted text-muted-foreground';
  return languageColors[language] || 'bg-muted text-muted-foreground';
}

// Signal icons
function getSignalIcon(signal: string) {
  if (signal.toLowerCase().includes('active')) return Activity;
  if (signal.toLowerCase().includes('ai') || signal.toLowerCase().includes('ml')) return Cpu;
  if (signal.toLowerCase().includes('popular')) return Star;
  return TrendingUp;
}

export default function GitHubPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: companiesData } = useSWR('/api/companies', fetcher);
  const { data: githubData, mutate: mutateGithub } = useSWR('/api/github', fetcher);

  const companies: Company[] = companiesData?.companies || [];
  const activities: GitHubActivity[] = githubData?.activities || [];
  const totalRepos = githubData?.totalRepos || 0;
  const totalStars = githubData?.totalStars || 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutateGithub();
    } catch (error) {
      console.error('Failed to refresh GitHub data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get company name from ID
  const getCompanyName = (companyId: string): string => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || companyId;
  };

  const getCompanySlug = (companyId: string): string => {
    const company = companies.find(c => c.id === companyId);
    return company?.slug || companyId;
  };

  // Sort activities by total stars (shows open source investment)
  const sortedActivities = [...activities].sort((a, b) => b.totalStars - a.totalStars);

  // Get all languages across repos
  const languageCounts = new Map<string, number>();
  activities.forEach(activity => {
    activity.topRepos.forEach(repo => {
      if (repo.language) {
        languageCounts.set(repo.language, (languageCounts.get(repo.language) || 0) + 1);
      }
    });
  });
  const topLanguages = [...languageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Get most starred repo across all companies
  const allTopRepos = activities.flatMap(a => a.topRepos);
  const mostStarredRepo = allTopRepos.sort((a, b) => b.stars - a.stars)[0];

  // Get companies with active development
  const activeCompanies = activities.filter(a =>
    a.signals.some(s => s.toLowerCase().includes('active'))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GitBranch className="w-8 h-8 text-purple-400" />
            GitHub Activity Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            Track open source investment and development activity
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? 'Fetching...' : 'Refresh GitHub Data'}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Public Repositories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalRepos}</div>
            <p className="text-xs text-muted-foreground mt-1">Across tracked companies</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stars
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalStars.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Community interest indicator</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Development
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCompanies.length || '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">Companies with recent pushes</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Most Popular Repo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">{mostStarredRepo?.name || '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {mostStarredRepo ? `${mostStarredRepo.stars.toLocaleString()} stars` : 'Refresh to see data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Source Investment - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Open Source Investment by Company */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Open Source Investment by Company
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click &quot;Refresh GitHub Data&quot; to scan company repositories</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedActivities.map((activity) => {
                    const maxStars = Math.max(...sortedActivities.map(a => a.totalStars));
                    const percentage = maxStars > 0 ? (activity.totalStars / maxStars) * 100 : 0;

                    return (
                      <div key={activity.companyId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Link
                            href={`/company/${getCompanySlug(activity.companyId)}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {getCompanyName(activity.companyId)}
                          </Link>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Code2 className="w-4 h-4" />
                              {activity.totalPublicRepos} repos
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400" />
                              {activity.totalStars.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        {/* Signals */}
                        {activity.signals.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {activity.signals.map((signal, idx) => {
                              const Icon = getSignalIcon(signal);
                              return (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  <Icon className="w-3 h-3 mr-1" />
                                  {signal}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recently Updated Repos */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Recent Development Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No activity data available. Click refresh to scan.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities
                    .flatMap(a => a.recentlyUpdated.map(repo => ({ ...repo, companyId: a.companyId })))
                    .sort((a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime())
                    .slice(0, 10)
                    .map((repo, idx) => (
                      <div
                        key={`${repo.fullName}-${idx}`}
                        className="flex items-start justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <a
                              href={repo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-sm hover:text-primary transition-colors truncate"
                            >
                              {repo.fullName}
                            </a>
                            <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          </div>
                          {repo.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {repo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {repo.language && (
                              <Badge variant="outline" className={cn("text-xs", getLanguageColor(repo.language))}>
                                {repo.language}
                              </Badge>
                            )}
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {repo.stars}
                            </span>
                            <span className="flex items-center gap-1">
                              <GitFork className="w-3 h-3" />
                              {repo.forks}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDistanceToNow(new Date(repo.pushedAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Technology Stack */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Code2 className="w-4 h-4 text-blue-400" />
                Technology Stack
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topLanguages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Refresh to see tech stack data</p>
              ) : (
                <div className="space-y-2">
                  {topLanguages.map(([language, count]) => (
                    <div key={language} className="flex items-center justify-between">
                      <Badge variant="outline" className={cn("text-xs", getLanguageColor(language))}>
                        {language}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{count} repos</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Starred Repos */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Star className="w-4 h-4 text-yellow-400" />
                Top Starred Repos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allTopRepos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No repo data available</p>
              ) : (
                <div className="space-y-3">
                  {allTopRepos
                    .sort((a, b) => b.stars - a.stars)
                    .slice(0, 5)
                    .map((repo, idx) => (
                      <div key={`${repo.fullName}-${idx}`} className="space-y-1">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                        >
                          {repo.name}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400" />
                            {repo.stars.toLocaleString()}
                          </span>
                          {repo.language && (
                            <Badge variant="outline" className={cn("text-xs", getLanguageColor(repo.language))}>
                              {repo.language}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* What This Tells Us */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium">What GitHub Data Reveals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <Star className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Star Count</p>
                  <p className="text-muted-foreground">Community adoption and mindshare in developer ecosystem</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Activity className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Recent Activity</p>
                  <p className="text-muted-foreground">Engineering investment and active development priorities</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Code2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Tech Stack</p>
                  <p className="text-muted-foreground">Technology direction and potential integration opportunities</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Cpu className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">AI/ML Repos</p>
                  <p className="text-muted-foreground">Signals investment in artificial intelligence capabilities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
