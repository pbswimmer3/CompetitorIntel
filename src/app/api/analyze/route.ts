import { NextResponse } from 'next/server';
import { analyzeNews, NewsItemForAnalysis } from '@/lib/claude';
import { insertNewsItem, getCompanyById } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { newsItems } = body as { newsItems: (NewsItemForAnalysis & { company_id: string; url?: string })[] };

    if (!newsItems || !Array.isArray(newsItems) || newsItems.length === 0) {
      return NextResponse.json(
        { error: 'newsItems array is required' },
        { status: 400 }
      );
    }

    // Prepare items for Claude analysis
    const itemsForAnalysis: NewsItemForAnalysis[] = await Promise.all(
      newsItems.map(async (item) => {
        const company = item.company_id ? await getCompanyById(item.company_id) : undefined;
        return {
          title: item.title,
          content: item.content,
          source: item.source,
          company: company?.name
        };
      })
    );

    // Call Claude API
    const analysisResult = await analyzeNews(itemsForAnalysis);

    // Store analyzed items in database
    const insertedIds: number[] = [];
    for (let i = 0; i < newsItems.length; i++) {
      const item = newsItems[i];
      const analysis = analysisResult.analyses[i];

      if (analysis) {
        const id = await insertNewsItem({
          company_id: item.company_id,
          title: item.title,
          url: item.url || null,
          source: item.source || null,
          published_at: new Date().toISOString(),
          raw_content: item.content || null,
          ai_summary: analysis.summary,
          ai_category: analysis.category,
          ai_significance: analysis.significance,
          ai_implications: analysis.implication
        });
        insertedIds.push(id);
      }
    }

    return NextResponse.json({
      success: true,
      analyses: analysisResult.analyses,
      trends: analysisResult.cross_cutting_trends,
      insertedIds
    });
  } catch (error) {
    console.error('Error analyzing news:', error);
    return NextResponse.json(
      { error: 'Failed to analyze news' },
      { status: 500 }
    );
  }
}
