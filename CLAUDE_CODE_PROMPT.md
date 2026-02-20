I want to build a Competitor Intelligence Dashboard for the process mining industry as a portfolio project.

IMPORTANT: Read the file PROJECT_SPEC.md in this directory first. It contains:
- Full feature spec
- Database schema (SQLite)
- Company seed data (9 companies including Celonis, UiPath, Skan.AI)
- Claude API integration code
- Tech stack details
- Project structure

After reading the spec, here's how I want you to build this:

## Phase 1: Project Setup
1. Initialize Next.js 14 with TypeScript, Tailwind, App Router, src directory
2. Install all dependencies (see spec for full list)
3. Set up shadcn/ui components
4. Create the SQLite database with the schema from the spec
5. Seed the companies table with the data from companies.json in the spec

## Phase 2: Data Layer
1. Build the Google News RSS scraper (src/lib/scrapers/news.ts)
2. Build a seed-data script that populates realistic mock news items so the dashboard looks good without live data
3. Build the Claude API wrapper (src/lib/claude.ts) for news analysis and briefing generation

## Phase 3: API Routes
1. GET /api/companies — list all companies
2. GET /api/companies/[slug] — single company with its news
3. GET /api/news — all news items, filterable by company and category
4. POST /api/analyze — trigger Claude analysis on new items
5. POST /api/briefing — generate weekly briefing
6. GET /api/trends — get detected trends

## Phase 4: Dashboard UI
Build a polished, dark-themed dashboard that looks like it belongs in an enterprise product:
1. **Main page (/):** Market overview stats at top, company cards grid, recent alerts feed
2. **Company detail (/company/[slug]):** Company info, news timeline, job signals
3. **Briefing page (/briefing):** Generate and view weekly briefings, with export option
4. **Navigation:** Clean sidebar or top nav

Design notes:
- Dark theme (think Bloomberg Terminal meets modern SaaS)
- Use significance badges (red for high, yellow for medium, gray for low)
- Company cards should show name, category, funding, and latest headline
- The alert feed should be the most prominent feature — it's the "wow" element
- Make it responsive

## Phase 5: Polish
1. Add loading states and error handling
2. Seed enough mock data that every section looks populated
3. Make sure the briefing generator actually calls Claude and produces good output
4. Add a "Last updated" timestamp
5. Clean up the README

Build this incrementally — get each phase working before moving to the next. Start with Phase 1 now.
