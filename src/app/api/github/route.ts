import { NextResponse } from 'next/server';
import { getAllCompanies, getCompanyById } from '@/lib/db';
import { fetchAllGitHubActivity, fetchCompanyGitHub } from '@/lib/scrapers/github';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');

    if (companyId) {
      // Fetch for single company
      const company = await getCompanyById(companyId);
      if (!company) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        );
      }

      const activity = await fetchCompanyGitHub(company);
      return NextResponse.json({ activity });
    }

    // Fetch for all companies
    const companies = await getAllCompanies();
    const activities = await fetchAllGitHubActivity(companies);

    return NextResponse.json({
      activities,
      totalRepos: activities.reduce((sum, a) => sum + a.totalPublicRepos, 0),
      totalStars: activities.reduce((sum, a) => sum + a.totalStars, 0),
    });
  } catch (error) {
    console.error('Error fetching GitHub activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub activity' },
      { status: 500 }
    );
  }
}
