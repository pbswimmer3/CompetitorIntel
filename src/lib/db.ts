import { neon } from '@neondatabase/serverless';

// Get database connection
function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(databaseUrl);
}

// Type definitions
export interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  founded_year: number | null;
  funding_total: string | null;
  valuation: string | null;
  employee_count_estimate: number | null;
  category: 'competitor' | 'adjacent' | 'target';
  logo_url: string | null;
  updated_at: string;
}

export interface NewsItem {
  id: number;
  company_id: string;
  title: string;
  url: string | null;
  source: string | null;
  published_at: string | null;
  raw_content: string | null;
  ai_summary: string | null;
  ai_category: 'funding' | 'product' | 'partnership' | 'hiring' | 'executive' | 'other' | null;
  ai_significance: 'high' | 'medium' | 'low' | null;
  ai_implications: string | null;
  created_at: string;
}

export interface Trend {
  id: number;
  title: string;
  description: string | null;
  related_companies: string;
  detected_at: string;
  trend_type: 'product' | 'market' | 'hiring' | 'funding' | null;
}

export interface Briefing {
  id: number;
  week_of: string;
  content: string;
  generated_at: string;
}

export interface JobSignal {
  id: number;
  company_id: string;
  role_title: string | null;
  department: string | null;
  location: string | null;
  url: string | null;
  detected_at: string;
}

export interface SecFilingAnalysis {
  id: number;
  company_id: string;
  filing_id: string;
  form_type: string;
  filed_date: string;
  document_url: string | null;
  ai_summary: string;
  analyzed_at: string;
}

