import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'db', 'intel.db');

// Ensure db directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create singleton database instance
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeSchema();
  }
  return db;
}

function initializeSchema(): void {
  const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db!.exec(schema);
  }
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
  related_companies: string; // JSON array
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

// Company operations
export function getAllCompanies(): Company[] {
  const db = getDb();
  return db.prepare('SELECT * FROM companies ORDER BY name').all() as Company[];
}

export function getCompanyBySlug(slug: string): Company | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM companies WHERE slug = ?').get(slug) as Company | undefined;
}

export function getCompanyById(id: string): Company | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM companies WHERE id = ?').get(id) as Company | undefined;
}

// News operations
export function getAllNews(limit: number = 50): NewsItem[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM news_items
    ORDER BY published_at DESC, created_at DESC
    LIMIT ?
  `).all(limit) as NewsItem[];
}

export function getNewsByCompany(companyId: string, limit: number = 20): NewsItem[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM news_items
    WHERE company_id = ?
    ORDER BY published_at DESC, created_at DESC
    LIMIT ?
  `).all(companyId, limit) as NewsItem[];
}

export function getNewsByCategory(category: string, limit: number = 50): NewsItem[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM news_items
    WHERE ai_category = ?
    ORDER BY published_at DESC, created_at DESC
    LIMIT ?
  `).all(category, limit) as NewsItem[];
}

export function getHighSignificanceNews(limit: number = 20): NewsItem[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM news_items
    WHERE ai_significance = 'high'
    ORDER BY published_at DESC, created_at DESC
    LIMIT ?
  `).all(limit) as NewsItem[];
}

export function insertNewsItem(item: Omit<NewsItem, 'id' | 'created_at'>): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO news_items (company_id, title, url, source, published_at, raw_content, ai_summary, ai_category, ai_significance, ai_implications)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    item.company_id,
    item.title,
    item.url,
    item.source,
    item.published_at,
    item.raw_content,
    item.ai_summary,
    item.ai_category,
    item.ai_significance,
    item.ai_implications
  );
  return result.lastInsertRowid as number;
}

// Trend operations
export function getAllTrends(limit: number = 20): Trend[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM trends
    ORDER BY detected_at DESC
    LIMIT ?
  `).all(limit) as Trend[];
}

export function insertTrend(trend: Omit<Trend, 'id' | 'detected_at'>): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO trends (title, description, related_companies, trend_type)
    VALUES (?, ?, ?, ?)
  `).run(trend.title, trend.description, trend.related_companies, trend.trend_type);
  return result.lastInsertRowid as number;
}

// Briefing operations
export function getLatestBriefing(): Briefing | undefined {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM briefings
    ORDER BY week_of DESC
    LIMIT 1
  `).get() as Briefing | undefined;
}

export function getAllBriefings(limit: number = 10): Briefing[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM briefings
    ORDER BY week_of DESC
    LIMIT ?
  `).all(limit) as Briefing[];
}

export function insertBriefing(briefing: Omit<Briefing, 'id' | 'generated_at'>): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO briefings (week_of, content)
    VALUES (?, ?)
  `).run(briefing.week_of, briefing.content);
  return result.lastInsertRowid as number;
}

// Job signal operations
export function getJobsByCompany(companyId: string, limit: number = 20): JobSignal[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM job_signals
    WHERE company_id = ?
    ORDER BY detected_at DESC
    LIMIT ?
  `).all(companyId, limit) as JobSignal[];
}

export function insertJobSignal(job: Omit<JobSignal, 'id' | 'detected_at'>): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO job_signals (company_id, role_title, department, location, url)
    VALUES (?, ?, ?, ?, ?)
  `).run(job.company_id, job.role_title, job.department, job.location, job.url);
  return result.lastInsertRowid as number;
}

// Stats
export function getStats() {
  const db = getDb();
  const companyCount = (db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number }).count;
  const newsCount = (db.prepare('SELECT COUNT(*) as count FROM news_items').get() as { count: number }).count;
  const highAlertCount = (db.prepare("SELECT COUNT(*) as count FROM news_items WHERE ai_significance = 'high'").get() as { count: number }).count;
  const trendCount = (db.prepare('SELECT COUNT(*) as count FROM trends').get() as { count: number }).count;

  return {
    companyCount,
    newsCount,
    highAlertCount,
    trendCount
  };
}
