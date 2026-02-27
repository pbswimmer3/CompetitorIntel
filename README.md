# Competitor Intelligence Dashboard

An AI-powered competitive intelligence platform for the **Process Mining / Process Intelligence** industry. Built with Next.js 14, TypeScript, Claude AI (Anthropic), and deployed on Vercel.

**Live Demo**: [competitor-intel-five.vercel.app](https://competitor-intel-five.vercel.app/)

---

## What It Does

This dashboard tracks 9 key companies in the process mining space and transforms raw public signals into actionable executive intelligence. It scrapes five categories of public data, runs each through Claude AI for analysis, and surfaces the results across six pages:

| Intelligence Source | What It Tracks |
|---|---|
| **News** | Google News, PR Newswire, Business Wire, GlobeNewswire — AI-analyzed per article |
| **Job Postings** | Greenhouse + Lever job boards — hiring pattern detection and signal analysis |
| **SEC Filings** | EDGAR regulatory filings for public competitors — AI extracts competitive strategy |
| **GitHub Activity** | Public repos — development velocity, AI/ML investment, open-source signals |
| **Executive Briefings** | On-demand AI synthesis of all four sources into a strategic leadership brief |

---

## How It Works End-to-End

1. **Data collection** — Clicking "Refresh" on any page triggers live scraping. News comes from RSS feeds (Google News, PR Newswire, Business Wire, GlobeNewswire). Job data comes from Greenhouse and Lever APIs. SEC filings come from the EDGAR submissions API. GitHub data comes from the GitHub REST API.

2. **AI analysis** — Each scraped news article is sent to Claude (Anthropic) for classification (category, significance, summary, strategic implication). SEC filings are fetched in full, relevant sections are extracted (Item 1, 1A, 7 for 10-K; Item 2 for 10-Q; full text for 8-K), and Claude generates competitive intelligence from the extracted text.

3. **Storage** — All data is persisted in a Neon PostgreSQL database. News items, job signals, SEC analyses, trends, and briefings each have their own table. Data survives page reloads and server restarts.

4. **Display** — The Next.js frontend fetches data from API routes using SWR (stale-while-revalidate). Each page presents a different view of the intelligence: the dashboard gives the overview, individual pages go deep on each data source, and company detail pages aggregate everything for a single competitor.

5. **Briefing generation** — The briefing page pulls the latest data from all four sources (news, jobs, SEC, GitHub) and sends it to Claude with a structured prompt. Claude returns a formatted strategic briefing with executive summary, competitive moves, signal detection, priorities, and a 30-day outlook.

---

## Features

### Dashboard (`/`)
The central intelligence hub with four sections:

- **Market Overview** — live counts of tracked companies, news items, high-priority alerts, and detected trends
- **Live Intelligence Feed** — scrolling news feed with AI-assigned significance (High / Medium / Low), category badges, and one-line AI summaries; refreshes on demand
- **Emerging Trends** — Claude-detected cross-company patterns with evidence tags
- **High Priority Alerts** — dedicated widget showing only high-significance items, each with its source and strategic implication
- **Companies Tracked** — grid of all 9 tracked companies sorted by relationship (Our Company, Competitor, Adjacent), each linking to a company detail page

---

### News Intelligence
Every scraped article is analyzed by Claude to produce four fields:
- **Category** — `funding` / `product` / `partnership` / `hiring` / `executive` / `other`
- **Significance** — `high` / `medium` / `low` (high = major market impact)
- **Summary** — one sentence cutting through PR spin
- **Implication** — specific strategic recommendation for Skan.AI

**Sources scraped per refresh:**
- Google News RSS (company-specific search terms)
- PR Newswire RSS
- Business Wire RSS
- GlobeNewswire RSS (BPM + enterprise software feeds)

Articles are deduplicated by title and URL before analysis. New articles only.

---

### Job Posting Intelligence (`/jobs`)
Scrapes live job boards and detects hiring patterns that predict competitor strategy. Data is persisted in the database so it's available immediately on every page load without re-scraping.

**Five signal types detected:**

| Signal | Detection Threshold | Strategic Meaning |
|---|---|---|
| AI/ML Hiring Surge | 3+ AI/ML roles | New product investment underway |
| Sales Expansion | 5+ sales roles | GTM push or new market segment |
| Engineering Investment | 10+ engineering roles | Major platform build-out |
| Geographic Expansion | 5+ distinct locations | International growth push |
| Leadership Build-out | 2+ VP/Director/C-suite roles | New business unit forming |

**Job boards monitored:**

| Company | Platform |
|---|---|
| Celonis | Greenhouse |
| UiPath | Greenhouse |
| ABBYY | Greenhouse |
| Automation Anywhere | Greenhouse |
| Skan.AI | Lever |
| Apromore | Lever |

Clicking **Refresh Job Data** scrapes all boards live, clears the previous snapshot, and stores the new data. The page displays the analysis immediately without needing another page reload.

---

### SEC Filing Intelligence (`/sec`)
Tracks regulatory filings from SEC EDGAR for all four public competitors and provides on-demand Claude analysis that extracts competitive intelligence from the actual filing text.

**How it works:**
1. **Refresh SEC Data** — fetches the latest filings list from EDGAR for each public company (fast, metadata only)
2. **Analyze** — click on any 10-K, 10-Q, or 8-K to trigger a full Claude analysis (20-40 seconds; result stored permanently)
3. **Re-analyze** — click on a previously analyzed filing to run a fresh Claude analysis, overwriting the stored result
4. The AI analysis card expands inline beneath each filing row

**What Claude extracts by filing type:**

| Filing | Sections Extracted | Claude Analyzes For |
|---|---|---|
| **10-K** (Annual Report) | Item 1 (Business), Item 1A (Risk Factors), Item 7 (MD&A) | Revenue signals, product strategy, competitive positioning, market expansion, risk factors that reveal strategy |
| **10-Q** (Quarterly Report) | Item 2 (MD&A) | Quarterly momentum, guidance changes, strategic updates |
| **8-K** (Material Event) | Full document | Acquisitions, leadership changes, major partnerships, earnings surprises |

**Extraction detail:** The section extractor skips the table of contents (which lists item headers but no content) and finds the actual section body. Each section is capped at 25,000 characters before being passed to Claude.

**Page layout:**
- **Recent Regulatory Filings** — chronological timeline of the last 15 filings across all public companies, each with an Analyze / Re-analyze button and expandable AI summary
- **Filings by Company** — breakdown by company showing filing counts and signals; all 9 tracked companies appear here (private companies show a "no SEC filings" indicator)
- **Sidebar** — "Companies Tracked" lists all 9 companies with Public / Private badges; filing type explainers; competitive intelligence value guide

**Public companies tracked via EDGAR:**

| Company | Ticker | CIK |
|---|---|---|
| UiPath | PATH | 0001734722 |
| Microsoft | MSFT | 0000789019 |
| IBM | IBM | 0000051143 |
| SAP (Signavio) | SAP | 0001000184 |

---

### GitHub Activity (`/github`)
Monitors public GitHub organizations to track development velocity and technology investment signals.

**Signals detected per company:**
- **Active Development** — 3+ repos with pushes in the last 7 days
- **AI/ML Investment** — 2+ repos with AI/ML-related names or topics
- **Popular Repos** — any repo with 100+ stars (community adoption signal)

**Data shown:**
- Repository count and total stars per company
- Top repositories with star counts, language, and last-push date
- Recent development activity feed (last 10 repos updated across all companies)
- Technology stack breakdown (top programming languages)
- Top starred repos across the industry

**Tracked organizations:**

| Company | GitHub Org | Notes |
|---|---|---|
| Celonis | celonis | -- |
| UiPath | UiPath | -- |
| ABBYY | abbyy | -- |
| Automation Anywhere | AutomationAnywhere | -- |
| Apromore | apromore | -- |
| IBM | IBM | Filtered to process/automation/AI repos |
| Microsoft | microsoft | Filtered to process/automation/AI repos |
| SAP | SAP | Filtered to process/automation/AI repos |

Large organizations (IBM, Microsoft, SAP) are filtered by relevance keywords to avoid returning thousands of unrelated repos.

> **Note:** GitHub's unauthenticated API rate limit is 60 requests/hour. GitHub data may occasionally be unavailable if the limit is hit.

---

### Company Detail Pages (`/company/[slug]`)
Each tracked company has a dedicated deep-dive page:

- **Company header** — name, category badge, description, website, founded year, funding total, employee count estimate
- **News & Updates** — full news timeline with AI category/significance badges, summaries, and strategic implications highlighted for high-priority items
- **Regulatory Filings** *(public companies only)* — recent filings with type, date, and expandable AI analysis summaries
- **Hiring Signals** sidebar — current open roles with department and location
- **GitHub Activity** sidebar — repo count, stars, development signals, and top repositories
- **Quick Stats** sidebar — counts of news items, high-priority alerts, open roles, SEC filings, and analyzed filings

---

### Executive Briefings (`/briefing`)
On-demand AI-generated strategic briefings that synthesize all four data sources into an executive-ready document.

**Briefing structure (Claude-generated):**
1. **Executive Summary** — the one thing leadership must know, top threat, top opportunity
2. **Market Dynamics** — second and third-order effects of major announcements
3. **Competitive Moves That Matter** — moves requiring a response, each rated with a recommended action
4. **Signal Detection** — leading indicators predicting future competitor moves
5. **Trends Requiring Strategic Response** — cross-signal patterns Skan.AI needs to get ahead of
6. **This Week's Priorities** — exactly 3 actions ranked `[URGENT]` / `[IMPORTANT]` / `[MONITOR]`
7. **30-Day Outlook** — 2-3 specific predictions based on current signals

**Data sources used per briefing generation:**
- Last 50 news items (with AI analysis)
- Last 10 detected market trends
- All stored job signals (analyzed for hiring patterns)
- Last 15 SEC filing AI analyses
- Today's date (injected into the prompt so Claude doesn't write `[date]` placeholders)

