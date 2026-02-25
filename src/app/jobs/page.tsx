'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Briefcase,
  Users,
  MapPin,
  TrendingUp,
  Building2,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Cpu,
  DollarSign,
  Globe
} from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface JobSignal {
  id: number;
  company_id: string;
  role_title: string;
  department: string | null;
  location: string | null;
  url: string | null;
  detected_at: string;
}

interface Company {
  id: string;
  name: string;
  slug: string;
}

// Signal icons and colors
const signalConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  'ai': { icon: Cpu, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  'sales': { icon: DollarSign, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  'engineering': { icon: Users, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  'geographic': { icon: Globe, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  'leadership': { icon: TrendingUp, color: 'text-red-400', bgColor: 'bg-red-500/10' },
};

function getSignalType(signal: string): string {
  if (signal.toLowerCase().includes('ai') || signal.toLowerCase().includes('ml')) return 'ai';
  if (signal.toLowerCase().includes('sales')) return 'sales';
  if (signal.toLowerCase().includes('engineering')) return 'engineering';
  if (signal.toLowerCase().includes('geographic')) return 'geographic';
  if (signal.toLowerCase().includes('leadership')) return 'leadership';
  return 'engineering';
}

export default function JobsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const { data: companiesData } = useSWR('/api/companies', fetcher);
  const { data: jobsData, mutate: mutateJobs } = useSWR(
    selectedCompany ? `/api/companies/${selectedCompany}` : null,
    fetcher
  );

  const companies: Company[] = companiesData?.companies || [];
  const stats = companiesData?.stats || { jobCount: 0 };

  // Fetch job analysis when refreshing
  const [analysisData, setAnalysisData] = useState<any>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/jobs/refresh', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setAnalysisData(data);
        mutateJobs();
      }
    } catch (error) {
      console.error('Failed to refresh jobs:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Group jobs by company from analysis
  const companyAnalyses = analysisData?.analyses || [];
  const companyResults = analysisData?.results || [];

  // Calculate aggregated insights
  const totalJobs = analysisData?.totalJobs || stats.jobCount || 0;
  const allSignals = companyAnalyses.flatMap((a: any) => a.signals || []);
  const uniqueSignals = [...new Set(allSignals)];

  // Top hiring companies
  const topHiring = [...companyResults].sort((a: any, b: any) => b.jobs - a.jobs).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-amber-400" />
            Job Posting Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            Track competitor hiring patterns to predict strategic moves
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? 'Scanning Jobs...' : 'Refresh Job Data'}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Open Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">Across tracked companies</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Companies Hiring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{companyResults.length || '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">With active job boards</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Strategic Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{uniqueSignals.length || '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">Patterns detected</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Hirer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{topHiring[0]?.company || '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {topHiring[0]?.jobs ? `${topHiring[0].jobs} open roles` : 'Refresh to see data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hiring Signals - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Strategic Signals */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Hiring Signals Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companyAnalyses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click &quot;Refresh Job Data&quot; to scan competitor job boards</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {companyAnalyses.map((analysis: any) => {
                    if (!analysis.signals || analysis.signals.length === 0) return null;
                    const company = companies.find(c => c.id === analysis.companyId);

                    return (
                      <div key={analysis.companyId} className="p-4 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <Link
                            href={`/company/${company?.slug || analysis.companyId}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {company?.name || analysis.companyId}
                          </Link>
                          <Badge variant="outline" className="text-xs">
                            {analysis.totalOpenings} open roles
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {analysis.signals.map((signal: string, idx: number) => {
                            const type = getSignalType(signal);
                            const config = signalConfig[type];
                            const Icon = config.icon;

                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "flex items-center gap-3 p-2 rounded-lg",
                                  config.bgColor
                                )}
                              >
                                <Icon className={cn("w-4 h-4", config.color)} />
                                <span className="text-sm">{signal}</span>
                              </div>
                            );
                          })}
                        </div>
                        {analysis.topLocations && analysis.topLocations.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {analysis.topLocations.slice(0, 3).map((loc: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3 mr-1" />
                                {loc}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Job Breakdown */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Hiring by Company
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companyResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No job data available. Click refresh to scan.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {companyResults.map((result: any) => {
                    const company = companies.find(c => c.name === result.company);
                    const maxJobs = Math.max(...companyResults.map((r: any) => r.jobs));
                    const percentage = (result.jobs / maxJobs) * 100;

                    return (
                      <div key={result.company} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <Link
                            href={`/company/${company?.slug || result.company.toLowerCase()}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {result.company}
                          </Link>
                          <span className="text-muted-foreground">{result.jobs} roles</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* What This Tells Us */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium">What Job Data Reveals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <Cpu className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">AI/ML Hiring</p>
                  <p className="text-muted-foreground">Signals investment in AI capabilities, likely new product features</p>
                </div>
              </div>
              <div className="flex gap-3">
                <DollarSign className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Sales Expansion</p>
                  <p className="text-muted-foreground">Indicates go-to-market push, possibly new territory or segment</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Globe className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Geographic Growth</p>
                  <p className="text-muted-foreground">Shows international expansion priorities</p>
                </div>
              </div>
              <div className="flex gap-3">
                <TrendingUp className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Leadership Hiring</p>
                  <p className="text-muted-foreground">May indicate new business units or strategic pivots</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                Greenhouse Job Boards
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                Lever Career Pages
              </div>
              <p className="text-xs mt-3">
                Currently tracking: Celonis, UiPath, ABBYY, Automation Anywhere, Skan.AI, Apromore
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
