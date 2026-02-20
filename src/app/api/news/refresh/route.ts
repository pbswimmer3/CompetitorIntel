import { NextResponse } from 'next/server';
import { getAllCompanies, insertNewsItem, getDb } from '@/lib/db';
import { fetchCompanyNews, cleanTitle } from '@/lib/scrapers/news';

export async function POST() {
  try {
    const companies = getAllCompanies();
    const results: { company: string; added: number; errors: string[] }[] = [];

    for (const company of companies) {
      const companyResult = { company: company.name, added: 0, errors: [] as string[] };

      try {
        const newsItems = await fetchCompanyNews(company, 5);

        for (const item of newsItems) {
          try {
            // Check if we already have this article (by title)
            const db = getDb();
            const existing = db.prepare(
              'SELECT id FROM news_items WHERE title = ? OR url = ?'
            ).get(cleanTitle(item.title), item.link);

            if (!existing) {
              insertNewsItem({
                company_id: company.id,
                title: cleanTitle(item.title),
                url: item.link,
                source: item.source,
                published_at: new Date(item.pubDate).toISOString(),
                raw_content: item.content,
                ai_summary: null,
                ai_category: null,
                ai_significance: null,
                ai_implications: null
              });
              companyResult.added++;
            }
          } catch (err) {
            companyResult.errors.push(`Failed to insert: ${item.title}`);
          }
        }
      } catch (err) {
        companyResult.errors.push(`Failed to fetch news: ${err}`);
      }

      results.push(companyResult);

      // Small delay between companies to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const totalAdded = results.reduce((sum, r) => sum + r.added, 0);

    return NextResponse.json({
      success: true,
      totalAdded,
      results
    });
  } catch (error) {
    console.error('Error refreshing news:', error);
    return NextResponse.json(
      { error: 'Failed to refresh news' },
      { status: 500 }
    );
  }
}
