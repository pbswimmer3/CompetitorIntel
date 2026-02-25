'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Building2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Scale
} from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface SECFiling {
  companyId: string;
  companyName: string;
  cik: string;
  filingType: '10-K' | '10-Q' | '8-K' | 'DEF 14A' | 'other';
  filingDate: string;
  reportDate: string | null;
  description: string;
  url: string;
  documentUrl: string | null;
}

interface SECCompanyInfo {
  companyId: string;
  cik: string;
  name: string;
  sic: string | null;
  sicDescription: string | null;
  fiscalYearEnd: string | null;
  recentFilings: SECFiling[];
  signals: string[];
}

interface Company {
  id: string;
  name: string;
  slug: string;
}

// Filing type styling
const filingTypeConfig: Record<string, { color: string; bgColor: string; description: string }> = {
  '10-K': {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    description: 'Annual Report'
  },
  '10-Q': {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    description: 'Quarterly Report'
  },
  '8-K': {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    description: 'Material Event'
  },
  'DEF 14A': {
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    description: 'Proxy Statement'
  },
};

function getFilingConfig(filingType: string) {
  return filingTypeConfig[filingType] || {
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    description: filingType
  };
}

export default function SECPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const { data: companiesData } = useSWR('/api/companies', fetcher);
  const { data: secData, mutate: mutateSEC } = useSWR('/api/sec', fetcher);

  const companies: Company[] = companiesData?.companies || [];
  const secCompanies: SECCompanyInfo[] = secData?.companies || [];
  const publicCompanyCount = secData?.publicCompanyCount || 0;
  const totalFilings = secData?.totalFilings || 0;
  const recentMaterialEvents = secData?.recentMaterialEvents || 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutateSEC();
    } catch (error) {
      console.error('Failed to refresh SEC data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get company name and slug from ID
  const getCompanyInfo = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return {
      name: company?.name || companyId,
      slug: company?.slug || companyId
    };
  };

  // Get all recent filings across companies, sorted by date
  const allRecentFilings = secCompanies
    .flatMap(c => c.recentFilings.map(f => ({ ...f, companyId: c.companyId })))
    .sort((a, b) => new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime())
    .slice(0, 15);

  // Get recent 8-K filings (material events)
  const materialEvents = allRecentFilings.filter(f => f.filingType === '8-K');

  // Companies with most recent activity
  const activeCompanies = secCompanies
    .map(c => ({
      ...c,
      recentCount: c.recentFilings.filter(f =>
        new Date(f.filingDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length
    }))
    .sort((a, b) => b.recentCount - a.recentCount);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Scale className="w-8 h-8 text-blue-400" />
            SEC Filing Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            Track regulatory filings and material events from public competitors
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? 'Fetching...' : 'Refresh SEC Data'}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Public Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{publicCompanyCount}</div>
            <p className="text-xs text-muted-foreground mt-1">With SEC filings tracked</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent Filings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalFilings}</div>
            <p className="text-xs text-muted-foreground mt-1">10-K, 10-Q, 8-K, Proxy</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Material Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{recentMaterialEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">8-K filings (last 30 days)</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Most Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">
              {activeCompanies[0]?.name || '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeCompanies[0]?.recentCount
                ? `${activeCompanies[0].recentCount} filings this month`
                : 'Refresh to see data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filings Timeline - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Filings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Recent Regulatory Filings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allRecentFilings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Scale className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click &quot;Refresh SEC Data&quot; to fetch filings from SEC EDGAR</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allRecentFilings.map((filing, idx) => {
                    const config = getFilingConfig(filing.filingType);
                    const companyInfo = getCompanyInfo(filing.companyId);

                    return (
                      <div
                        key={`${filing.companyId}-${filing.filingType}-${filing.filingDate}-${idx}`}
                        className="flex items-start gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <Badge
                          variant="outline"
                          className={cn("shrink-0 font-mono text-xs", config.bgColor, config.color)}
                        >
                          {filing.filingType}
                        </Badge>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/company/${companyInfo.slug}`}
                              className="font-medium text-sm hover:text-primary transition-colors"
                            >
                              {companyInfo.name}
                            </Link>
                            {filing.documentUrl && (
                              <a
                                href={filing.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {config.description}: {filing.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Filed {format(new Date(filing.filingDate), 'MMM d, yyyy')}
                              {' '}({formatDistanceToNow(new Date(filing.filingDate), { addSuffix: true })})
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Filing Breakdown */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                Filings by Company
              </CardTitle>
            </CardHeader>
            <CardContent>
              {secCompanies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No SEC data available. Click refresh to fetch.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {secCompanies.map((company) => {
                    const companyInfo = getCompanyInfo(company.companyId);
                    const filing10K = company.recentFilings.filter(f => f.filingType === '10-K').length;
                    const filing10Q = company.recentFilings.filter(f => f.filingType === '10-Q').length;
                    const filing8K = company.recentFilings.filter(f => f.filingType === '8-K').length;
                    const filingProxy = company.recentFilings.filter(f => f.filingType === 'DEF 14A').length;

                    return (
                      <div key={company.companyId} className="p-4 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <Link
                            href={`/company/${companyInfo.slug}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {company.name}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            CIK: {company.cik}
                          </span>
                        </div>

                        {/* Filing counts */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {filing10K > 0 && (
                            <Badge variant="outline" className={cn("text-xs", filingTypeConfig['10-K'].bgColor, filingTypeConfig['10-K'].color)}>
                              {filing10K} Annual Reports
                            </Badge>
                          )}
                          {filing10Q > 0 && (
                            <Badge variant="outline" className={cn("text-xs", filingTypeConfig['10-Q'].bgColor, filingTypeConfig['10-Q'].color)}>
                              {filing10Q} Quarterly Reports
                            </Badge>
                          )}
                          {filing8K > 0 && (
                            <Badge variant="outline" className={cn("text-xs", filingTypeConfig['8-K'].bgColor, filingTypeConfig['8-K'].color)}>
                              {filing8K} Material Events
                            </Badge>
                          )}
                          {filingProxy > 0 && (
                            <Badge variant="outline" className={cn("text-xs", filingTypeConfig['DEF 14A'].bgColor, filingTypeConfig['DEF 14A'].color)}>
                              {filingProxy} Proxy Statements
                            </Badge>
                          )}
                        </div>

                        {/* Signals */}
                        {company.signals.length > 0 && (
                          <div className="space-y-1">
                            {company.signals.map((signal, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <AlertCircle className="w-3 h-3 text-amber-400" />
                                {signal}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Additional info */}
                        {company.sicDescription && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Industry: {company.sicDescription}
                          </p>
                        )}
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
          {/* Filing Types Explained */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Filing Types Explained</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <Badge variant="outline" className={cn("shrink-0", filingTypeConfig['10-K'].bgColor, filingTypeConfig['10-K'].color)}>
                  10-K
                </Badge>
                <div>
                  <p className="font-medium">Annual Report</p>
                  <p className="text-muted-foreground text-xs">Comprehensive yearly overview: financials, strategy, risks</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Badge variant="outline" className={cn("shrink-0", filingTypeConfig['10-Q'].bgColor, filingTypeConfig['10-Q'].color)}>
                  10-Q
                </Badge>
                <div>
                  <p className="font-medium">Quarterly Report</p>
                  <p className="text-muted-foreground text-xs">Unaudited quarterly financials and updates</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Badge variant="outline" className={cn("shrink-0", filingTypeConfig['8-K'].bgColor, filingTypeConfig['8-K'].color)}>
                  8-K
                </Badge>
                <div>
                  <p className="font-medium">Material Event</p>
                  <p className="text-muted-foreground text-xs">Major events: acquisitions, leadership changes, earnings</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Badge variant="outline" className={cn("shrink-0", filingTypeConfig['DEF 14A'].bgColor, filingTypeConfig['DEF 14A'].color)}>
                  DEF 14A
                </Badge>
                <div>
                  <p className="font-medium">Proxy Statement</p>
                  <p className="text-muted-foreground text-xs">Executive compensation, board info, shareholder votes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What to Look For */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Competitive Intelligence Value</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <DollarSign className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Revenue Segments</p>
                  <p className="text-muted-foreground">10-K reveals revenue by product line and geography</p>
                </div>
              </div>
              <div className="flex gap-3">
                <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Strategic Priorities</p>
                  <p className="text-muted-foreground">MD&A section outlines future direction and investments</p>
                </div>
              </div>
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Risk Factors</p>
                  <p className="text-muted-foreground">Often names competitors and market threats</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Users className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Executive Changes</p>
                  <p className="text-muted-foreground">8-K filings report leadership transitions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Public Companies Tracked */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Public Companies Tracked</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                UiPath (PATH)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                Microsoft (MSFT)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                IBM (IBM)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                SAP (SAP) - owns Signavio
              </div>
              <p className="text-xs mt-3">
                Data sourced from SEC EDGAR
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
