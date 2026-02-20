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
