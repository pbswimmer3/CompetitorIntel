import { Company } from '@/lib/db';

export interface SECFiling {
  companyId: string;
  companyName: string;
  cik: string;
  accessionNumber: string;
  filingType: '10-K' | '10-Q' | '8-K' | 'DEF 14A' | 'other';
  filingDate: string;
  reportDate: string | null;
  description: string;
  url: string;
  documentUrl: string | null;
}

export interface SECCompanyInfo {
  companyId: string;
  cik: string;
  name: string;
  sic: string | null;
  sicDescription: string | null;
  fiscalYearEnd: string | null;
  recentFilings: SECFiling[];
  signals: string[];
}

// Map company IDs to SEC CIK numbers (only public companies)
const companyCIKs: Record<string, { cik: string; name: string }> = {
  'uipath': { cik: '0001856437', name: 'UiPath Inc' },
  'microsoft': { cik: '0000789019', name: 'Microsoft Corporation' },
  'ibm': { cik: '0000051143', name: 'International Business Machines Corp' },
  'sap-signavio': { cik: '0001000184', name: 'SAP SE' }, // SAP owns Signavio
};

// SEC EDGAR API base URL
const SEC_API_BASE = 'https://data.sec.gov';

// Headers for the EDGAR submissions JSON API
const SEC_HEADERS = {
  'User-Agent': 'CompetitorIntelDashboard/1.0 admin@competitor-intel.com',
  'Accept': 'application/json',
};

// Headers for fetching actual filing documents (HTML/text, not JSON)
const SEC_DOC_HEADERS = {
  'User-Agent': 'CompetitorIntelDashboard/1.0 admin@competitor-intel.com',
  'Accept': 'text/html,application/xhtml+xml,text/plain,*/*',
};

// Filing types we're interested in
const RELEVANT_FILING_TYPES = ['10-K', '10-Q', '8-K', 'DEF 14A'];

