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
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
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
  accessionNumber: string;
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

interface StoredAnalysis {
  id: number;
  company_id: string;
  filing_id: string;
  form_type: string;
  filed_date: string;
  document_url: string | null;
  ai_summary: string;
  analyzed_at: string;
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

const ANALYZABLE_TYPES = ['10-K', '10-Q', '8-K'];

export default function SECPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Track which filings are currently being analyzed { [accessionNumber]: boolean }
  const [analyzingFilings, setAnalyzingFilings] = useState<Record<string, boolean>>({});
  // Track filings that failed to analyze { [accessionNumber]: boolean }
  const [failedFilings, setFailedFilings] = useState<Record<string, boolean>>({});
  // Track locally-added analysis results before SWR refetches
  const [localAnalyses, setLocalAnalyses] = useState<Record<string, StoredAnalysis>>({});
  // Track which filing summaries are expanded
  const [expandedFilings, setExpandedFilings] = useState<Record<string, boolean>>({});

  const { data: companiesData } = useSWR('/api/companies', fetcher);
  const { data: secData, mutate: mutateSEC } = useSWR('/api/sec', fetcher);
  const { data: analysesData, mutate: mutateAnalyses } = useSWR('/api/sec/analyze', fetcher);

  const companies: Company[] = companiesData?.companies || [];
  const secCompanies: SECCompanyInfo[] = secData?.companies || [];
  const publicCompanyCount = secData?.publicCompanyCount || 0;
  const totalFilings = secData?.totalFilings || 0;
  const recentMaterialEvents = secData?.recentMaterialEvents || 0;

  // Build a map of filing_id -> stored analysis
  const storedAnalyses: Record<string, StoredAnalysis> = {};
  for (const a of (analysesData?.analyses || [])) {
    storedAnalyses[a.filing_id] = a;
  }
  // Merge locally-added results
  Object.assign(storedAnalyses, localAnalyses);

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

  const handleAnalyze = async (filing: SECFiling) => {
    const key = filing.accessionNumber;
    setAnalyzingFilings(prev => ({ ...prev, [key]: true }));

    try {
      const companyInfo = getCompanyInfo(filing.companyId);
      const response = await fetch('/api/sec/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: filing.companyId,
          companyName: companyInfo.name,
          filingId: filing.accessionNumber,
          docUrl: filing.documentUrl,
          formType: filing.filingType,
          filedDate: filing.filingDate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLocalAnalyses(prev => ({ ...prev, [key]: data.analysis }));
        setExpandedFilings(prev => ({ ...prev, [key]: true }));
        mutateAnalyses();
      } else {
        setFailedFilings(prev => ({ ...prev, [key]: true }));
      }
    } catch (error) {
      console.error('Failed to analyze filing:', error);
      setFailedFilings(prev => ({ ...prev, [key]: true }));
    } finally {
      setAnalyzingFilings(prev => ({ ...prev, [key]: false }));
    }
  };

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

  const activeCompanies = secCompanies
    .map(c => ({
      ...c,
      recentCount: c.recentFilings.filter(f =>
        new Date(f.filingDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length
    }))
    .sort((a, b) => b.recentCount - a.recentCount);

  const analyzedCount = Object.keys(storedAnalyses).length;

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
            Track regulatory filings and generate AI competitive intelligence from public competitors
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
              AI Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analyzedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Filings analyzed by Claude</p>
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
                <div className="space-y-4">
                  {allRecentFilings.map((filing, idx) => {
                    const config = getFilingConfig(filing.filingType);
                    const companyInfo = getCompanyInfo(filing.companyId);
                    const filingKey = filing.accessionNumber;
                    const isAnalyzing = analyzingFilings[filingKey];
                    const hasFailed = failedFilings[filingKey];
                    const storedAnalysis = storedAnalyses[filingKey];
                    const isExpanded = expandedFilings[filingKey];
                    const canAnalyze = ANALYZABLE_TYPES.includes(filing.filingType) && filing.documentUrl;

                    return (
                      <div
                        key={`${filing.companyId}-${filing.filingType}-${filing.filingDate}-${idx}`}
                        className="rounded-lg border border-border overflow-hidden"
                      >
                        {/* Filing header row */}
                        <div className="flex items-start gap-4 p-3 hover:bg-muted/30 transition-colors">
                          <Badge
                            variant="outline"
                            className={cn("shrink-0 font-mono text-xs mt-0.5", config.bgColor, config.color)}
                          >
                            {filing.filingType}
                          </Badge>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
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
                              {storedAnalysis && (
                                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  AI Analyzed
                                </Badge>
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

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            {storedAnalysis && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => setExpandedFilings(prev => ({ ...prev, [filingKey]: !isExpanded }))}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </Button>
                            )}
                            {canAnalyze && !storedAnalysis && (
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "h-7 px-3 text-xs gap-1.5",
                                  hasFailed && "border-red-500/30 text-red-400"
                                )}
                                disabled={isAnalyzing}
                                onClick={() => {
                                  setFailedFilings(prev => ({ ...prev, [filingKey]: false }));
                                  handleAnalyze(filing);
                                }}
                              >
                                {isAnalyzing ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Analyzing...
                                  </>
                                ) : hasFailed ? (
                                  <>
                                    <AlertCircle className="w-3 h-3" />
                                    Retry
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3 text-amber-400" />
                                    Analyze
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Expanded AI Summary */}
                        {storedAnalysis && isExpanded && (
                          <div className="border-t border-border bg-muted/20 p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="w-4 h-4 text-amber-400" />
                              <span className="text-sm font-medium">AI Competitive Intelligence</span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                Analyzed {formatDistanceToNow(new Date(storedAnalysis.analyzed_at), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                              {storedAnalysis.ai_summary}
                            </div>
                          </div>
                        )}
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
                    const companyAnalysedCount = company.recentFilings.filter(
                      f => storedAnalyses[f.accessionNumber]
                    ).length;

                    return (
                      <div key={company.companyId} className="p-4 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <Link
                            href={`/company/${companyInfo.slug}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {company.name}
                          </Link>
                          <div className="flex items-center gap-2">
                            {companyAnalysedCount > 0 && (
                              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                {companyAnalysedCount} analyzed
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              CIK: {company.cik}
                            </span>
                          </div>
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

          {/* How AI Analysis Works */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                How AI Analysis Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Click <strong className="text-foreground">Analyze</strong> on any 10-K, 10-Q, or 8-K filing to generate competitive intelligence.</p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-blue-400 font-medium shrink-0">10-K:</span>
                  <span>Extracts Business, Risk Factors, and MD&A sections</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-400 font-medium shrink-0">10-Q:</span>
                  <span>Extracts the MD&A quarterly update</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-400 font-medium shrink-0">8-K:</span>
                  <span>Full document — always concise and material</span>
                </div>
              </div>
              <p className="text-xs">Results are stored permanently and used to enrich the weekly briefing.</p>
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
                  <p className="text-muted-foreground">Often names competitors and market threats explicitly</p>
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
                SAP (SAP) — owns Signavio
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
