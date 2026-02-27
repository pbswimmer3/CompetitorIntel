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
  jobSignals?: {
    company: string;
    totalOpenings: number;
    signals: string[];
  }[];
  secFilingInsights?: {
    company: string;
    formType: string;
    filedDate: string;
    summary: string;
  }[];
}

export async function generateBriefing(weekData: WeekData): Promise<string> {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: `You are the head of competitive intelligence at a top-tier strategy consulting firm, writing a weekly briefing for the CEO and leadership team of Skan.AI.

Today's date is ${today}.

ABOUT SKAN.AI:
- Series B process intelligence startup (~$50M raised)
- Unique approach: Computer vision-based process discovery (watches screens, no logs needed)
- Key advantages: Non-invasive (no IT integration), works on any app, deploys in days not months
- Target market: Enterprise companies wanting to understand how work actually gets done
- Current challenges: Competing against Celonis's market dominance and Microsoft's bundling strategy

YOUR ROLE:
You're not summarizing news - you're providing STRATEGIC INTELLIGENCE. Think like a board member:
- What signals indicate where the market is heading?
- What competitor moves require a response?
- What windows of opportunity are opening or closing?
- What would you bet money on happening in the next 6-12 months?

WRITING STYLE:
- Direct and confident - take positions, don't hedge everything
- Specific - name names, cite evidence, give timeframes
- Actionable - every insight should connect to a "so what" for Skan.AI
- Contrarian where warranted - if conventional wisdom is wrong, say so`,
    messages: [
      {
        role: 'user',
        content: `Generate an executive intelligence briefing based on this data:

## News Intelligence (${weekData.totalNewsCount} articles, ${weekData.highPriorityAlerts} high-priority)
${JSON.stringify(weekData.newsItems, null, 2)}

## Detected Market Trends
${JSON.stringify(weekData.trends, null, 2)}
${weekData.jobSignals && weekData.jobSignals.length > 0 ? `
## Job Signal Intelligence
${weekData.jobSignals.map(j => `- ${j.company}: ${j.totalOpenings} open roles${j.signals.length > 0 ? ` | Signals: ${j.signals.join(', ')}` : ''}`).join('\n')}
` : ''}${weekData.secFilingInsights && weekData.secFilingInsights.length > 0 ? `
## SEC Filing Intelligence (AI-Analyzed)
${weekData.secFilingInsights.map(s => `- ${s.company} ${s.formType} (filed ${s.filedDate}): ${s.summary}`).join('\n\n')}
` : ''}

Structure your briefing as follows:

## Executive Summary
(3 bullet points: The ONE thing leadership must know, the biggest threat this week, the biggest opportunity this week)

## Market Dynamics
(What's actually happening in the market? Cut through the PR. What are the 2nd and 3rd order effects of major announcements?)

## Competitive Moves That Matter
(Focus on moves that require a RESPONSE from Skan.AI. For each:)
- What happened
- Why it matters (be specific about market impact)
- Threat level: 🔴 High / 🟡 Medium / 🟢 Low
- Recommended response

## Signal Detection
(What leading indicators are you seeing? These are things that PREDICT future competitor moves:)
- Hiring patterns suggesting new product areas
- Partnership announcements hinting at strategy shifts
- Messaging changes indicating repositioning
- Funding/M&A activity suggesting consolidation

## Trends Requiring Strategic Response
(Connect the dots across multiple signals. What patterns are emerging that Skan.AI needs to get ahead of?)

## This Week's Priorities
(Exactly 3 specific, actionable items ranked by urgency. Format:)
1. [URGENT/IMPORTANT/MONITOR] Action item with specific next step
2. ...
3. ...

## 30-Day Outlook
(What should leadership expect to see in the next month? Make 2-3 specific predictions based on current signals.)`
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

// Structured trend type for database storage
export interface DetectedTrend {
  title: string;
  description: string;
  type: 'product' | 'market' | 'hiring' | 'funding';
  relatedCompanies: string[];
}

export interface AnalysisWithTrendsResult {
  analyses: NewsAnalysis[];
  trends: DetectedTrend[];
}

// Enhanced analysis that returns both news categorization and detected trends
export async function analyzeNewsWithTrends(
  newsItems: { id: number; title: string; content: string; source: string; company: string }[]
): Promise<AnalysisWithTrendsResult> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: `You are a senior competitive intelligence analyst specializing in the process mining, intelligent automation, and enterprise software industry.

Your client is Skan.AI, a Series B startup with these differentiators:
- Computer vision-based, non-invasive process discovery (no system logs needed)
- Works across any desktop application without IT integration
- Quick time-to-value (days vs months for traditional tools)

Key competitors to watch:
- Celonis: Market leader ($13B valuation), execution management platform
- UiPath: Public company, RPA leader expanding into process mining
- ABBYY: Process intelligence + document AI
- Microsoft: Process Advisor in Power Platform (bundled with enterprise licenses)
- IBM: watsonx process mining (enterprise focus)
- SAP Signavio: Acquired by SAP (ERP integration advantage)
- Automation Anywhere: RPA + process discovery
- Apromore: Open source (recently acquired by Salesforce)

Analyze news with a focus on:
1. What does this ACTUALLY mean (cut through PR spin)?
2. Is this a leading indicator of something bigger?
3. What should Skan.AI do about it?`,
    messages: [
      {
        role: 'user',
        content: `Analyze these news items and identify patterns/trends across them.

News items:
${JSON.stringify(newsItems.map(i => ({ title: i.title, content: i.content, source: i.source, company: i.company })), null, 2)}

Provide your analysis in this exact JSON format (no markdown, no code blocks):
{
  "analyses": [
    {
      "title": "exact title from input",
      "category": "funding|product|partnership|hiring|executive|other",
      "significance": "high|medium|low",
      "summary": "One sentence cutting through the PR spin - what does this actually mean?",
      "implication": "Specific implication for Skan.AI - what should they consider doing?"
    }
  ],
  "trends": [
    {
      "title": "Short trend title (e.g., 'AI Agent Positioning Race')",
      "description": "2-3 sentences explaining the pattern you're seeing across multiple news items and why it matters",
      "type": "product|market|hiring|funding",
      "relatedCompanies": ["company1", "company2"]
    }
  ]
}

Rules:
- significance=high: Major market impact, acquisition, significant funding, leadership change at key competitor
- significance=medium: Notable product launch, partnership, or expansion
- significance=low: Routine announcements, minor updates, PR fluff
- Only include trends you can support with evidence from multiple news items
- Be specific in implications - vague advice is useless`
      }
    ]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    // Clean up potential markdown formatting
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedText) as AnalysisWithTrendsResult;
  } catch {
    console.error('Failed to parse Claude analysis response:', text);
    return {
      analyses: [],
      trends: []
    };
  }
}

