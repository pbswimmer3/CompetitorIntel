import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db', 'intel.db');
const db = new Database(DB_PATH);

// Mock news data with realistic industry headlines
const mockNewsData = [
  // Celonis - High profile market leader
  {
    company_id: 'celonis',
    title: 'Celonis Launches AI Copilot for Process Mining, Claims 10x Faster Insights',
    url: 'https://example.com/celonis-ai-copilot',
    source: 'TechCrunch',
    published_at: '2026-02-15T10:00:00Z',
    ai_summary: 'Celonis introduces an AI-powered copilot feature that dramatically accelerates process discovery and optimization recommendations.',
    ai_category: 'product',
    ai_significance: 'high',
    ai_implications: 'Sets new bar for AI integration in process mining. Competitors need to respond with similar AI capabilities or risk falling behind.'
  },
  {
    company_id: 'celonis',
    title: 'Celonis Partners with SAP to Deepen ERP Integration',
    url: 'https://example.com/celonis-sap-partnership',
    source: 'Reuters',
    published_at: '2026-02-12T14:30:00Z',
    ai_summary: 'Strategic partnership announcement strengthening Celonis position in enterprise market through deeper SAP integration.',
    ai_category: 'partnership',
    ai_significance: 'high',
    ai_implications: 'Major competitive moat being built. SAP customer base becomes harder for competitors to penetrate.'
  },
  {
    company_id: 'celonis',
    title: 'Celonis Opens New R&D Center in Munich, Adding 200 Engineers',
    url: 'https://example.com/celonis-munich-rd',
    source: 'Bloomberg',
    published_at: '2026-02-08T09:00:00Z',
    ai_summary: 'Celonis expands engineering capacity with significant hiring push in Munich.',
    ai_category: 'hiring',
    ai_significance: 'medium',
    ai_implications: 'Signals continued heavy investment in product development. Talent competition in Munich process mining hub intensifies.'
  },

  // UiPath - Public company RPA + process mining
  {
    company_id: 'uipath',
    title: 'UiPath Q4 Earnings Beat Expectations, Process Mining Revenue Up 45%',
    url: 'https://example.com/uipath-q4-earnings',
    source: 'CNBC',
    published_at: '2026-02-14T16:00:00Z',
    ai_summary: 'UiPath reports strong quarterly results with process mining segment showing exceptional growth.',
    ai_category: 'funding',
    ai_significance: 'high',
    ai_implications: 'Validates RPA+process mining strategy. UiPath becoming a more credible process intelligence competitor.'
  },
  {
    company_id: 'uipath',
    title: 'UiPath Acquires Process Intelligence Startup ProcessAI for $180M',
    url: 'https://example.com/uipath-processai-acquisition',
    source: 'Wall Street Journal',
    published_at: '2026-02-10T11:00:00Z',
    ai_summary: 'UiPath acquires computer vision-based process discovery startup to enhance its process mining capabilities.',
    ai_category: 'funding',
    ai_significance: 'high',
    ai_implications: 'Direct threat to computer vision-based players like Skan.AI. UiPath aggressively expanding capabilities through M&A.'
  },
  {
    company_id: 'uipath',
    title: 'UiPath Names New Chief Product Officer from Salesforce',
    url: 'https://example.com/uipath-new-cpo',
    source: 'Forbes',
    published_at: '2026-02-05T08:00:00Z',
    ai_summary: 'UiPath brings in enterprise SaaS veteran to lead product strategy.',
    ai_category: 'executive',
    ai_significance: 'medium',
    ai_implications: 'Signals focus on enterprise go-to-market and product-led growth strategies.'
  },

  // ABBYY - Process intelligence + document AI
  {
    company_id: 'abbyy',
    title: 'ABBYY Introduces Timeline 7.0 with Enhanced Process Simulation',
    url: 'https://example.com/abbyy-timeline-7',
    source: 'VentureBeat',
    published_at: '2026-02-13T13:00:00Z',
    ai_summary: 'ABBYY releases major update to process mining platform with new simulation and what-if analysis capabilities.',
    ai_category: 'product',
    ai_significance: 'medium',
    ai_implications: 'Process simulation becoming table stakes. Need to evaluate Skan.AI roadmap for similar capabilities.'
  },
  {
    company_id: 'abbyy',
    title: 'ABBYY Reports 35% YoY Growth in Process Intelligence Division',
    url: 'https://example.com/abbyy-growth',
    source: 'BusinessWire',
    published_at: '2026-02-07T10:00:00Z',
    ai_summary: 'ABBYY process intelligence business shows strong growth amid increased demand for automation.',
    ai_category: 'other',
    ai_significance: 'low',
    ai_implications: 'Market continues to grow. Rising tide benefits all players.'
  },

  // Microsoft - Adjacent player
  {
    company_id: 'microsoft',
    title: 'Microsoft Integrates Process Advisor Directly into Copilot for Microsoft 365',
    url: 'https://example.com/microsoft-copilot-process',
    source: 'The Verge',
    published_at: '2026-02-16T15:00:00Z',
    ai_summary: 'Microsoft embeds process mining insights directly into everyday productivity tools via Copilot integration.',
    ai_category: 'product',
    ai_significance: 'high',
    ai_implications: 'Game-changing distribution advantage. Process mining becomes accessible to millions of M365 users without separate tool adoption.'
  },
  {
    company_id: 'microsoft',
    title: 'Microsoft Power Platform Surpasses 30 Million Monthly Active Users',
    url: 'https://example.com/microsoft-power-platform-mau',
    source: 'ZDNet',
    published_at: '2026-02-11T09:30:00Z',
    ai_summary: 'Power Platform continues rapid growth, providing vast distribution channel for Process Advisor.',
    ai_category: 'other',
    ai_significance: 'medium',
    ai_implications: 'Scale advantage widens. Microsoft can afford to bundle process mining at low/no cost.'
  },

  // IBM - Enterprise adjacent
  {
    company_id: 'ibm',
    title: 'IBM Launches watsonx Process Mining with Generative AI Capabilities',
    url: 'https://example.com/ibm-watsonx-process',
    source: 'InfoWorld',
    published_at: '2026-02-09T12:00:00Z',
    ai_summary: 'IBM integrates generative AI into process mining offering under watsonx brand.',
    ai_category: 'product',
    ai_significance: 'medium',
    ai_implications: 'Enterprise AI race intensifies. IBM leveraging existing enterprise relationships to push process mining.'
  },
  {
    company_id: 'ibm',
    title: 'IBM Signs $50M Process Mining Deal with Major European Bank',
    url: 'https://example.com/ibm-bank-deal',
    source: 'CIO',
    published_at: '2026-02-04T14:00:00Z',
    ai_summary: 'IBM wins significant enterprise process mining contract in financial services sector.',
    ai_category: 'partnership',
    ai_significance: 'medium',
    ai_implications: 'Financial services vertical remains competitive. Enterprise sales cycles favor incumbents.'
  },

  // SAP Signavio
  {
    company_id: 'sap-signavio',
    title: 'SAP Makes Signavio Standard in S/4HANA Cloud Implementations',
    url: 'https://example.com/sap-signavio-s4hana',
    source: 'Diginomica',
    published_at: '2026-02-14T08:00:00Z',
    ai_summary: 'SAP bundles Signavio process intelligence into core ERP offering.',
    ai_category: 'product',
    ai_significance: 'high',
    ai_implications: 'Major threat to standalone vendors. SAP customers may not need third-party process mining.'
  },
  {
    company_id: 'sap-signavio',
    title: 'SAP Signavio Adds 500 New Enterprise Customers in Q4',
    url: 'https://example.com/sap-signavio-customers',
    source: 'Enterprise Times',
    published_at: '2026-02-06T11:00:00Z',
    ai_summary: 'Signavio shows strong customer acquisition leveraging SAP distribution.',
    ai_category: 'other',
    ai_significance: 'medium',
    ai_implications: 'SAP channel proving effective. Non-SAP customers become priority target for competitors.'
  },

  // Automation Anywhere
  {
    company_id: 'automation-anywhere',
    title: 'Automation Anywhere Unveils Process Discovery 3.0 with Desktop Analytics',
    url: 'https://example.com/aa-process-discovery-3',
    source: 'TechTarget',
    published_at: '2026-02-12T10:00:00Z',
    ai_summary: 'Automation Anywhere enhances process discovery with desktop activity analysis.',
    ai_category: 'product',
    ai_significance: 'high',
    ai_implications: 'Direct competition with computer vision approaches. Feature parity increasing across vendors.'
  },
  {
    company_id: 'automation-anywhere',
    title: 'Automation Anywhere Raises $200M in Pre-IPO Round',
    url: 'https://example.com/aa-pre-ipo',
    source: 'TechCrunch',
    published_at: '2026-02-02T16:00:00Z',
    ai_summary: 'Automation Anywhere secures significant funding ahead of expected IPO.',
    ai_category: 'funding',
    ai_significance: 'medium',
    ai_implications: 'Well-funded competitor preparing for public market scrutiny. May increase marketing spend.'
  },

  // Apromore - Open source
  {
    company_id: 'apromore',
    title: 'Apromore Community Edition Downloaded 100,000 Times',
    url: 'https://example.com/apromore-downloads',
    source: 'Open Source Weekly',
    published_at: '2026-02-11T09:00:00Z',
    ai_summary: 'Open-source process mining platform reaches significant adoption milestone.',
    ai_category: 'other',
    ai_significance: 'low',
    ai_implications: 'Open source creates downward price pressure. Academic adoption may influence enterprise decisions.'
  },
  {
    company_id: 'apromore',
    title: 'Apromore Partners with University of Melbourne for AI Research',
    url: 'https://example.com/apromore-melbourne',
    source: 'Research News',
    published_at: '2026-02-03T10:00:00Z',
    ai_summary: 'Apromore strengthens academic ties with major research partnership.',
    ai_category: 'partnership',
    ai_significance: 'low',
    ai_implications: 'Research partnerships may yield innovative features. Monitor academic publications.'
  },

  // Skan.AI - The target company
  {
    company_id: 'skan-ai',
    title: 'Skan.AI Closes $28M Series B Extension to Accelerate Enterprise Growth',
    url: 'https://example.com/skan-series-b-extension',
    source: 'TechCrunch',
    published_at: '2026-02-17T09:00:00Z',
    ai_summary: 'Skan.AI raises additional capital to fuel go-to-market expansion and product development.',
    ai_category: 'funding',
    ai_significance: 'high',
    ai_implications: 'Strong investor confidence in computer vision approach. Runway extended for competitive positioning.'
  },
  {
    company_id: 'skan-ai',
    title: 'Skan.AI Wins "Most Innovative Process Mining Solution" at Gartner Summit',
    url: 'https://example.com/skan-gartner-award',
    source: 'PR Newswire',
    published_at: '2026-02-13T14:00:00Z',
    ai_summary: 'Industry recognition for Skan.AI\'s novel computer vision-based approach.',
    ai_category: 'other',
    ai_significance: 'medium',
    ai_implications: 'Analyst recognition improves enterprise credibility. Use in sales collateral.'
  },
  {
    company_id: 'skan-ai',
    title: 'Skan.AI Hires VP of Engineering from Google Cloud',
    url: 'https://example.com/skan-vp-eng',
    source: 'LinkedIn News',
    published_at: '2026-02-08T11:00:00Z',
    ai_summary: 'Skan.AI strengthens engineering leadership with experienced cloud executive.',
    ai_category: 'executive',
    ai_significance: 'medium',
    ai_implications: 'Engineering leadership strengthened. Cloud expertise supports enterprise scaling.'
  }
];

