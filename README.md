# Competitor Intelligence Dashboard

An AI-powered competitive intelligence platform for the **Process Mining / Process Intelligence** industry. Built with Next.js 14, TypeScript, Claude AI (Anthropic), and deployed on Vercel.

**Live Demo**: [competitor-intel-five.vercel.app](https://competitor-intel-five.vercel.app/)

## What It Does

This dashboard continuously tracks 9 key companies in the process mining space and transforms raw public signals into actionable executive intelligence:

- **News Intelligence** — Scrapes Google News, PR Newswire, and Business Wire; Claude analyzes every article for significance, category, and strategic implication
- **Job Posting Intelligence** — Scrapes Greenhouse and Lever job boards to detect hiring patterns (AI surge, sales expansion, leadership build-out, geo expansion)
- **SEC Filing Intelligence** — Fetches EDGAR filings for public competitors (UiPath, Microsoft, IBM, SAP); on-demand Claude analysis extracts competitive strategy from 10-K/10-Q/8-K key sections
- **GitHub Activity Tracking** — Monitors public repos for development velocity, AI/ML investment, and open-source signals
- **Executive Briefings** — Weekly AI-generated briefings synthesizing all four data sources into strategic insights, threat levels, and prioritized actions

## Key Features

### AI-Powered News Analysis
Every article is analyzed by Claude to produce:
- **Category**: funding / product / partnership / hiring / executive / other
- **Significance**: 🔴 High / 🟡 Medium / 🟢 Low
- **Summary**: One-line insight cutting through PR spin
- **Implication**: Specific strategic recommendation for Skan.AI

### Job Posting Intelligence
Detects hiring patterns that predict competitor strategy:
- AI/ML hiring surge (signals new product investment)
- Sales expansion (signals GTM push or new segment)
- Engineering investment (signals platform build-out)
- Geographic expansion (signals international growth)
- Leadership buildout (signals new business units)

Job data is **persisted in the database** and displayed on load — no data loss between sessions.

### SEC Filing Intelligence
On-demand competitive analysis from regulatory filings:
- Click **Analyze** on any 10-K, 10-Q, or 8-K to trigger Claude analysis
- **10-K**: Extracts Business (Item 1), Risk Factors (Item 1A), and MD&A (Item 7) — the three highest-signal sections for competitive intel
- **10-Q**: Extracts the quarterly MD&A update
- **8-K**: Full document (material events are short and entirely relevant)
- Results are stored permanently and surfaced in the weekly briefing

### Executive Briefings
Synthesizes all data sources into a structured strategic brief:
- **Executive Summary** — The one thing leadership must know, top threat, top opportunity
- **Competitive Moves That Matter** — With threat levels 🔴🟡🟢 and recommended responses
- **Signal Detection** — Leading indicators predicting future competitor moves
- **Job Signal Intelligence** — Hiring patterns from all tracked companies
- **SEC Filing Insights** — Competitive intelligence from analyzed regulatory filings
- **30-Day Outlook** — Specific predictions based on current signals
- **Prioritized Actions** — Tagged [URGENT] / [IMPORTANT] / [MONITOR]

### Company Detail Pages
Each tracked company has a dedicated page showing:
- Full news timeline with AI analysis
- Live hiring signals from job boards
- Regulatory filings with AI summaries (public companies)
- GitHub activity with repo stats and development signals

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) + TypeScript |
| **UI** | shadcn/ui + Tailwind CSS (dark theme) |
| **AI** | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| **Database** | Neon PostgreSQL (serverless) |
| **Deployment** | Vercel |
| **Job Data** | Greenhouse API + Lever API |
| **SEC Data** | SEC EDGAR API |
| **News** | Google News RSS + PR Newswire + Business Wire |

## Getting Started

### Prerequisites
- Node.js 18+
- Anthropic API key
- Neon PostgreSQL database (free tier works fine)

### Quick Start (Windows)

Double-click `start.bat` to install dependencies, initialize the database, start the dev server, and open the browser.

### Manual Setup

```bash
npm install

cp env.example .env.local
# Edit .env.local — add:
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
5. Initialize database: `POST /api/init`
6. Seed data: `POST /api/news/refresh`

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main dashboard
│   ├── briefing/                   # Executive briefing page
│   ├── jobs/                       # Job posting intelligence
│   ├── sec/                        # SEC filing intelligence
│   ├── company/[slug]/             # Company detail pages
│   └── api/
│       ├── companies/              # Company data endpoints
│       ├── news/                   # News fetch + AI analysis
│       ├── jobs/                   # Job data (GET = persisted, POST refresh = live scrape)
│       ├── sec/                    # SEC filings (EDGAR)
│       ├── sec/analyze/            # On-demand filing analysis with Claude
│       ├── trends/                 # Detected market trends
│       ├── briefing/               # Briefing generation (all data sources)
│       └── init/                   # Database initialization
├── components/
│   ├── AlertFeed.tsx
│   ├── BriefingGenerator.tsx
│   ├── CompanyCard.tsx
│   ├── MarketOverview.tsx
│   ├── TrendCard.tsx
│   └── Navbar.tsx
└── lib/
    ├── db.ts                       # Neon PostgreSQL wrapper
    ├── claude.ts                   # Claude AI integration
    └── scrapers/
        ├── news.ts                 # Multi-source news scraping
        ├── jobs.ts                 # Greenhouse + Lever job scraping
        ├── sec.ts                  # SEC EDGAR + document extraction
        └── github.ts               # GitHub org activity
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/companies` | GET | All tracked companies with stats |
| `/api/companies/[slug]` | GET | Single company with news and jobs |
| `/api/news` | GET | All news items (filterable) |
| `/api/news/refresh` | POST | Scrape new articles + Claude analysis + trend detection |
| `/api/jobs` | GET | Persisted job signals from DB with pattern analysis |
| `/api/jobs/refresh` | POST | Scrape live job boards + store in DB |
| `/api/sec` | GET | Live SEC filings from EDGAR for public competitors |
| `/api/sec/analyze` | GET | All stored AI analyses of filings |
| `/api/sec/analyze` | POST | Analyze a specific filing with Claude (cached) |
| `/api/trends` | GET | Detected market trends |
| `/api/briefing` | GET | All stored briefings |
| `/api/briefing` | POST | Generate new briefing (uses news + jobs + SEC + trends) |
| `/api/init` | POST | Initialize database schema and seed companies |

## Tracked Companies

| Company | Category | Job Scraping | SEC Filings | GitHub |
|---------|----------|-------------|-------------|--------|
| Celonis | Competitor | Greenhouse | — | ✓ |
| UiPath | Competitor | Greenhouse | ✓ (PATH) | ✓ |
| ABBYY | Competitor | Greenhouse | — | ✓ |
| Microsoft | Competitor | — | ✓ (MSFT) | ✓ |
| IBM | Competitor | — | ✓ (IBM) | ✓ |
| SAP Signavio | Competitor | — | ✓ (SAP) | ✓ |
| Automation Anywhere | Adjacent | Greenhouse | — | ✓ |
| Apromore | Adjacent | Lever | — | ✓ |
| Skan.AI | Our Company | Lever | — | — |

## Future Ideas

- Patent filing monitoring (USPTO)
- G2/Capterra review sentiment analysis
- Website change detection (pricing pages, messaging shifts)
- LinkedIn employee count trend tracking
- Earnings call transcript analysis

---

Built with [Claude Code](https://claude.ai/claude-code)
