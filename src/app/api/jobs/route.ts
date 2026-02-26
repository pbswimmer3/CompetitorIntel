import { NextResponse } from 'next/server';
import { getAllCompanies, getAllJobSignals } from '@/lib/db';
import { analyzeJobSignals } from '@/lib/scrapers/jobs';
import type { JobPosting } from '@/lib/scrapers/jobs';

export async function GET() {
  try {
    const [companies, jobSignals] = await Promise.all([
      getAllCompanies(),
      getAllJobSignals(),
    ]);

    if (jobSignals.length === 0) {
      return NextResponse.json({
        totalJobs: 0,
        results: [],
        analyses: [],
      });
    }

    // Convert DB JobSignal format to JobPosting format for analyzeJobSignals
    const jobPostings: JobPosting[] = jobSignals.map(signal => ({
      companyId: signal.company_id,
      title: signal.role_title || '',
      department: signal.department,
      location: signal.location,
      url: signal.url || '',
      postedAt: signal.detected_at,
    }));

    const analyses = analyzeJobSignals(jobPostings);

    // Group by company for results
    const byCompany = new Map<string, number>();
    for (const job of jobPostings) {
      byCompany.set(job.companyId, (byCompany.get(job.companyId) || 0) + 1);
    }

    const results = [...byCompany.entries()].map(([companyId, count]) => {
      const company = companies.find(c => c.id === companyId);
      const analysis = analyses.find(a => a.companyId === companyId);
      return {
        company: company?.name || companyId,
        jobs: count,
        signals: analysis?.signals || [],
      };
    });

    return NextResponse.json({
      totalJobs: jobSignals.length,
      results,
      analyses,
    });
  } catch (error) {
    console.error('Error fetching jobs from DB:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
