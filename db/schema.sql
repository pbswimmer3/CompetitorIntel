-- Competitor Intelligence Dashboard Database Schema

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
    category TEXT DEFAULT 'competitor', -- 'competitor', 'adjacent', 'target'
    logo_url TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT REFERENCES companies(id),
    title TEXT NOT NULL,
    url TEXT,
    source TEXT,
    published_at DATETIME,
    raw_content TEXT,
    ai_summary TEXT,
    ai_category TEXT, -- 'funding', 'product', 'partnership', 'hiring', 'executive', 'other'
    ai_significance TEXT, -- 'high', 'medium', 'low'
    ai_implications TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    related_companies TEXT, -- JSON array of company IDs
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    trend_type TEXT -- 'product', 'market', 'hiring', 'funding'
);

CREATE TABLE IF NOT EXISTS briefings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_of DATE NOT NULL,
    content TEXT NOT NULL, -- Full markdown briefing
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT REFERENCES companies(id),
    role_title TEXT,
    department TEXT,
    location TEXT,
    url TEXT,
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_news_company ON news_items(company_id);
CREATE INDEX IF NOT EXISTS idx_news_published ON news_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_significance ON news_items(ai_significance);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON job_signals(company_id);
CREATE INDEX IF NOT EXISTS idx_briefings_week ON briefings(week_of DESC);
