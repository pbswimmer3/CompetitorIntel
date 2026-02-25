import { NextResponse } from 'next/server';
import { getAllCompanies, insertJobSignal, clearJobSignals } from '@/lib/db';
import { fetchAllCompanyJobs, analyzeJobSignals } from '@/lib/scrapers/jobs';

export async function POST() {
  try {
    const companies = await getAllCompanies();

    // Fetch all job postings
    const jobs = await fetchAllCompanyJobs(companies);

    // Clear existing job signals and insert fresh data
    await clearJobSignals();

    let inserted = 0;
    for (const job of jobs) {
      try {
        await insertJobSignal({
          company_id: job.companyId,
          role_title: job.title,
          department: job.department,
          location: job.location,
          url: job.url,
        });
        inserted++;
      } catch (err) {
        console.error(`Failed to insert job: ${job.title}`, err);
      }
    }

    // Analyze job signals for patterns
    const analyses = analyzeJobSignals(jobs);

    // Group jobs by company for response
    const byCompany = new Map<string, number>();
    for (const job of jobs) {
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
      success: true,
      totalJobs: inserted,
      results,
      analyses,
    });
  } catch (error) {
    console.error('Error refreshing jobs:', error);
    return NextResponse.json(
      { error: 'Failed to refresh jobs' },
      { status: 500 }
    );
  }
}
