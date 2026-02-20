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
    const briefings = getAllBriefings(10);
    const latest = getLatestBriefing();

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
    const news = getAllNews(50);
    const trends = getAllTrends(10);
    const stats = getStats();

    // Prepare data for Claude
    const weekData: WeekData = {
      newsItems: news.map(item => {
        const company = getCompanyById(item.company_id);
        return {
          company: company?.name || 'Unknown',
          title: item.title,
          category: item.ai_category || 'other',
          significance: item.ai_significance || 'low',
          summary: item.ai_summary || item.title
        };
      }),
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
    const briefingId = insertBriefing({
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
