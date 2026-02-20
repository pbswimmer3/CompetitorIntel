import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // Uses ANTHROPIC_API_KEY env var

export interface NewsAnalysis {
  title: string;
  category: 'funding' | 'product' | 'partnership' | 'hiring' | 'executive' | 'other';
  significance: 'high' | 'medium' | 'low';
  summary: string;
  implication: string;
}

export interface AnalysisResult {
  analyses: NewsAnalysis[];
  cross_cutting_trends: string[];
}

export interface NewsItemForAnalysis {
  title: string;
  content: string;
  source: string;
  company?: string;
}

export async function analyzeNews(newsItems: NewsItemForAnalysis[]): Promise<AnalysisResult> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: `You are a competitive intelligence analyst specializing in the process mining and enterprise automation industry.

Key players in this space include:
- Celonis (market leader, $13B valuation)
- UiPath (public company, RPA + process mining)
- ABBYY (process intelligence + document AI)
- Microsoft (Process Advisor in Power Platform)
- IBM (watsonx process mining)
- SAP Signavio (acquired by SAP)
- Automation Anywhere (RPA + process discovery)
- Apromore (open source)
- Skan.AI (Series B, computer vision-based process intelligence - our client)

Analyze news items and provide structured insights relevant to a Series B process intelligence startup.`,
    messages: [
      {
        role: 'user',
        content: `Analyze these news items about process mining companies. For each, provide:
1. Category (funding/product/partnership/hiring/executive/other)
2. Significance (high/medium/low) - high means major market impact, medium means notable but expected, low means routine
3. One-sentence summary
4. Strategic implication for a Series B process intelligence startup competing in this space

News items:
${JSON.stringify(newsItems, null, 2)}

Respond in JSON format only (no markdown, no code blocks):
{
  "analyses": [
    {
      "title": "...",
      "category": "...",
      "significance": "...",
      "summary": "...",
      "implication": "..."
    }
  ],
  "cross_cutting_trends": ["trend 1", "trend 2"]
}`
      }
    ]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    return JSON.parse(text) as AnalysisResult;
  } catch {
    console.error('Failed to parse Claude response:', text);
    return {
      analyses: [],
      cross_cutting_trends: []
    };
  }
}

export interface WeekData {
  newsItems: {
    company: string;
    title: string;
    category: string;
    significance: string;
    summary: string;
  }[];
  trends: {
    title: string;
    description: string;
  }[];
  highPriorityAlerts: number;
  totalNewsCount: number;
}

export async function generateBriefing(weekData: WeekData): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    system: `You are a senior strategy analyst writing a weekly competitive intelligence briefing for the leadership team of Skan.AI, a Series B process intelligence startup.

Skan.AI differentiates through:
- Computer vision-based, non-invasive process discovery
- No need for system logs or IT integration
- Works across any desktop application
- Quick time-to-value (days vs months)

The briefing should be actionable, insightful, and focused on strategic implications. Write in a professional but direct tone. Avoid jargon and be specific about recommendations.`,
    messages: [
      {
        role: 'user',
        content: `Generate a weekly competitive intelligence briefing based on this data:

${JSON.stringify(weekData, null, 2)}

Structure:
## Market Pulse
(2-3 sentence overview of the week - what's the big picture?)

## Top Developments
(Top 3 most significant events with analysis - be specific about why they matter)

## Company Updates
(Brief update per company with notable activity - only include companies with news)

## Trends to Watch
(Emerging patterns across the competitive landscape - connect the dots)

## Strategic Implications for Skan.AI
(What this means for positioning, product, and GTM - be specific and actionable)

## Recommended Actions
(2-3 specific things leadership should consider this week - prioritized and concrete)`
      }
    ]
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

// Analyze a single news item for quick categorization
export async function categorizeNewsItem(item: NewsItemForAnalysis): Promise<NewsAnalysis | null> {
  try {
    const result = await analyzeNews([item]);
    return result.analyses[0] || null;
  } catch (error) {
    console.error('Failed to categorize news item:', error);
    return null;
  }
}

// Generate a quick summary of multiple trends
export async function analyzeTrends(
  newsItems: { title: string; company: string; category: string }[]
): Promise<string[]> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: 'You are a competitive intelligence analyst. Identify 3-5 key trends from the provided news data.',
    messages: [
      {
        role: 'user',
        content: `Identify the top trends from these recent news items in the process mining industry:

${JSON.stringify(newsItems, null, 2)}

Respond with a JSON array of trend descriptions (just the array, no other text):
["Trend 1: description", "Trend 2: description", ...]`
      }
    ]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]';

  try {
    return JSON.parse(text) as string[];
  } catch {
    console.error('Failed to parse trends response:', text);
    return [];
  }
}
