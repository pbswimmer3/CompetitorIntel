import { NextResponse } from 'next/server';
import { getAllNews, getNewsByCompany, getNewsByCategory, getHighSignificanceNews, getCompanyById } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company');
    const category = searchParams.get('category');
    const significance = searchParams.get('significance');
    const limit = parseInt(searchParams.get('limit') || '50');

    let news;

    if (companyId) {
      news = getNewsByCompany(companyId, limit);
    } else if (category) {
      news = getNewsByCategory(category, limit);
    } else if (significance === 'high') {
      news = getHighSignificanceNews(limit);
    } else {
      news = getAllNews(limit);
    }

    // Enrich with company names
    const enrichedNews = news.map(item => {
      const company = getCompanyById(item.company_id);
      return {
        ...item,
        company_name: company?.name || 'Unknown',
        company_slug: company?.slug || ''
      };
    });

    return NextResponse.json({ news: enrichedNews });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
