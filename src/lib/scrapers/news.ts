import Parser from 'rss-parser';
import { Company } from '@/lib/db';

const parser = new Parser({
  customFields: {
    item: ['source']
  }
});

export interface RawNewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  content: string;
}

// Google News RSS search URL builder
function buildGoogleNewsUrl(companyName: string, additionalTerms: string[] = []): string {
  const searchTerms = [companyName, ...additionalTerms].join('+');
  return `https://news.google.com/rss/search?q=${encodeURIComponent(searchTerms)}&hl=en-US&gl=US&ceid=US:en`;
}

// Fetch news for a single company
export async function fetchCompanyNews(company: Company, maxItems: number = 10): Promise<RawNewsItem[]> {
  const searchTerms = getSearchTermsForCompany(company);
  const url = buildGoogleNewsUrl(company.name, searchTerms);

  try {
    const feed = await parser.parseURL(url);

    return feed.items.slice(0, maxItems).map(item => ({
      title: item.title || '',
      link: item.link || '',
      pubDate: item.pubDate || new Date().toISOString(),
      source: extractSource(item.title || ''),
      content: item.contentSnippet || item.content || ''
    }));
  } catch (error) {
    console.error(`Error fetching news for ${company.name}:`, error);
    return [];
  }
}

// Fetch news for all companies
export async function fetchAllCompanyNews(
  companies: Company[],
  maxItemsPerCompany: number = 5
): Promise<Map<string, RawNewsItem[]>> {
  const results = new Map<string, RawNewsItem[]>();

  // Process companies sequentially to avoid rate limiting
  for (const company of companies) {
    const news = await fetchCompanyNews(company, maxItemsPerCompany);
    results.set(company.id, news);
    // Small delay between requests
    await delay(500);
  }

  return results;
}

// Get company-specific search terms to improve relevance
// NOTE: Using minimal terms to get broader results - only add terms for generic company names
function getSearchTermsForCompany(company: Company): string[] {
  // Only add qualifying terms for companies with very generic names
  // to avoid unrelated results (e.g., "IBM" returns too much noise without context)
  const companySpecificTerms: Record<string, string[]> = {
    'microsoft': ['automation OR "process mining"'],
    'ibm': ['automation OR "process mining"'],
    'sap-signavio': []  // "SAP Signavio" is specific enough
  };

  return companySpecificTerms[company.id] || [];
}

// Extract source from Google News title (format: "Title - Source")
function extractSource(title: string): string {
  const parts = title.split(' - ');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return 'Unknown';
}

// Helper to clean title (remove source suffix)
export function cleanTitle(title: string): string {
  const parts = title.split(' - ');
  if (parts.length > 1) {
    return parts.slice(0, -1).join(' - ').trim();
  }
  return title;
}

// Simple delay helper
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// PR Newswire RSS feed for direct press releases
export interface PRNewsItem extends RawNewsItem {
  companyId: string;
}

