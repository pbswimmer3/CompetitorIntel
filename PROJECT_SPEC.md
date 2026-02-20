# Competitor Intelligence Dashboard — Project Spec

## What This Is
A web-based competitive intelligence dashboard for the **Process Mining / Process Intelligence** industry. It automatically gathers public data on key players, synthesizes insights using Claude, and generates weekly briefing reports.

**Why it matters:** This is a portfolio project demonstrating AI-powered business automation — specifically the ability to build agentic workflows that replace manual research work.

---

## Target Companies to Track

### Primary Competitors (Process Mining)
1. **Celonis** — Market leader, $13B+ valuation, Series D
2. **UiPath** — Public (NYSE: PATH), RPA + process mining
3. **ABBYY** — Process intelligence + document AI
4. **Minit** (acquired by Microsoft) — Process mining
5. **Apromore** — Open-source process mining

### Adjacent Players
6. **Microsoft** (Process Advisor / Copilot) — Bundling process mining into Power Platform
7. **IBM** (Process Mining) — Enterprise play
8. **SAP Signavio** — Acquired by SAP, integrated into ERP
9. **Automation Anywhere** — RPA + process discovery

### The Company We're Scouting For
10. **Skan.AI** — Series B, computer-vision-based process intelligence

---

## Core Features

### 1. Data Collection Layer
Scrape/fetch public data from these sources:
- **News**: Google News RSS, Bing News API (free tier), or web scraping
- **Press Releases**: Company newsroom pages
- **Job Postings**: LinkedIn/Greenhouse/Lever career pages (signals hiring = investment areas)
- **Funding/M&A**: Crunchbase (free tier), PitchBook news
- **Product Updates**: Company blogs, changelog pages
- **Social Signals**: Twitter/X mentions, LinkedIn company updates

### 2. AI Analysis Layer (Claude API)
For each batch of collected data, use Claude to:
- **Categorize** news by type (funding, product launch, partnership, hiring, executive change)
- **Extract** key entities (people, companies, dollar amounts, dates)
- **Assess** strategic implications ("What does this mean for the competitive landscape?")
- **Identify trends** across companies (e.g., "3 of 5 competitors launched AI copilot features this month")
- **Generate risk/opportunity flags** for Skan.AI specifically

### 3. Dashboard UI
- **Overview**: Market landscape summary with key metrics
- **Company Cards**: One per competitor with latest news, funding, headcount trends
- **Trend Analysis**: What themes are emerging across the market
- **Weekly Briefing**: Auto-generated executive summary (PDF-exportable)
- **Alert Feed**: Chronological feed of notable events with AI-generated significance ratings (High/Med/Low)

### 4. Weekly Briefing Generator
Auto-generates a structured briefing:
- Market pulse (1-2 sentences)
- Top 3 developments this week
- Company-by-company updates
- Strategic implications for Skan.AI
- Recommended actions

---

## Tech Stack

```
Frontend:  Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
Backend:   Next.js API routes
AI:        Anthropic Claude API (claude-sonnet-4-20250514)
Database:  SQLite via better-sqlite3 (simple, no infra needed)
Scraping:  Cheerio + node-fetch (for HTML parsing)
Charts:    Recharts
PDF:       @react-pdf/renderer (for briefing export)
```

---

## Project Structure

```
competitor-intel-dashboard/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── .env.local              # ANTHROPIC_API_KEY goes here
├── prisma/ or db/
│   └── schema.sql          # SQLite schema
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Main dashboard
│   │   ├── briefing/
│   │   │   └── page.tsx                # Weekly briefing view
│   │   └── company/[slug]/
│   │       └── page.tsx                # Company detail page
│   ├── components/
│   │   ├── CompanyCard.tsx
│   │   ├── AlertFeed.tsx
│   │   ├── TrendChart.tsx
│   │   ├── MarketOverview.tsx
│   │   ├── BriefingGenerator.tsx
│   │   └── Navbar.tsx
│   ├── lib/
│   │   ├── db.ts                       # SQLite connection
│   │   ├── claude.ts                   # Claude API wrapper
│   │   ├── scrapers/
│   │   │   ├── news.ts                 # Google News RSS parser
│   │   │   ├── careers.ts              # Job posting scraper
│   │   │   └── crunchbase.ts           # Funding data
│   │   └── analysis/
│   │       ├── categorize.ts           # News categorization
│   │       ├── trends.ts               # Cross-company trend detection
│   │       └── briefing.ts             # Weekly briefing generation
│   └── data/
│       └── companies.json              # Static company metadata
```