// Mock trends data
const mockTrends = [
  {
    title: 'AI Copilot Integration Becomes Table Stakes',
    description: 'Multiple vendors (Celonis, Microsoft, IBM) have launched AI copilot features in February. This is rapidly becoming an expected capability rather than a differentiator.',
    related_companies: JSON.stringify(['celonis', 'microsoft', 'ibm']),
    trend_type: 'product'
  },
  {
    title: 'Bundling Pressure from Platform Players',
    description: 'Microsoft and SAP are embedding process mining into broader platforms, creating pressure on standalone vendors to demonstrate unique value.',
    related_companies: JSON.stringify(['microsoft', 'sap-signavio']),
    trend_type: 'market'
  },
  {
    title: 'Computer Vision Process Discovery Gaining Traction',
    description: 'UiPath\'s acquisition and Automation Anywhere\'s new release signal growing interest in computer vision for process discovery, validating Skan.AI\'s core approach.',
    related_companies: JSON.stringify(['uipath', 'automation-anywhere', 'skan-ai']),
    trend_type: 'product'
  },
  {
    title: 'Strong Hiring Signals in European Engineering',
    description: 'Multiple vendors expanding engineering teams in Europe, particularly Munich and London, intensifying competition for process mining talent.',
    related_companies: JSON.stringify(['celonis', 'sap-signavio']),
    trend_type: 'hiring'
  }
];