// Fetch company submissions from SEC EDGAR
async function fetchCompanySubmissions(cik: string): Promise<any> {
  try {
    // Remove leading zeros for the API call, then pad to 10 digits
    const paddedCik = cik.replace(/^0+/, '').padStart(10, '0');

    const response = await fetch(
      `${SEC_API_BASE}/submissions/CIK${paddedCik}.json`,
      { headers: SEC_HEADERS }
    );

    if (!response.ok) {
      console.log(`SEC API returned ${response.status} for CIK ${cik}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching SEC data for CIK ${cik}:`, error);
    return null;
  }
}

// Parse filings from SEC submission data
function parseFilings(
  companyId: string,
  companyName: string,
  cik: string,
  submissions: any
): SECFiling[] {
  const filings: SECFiling[] = [];

  if (!submissions?.filings?.recent) {
    return filings;
  }

  const recent = submissions.filings.recent;
  const count = Math.min(recent.form?.length || 0, 50); // Get last 50 filings

  for (let i = 0; i < count; i++) {
    const form = recent.form[i];

    // Filter to relevant filing types
    if (!RELEVANT_FILING_TYPES.includes(form)) {
      continue;
    }

    const accessionNumber = recent.accessionNumber[i].replace(/-/g, '');
    const filingDate = recent.filingDate[i];
    const reportDate = recent.reportDate?.[i] || null;
    const primaryDocument = recent.primaryDocument?.[i] || '';
    const description = recent.primaryDocDescription?.[i] || form;

    // Construct URLs
    const baseUrl = `https://www.sec.gov/Archives/edgar/data/${cik.replace(/^0+/, '')}/${accessionNumber}`;
    const documentUrl = primaryDocument ? `${baseUrl}/${primaryDocument}` : null;

    filings.push({
      companyId,
      companyName,
      cik,
      accessionNumber: recent.accessionNumber[i],
      filingType: form as SECFiling['filingType'],
      filingDate,
      reportDate,
      description,
      url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=${form}&dateb=&owner=include&count=10`,
      documentUrl,
    });
  }

  return filings;
}

// Generate signals from filings
function generateSignals(filings: SECFiling[]): string[] {
  const signals: string[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Recent 10-K filing
  const recent10K = filings.find(f =>
    f.filingType === '10-K' &&
    new Date(f.filingDate) > new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  );
  if (recent10K) {
    signals.push(`Annual Report (10-K) filed ${recent10K.filingDate}`);
  }

  // Recent 10-Q filings
  const recent10Qs = filings.filter(f =>
    f.filingType === '10-Q' &&
    new Date(f.filingDate) > thirtyDaysAgo
  );
  if (recent10Qs.length > 0) {
    signals.push(`Quarterly Report (10-Q) filed recently`);
  }

  // Recent 8-K filings (material events)
  const recent8Ks = filings.filter(f =>
    f.filingType === '8-K' &&
    new Date(f.filingDate) > thirtyDaysAgo
  );
  if (recent8Ks.length > 0) {
    signals.push(`${recent8Ks.length} material event(s) reported in last 30 days`);
  }

  // Proxy statement
  const recentProxy = filings.find(f =>
    f.filingType === 'DEF 14A' &&
    new Date(f.filingDate) > new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  );
  if (recentProxy) {
    signals.push(`Proxy statement filed (executive compensation details)`);
  }

  return signals;
}

// Fetch SEC filings for a single company
export async function fetchCompanySEC(company: Company): Promise<SECCompanyInfo | null> {
  const secInfo = companyCIKs[company.id];

  if (!secInfo) {
    // Not a public company we track
    return null;
  }

  const submissions = await fetchCompanySubmissions(secInfo.cik);

  if (!submissions) {
    return null;
  }

  const filings = parseFilings(
    company.id,
    secInfo.name,
    secInfo.cik,
    submissions
  );

  const signals = generateSignals(filings);

  return {
    companyId: company.id,
    cik: secInfo.cik,
    name: submissions.name || secInfo.name,
    sic: submissions.sic || null,
    sicDescription: submissions.sicDescription || null,
    fiscalYearEnd: submissions.fiscalYearEnd || null,
    recentFilings: filings.slice(0, 20), // Return last 20 relevant filings
    signals,
  };
}

// Fetch SEC filings for all public companies
export async function fetchAllSECFilings(companies: Company[]): Promise<SECCompanyInfo[]> {
  const results: SECCompanyInfo[] = [];

  for (const company of companies) {
    try {
      const secInfo = await fetchCompanySEC(company);
      if (secInfo) {
        results.push(secInfo);
      }

      // Rate limiting - SEC asks for no more than 10 requests per second
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error fetching SEC data for ${company.name}:`, error);
    }
  }

  return results;
}

// Get list of public companies we can track
export function getPublicCompanies(): string[] {
  return Object.keys(companyCIKs);
}

// Check if a company is public
export function isPublicCompany(companyId: string): boolean {
  return companyId in companyCIKs;
}

// Fetch a SEC document and return plain text
export async function fetchSECDocumentText(documentUrl: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(documentUrl, {
      headers: SEC_DOC_HEADERS,
      signal: AbortSignal.timeout(30000), // 30-second timeout
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`SEC document fetch error: ${msg} (URL: ${documentUrl})`);
  }

  if (!response.ok) {
    throw new Error(`SEC document fetch failed: HTTP ${response.status} for ${documentUrl}`);
  }

  const html = await response.text();

  // Strip HTML to plain text
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return text;
}

// Extract the text between two item markers (e.g. ITEM 1 to ITEM 1A)
// Retries up to 5 times to skip table-of-contents entries (which are very short)
// and find the actual section content.
function extractBetweenItems(text: string, startItem: string, endItem: string): string {
  // Match "Item 1." / "ITEM 1." / "Item 1 " etc.
  const endRegex = new RegExp(`(?:^|\\s)ITEM\\s+${endItem}[.\\s]`, 'i');

  let pos = 0;
  for (let attempt = 0; attempt < 5; attempt++) {
    const startRegex = new RegExp(`(?:^|\\s)ITEM\\s+${startItem}[.\\s]`, 'i');
    const relIdx = text.slice(pos).search(startRegex);
    if (relIdx === -1) break;

    const absStart = pos + relIdx;
    const remainder = text.slice(absStart);
    const endIdx = remainder.search(endRegex);
    const section = endIdx === -1 ? remainder : remainder.slice(0, endIdx);

    // If we have substantial content (not just a TOC line like "Item 1. Business 4"),
    // this is the real section — return it.
    if (section.trim().length > 500) {
      return section.slice(0, 25000);
    }

    // Too short — this was a TOC entry. Advance past it and try the next occurrence.
    pos = absStart + 8;
  }

  return '';
}

// Extract competitive-intelligence-relevant sections based on filing type
export function extractFilingSections(text: string, formType: string): string {
  if (formType === '8-K') {
    // 8-Ks are short – return the full text (capped)
    return text.slice(0, 50000);
  }

  if (formType === '10-Q') {
    // Item 2: MD&A; Item 3: Quantitative disclosures (less useful)
    const mda = extractBetweenItems(text, '2', '3');
    return mda || text.slice(0, 40000);
  }

  // 10-K: Items 1 (Business), 1A (Risk Factors), 7 (MD&A)
  const item1 = extractBetweenItems(text, '1', '1A');
  const item1A = extractBetweenItems(text, '1A', '1B');
  const item7 = extractBetweenItems(text, '7', '7A');

  const combined = [item1, item1A, item7].filter(Boolean).join('\n\n---\n\n');
  return combined || text.slice(0, 60000);
}
