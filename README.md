# Competitor Intelligence Dashboard

An AI-powered competitive intelligence dashboard for the **Process Mining / Process Intelligence** industry. Built with Next.js 14, TypeScript, and Claude AI.

## What It Does

This dashboard automatically:
- **Tracks 9 key companies** in the process mining space (Celonis, UiPath, ABBYY, Microsoft, IBM, SAP Signavio, Automation Anywhere, Apromore, Skan.AI)
- **Aggregates news and signals** from public sources
- **Analyzes intelligence** using Claude AI to categorize, assess significance, and identify strategic implications
- **Generates weekly briefings** tailored for Skan.AI leadership
- **Identifies cross-company trends** in the competitive landscape

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Database**: SQLite via better-sqlite3
- **Charts**: Recharts
- **PDF Export**: @react-pdf/renderer

## Getting Started

### Prerequisites
- Node.js 18+
- Anthropic API key

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Initialize the database with seed data
npm run seed
npm run seed:news

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main dashboard
│   ├── briefing/          # Weekly briefing page
│   ├── company/[slug]/    # Company detail pages
│   └── api/               # API routes
├── components/            # React components
│   ├── AlertFeed.tsx      # Live intelligence feed
│   ├── CompanyCard.tsx    # Company overview cards
│   ├── MarketOverview.tsx # Stats dashboard
│   ├── TrendCard.tsx      # Trend analysis display
│   └── Navbar.tsx         # Navigation
├── lib/
│   ├── db.ts              # SQLite database wrapper
│   ├── claude.ts          # Claude API integration
│   └── scrapers/          # News scraping utilities
└── data/
    └── companies.json     # Company seed data

db/
├── schema.sql             # Database schema
└── intel.db               # SQLite database (created on first run)

scripts/
├── seed.ts                # Seed companies
└── seed-news.ts           # Seed mock news data
```

## Features

### Dashboard (/)
- Market overview with key metrics
- Live intelligence feed with significance ratings
- Emerging trends detection
- Company cards grid

### Company Detail (/company/[slug])
- Company profile and metadata
- News timeline with AI analysis
- Hiring signals and job postings
- Strategic implications

### Weekly Briefing (/briefing)
- AI-generated executive summary
- Top developments analysis
- Company-by-company updates
- Strategic recommendations

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/companies` | GET | List all tracked companies |
| `/api/companies/[slug]` | GET | Single company with news |
| `/api/news` | GET | All news items (filterable) |
| `/api/trends` | GET | Detected trends |
| `/api/briefing` | GET | Fetch briefings |
| `/api/briefing` | POST | Generate new briefing |
| `/api/analyze` | POST | Analyze news with Claude |

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run seed         # Seed companies data
npm run seed:news    # Seed mock news data
npm run lint         # Run ESLint
```

## Demo Data

The project comes pre-seeded with realistic mock data including:
- 9 companies with detailed profiles
- 21 news items with AI analysis
- 4 emerging trends
- 12 job signals

This allows the dashboard to look populated and professional for demonstrations.

## Why This Project

This is a portfolio project demonstrating:
1. **AI-powered business automation** - Using Claude to replace manual competitive research
2. **Agentic workflow patterns** - Data collection, AI analysis, structured output, reporting
3. **Modern full-stack development** - Next.js 14, TypeScript, Tailwind, SQLite
4. **Domain expertise** - Deep understanding of the process mining competitive landscape

---

Built with Claude Code