// Fetch press releases from PR Newswire and Business Wire
export async function fetchPRNewswire(companies: Company[]): Promise<PRNewsItem[]> {
  const results: PRNewsItem[] = [];

  // PR Newswire search feeds for each company
  const companySearchTerms: Record<string, string[]> = {
    'celonis': ['Celonis'],
    'uipath': ['UiPath'],
    'abbyy': ['ABBYY'],
    'automation-anywhere': ['Automation Anywhere'],
    'sap-signavio': ['SAP Signavio', 'Signavio'],
    'skan-ai': ['Skan.AI', 'Skan AI'],
    'apromore': ['Apromore'],
    // Skip IBM and Microsoft as they have too many unrelated press releases
  };

  for (const company of companies) {
    const searchTerms = companySearchTerms[company.id];
    if (!searchTerms) continue;

    for (const term of searchTerms) {
      try {
        // PR Newswire RSS feed
        const prNewswireUrl = `https://www.prnewswire.com/rss/news-releases-list.rss?searchTerms=${encodeURIComponent(term)}`;

        try {
          const feed = await parser.parseURL(prNewswireUrl);

          for (const item of feed.items.slice(0, 3)) {
            // Verify the company is actually mentioned in title or content
            const titleLower = (item.title || '').toLowerCase();
            const contentLower = (item.contentSnippet || item.content || '').toLowerCase();
            const termLower = term.toLowerCase();

            if (titleLower.includes(termLower) || contentLower.includes(termLower)) {
              results.push({
                title: item.title || '',
                link: item.link || '',
                pubDate: item.pubDate || new Date().toISOString(),
                source: 'PR Newswire',
                content: item.contentSnippet || item.content || '',
                companyId: company.id
              });
            }
          }
        } catch (err) {
          // PR Newswire might block or rate limit - silently continue
          console.log(`PR Newswire fetch failed for ${term}, continuing...`);
        }

        // Business Wire RSS feed
        const businessWireUrl = `https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeEFpRWg==&keyword=${encodeURIComponent(term)}`;

        try {
          const bwFeed = await parser.parseURL(businessWireUrl);

          for (const item of bwFeed.items.slice(0, 3)) {
            const titleLower = (item.title || '').toLowerCase();
            const contentLower = (item.contentSnippet || item.content || '').toLowerCase();
            const termLower = term.toLowerCase();

            if (titleLower.includes(termLower) || contentLower.includes(termLower)) {
              results.push({
                title: item.title || '',
                link: item.link || '',
                pubDate: item.pubDate || new Date().toISOString(),
                source: 'Business Wire',
                content: item.contentSnippet || item.content || '',
                companyId: company.id
              });
            }
          }
        } catch (err) {
          console.log(`Business Wire fetch failed for ${term}, continuing...`);
        }

        // Small delay between requests
        await delay(300);
      } catch (err) {
        console.error(`Error fetching PR for ${company.name}:`, err);
      }
    }
  }

  // Deduplicate by title
  const seen = new Set<string>();
  return results.filter(item => {
    const key = item.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// GlobeNewswire RSS for additional coverage
export async function fetchGlobeNewswire(companies: Company[]): Promise<PRNewsItem[]> {
  const results: PRNewsItem[] = [];

  // GlobeNewswire category feeds relevant to process mining/automation
  const categoryFeeds = [
    'https://www.globenewswire.com/RssFeed/subjectcode/25-Business%20Process%20Management/feedTitle/GlobeNewswire%20-%20Business%20Process%20Management',
    'https://www.globenewswire.com/RssFeed/subjectcode/32-Enterprise%20Software/feedTitle/GlobeNewswire%20-%20Enterprise%20Software'
  ];

  const companyNames = new Map(companies.map(c => [c.name.toLowerCase(), c.id]));

  for (const feedUrl of categoryFeeds) {
    try {
      const feed = await parser.parseURL(feedUrl);

      for (const item of feed.items.slice(0, 10)) {
        const titleLower = (item.title || '').toLowerCase();
        const contentLower = (item.contentSnippet || item.content || '').toLowerCase();

        // Check if any of our tracked companies are mentioned
        for (const [name, id] of companyNames) {
          if (titleLower.includes(name) || contentLower.includes(name)) {
            results.push({
              title: item.title || '',
              link: item.link || '',
              pubDate: item.pubDate || new Date().toISOString(),
              source: 'GlobeNewswire',
              content: item.contentSnippet || item.content || '',
              companyId: id
            });
            break; // Only add once per item
          }
        }
      }

      await delay(300);
    } catch (err) {
      console.error('Error fetching GlobeNewswire:', err);
    }
  }

  return results;
}

// Batch fetch with proper error handling
export async function batchFetchNews(
  companies: Company[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ companyId: string; news: RawNewsItem[] }[]> {
  const results: { companyId: string; news: RawNewsItem[] }[] = [];

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    try {
      const news = await fetchCompanyNews(company, 5);
      results.push({ companyId: company.id, news });
    } catch (error) {
      console.error(`Failed to fetch news for ${company.name}:`, error);
      results.push({ companyId: company.id, news: [] });
    }

    if (onProgress) {
      onProgress(i + 1, companies.length);
    }

    // Rate limiting delay
    if (i < companies.length - 1) {
      await delay(1000);
    }
  }

  return results;
}
