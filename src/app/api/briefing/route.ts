import { NextResponse } from 'next/server';
import { generateBriefing, WeekData } from '@/lib/claude';
import {
  getAllNews,
  getAllTrends,
  getLatestBriefing,
  getAllBriefings,
  insertBriefing,
  getCompanyById,
  getStats,
  getAllJobSignals,
  getAllSecFilingAnalyses,
  getAllCompanies,
} from '@/lib/db';
import { analyzeJobSignals } from '@/lib/scrapers/jobs';
import type { JobPosting } from '@/lib/scrapers/jobs';
import { format, startOfWeek } from 'date-fns';

export async function GET() {
  try {
    const [briefings, latest] = await Promise.all([
      getAllBriefings(10),
      getLatestBriefing()
    ]);

    return NextResponse.json({
      briefings,
      latest
    });
  } catch (error) {
    console.error('Error fetching briefings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch briefings' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Gather all data sources in parallel
    const [news, trends, stats, jobSignals, secAnalyses, companies] = await Promise.all([
      getAllNews(50),
      getAllTrends(10),
      getStats(),
      getAllJobSignals(),
      getAllSecFilingAnalyses(15),
      getAllCompanies(),
    ]);

    // Enrich news with company names
    const newsItemsWithCompany = await Promise.all(
      news.map(async (item) => {
        const company = await getCompanyById(item.company_id);
        return {
          company: company?.name || 'Unknown',
          title: item.title,
          category: item.ai_category || 'other',
          significance: item.ai_significance || 'low',
          summary: item.ai_summary || item.title
        };
      })
    );

    // Convert job signals from DB format to JobPosting format and run analysis
    const jobPostings: JobPosting[] = jobSignals.map(signal => ({
      companyId: signal.company_id,
      title: signal.role_title || '',
      department: signal.department,
      location: signal.location,
      url: signal.url || '',
      postedAt: signal.detected_at,
    }));

    const jobAnalyses = analyzeJobSignals(jobPostings);
    const enrichedJobSignals = jobAnalyses
      .filter(a => a.totalOpenings > 0)
      .map(a => {
        const company = companies.find(c => c.id === a.companyId);
        return {
          company: company?.name || a.companyId,
          totalOpenings: a.totalOpenings,
          signals: a.signals,
        };
      });

    // Enrich SEC analyses with company names
    const enrichedSecInsights = await Promise.all(
      secAnalyses.map(async (analysis) => {
        const company = await getCompanyById(analysis.company_id);
        return {
          company: company?.name || analysis.company_id,
          formType: analysis.form_type,
          filedDate: analysis.filed_date,
          summary: analysis.ai_summary,
        };
      })
    );

    const weekData: WeekData = {
      newsItems: newsItemsWithCompany,
      trends: trends.map(t => ({
        title: t.title,
        description: t.description || ''
      })),
      highPriorityAlerts: stats.highAlertCount,
      totalNewsCount: stats.newsCount,
      jobSignals: enrichedJobSignals.length > 0 ? enrichedJobSignals : undefined,
      secFilingInsights: enrichedSecInsights.length > 0 ? enrichedSecInsights : undefined,
    };

    // Generate briefing using Claude
    const briefingContent = await generateBriefing(weekData);

    // Store in database
    const weekOf = format(startOfWeek(new Date()), 'yyyy-MM-dd');
    const briefingId = await insertBriefing({
      week_of: weekOf,
      content: briefingContent
    });

    return NextResponse.json({
      success: true,
      briefingId,
      weekOf,
      content: briefingContent
    });
  } catch (error) {
    console.error('Error generating briefing:', error);
    return NextResponse.json(
      { error: 'Failed to generate briefing' },
      { status: 500 }
    );
  }
}