// Mock job signals
const mockJobs = [
  { company_id: 'celonis', role_title: 'Senior AI/ML Engineer', department: 'Engineering', location: 'Munich, Germany' },
  { company_id: 'celonis', role_title: 'Enterprise Account Executive', department: 'Sales', location: 'New York, NY' },
  { company_id: 'celonis', role_title: 'Product Manager - Copilot', department: 'Product', location: 'Munich, Germany' },
  { company_id: 'uipath', role_title: 'Director of Process Mining', department: 'Product', location: 'Bellevue, WA' },
  { company_id: 'uipath', role_title: 'Staff Engineer - Computer Vision', department: 'Engineering', location: 'Bangalore, India' },
  { company_id: 'microsoft', role_title: 'Principal PM - Process Advisor', department: 'Product', location: 'Redmond, WA' },
  { company_id: 'microsoft', role_title: 'Senior SWE - Power Platform', department: 'Engineering', location: 'Redmond, WA' },
  { company_id: 'automation-anywhere', role_title: 'VP of Process Intelligence', department: 'Product', location: 'San Jose, CA' },
  { company_id: 'skan-ai', role_title: 'Senior Computer Vision Engineer', department: 'Engineering', location: 'San Francisco, CA' },
  { company_id: 'skan-ai', role_title: 'Enterprise Sales Director', department: 'Sales', location: 'Boston, MA' },
  { company_id: 'sap-signavio', role_title: 'Integration Architect', department: 'Engineering', location: 'Berlin, Germany' },
  { company_id: 'ibm', role_title: 'Data Scientist - Process Mining', department: 'Research', location: 'Yorktown Heights, NY' }
];