// Analyze a SEC filing document and return competitive intelligence summary
export async function analyzeSecFiling(
  content: string,
  companyName: string,
  formType: string
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: `You are a competitive intelligence analyst for Skan.AI, a Series B computer vision-based process intelligence startup. You analyze SEC filings to extract strategic intelligence relevant to the process mining and enterprise automation market.

Key competitors tracked: Celonis, UiPath, ABBYY, Microsoft, IBM, SAP Signavio, Automation Anywhere, Apromore.

Your job is to cut through the regulatory language and surface what actually matters for a competitor watching this company.`,
    messages: [
      {
        role: 'user',
        content: `Analyze this ${formType} filing from ${companyName} and provide competitive intelligence.

Filing content (key sections):
${content.slice(0, 60000)}

Provide a structured analysis covering:
1. **Revenue & Growth Signals** - What do the numbers say about their business momentum?
2. **Product & Technology Strategy** - What are they building or investing in?
3. **Competitive Positioning** - How do they describe their competition? Who do they name?
4. **Market Expansion** - New geographies, verticals, or customer segments?
5. **Risk Factors That Reveal Strategy** - What threats do they acknowledge that reveal their strategic concerns?
6. **Implication for Skan.AI** - The 1-2 most actionable insights for Skan.AI's strategy

Be specific and direct. Cite specific phrases or data from the filing where possible. Keep the total response to 400-600 words.`
      }
    ]
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

// Generate a quick summary of multiple trends (legacy function)
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