// Initialize database schema
export async function initializeSchema(): Promise<void> {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      website TEXT,
      founded_year INTEGER,
      funding_total TEXT,
      valuation TEXT,
      employee_count_estimate INTEGER,
      category TEXT DEFAULT 'competitor',
      logo_url TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS news_items (
      id SERIAL PRIMARY KEY,
      company_id TEXT REFERENCES companies(id),
      title TEXT NOT NULL,
      url TEXT,
      source TEXT,
      published_at TIMESTAMP,
      raw_content TEXT,
      ai_summary TEXT,
      ai_category TEXT,
      ai_significance TEXT,
      ai_implications TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS trends (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      related_companies TEXT,
      detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      trend_type TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS briefings (
      id SERIAL PRIMARY KEY,
      week_of DATE NOT NULL,
      content TEXT NOT NULL,
      generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS job_signals (
      id SERIAL PRIMARY KEY,
      company_id TEXT REFERENCES companies(id),
      role_title TEXT,
      department TEXT,
      location TEXT,
      url TEXT,
      detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sec_filing_analyses (
      id SERIAL PRIMARY KEY,
      company_id TEXT REFERENCES companies(id),
      filing_id TEXT UNIQUE,
      form_type TEXT,
      filed_date TEXT,
      document_url TEXT,
      ai_summary TEXT,
      analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_news_company ON news_items(company_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_news_published ON news_items(published_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_news_significance ON news_items(ai_significance)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_jobs_company ON job_signals(company_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_briefings_week ON briefings(week_of DESC)`;
}

// Seed companies data
export async function seedCompanies(): Promise<void> {
  const sql = getDb();

  const companies = [
    { id: 'celonis', name: 'Celonis', slug: 'celonis', description: 'Market leader in execution management and process mining', website: 'https://celonis.com', founded_year: 2011, funding_total: '$1.4B', valuation: '$13B', employee_count_estimate: 3000, category: 'competitor' },
    { id: 'uipath', name: 'UiPath', slug: 'uipath', description: 'Enterprise automation and RPA platform with process mining capabilities', website: 'https://uipath.com', founded_year: 2005, funding_total: '$2B', valuation: '$7B', employee_count_estimate: 4000, category: 'competitor' },
    { id: 'abbyy', name: 'ABBYY', slug: 'abbyy', description: 'Intelligent document processing and process intelligence', website: 'https://abbyy.com', founded_year: 1989, funding_total: '$200M', valuation: '$1B', employee_count_estimate: 1200, category: 'competitor' },
    { id: 'microsoft', name: 'Microsoft (Process Advisor)', slug: 'microsoft', description: 'Process mining through Power Automate Process Advisor', website: 'https://powerautomate.microsoft.com', founded_year: 1975, funding_total: 'Public', valuation: '$2.8T', employee_count_estimate: 220000, category: 'competitor' },
    { id: 'ibm', name: 'IBM Process Mining', slug: 'ibm', description: 'Enterprise process mining as part of Cloud Pak for Business Automation', website: 'https://ibm.com/cloud/process-mining', founded_year: 1911, funding_total: 'Public', valuation: '$150B', employee_count_estimate: 280000, category: 'competitor' },
    { id: 'sap-signavio', name: 'SAP Signavio', slug: 'sap-signavio', description: 'Process transformation suite acquired by SAP', website: 'https://signavio.com', founded_year: 2009, funding_total: 'Acquired', valuation: '$1.2B', employee_count_estimate: 500, category: 'competitor' },
    { id: 'automation-anywhere', name: 'Automation Anywhere', slug: 'automation-anywhere', description: 'RPA platform expanding into process discovery', website: 'https://automationanywhere.com', founded_year: 2003, funding_total: '$840M', valuation: '$6.8B', employee_count_estimate: 2500, category: 'adjacent' },
    { id: 'apromore', name: 'Apromore', slug: 'apromore', description: 'Open-source process mining platform', website: 'https://apromore.com', founded_year: 2019, funding_total: '$10M', valuation: null, employee_count_estimate: 50, category: 'adjacent' },
    { id: 'skan-ai', name: 'Skan.AI', slug: 'skan-ai', description: 'Computer vision-based process intelligence platform', website: 'https://skan.ai', founded_year: 2018, funding_total: '$50M', valuation: null, employee_count_estimate: 100, category: 'target' }
  ];

  for (const company of companies) {
    await sql`
      INSERT INTO companies (id, name, slug, description, website, founded_year, funding_total, valuation, employee_count_estimate, category)
      VALUES (${company.id}, ${company.name}, ${company.slug}, ${company.description}, ${company.website}, ${company.founded_year}, ${company.funding_total}, ${company.valuation}, ${company.employee_count_estimate}, ${company.category})
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

// Company operations
export async function getAllCompanies(): Promise<Company[]> {
  const sql = getDb();
  // Self-healing: fix incorrect categories set during initial seeding
  // WHERE conditions make these no-ops once the data is corrected
  await sql`UPDATE companies SET category = 'competitor' WHERE id = 'celonis' AND category = 'target'`;
  await sql`UPDATE companies SET category = 'target' WHERE id = 'skan-ai' AND category != 'target'`;
  const result = await sql`SELECT * FROM companies ORDER BY name`;
  return result as Company[];
}

export async function getCompanyBySlug(slug: string): Promise<Company | undefined> {
  const sql = getDb();
  const result = await sql`SELECT * FROM companies WHERE slug = ${slug}`;
  return result[0] as Company | undefined;
}

export async function getCompanyById(id: string): Promise<Company | undefined> {
  const sql = getDb();
  const result = await sql`SELECT * FROM companies WHERE id = ${id}`;
  return result[0] as Company | undefined;
}

// News operations
export async function getAllNews(limit: number = 50): Promise<NewsItem[]> {
  const sql = getDb();
  const result = await sql`
    SELECT * FROM news_items
    ORDER BY published_at DESC NULLS LAST, created_at DESC
    LIMIT ${limit}
  `;
  return result as NewsItem[];
}

export async function getNewsByCompany(companyId: string, limit: number = 20): Promise<NewsItem[]> {
  const sql = getDb();
  const result = await sql`
    SELECT * FROM news_items
    WHERE company_id = ${companyId}
    ORDER BY published_at DESC NULLS LAST, created_at DESC
    LIMIT ${limit}
  `;
  return result as NewsItem[];
}

export async function getNewsByCategory(category: string, limit: number = 50): Promise<NewsItem[]> {
  const sql = getDb();
  const result = await sql`
    SELECT * FROM news_items
    WHERE ai_category = ${category}
    ORDER BY published_at DESC NULLS LAST, created_at DESC
    LIMIT ${limit}
  `;
  return result as NewsItem[];
}

export async function getHighSignificanceNews(limit: number = 20): Promise<NewsItem[]> {
  const sql = getDb();
  const result = await sql`
    SELECT * FROM news_items
    WHERE ai_significance = 'high'
    ORDER BY published_at DESC NULLS LAST, created_at DESC
    LIMIT ${limit}
  `;
  return result as NewsItem[];
}

export async function insertNewsItem(item: Omit<NewsItem, 'id' | 'created_at'>): Promise<number> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO news_items (company_id, title, url, source, published_at, raw_content, ai_summary, ai_category, ai_significance, ai_implications)
    VALUES (${item.company_id}, ${item.title}, ${item.url}, ${item.source}, ${item.published_at}, ${item.raw_content}, ${item.ai_summary}, ${item.ai_category}, ${item.ai_significance}, ${item.ai_implications})
    RETURNING id
  `;
  return result[0].id;
}

export async function checkNewsExists(title: string, url: string | null): Promise<boolean> {
  const sql = getDb();
  const result = await sql`
    SELECT id FROM news_items WHERE title = ${title} OR url = ${url}
  `;
  return result.length > 0;
}

export async function updateNewsItemAnalysis(
  id: number,
  analysis: {
    ai_summary: string | null;
    ai_category: string | null;
    ai_significance: string | null;
    ai_implications: string | null;
  }
): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE news_items
    SET ai_summary = ${analysis.ai_summary},
        ai_category = ${analysis.ai_category},
        ai_significance = ${analysis.ai_significance},
        ai_implications = ${analysis.ai_implications}
    WHERE id = ${id}
  `;
}

// Trend operations
export async function getAllTrends(limit: number = 20): Promise<Trend[]> {
  const sql = getDb();
  const result = await sql`
    SELECT * FROM trends
    ORDER BY detected_at DESC
    LIMIT ${limit}
  `;
  return result as Trend[];
}

export async function insertTrend(trend: Omit<Trend, 'id' | 'detected_at'>): Promise<number> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO trends (title, description, related_companies, trend_type)
    VALUES (${trend.title}, ${trend.description}, ${trend.related_companies}, ${trend.trend_type})
    RETURNING id
  `;
  return result[0].id;
}

// Briefing operations
export async function getLatestBriefing(): Promise<Briefing | undefined> {
  const sql = getDb();
  const result = await sql`
    SELECT * FROM briefings
    ORDER BY generated_at DESC
    LIMIT 1
  `;
  return result[0] as Briefing | undefined;
}

export async function getAllBriefings(limit: number = 10): Promise<Briefing[]> {
  const sql = getDb();
  const result = await sql`
    SELECT * FROM briefings
    ORDER BY generated_at DESC
    LIMIT ${limit}
  `;
  return result as Briefing[];
}

export async function insertBriefing(briefing: Omit<Briefing, 'id' | 'generated_at'>): Promise<number> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO briefings (week_of, content)
    VALUES (${briefing.week_of}, ${briefing.content})
    RETURNING id
  `;
  return result[0].id;
}

// Job signal operations
export async function getJobsByCompany(companyId: string, limit: number = 20): Promise<JobSignal[]> {
  const sql = getDb();
  const result = await sql`
    SELECT * FROM job_signals
    WHERE company_id = ${companyId}
    ORDER BY detected_at DESC
    LIMIT ${limit}
  `;
  return result as JobSignal[];
}

export async function insertJobSignal(job: Omit<JobSignal, 'id' | 'detected_at'>): Promise<number> {
  const sql = getDb();
  const result = await sql`
    INSERT INTO job_signals (company_id, role_title, department, location, url)
    VALUES (${job.company_id}, ${job.role_title}, ${job.department}, ${job.location}, ${job.url})
    RETURNING id
  `;
  return result[0].id;
}

export async function clearJobSignals(): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM job_signals`;
}

export async function getJobStats(): Promise<{
  companyId: string;
  totalJobs: number;
  topDepartments: string[];
}[]> {
  const sql = getDb();
  const result = await sql`
    SELECT
      company_id,
      COUNT(*) as total_jobs,
      array_agg(DISTINCT department) FILTER (WHERE department IS NOT NULL) as departments
    FROM job_signals
    GROUP BY company_id
  `;
  return result.map((row: any) => ({
    companyId: row.company_id,
    totalJobs: Number(row.total_jobs),
    topDepartments: (row.departments || []).slice(0, 5),
  }));
}

// Get all job signals (for briefing and GET /api/jobs)
export async function getAllJobSignals(): Promise<JobSignal[]> {
  const sql = getDb();
  const result = await sql`SELECT * FROM job_signals ORDER BY detected_at DESC`;
  return result as JobSignal[];
}

// Ensures the sec_filing_analyses table exists — self-healing for DBs created before this table was added
async function ensureSecFilingAnalysesTable(sql: ReturnType<typeof getDb>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS sec_filing_analyses (
      id SERIAL PRIMARY KEY,
      company_id TEXT REFERENCES companies(id),
      filing_id TEXT UNIQUE,
      form_type TEXT,
      filed_date TEXT,
      document_url TEXT,
      ai_summary TEXT,
      analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// SEC filing analysis operations
export async function getSecFilingAnalysis(filingId: string): Promise<SecFilingAnalysis | undefined> {
  const sql = getDb();
  await ensureSecFilingAnalysesTable(sql);
  const result = await sql`SELECT * FROM sec_filing_analyses WHERE filing_id = ${filingId}`;
  return result[0] as SecFilingAnalysis | undefined;
}

export async function insertSecFilingAnalysis(
  analysis: Omit<SecFilingAnalysis, 'id' | 'analyzed_at'>
): Promise<number> {
  const sql = getDb();
  await ensureSecFilingAnalysesTable(sql);
  const result = await sql`
    INSERT INTO sec_filing_analyses (company_id, filing_id, form_type, filed_date, document_url, ai_summary)
    VALUES (${analysis.company_id}, ${analysis.filing_id}, ${analysis.form_type}, ${analysis.filed_date}, ${analysis.document_url}, ${analysis.ai_summary})
    ON CONFLICT (filing_id) DO UPDATE SET ai_summary = EXCLUDED.ai_summary, analyzed_at = NOW()
    RETURNING id
  `;
  return result[0].id;
}

export async function getAllSecFilingAnalyses(limit: number = 20): Promise<SecFilingAnalysis[]> {
  const sql = getDb();
  await ensureSecFilingAnalysesTable(sql);
  const result = await sql`
    SELECT * FROM sec_filing_analyses
    ORDER BY analyzed_at DESC
    LIMIT ${limit}
  `;
  return result as SecFilingAnalysis[];
}

export async function getSecFilingAnalysesByCompany(companyId: string): Promise<SecFilingAnalysis[]> {
  const sql = getDb();
  await ensureSecFilingAnalysesTable(sql);
  const result = await sql`
    SELECT * FROM sec_filing_analyses
    WHERE company_id = ${companyId}
    ORDER BY filed_date DESC
  `;
  return result as SecFilingAnalysis[];
}

// Stats
export async function getStats() {
  const sql = getDb();
  const [companyResult, newsResult, highAlertResult, trendResult, jobResult] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM companies`,
    sql`SELECT COUNT(*) as count FROM news_items`,
    sql`SELECT COUNT(*) as count FROM news_items WHERE ai_significance = 'high'`,
    sql`SELECT COUNT(*) as count FROM trends`,
    sql`SELECT COUNT(*) as count FROM job_signals`
  ]);

  return {
    companyCount: Number(companyResult[0].count),
    newsCount: Number(newsResult[0].count),
    highAlertCount: Number(highAlertResult[0].count),
    trendCount: Number(trendResult[0].count),
    jobCount: Number(jobResult[0].count)
  };
}