Briefings are stored permanently. The sidebar lists all previous briefings sorted by generation date (newest first) and allows switching between them.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) + TypeScript |
| **UI** | shadcn/ui + Tailwind CSS (dark theme) |
| **AI** | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| **Database** | Neon PostgreSQL (serverless) |
| **Deployment** | Vercel (Pro plan recommended — functions need >10s timeout) |
| **Job Data** | Greenhouse API + Lever API |
| **SEC Data** | SEC EDGAR API (data.sec.gov) |
| **News** | Google News RSS + PR Newswire + Business Wire + GlobeNewswire |
| **GitHub** | GitHub REST API v3 (unauthenticated) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))
- Neon PostgreSQL database — free tier at [neon.tech](https://neon.tech)

### Quick Start (Windows)

Double-click `start.bat` to install dependencies, initialize the database, start the dev server, and open the browser.

### Manual Setup

```bash
npm install

cp env.example .env.local
# Edit .env.local and add:
#   ANTHROPIC_API_KEY=your-key
#   DATABASE_URL=your-neon-connection-string

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables: `ANTHROPIC_API_KEY`, `DATABASE_URL`
4. Deploy
5. Initialize the database: `POST /api/init` (run once after first deploy)
6. Seed initial news data: `POST /api/news/refresh`

> **Vercel plan note:** The SEC filing analyze function fetches a document from EDGAR and calls Claude — this can take 20-40 seconds. Vercel's hobby plan hard-caps function execution at 10 seconds. A Pro plan (or the `maxDuration = 60` config on Pro) is required for SEC analysis to complete successfully.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main dashboard
│   ├── briefing/page.tsx           # Executive briefing page
│   ├── jobs/page.tsx               # Job posting intelligence
│   ├── sec/page.tsx                # SEC filing intelligence
│   ├── github/page.tsx             # GitHub activity tracking
│   ├── company/[slug]/page.tsx     # Company detail pages
│   └── api/
│       ├── companies/              # GET all companies + stats
│       ├── companies/[slug]/       # GET single company with news/jobs
│       ├── news/                   # GET news (filterable)
│       ├── news/refresh/           # POST scrape + AI analysis + trend detection
│       ├── jobs/                   # GET persisted job signals from DB
│       ├── jobs/refresh/           # POST scrape live job boards + store
│       ├── sec/                    # GET live SEC filings from EDGAR
│       ├── sec/analyze/            # GET all analyses; POST analyze filing (force re-analysis supported)
│       ├── github/                 # GET GitHub activity for all/one company
│       ├── trends/                 # GET detected market trends
│       ├── briefing/               # GET stored briefings; POST generate new briefing
│       └── init/                   # POST initialize DB schema + seed companies
├── components/
│   ├── AlertFeed.tsx               # News feed with refresh button
│   ├── BriefingGenerator.tsx       # Generate briefing button + loading state
│   ├── CompanyCard.tsx             # Company summary card
│   ├── HighPriorityAlerts.tsx      # High-priority alerts widget
│   ├── MarketOverview.tsx          # Key metrics stat cards
│   ├── TrendCard.tsx               # Market trends display
│   └── Navbar.tsx                  # Navigation (Dashboard, Briefing, Jobs, GitHub, SEC Filings)
└── lib/
    ├── db.ts                       # Neon PostgreSQL wrapper + all DB functions
    ├── claude.ts                   # Claude AI integration (news, SEC, briefing)
    └── scrapers/
        ├── news.ts                 # Multi-source news scraping + dedup
        ├── jobs.ts                 # Greenhouse + Lever scraping + signal analysis
        ├── sec.ts                  # SEC EDGAR API + document fetch + section extraction
        └── github.ts               # GitHub org activity + signal detection
```

---

## API Reference

| Route | Method | Description |
|---|---|---|
| `/api/companies` | GET | All 9 tracked companies with aggregated stats |
| `/api/companies/[slug]` | GET | Single company with its news items and job signals |
| `/api/news` | GET | News items — filterable by `company`, `category`, `significance`, `limit` |
| `/api/news/refresh` | POST | Scrape all sources, run Claude analysis on new articles, detect trends |
| `/api/jobs` | GET | Persisted job signals from DB with hiring pattern analysis |
| `/api/jobs/refresh` | POST | Scrape live job boards, replace DB snapshot, return analysis |
| `/api/sec` | GET | Live SEC filings from EDGAR; `?company=id` for single company |
| `/api/sec/analyze` | GET | All stored AI filing analyses (up to 50) |
| `/api/sec/analyze` | POST | Analyze a filing; body: `{companyId, filingId, docUrl, formType, filedDate, force?}` |
| `/api/github` | GET | GitHub activity for all companies; `?company=id` for single company |
| `/api/trends` | GET | Detected market trends with related company names; `?limit=N` |
| `/api/briefing` | GET | All stored briefings (newest first) + latest briefing object |
| `/api/briefing` | POST | Generate a new briefing from all current data sources |
| `/api/init` | POST | Create DB schema tables and seed the 9 tracked companies |

---

## Tracked Companies

| Company | Category | Job Board | SEC Filings | GitHub |
|---|---|---|---|---|
| Skan.AI | **Our Company** | Lever | -- | -- |
| Celonis | Competitor | Greenhouse | -- (private) | celonis |
| UiPath | Competitor | Greenhouse | PATH (CIK 0001734722) | UiPath |
| ABBYY | Competitor | Greenhouse | -- (private) | abbyy |
| Microsoft | Competitor | -- | MSFT (CIK 0000789019) | microsoft |
| IBM | Competitor | -- | IBM (CIK 0000051143) | IBM |
| SAP Signavio | Competitor | -- | SAP (CIK 0001000184) | SAP |
| Automation Anywhere | Adjacent | Greenhouse | -- (private) | AutomationAnywhere |
| Apromore | Adjacent | Lever | -- (private) | apromore |

---

## Modifying Tracked Companies

The list of tracked companies is defined in several files. To add, remove, or modify a company:

### 1. Company metadata (`src/lib/db.ts`)

The `initializeDatabase()` function contains the seed data array. Each company has an `id`, `name`, `slug`, `description`, `website`, `category` (`target` / `competitor` / `adjacent`), and optional fields like `founded_year`, `funding_total`, `valuation`, and `employee_count_estimate`.

To **add a company**: add a new object to the seed array and run `POST /api/init` to insert it. Existing companies are not overwritten (uses `ON CONFLICT DO NOTHING`).

To **remove a company**: delete the row from the `companies` table in your database. Removing it from the seed array only prevents it from being re-created on fresh databases.

To **change a company's category**: update the `category` field in the seed array. For existing databases, run a SQL UPDATE directly or add a self-healing UPDATE statement in `getAllCompanies()` (see the Celonis/Skan.AI fix pattern already in the code).

### 2. News scraping (`src/lib/scrapers/news.ts`)

Search terms for Google News are derived from the company name. If the new company needs custom search terms, add them to the scraper's company-specific search logic.

### 3. Job board scraping (`src/lib/scrapers/jobs.ts`)

The `companyJobBoards` map defines which companies have Greenhouse or Lever job boards. Add a new entry with the company ID and the board URL slug:

```typescript
'new-company': { platform: 'greenhouse', boardToken: 'newcompany' },
```

Companies without a job board entry are simply skipped during job scraping.

### 4. SEC EDGAR tracking (`src/lib/scrapers/sec.ts`)

The `companyCIKs` map defines which companies are publicly traded and their SEC CIK numbers. To track a new public company:

```typescript
'new-company': { cik: '0001234567', name: 'New Company Inc' },
```

Look up the CIK at [SEC EDGAR Company Search](https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany). Private companies should not be added here — they will automatically show as "Private" on the SEC page.

### 5. GitHub tracking (`src/lib/scrapers/github.ts`)

The `companyGitHubOrgs` map defines GitHub organization names. For large orgs (thousands of repos), add relevance filter keywords to avoid fetching unrelated repositories:

```typescript
'new-company': { org: 'newcompany', filterKeywords: ['process', 'mining'] },
```

---

## Database Schema

Six tables in Neon PostgreSQL:

| Table | Purpose |
|---|---|
| `companies` | Company metadata (name, category, funding, employee count) |
| `news_items` | Scraped articles + Claude analysis (summary, category, significance, implication) |
| `trends` | Detected market trends with related companies and trend type |
| `job_signals` | Individual job postings scraped from Greenhouse/Lever |
| `briefings` | Generated briefing content with week_of and generated_at timestamps |
| `sec_filing_analyses` | Per-filing Claude analyses keyed by EDGAR accession number |

The `sec_filing_analyses` table self-heals on first use — it's created automatically via `CREATE TABLE IF NOT EXISTS` before any query, so existing databases don't need to re-run `/api/init`.

---

## Future Ideas

- Patent filing monitoring (USPTO)
- G2 / Capterra review sentiment analysis
- Website change detection (pricing pages, messaging shifts)
- LinkedIn employee count trend tracking
- Earnings call transcript analysis
- Email digest delivery of weekly briefings

---

Built with [Claude Code](https://claude.ai/claude-code)
