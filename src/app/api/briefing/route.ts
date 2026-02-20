import { NextResponse } from 'next/server';
import { generateBriefing, WeekData } from '@/lib/claude';
import {
  getAllNews,
  getAllTrends,
  getLatestBriefing,
  getAllBriefings,
  insertBriefing,
  getCompanyById,
  getStats
} from '@/lib/db';
import { format, startOfWeek } from 'date-fns';

export async function GET() {
  try {
    const [briefings, latest] = await Promise.all([
      getAllBriefings(10),
      getLatestBriefing()
    ]);

    return NextResponse.json({
      briefings,
      latest
    });
  } catch (error) {
    console.error('Error fetching briefings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch briefings' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Gather data for briefing
    const [news, trends, stats] = await Promise.all([
      getAllNews(50),
      getAllTrends(10),
      getStats()
    ]);

    // Prepare data for Claude
    const newsItemsWithCompany = await Promise.all(
      news.map(async (item) => {
        const company = await getCompanyById(item.company_id);
        return {
          company: company?.name || 'Unknown',
          title: item.title,
          category: item.ai_category || 'other',
          significance: item.ai_significance || 'low',
          summary: item.ai_summary || item.title
        };
      })
    );

    const weekData: WeekData = {
      newsItems: newsItemsWithCompany,
      trends: trends.map(t => ({
        title: t.title,
        description: t.description || ''
      })),
      highPriorityAlerts: stats.highAlertCount,
      totalNewsCount: stats.newsCount
    };

    // Generate briefing using Claude
    const briefingContent = await generateBriefing(weekData);

    // Store in database
    const weekOf = format(startOfWeek(new Date()), 'yyyy-MM-dd');
    const briefingId = await insertBriefing({
      week_of: weekOf,
      content: briefingContent
    });

    return NextResponse.json({
      success: true,
      briefingId,
      weekOf,
      content: briefingContent
    });
  } catch (error) {
    console.error('Error generating briefing:', error);
    return NextResponse.json(
      { error: 'Failed to generate briefing' },
      { status: 500 }
    );
  }
}
