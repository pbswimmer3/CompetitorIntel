import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  getCompanyBySlug,
  getNewsByCompany,
  getJobsByCompany,
  getSecFilingAnalysesByCompany,
} from '@/lib/db';
import { fetchCompanySEC, isPublicCompany } from '@/lib/scrapers/sec';
import { fetchCompanyGitHub } from '@/lib/scrapers/github';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Building2,
  Globe,
  Calendar,
  DollarSign,
  Users,
  Briefcase,
  MapPin,
  ExternalLink,
  AlertCircle,
  TrendingUp,
  Handshake,
  UserCheck,
  MoreHorizontal,
  Scale,
  FileText,
  CheckCircle2,
  Star,
  GitBranch,
  Activity,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

const categoryStyles = {
  competitor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  adjacent: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  target: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
};

const categoryLabels = {
  competitor: 'Competitor',
  adjacent: 'Adjacent Player',
  target: 'Our Company'
};

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

const filingTypeColors: Record<string, string> = {
  '10-K': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  '10-Q': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  '8-K': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  'DEF 14A': 'text-purple-400 bg-purple-500/10 border-purple-500/30',
};

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const [news, jobs, secAnalyses] = await Promise.all([
    getNewsByCompany(company.id),
    getJobsByCompany(company.id),
    getSecFilingAnalysesByCompany(company.id),
  ]);

  // Fetch live SEC filings for public companies (4 companies only)
  const secInfo = isPublicCompany(company.id)
    ? await fetchCompanySEC(company).catch(() => null)
    : null;

  // Fetch GitHub activity (best-effort, may be rate-limited)
  const githubActivity = await fetchCompanyGitHub(company).catch(() => null);

  // Build a map of filing_id -> AI summary for quick lookup
  const analysisMap: Record<string, string> = {};
  for (const a of secAnalyses) {
    analysisMap[a.filing_id] = a.ai_summary;
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </Link>

      {/* Company Header */}
      <div className="flex items-start gap-6">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-8 h-8 text-slate-300" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{company.name}</h1>
            <Badge
              variant="outline"
              className={cn('text-sm', categoryStyles[company.category])}
            >
              {categoryLabels[company.category]}
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground mb-4">{company.description}</p>
          <div className="flex flex-wrap gap-6 text-sm">
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Globe className="w-4 h-4" />
                {company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {company.founded_year && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Founded {company.founded_year}
              </div>
            )}
            {company.funding_total && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                {company.funding_total}
              </div>
            )}
            {company.employee_count_estimate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                ~{company.employee_count_estimate.toLocaleString()} employees
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* News Timeline - 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400" />
            News & Updates
          </h2>

          {news.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center text-muted-foreground">
                No news items tracked for this company yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {news.map((item) => {
                const CategoryIcon = categoryIcons[item.ai_category as keyof typeof categoryIcons] || MoreHorizontal;
                const significance = item.ai_significance || 'low';

                return (
                  <Card
                    key={item.id}
                    className={cn(
                      'bg-card border-border',
                      significance === 'high' && 'border-red-500/30'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                          <Badge
                            variant="outline"
                            className={cn('text-xs capitalize', significanceStyles[significance as keyof typeof significanceStyles])}
                          >
                            {significance}
                          </Badge>
                          {item.ai_category && (
                            <Badge variant="outline" className="text-xs capitalize text-muted-foreground">
                              {item.ai_category}
                            </Badge>
                          )}
                        </div>
                        {item.published_at && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>

                      <h3 className="font-medium mb-2">{item.title}</h3>

                      {item.ai_summary && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.ai_summary}
                        </p>
                      )}

                      {item.ai_implications && significance === 'high' && (
                        <div className="text-sm text-amber-400/80 bg-amber-500/10 p-3 rounded border border-amber-500/20">
                          <span className="font-medium">Strategic Implication:</span> {item.ai_implications}
                        </div>
                      )}

                      {item.source && (
                        <div className="text-xs text-muted-foreground mt-3">
                          Source: {item.source}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* SEC Filings Section (public companies only) */}
          {secInfo && (
            <div className="space-y-4 pt-2">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-400" />
                Regulatory Filings
              </h2>
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  {secInfo.recentFilings.slice(0, 8).map((filing, idx) => {
                    const colorClass = filingTypeColors[filing.filingType] || 'text-muted-foreground bg-muted';
                    const hasAnalysis = !!analysisMap[filing.accessionNumber];

                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={cn('shrink-0 font-mono text-xs', colorClass)}>
                            {filing.filingType}
                          </Badge>
                          <span className="text-sm flex-1">
                            {format(new Date(filing.filingDate), 'MMM d, yyyy')}
                          </span>
                          {hasAnalysis && (
                            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Analyzed
                            </Badge>
                          )}
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
                        {hasAnalysis && (
                          <div className="ml-12 text-xs text-muted-foreground bg-muted/30 p-3 rounded border border-border line-clamp-3">
                            {analysisMap[filing.accessionNumber]}
                          </div>
                        )}
                        {idx < secInfo.recentFilings.slice(0, 8).length - 1 && (
                          <Separator className="mt-2" />
                        )}
                      </div>
                    );
                  })}
                  <div className="pt-1">
                    <Link href="/sec" className="text-xs text-primary hover:underline flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      View all filings and analyze with AI →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Job Signals */}
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-400" />
            Hiring Signals
          </h2>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              {jobs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No job signals detected. Refresh job data from the Jobs page.
                </p>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <h4 className="font-medium text-sm">{job.role_title}</h4>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                        {job.department && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {job.department}
                          </span>
                        )}
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {job.location}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* GitHub Activity */}
          {githubActivity && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-400" />
                GitHub Activity
              </h2>
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <div className="text-xl font-bold">{githubActivity.totalPublicRepos}</div>
                      <div className="text-xs text-muted-foreground">Public Repos</div>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <div className="text-xl font-bold">{githubActivity.totalStars.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Total Stars</div>
                    </div>
                  </div>

                  {/* Signals */}
                  {githubActivity.signals.length > 0 && (
                    <div className="space-y-1">
                      {githubActivity.signals.map((signal, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Activity className="w-3 h-3 text-purple-400 shrink-0" />
                          {signal}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Top repos */}
                  {githubActivity.topRepos.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top Repositories</p>
                      {githubActivity.topRepos.slice(0, 4).map((repo) => (
                        <a
                          key={repo.fullName}
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{repo.name}</p>
                            {repo.description && (
                              <p className="text-xs text-muted-foreground truncate">{repo.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-2">
                            <Star className="w-3 h-3" />
                            {repo.stars}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Stats */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">News Items</span>
                <span className="font-medium">{news.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">High Priority</span>
                <span className="font-medium text-red-400">
                  {news.filter(n => n.ai_significance === 'high').length}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Open Roles</span>
                <span className="font-medium">{jobs.length}</span>
              </div>
              {secInfo && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">SEC Filings</span>
                    <span className="font-medium">{secInfo.recentFilings.length}</span>
                  </div>
                </>
              )}
              {secAnalyses.length > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Filings Analyzed</span>
                    <span className="font-medium text-emerald-400">{secAnalyses.length}</span>
                  </div>
                </>
              )}
              {company.valuation && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valuation</span>
                    <span className="font-medium">{company.valuation}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
