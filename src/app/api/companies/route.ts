import { NextResponse } from 'next/server';
import { getAllCompanies, getStats } from '@/lib/db';

export async function GET() {
  try {
    const companies = getAllCompanies();
    const stats = getStats();

    return NextResponse.json({
      companies,
      stats
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}
