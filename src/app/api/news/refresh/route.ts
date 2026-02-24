import { NextResponse } from 'next/server';
import { getAllCompanies, insertNewsItem, checkNewsExists, insertTrend, getAllNews } from '@/lib/db';
import { fetchCompanyNews, fetchPRNewswire, cleanTitle } from '@/lib/scrapers/news';
import { analyzeNewsWithTrends } from '@/lib/claude';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const skipAnalysis = searchParams.get('skipAnalysis') === 'true';

    const companies = await getAllCompanies();
    const results: { company: string; added: number; errors: string[] }[] = [];
    const allNewItems: { id: number; company_id: string; title: string; content: string; source: string }[] = [];

    // Fetch from Google News for each company
    for (const company of companies) {
      const companyResult = { company: company.name, added: 0, errors: [] as string[] };

      try {
        const newsItems = await fetchCompanyNews(company, 5);

        for (const item of newsItems) {
          try {
            const exists = await checkNewsExists(cleanTitle(item.title), item.link);

            if (!exists) {
              const id = await insertNewsItem({
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

              // Track for batch analysis
              allNewItems.push({
                id,
                company_id: company.id,
                title: cleanTitle(item.title),
                content: item.content,
                source: item.source
              });
            }
          } catch (err) {
            companyResult.errors.push(`Failed to insert: ${item.title}`);
          }
        }
      } catch (err) {
        companyResult.errors.push(`Failed to fetch news: ${err}`);
      }

      results.push(companyResult);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Fetch from PR Newswire for key companies
    const prResult = { company: 'PR Newswire', added: 0, errors: [] as string[] };
    try {
      const prItems = await fetchPRNewswire(companies);

      for (const item of prItems) {
        try {
          const exists = await checkNewsExists(cleanTitle(item.title), item.link);

          if (!exists) {
            const id = await insertNewsItem({
              company_id: item.companyId,
              title: cleanTitle(item.title),
              url: item.link,
              source: 'PR Newswire',
              published_at: new Date(item.pubDate).toISOString(),
              raw_content: item.content,
              ai_summary: null,
              ai_category: null,
              ai_significance: null,
              ai_implications: null
            });
            prResult.added++;

            allNewItems.push({
              id,
              company_id: item.companyId,
              title: cleanTitle(item.title),
              content: item.content,
              source: 'PR Newswire'
            });
          }
        } catch (err) {
          prResult.errors.push(`Failed to insert PR item: ${item.title}`);
        }
      }
    } catch (err) {
      prResult.errors.push(`Failed to fetch PR Newswire: ${err}`);
    }
    results.push(prResult);

    // Run AI analysis on new items if we have any and analysis isn't skipped
    let analysisResult = null;
    let trendsAdded = 0;

    if (allNewItems.length > 0 && !skipAnalysis) {
      try {
        // Get company names for analysis
        const companyMap = new Map(companies.map(c => [c.id, c.name]));

        const itemsForAnalysis = allNewItems.slice(0, 20).map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          source: item.source,
          company: companyMap.get(item.company_id) || 'Unknown'
        }));

        analysisResult = await analyzeNewsWithTrends(itemsForAnalysis);

        // Update news items with AI analysis
        if (analysisResult.analyses) {
          const { updateNewsItemAnalysis } = await import('@/lib/db');

          for (const analysis of analysisResult.analyses) {
            const item = allNewItems.find(i => i.title === analysis.title);
            if (item) {
              await updateNewsItemAnalysis(item.id, {
                ai_summary: analysis.summary,
                ai_category: analysis.category,
                ai_significance: analysis.significance,
                ai_implications: analysis.implication
              });
            }
          }
        }

        // Insert detected trends
        if (analysisResult.trends && analysisResult.trends.length > 0) {
          for (const trend of analysisResult.trends) {
            await insertTrend({
              title: trend.title,
              description: trend.description,
              related_companies: JSON.stringify(trend.relatedCompanies || []),
              trend_type: trend.type || 'market'
            });
            trendsAdded++;
          }
        }
      } catch (err) {
        console.error('Error during AI analysis:', err);
      }
    }

    const totalAdded = results.reduce((sum, r) => sum + r.added, 0);

    return NextResponse.json({
      success: true,
      totalAdded,
      trendsAdded,
      analyzed: analysisResult ? allNewItems.length : 0,
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
