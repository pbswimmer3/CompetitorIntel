import { Company } from '@/lib/db';

export interface JobPosting {
  companyId: string;
  title: string;
  department: string | null;
  location: string | null;
  url: string;
  postedAt: string | null;
}

// Company career page configurations
// Each company uses different ATS platforms
const companyJobSources: Record<string, { type: 'greenhouse' | 'lever' | 'workday' | 'custom'; boardId: string }> = {
  'celonis': { type: 'greenhouse', boardId: 'celonis' },
  'uipath': { type: 'greenhouse', boardId: 'uipath' },
  'abbyy': { type: 'greenhouse', boardId: 'abbyy' },
  'automation-anywhere': { type: 'greenhouse', boardId: 'automationanywhere' },
  'skan-ai': { type: 'lever', boardId: 'skan-ai' },
  'apromore': { type: 'lever', boardId: 'apromore' },
  // Microsoft, IBM, SAP use proprietary systems - not easily scrapable
};

// Greenhouse API - Returns JSON list of jobs
async function fetchGreenhouseJobs(boardId: string, companyId: string): Promise<JobPosting[]> {
  try {
    const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${boardId}/jobs`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`Greenhouse API returned ${response.status} for ${boardId}`);
      return [];
    }

    const data = await response.json();
    const jobs = data.jobs || [];

    return jobs.slice(0, 20).map((job: any) => ({
      companyId,
      title: job.title || 'Unknown Role',
      department: job.departments?.[0]?.name || null,
      location: job.location?.name || null,
      url: job.absolute_url || `https://boards.greenhouse.io/${boardId}/jobs/${job.id}`,
      postedAt: job.updated_at || job.created_at || null,
    }));
  } catch (error) {
    console.error(`Error fetching Greenhouse jobs for ${boardId}:`, error);
    return [];
  }
}

// Lever API - Returns JSON list of jobs
async function fetchLeverJobs(boardId: string, companyId: string): Promise<JobPosting[]> {
  try {
    const response = await fetch(`https://api.lever.co/v0/postings/${boardId}?mode=json`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`Lever API returned ${response.status} for ${boardId}`);
      return [];
    }

    const jobs = await response.json();

    return jobs.slice(0, 20).map((job: any) => ({
      companyId,
      title: job.text || 'Unknown Role',
      department: job.categories?.department || job.categories?.team || null,
      location: job.categories?.location || null,
      url: job.hostedUrl || job.applyUrl || `https://jobs.lever.co/${boardId}/${job.id}`,
      postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
    }));
  } catch (error) {
    console.error(`Error fetching Lever jobs for ${boardId}:`, error);
    return [];
  }
}

// Fetch jobs for a single company
export async function fetchCompanyJobs(company: Company): Promise<JobPosting[]> {
  const source = companyJobSources[company.id];

  if (!source) {
    return [];
  }

  switch (source.type) {
    case 'greenhouse':
      return fetchGreenhouseJobs(source.boardId, company.id);
    case 'lever':
      return fetchLeverJobs(source.boardId, company.id);
    default:
      return [];
  }
}

// Fetch jobs for all companies
export async function fetchAllCompanyJobs(companies: Company[]): Promise<JobPosting[]> {
  const allJobs: JobPosting[] = [];

  for (const company of companies) {
    try {
      const jobs = await fetchCompanyJobs(company);
      allJobs.push(...jobs);

      // Small delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error fetching jobs for ${company.name}:`, error);
    }
  }

  return allJobs;
}

// Analyze job postings for strategic signals
export function analyzeJobSignals(jobs: JobPosting[]): {
  companyId: string;
  totalOpenings: number;
  topDepartments: string[];
  topLocations: string[];
  signals: string[];
}[] {
  // Group jobs by company
  const byCompany = new Map<string, JobPosting[]>();
  for (const job of jobs) {
    const existing = byCompany.get(job.companyId) || [];
    existing.push(job);
    byCompany.set(job.companyId, existing);
  }

  const analyses: {
    companyId: string;
    totalOpenings: number;
    topDepartments: string[];
    topLocations: string[];
    signals: string[];
  }[] = [];

  for (const [companyId, companyJobs] of byCompany) {
    // Count departments
    const deptCounts = new Map<string, number>();
    const locCounts = new Map<string, number>();

    for (const job of companyJobs) {
      if (job.department) {
        deptCounts.set(job.department, (deptCounts.get(job.department) || 0) + 1);
      }
      if (job.location) {
        locCounts.set(job.location, (locCounts.get(job.location) || 0) + 1);
      }
    }

    // Sort by count
    const topDepts = [...deptCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    const topLocs = [...locCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    // Generate signals based on patterns
    const signals: string[] = [];

    // Check for AI/ML hiring surge
    const aiJobs = companyJobs.filter(j =>
      j.title.toLowerCase().includes('ai') ||
      j.title.toLowerCase().includes('machine learning') ||
      j.title.toLowerCase().includes('ml ') ||
      j.title.toLowerCase().includes('data scientist')
    );
    if (aiJobs.length >= 3) {
      signals.push(`Heavy AI/ML hiring (${aiJobs.length} roles)`);
    }

    // Check for sales expansion
    const salesJobs = companyJobs.filter(j =>
      j.title.toLowerCase().includes('sales') ||
      j.title.toLowerCase().includes('account executive') ||
      j.title.toLowerCase().includes('business development')
    );
    if (salesJobs.length >= 5) {
      signals.push(`Sales expansion underway (${salesJobs.length} roles)`);
    }

    // Check for engineering investment
    const engJobs = companyJobs.filter(j =>
      j.title.toLowerCase().includes('engineer') ||
      j.title.toLowerCase().includes('developer')
    );
    if (engJobs.length >= 10) {
      signals.push(`Major engineering investment (${engJobs.length} roles)`);
    }

    // Check for geographic expansion
    const uniqueLocations = new Set(companyJobs.map(j => j.location).filter(Boolean));
    if (uniqueLocations.size >= 5) {
      signals.push(`Geographic expansion (${uniqueLocations.size} locations)`);
    }

    // Check for leadership hiring
    const leadershipJobs = companyJobs.filter(j =>
      j.title.toLowerCase().includes('director') ||
      j.title.toLowerCase().includes('vp ') ||
      j.title.toLowerCase().includes('vice president') ||
      j.title.toLowerCase().includes('head of') ||
      j.title.toLowerCase().includes('chief')
    );
    if (leadershipJobs.length >= 2) {
      signals.push(`Leadership buildout (${leadershipJobs.length} senior roles)`);
    }

    analyses.push({
      companyId,
      totalOpenings: companyJobs.length,
      topDepartments: topDepts,
      topLocations: topLocs,
      signals,
    });
  }

  return analyses;
}
