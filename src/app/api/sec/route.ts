import { NextResponse } from 'next/server';
import { getAllCompanies, getCompanyById } from '@/lib/db';
import { fetchAllSECFilings, fetchCompanySEC, getPublicCompanies } from '@/lib/scrapers/sec';

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

      const secInfo = await fetchCompanySEC(company);
      if (!secInfo) {
        return NextResponse.json(
          { error: 'Company is not publicly traded or not tracked', publicCompanies: getPublicCompanies() },
          { status: 404 }
        );
      }

      return NextResponse.json({ secInfo });
    }

    // Fetch for all public companies
    const companies = await getAllCompanies();
    const secFilings = await fetchAllSECFilings(companies);

    // Calculate summary stats
    const totalFilings = secFilings.reduce((sum, s) => sum + s.recentFilings.length, 0);
    const recentMaterialEvents = secFilings.reduce((sum, s) => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return sum + s.recentFilings.filter(f =>
        f.filingType === '8-K' && new Date(f.filingDate) > thirtyDaysAgo
      ).length;
    }, 0);

    return NextResponse.json({
      companies: secFilings,
      publicCompanyCount: secFilings.length,
      totalFilings,
      recentMaterialEvents,
      trackedCIKs: getPublicCompanies(),
    });
  } catch (error) {
    console.error('Error fetching SEC filings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SEC filings' },
      { status: 500 }
    );
  }
}