---

## Database Schema

```sql
CREATE TABLE companies (
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

CREATE TABLE news_items (
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

CREATE TABLE trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    related_companies TEXT, -- JSON array of company IDs
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    trend_type TEXT -- 'product', 'market', 'hiring', 'funding'
);

CREATE TABLE briefings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_of DATE NOT NULL,
    content TEXT NOT NULL, -- Full markdown briefing
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT REFERENCES companies(id),
    role_title TEXT,
    department TEXT,
    location TEXT,
    url TEXT,
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Seed Data (companies.json)

```json
[
  {
    "id": "celonis",
    "name": "Celonis",
    "slug": "celonis",
    "description": "Market leader in process mining. AI-enhanced execution management platform.",
    "website": "https://www.celonis.com",
    "founded_year": 2011,
    "funding_total": "$1.4B",
    "valuation": "$13B",
    "employee_count_estimate": 3000,
    "category": "competitor"
  },
  {
    "id": "uipath",
    "name": "UiPath",
    "slug": "uipath",
    "description": "Enterprise automation platform. Public company (NYSE: PATH). RPA + process mining.",
    "website": "https://www.uipath.com",
    "founded_year": 2005,
    "funding_total": "Public",
    "valuation": "~$7B market cap",
    "employee_count_estimate": 4000,
    "category": "competitor"
  },
  {
    "id": "abbyy",
    "name": "ABBYY",
    "slug": "abbyy",
    "description": "Process intelligence and intelligent document processing.",
    "website": "https://www.abbyy.com",
    "founded_year": 1989,
    "funding_total": "$200M+",
    "valuation": "Private",
    "employee_count_estimate": 1200,
    "category": "competitor"
  },
  {
    "id": "microsoft",
    "name": "Microsoft (Process Advisor)",
    "slug": "microsoft-process",
    "description": "Process mining via Power Automate Process Advisor, now enhanced with Copilot.",
    "website": "https://powerautomate.microsoft.com",
    "founded_year": 1975,
    "funding_total": "Public",
    "valuation": "Public (MSFT)",
    "employee_count_estimate": 220000,
    "category": "adjacent"
  },
  {
    "id": "ibm",
    "name": "IBM Process Mining",
    "slug": "ibm-process",
    "description": "Enterprise process mining integrated with Watson/watsonx AI.",
    "website": "https://www.ibm.com/products/process-mining",
    "founded_year": 1911,
    "funding_total": "Public",
    "valuation": "Public (IBM)",
    "employee_count_estimate": 280000,
    "category": "adjacent"
  },
  {
    "id": "sap-signavio",
    "name": "SAP Signavio",
    "slug": "sap-signavio",
    "description": "Process transformation suite acquired by SAP in 2021. Integrated into SAP ecosystem.",
    "website": "https://www.signavio.com",
    "founded_year": 2009,
    "funding_total": "Acquired by SAP (~$1.2B)",
    "valuation": "SAP subsidiary",
    "employee_count_estimate": 800,
    "category": "competitor"
  },
  {
    "id": "automation-anywhere",
    "name": "Automation Anywhere",
    "slug": "automation-anywhere",
    "description": "Cloud-native RPA + process discovery platform.",
    "website": "https://www.automationanywhere.com",
    "founded_year": 2003,
    "funding_total": "$840M",
    "valuation": "$6.8B",
    "employee_count_estimate": 2500,
    "category": "adjacent"
  },
  {
    "id": "apromore",
    "name": "Apromore",
    "slug": "apromore",
    "description": "Open-source process mining platform. Academic roots (University of Melbourne).",
    "website": "https://apromore.com",
    "founded_year": 2019,
    "funding_total": "$15M+",
    "valuation": "Private",
    "employee_count_estimate": 80,
    "category": "competitor"
  },
  {
    "id": "skan-ai",
    "name": "Skan.AI",
    "slug": "skan-ai",
    "description": "Computer-vision based process intelligence. Series B. Non-invasive process discovery.",
    "website": "https://www.skan.ai",
    "founded_year": 2018,
    "funding_total": "$54M",
    "valuation": "Private",
    "employee_count_estimate": 90,
    "category": "target"
  }
]
```

---

## Claude API Integration

### Wrapper (src/lib/claude.ts)
```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // Uses ANTHROPIC_API_KEY env var

