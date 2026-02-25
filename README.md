# Competitor Intelligence Dashboard

An AI-powered competitive intelligence platform for the **Process Mining / Process Intelligence** industry. Built with Next.js 14, TypeScript, Claude AI, and deployed on Vercel.

**Live Demo**: [competitor-intel-five.vercel.app](https://competitor-intel-five.vercel.app/)

## What It Does

This dashboard automatically:
- **Tracks 9 key companies** in the process mining space (Celonis, UiPath, ABBYY, Microsoft, IBM, SAP Signavio, Automation Anywhere, Apromore, Skan.AI)
- **Aggregates news from multiple sources** - Google News RSS, PR Newswire, Business Wire
- **Analyzes every article with Claude AI** - categorization, significance rating, strategic implications
- **Detects market trends** automatically from patterns across news items
- **Generates executive briefings** with threat levels, predictions, and prioritized actions

## Key Features

### AI-Powered Analysis
Every news article is analyzed by Claude AI to determine:
- **Category**: funding, product, partnership, hiring, executive, other
- **Significance**: 🔴 High / 🟡 Medium / 🟢 Low
- **Summary**: One-line insight cutting through PR spin
- **Implication**: Specific strategic recommendation for action

### Automatic Trend Detection
The system identifies cross-company patterns like:
- "Vertical AI Specialization Race"
- "Microsoft Bundling Threat Escalation"
- "AI ROI Scrutiny Intensification"

### Executive Briefings
AI-generated strategic briefings include:
- **Executive Summary** - THE ONE THING leadership must know
- **Competitive Moves That Matter** - with threat levels and recommended responses
- **Signal Detection** - leading indicators predicting future moves
- **30-Day Outlook** - specific predictions based on current signals
- **Prioritized Actions** - tagged [URGENT], [IMPORTANT], or [MONITOR]

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui (dark theme)
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Database**: Neon PostgreSQL (serverless)
- **Deployment**: Vercel
- **Data Sources**: Google News RSS, PR Newswire, Business Wire

## Getting Started

### Prerequisites
- Node.js 18+
- Anthropic API key
- Neon PostgreSQL database (free tier available)

### Quick Start (Windows)

Double-click `start.bat` to:
1. Install dependencies (if needed)
2. Initialize the database (if needed)
3. Start the dev server
4. Open the browser

### Manual Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add:
#   ANTHROPIC_API_KEY=your-key
#   DATABASE_URL=your-neon-connection-string

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `ANTHROPIC_API_KEY`
   - `DATABASE_URL` (from Neon)
4. Deploy
5. Initialize database: `POST /api/init`
6. Refresh news: Click "Refresh News" button

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main dashboard
│   ├── briefing/          # Weekly briefing page
│   ├── company/[slug]/    # Company detail pages
│   └── api/               # API routes
│       ├── companies/     # Company data endpoints
│       ├── news/          # News endpoints + refresh
│       ├── trends/        # Trend detection
│       ├── briefing/      # Briefing generation
│       └── init/          # Database initialization
├── components/            # React components
│   ├── AlertFeed.tsx      # Live intelligence feed
│   ├── CompanyCard.tsx    # Company overview cards
│   ├── MarketOverview.tsx # Stats dashboard
│   ├── TrendCard.tsx      # Trend analysis display
│   ├── BriefingGenerator.tsx # Briefing creation
│   └── Navbar.tsx         # Navigation
└── lib/
    ├── db.ts              # Neon PostgreSQL wrapper
    ├── claude.ts          # Claude AI integration
    └── scrapers/
        └── news.ts        # Multi-source news scraping
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/companies` | GET | List all tracked companies with stats |
| `/api/companies/[slug]` | GET | Single company with news and jobs |
| `/api/news` | GET | All news items (filterable by company, category) |
| `/api/news/refresh` | POST | Fetch new articles + AI analysis + trend detection |
| `/api/trends` | GET | Detected market trends |
| `/api/briefing` | GET | Fetch all briefings |
| `/api/briefing` | POST | Generate new executive briefing |
| `/api/init` | POST | Initialize database schema and seed companies |

## Data Sources

| Source | Type | What It Provides |
|--------|------|------------------|
| Google News RSS | News | General news coverage for each company |
| PR Newswire | Press Releases | Official company announcements |
| Business Wire | Press Releases | Official company announcements |

## Screenshots

### Dashboard
- Market overview with key metrics
- Live intelligence feed with AI-analyzed significance ratings
- Emerging trends detected across companies
- Company cards with latest activity

### Executive Briefing
- AI-generated strategic analysis
- Threat levels for competitive moves
- Prioritized action items
- 30-day market predictions

## Roadmap

### Phase 2 (In Progress)
- [ ] Job posting scraping (Greenhouse/Lever APIs)
- [ ] GitHub activity tracking for public repos

### Phase 3 (Planned)
- [ ] SEC filing analysis for public companies (UiPath, IBM, Microsoft, SAP)

### Future Ideas
- Patent filing monitoring (USPTO)
- G2/Capterra review sentiment
- Website change detection (pricing pages)
- LinkedIn employee count trends

## Why This Project

This is a portfolio project demonstrating:

1. **AI-Powered Business Intelligence** - Using Claude to transform raw news into strategic insights
2. **Multi-Source Data Aggregation** - Combining news, press releases, and (soon) job postings
3. **Automatic Pattern Detection** - Identifying market trends across multiple signals
4. **Production Deployment** - Full CI/CD with Vercel and serverless PostgreSQL
5. **Domain Expertise** - Deep understanding of the process mining competitive landscape

## License

MIT

---

Built with [Claude Code](https://claude.ai/claude-code)
