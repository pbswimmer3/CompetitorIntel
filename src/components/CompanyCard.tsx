'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, DollarSign, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  founded_year: number | null;
  funding_total: string | null;
  valuation: string | null;
  employee_count_estimate: number | null;
  category: 'competitor' | 'adjacent' | 'target';
}

interface NewsItem {
  title: string;
  ai_significance: string | null;
  published_at: string | null;
}

interface CompanyCardProps {
  company: Company;
  latestNews?: NewsItem;
}

const categoryStyles = {
  competitor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  adjacent: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  target: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
};

const categoryLabels = {
  competitor: 'Competitor',
  adjacent: 'Adjacent',
  target: 'Our Company'
};

export function CompanyCard({ company, latestNews }: CompanyCardProps) {
  return (
    <Link href={`/company/${company.slug}`}>
      <Card className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer h-full group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                  {company.name}
                </h3>
                <Badge
                  variant="outline"
                  className={cn('text-xs', categoryStyles[company.category])}
                >
                  {categoryLabels[company.category]}
                </Badge>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {company.description}
          </p>

          <div className="flex flex-wrap gap-4 text-sm">
            {company.funding_total && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{company.funding_total}</span>
              </div>
            )}
            {company.employee_count_estimate && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span>{company.employee_count_estimate.toLocaleString()}</span>
              </div>
            )}
          </div>

          {latestNews && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Latest:</p>
              <p className="text-sm line-clamp-2">{latestNews.title}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
