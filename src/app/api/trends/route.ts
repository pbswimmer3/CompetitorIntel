import { NextResponse } from 'next/server';
import { getAllTrends, getCompanyById } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const trends = await getAllTrends(limit);

    // Enrich with company names
    const enrichedTrends = await Promise.all(
      trends.map(async (trend) => {
        let relatedCompanies: { id: string; name: string }[] = [];
        try {
          const companyIds = JSON.parse(trend.related_companies) as string[];
          relatedCompanies = await Promise.all(
            companyIds.map(async (id) => {
              const company = await getCompanyById(id);
              return {
                id,
                name: company?.name || id
              };
            })
          );
        } catch {
          // If JSON parse fails, leave empty
        }

        return {
          ...trend,
          related_companies_parsed: relatedCompanies
        };
      })
    );

    return NextResponse.json({ trends: enrichedTrends });
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    );
  }
}