export async function analyzeNews(
  newsItems: { title: string; content: string; source: string }[]
) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system:
      "You are a competitive intelligence analyst specializing in the process mining and enterprise automation industry. Analyze news items and provide structured insights.",
    messages: [
      {
        role: "user",
        content: `Analyze these news items about process mining companies. For each, provide:
1. Category (funding/product/partnership/hiring/executive/other)
2. Significance (high/medium/low)
3. One-sentence summary
4. Strategic implication for a Series B process intelligence startup competing in this space

News items:
${JSON.stringify(newsItems, null, 2)}

Respond in JSON format:
{
  "analyses": [
    {
      "title": "...",
      "category": "...",
      "significance": "...",
      "summary": "...",
      "implication": "..."
    }
  ],
  "cross_cutting_trends": ["..."]
}`,
      },
    ],
  });

  return JSON.parse(
    response.content[0].type === "text" ? response.content[0].text : ""
  );
}

export async function generateBriefing(weekData: any) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    system:
      "You are a senior strategy analyst writing a weekly competitive intelligence briefing for the leadership team of Skan.AI, a Series B process intelligence startup.",
    messages: [
      {
        role: "user",
        content: `Generate a weekly competitive intelligence briefing based on this data:

${JSON.stringify(weekData, null, 2)}

Structure:
## Market Pulse
(2-3 sentence overview of the week)

## Top Developments
(Top 3 most significant events with analysis)

## Company Updates
(Brief update per company with notable activity)

## Trends to Watch
(Emerging patterns across the competitive landscape)

## Strategic Implications for Skan.AI
(What this means for positioning, product, and GTM)

## Recommended Actions
(2-3 specific things leadership should consider)`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}
```

---

## Key Scraping Approach

Since this is a home project without paid API access, use these free methods:

### Google News RSS
```
https://news.google.com/rss/search?q="celonis"+process+mining&hl=en-US&gl=US&ceid=US:en
```
Parse the RSS XML, extract titles, links, dates.

### Company Career Pages
Scrape the careers/jobs pages of each company. Count open roles by department to track hiring signals.

### Fallback: Mock/Seed Data
For the demo, include a `seed-data.ts` script that populates the DB with realistic sample news items so the dashboard looks great even without live scraping. This is critical for demo purposes.

---

## Build Instructions for Claude Code

When you open Claude Code, paste this prompt:

```
I want to build a Competitor Intelligence Dashboard for the process mining industry. 

Here's what I need:
1. Read the PROJECT_SPEC.md file in this directory for full details
2. Initialize a Next.js 14 project with TypeScript, Tailwind, and shadcn/ui
3. Set up SQLite with better-sqlite3
4. Create the database schema and seed it with the companies.json data
5. Build the scraping layer (Google News RSS + fallback seed data)
6. Build the Claude API integration for news analysis and briefing generation
7. Build the dashboard UI with:
   - Market overview with key stats
   - Company cards grid
   - Alert/news feed with significance ratings
   - Trend analysis section
   - Weekly briefing generator page
8. Make it look polished — this is a portfolio piece

Start by reading PROJECT_SPEC.md, then build incrementally. Ask me questions if anything is unclear.
```

---

## Demo Talking Points

When presenting this to Skan.AI:

1. **"I built this in a week using Claude Code"** — proves you can move fast with AI tools
2. **"It replaces 5-10 hours/week of manual competitive research"** — speaks to the 'do more with less' mandate
3. **"The agentic workflow pattern is reusable"** — data collection → AI analysis → structured output → reporting can be applied to any business process
4. **"I chose your competitive landscape intentionally"** — shows you've done your homework on the market
5. **"Here's how I'd apply this pattern to deal desk, legal review, customer onboarding..."** — bridges from project to role

---

## Environment Setup

```bash
# Prerequisites
node -v  # Need 18+
npm -v

# Create project
npx create-next-app@latest competitor-intel-dashboard --typescript --tailwind --eslint --app --src-dir

# Install dependencies
cd competitor-intel-dashboard
npm install @anthropic-ai/sdk better-sqlite3 cheerio rss-parser recharts @react-pdf/renderer
npm install -D @types/better-sqlite3

# shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add card badge button tabs separator scroll-area

# Environment variable
echo "ANTHROPIC_API_KEY=your-key-here" > .env.local
```

---

## Success Criteria
- [ ] Dashboard loads with all 9 companies displayed
- [ ] News feed shows categorized, AI-analyzed items
- [ ] Clicking a company shows its detail page
- [ ] Trend analysis identifies patterns across companies
- [ ] Weekly briefing generates a polished, exportable report
- [ ] Looks professional enough to screen-share in an interview
- [ ] Entire thing is on GitHub with a clean README