console.log('Seeding mock news data...');

// Clear existing data
db.exec('DELETE FROM news_items');
db.exec('DELETE FROM trends');
db.exec('DELETE FROM job_signals');

// Insert news items
const insertNews = db.prepare(`
  INSERT INTO news_items (company_id, title, url, source, published_at, ai_summary, ai_category, ai_significance, ai_implications)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertNewsMany = db.transaction((items: typeof mockNewsData) => {
  for (const item of items) {
    insertNews.run(
      item.company_id,
      item.title,
      item.url,
      item.source,
      item.published_at,
      item.ai_summary,
      item.ai_category,
      item.ai_significance,
      item.ai_implications
    );
  }
});

insertNewsMany(mockNewsData);
console.log(`Inserted ${mockNewsData.length} news items.`);

// Insert trends
const insertTrend = db.prepare(`
  INSERT INTO trends (title, description, related_companies, trend_type)
  VALUES (?, ?, ?, ?)
`);

const insertTrendsMany = db.transaction((trends: typeof mockTrends) => {
  for (const trend of trends) {
    insertTrend.run(trend.title, trend.description, trend.related_companies, trend.trend_type);
  }
});

insertTrendsMany(mockTrends);
console.log(`Inserted ${mockTrends.length} trends.`);

// Insert job signals
const insertJob = db.prepare(`
  INSERT INTO job_signals (company_id, role_title, department, location)
  VALUES (?, ?, ?, ?)
`);

const insertJobsMany = db.transaction((jobs: typeof mockJobs) => {
  for (const job of jobs) {
    insertJob.run(job.company_id, job.role_title, job.department, job.location);
  }
});

insertJobsMany(mockJobs);
console.log(`Inserted ${mockJobs.length} job signals.`);

// Verify
const newsCount = (db.prepare('SELECT COUNT(*) as count FROM news_items').get() as { count: number }).count;
const trendCount = (db.prepare('SELECT COUNT(*) as count FROM trends').get() as { count: number }).count;
const jobCount = (db.prepare('SELECT COUNT(*) as count FROM job_signals').get() as { count: number }).count;

console.log(`\nDatabase seeded successfully!`);
console.log(`- News items: ${newsCount}`);
console.log(`- Trends: ${trendCount}`);
console.log(`- Job signals: ${jobCount}`);

db.close();
