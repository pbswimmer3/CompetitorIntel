import { Company } from '@/lib/db';

export interface GitHubRepo {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  updatedAt: string;
  pushedAt: string;
}

export interface GitHubActivity {
  companyId: string;
  orgName: string;
  totalPublicRepos: number;
  totalStars: number;
  topRepos: GitHubRepo[];
  recentlyUpdated: GitHubRepo[];
  signals: string[];
}

// Map company IDs to GitHub organization names
const companyGitHubOrgs: Record<string, string[]> = {
  'celonis': ['celonis'],
  'uipath': ['UiPath'],
  'abbyy': ['abbyy'],
  'automation-anywhere': ['AutomationAnywhere'],
  'apromore': ['apromore'],
  'ibm': ['IBM'], // Note: IBM has thousands of repos, we'll filter
  'microsoft': ['microsoft', 'Azure'], // Filter to automation-related
  'sap-signavio': ['signavio', 'SAP'], // Filter to process-related
};

// Keywords to filter repos for large orgs
const relevantKeywords = [
  'process', 'automation', 'rpa', 'mining', 'workflow',
  'ai', 'ml', 'machine-learning', 'intelligent',
  'document', 'ocr', 'extract'
];

function isRelevantRepo(repo: any): boolean {
  const name = (repo.name || '').toLowerCase();
  const desc = (repo.description || '').toLowerCase();
  const combined = `${name} ${desc}`;

  return relevantKeywords.some(keyword => combined.includes(keyword));
}

// Fetch public repos for a GitHub organization
async function fetchOrgRepos(orgName: string, filterRelevant: boolean = false): Promise<GitHubRepo[]> {
  try {
    // GitHub API - no auth needed for public data, but rate limited to 60 req/hour
    const response = await fetch(
      `https://api.github.com/orgs/${orgName}/repos?type=public&sort=updated&per_page=30`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CompetitorIntelDashboard/1.0',
        },
      }
    );

    if (!response.ok) {
      console.log(`GitHub API returned ${response.status} for ${orgName}`);
      return [];
    }

    const repos = await response.json();

    let filtered = repos;
    if (filterRelevant) {
      filtered = repos.filter(isRelevantRepo);
    }

    return filtered.map((repo: any) => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      language: repo.language,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
    }));
  } catch (error) {
    console.error(`Error fetching GitHub repos for ${orgName}:`, error);
    return [];
  }
}

// Fetch GitHub activity for a single company
export async function fetchCompanyGitHub(company: Company): Promise<GitHubActivity | null> {
  const orgNames = companyGitHubOrgs[company.id];

  if (!orgNames || orgNames.length === 0) {
    return null;
  }

  const allRepos: GitHubRepo[] = [];
  const signals: string[] = [];

  // Large orgs need filtering
  const needsFiltering = ['ibm', 'microsoft', 'sap-signavio'].includes(company.id);

  for (const orgName of orgNames) {
    const repos = await fetchOrgRepos(orgName, needsFiltering);
    allRepos.push(...repos);

    // Rate limit delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (allRepos.length === 0) {
    return null;
  }

  // Calculate totals
  const totalStars = allRepos.reduce((sum, repo) => sum + repo.stars, 0);

  // Sort by stars for top repos
  const topRepos = [...allRepos]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 5);

  // Sort by push date for recently updated
  const recentlyUpdated = [...allRepos]
    .sort((a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime())
    .slice(0, 5);

  // Generate signals
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentPushes = allRepos.filter(r => new Date(r.pushedAt) > oneWeekAgo);
  if (recentPushes.length >= 3) {
    signals.push(`Active development (${recentPushes.length} repos updated this week)`);
  }

  // Check for AI/ML repos
  const aiRepos = allRepos.filter(r => {
    const combined = `${r.name} ${r.description || ''}`.toLowerCase();
    return combined.includes('ai') || combined.includes('ml') || combined.includes('machine');
  });
  if (aiRepos.length >= 2) {
    signals.push(`AI/ML focus (${aiRepos.length} related repos)`);
  }

  // Check for high-star repos
  const popularRepos = allRepos.filter(r => r.stars >= 100);
  if (popularRepos.length >= 1) {
    signals.push(`Popular open source (${popularRepos.length} repos with 100+ stars)`);
  }

  return {
    companyId: company.id,
    orgName: orgNames[0],
    totalPublicRepos: allRepos.length,
    totalStars,
    topRepos,
    recentlyUpdated,
    signals,
  };
}

// Fetch GitHub activity for all companies
export async function fetchAllGitHubActivity(companies: Company[]): Promise<GitHubActivity[]> {
  const activities: GitHubActivity[] = [];

  for (const company of companies) {
    try {
      const activity = await fetchCompanyGitHub(company);
      if (activity) {
        activities.push(activity);
      }

      // Rate limiting - GitHub allows 60 requests/hour for unauthenticated
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error fetching GitHub for ${company.name}:`, error);
    }
  }

  return activities;
}
