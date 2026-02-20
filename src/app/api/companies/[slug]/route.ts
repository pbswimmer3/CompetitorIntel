import { NextResponse } from 'next/server';
import { getCompanyBySlug, getNewsByCompany, getJobsByCompany } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const company = await getCompanyBySlug(slug);

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const [news, jobs] = await Promise.all([
      getNewsByCompany(company.id),
      getJobsByCompany(company.id)
    ]);

    return NextResponse.json({
      company,
      news,
      jobs
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}
