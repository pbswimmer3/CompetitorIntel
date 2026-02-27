import { NextResponse } from 'next/server';
import {
  getSecFilingAnalysis,
  insertSecFilingAnalysis,
  getAllSecFilingAnalyses,
} from '@/lib/db';
import { analyzeSecFiling } from '@/lib/claude';
import { fetchSECDocumentText, extractFilingSections } from '@/lib/scrapers/sec';

// Allow up to 60 seconds — fetching + extracting + Claude analysis can take 20-40s
export const maxDuration = 60;

// GET - return all stored analyses
export async function GET() {
  try {
    const analyses = await getAllSecFilingAnalyses(50);
    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('Error fetching SEC analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SEC analyses' },
      { status: 500 }
    );
  }
}

// POST - analyze a specific filing with Claude
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, companyName, filingId, docUrl, formType, filedDate, force } = body;

    if (!companyId || !filingId || !formType) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, filingId, formType' },
        { status: 400 }
      );
    }

    // Return cached result if already analyzed (unless force re-analysis requested)
    if (!force) {
      const existing = await getSecFilingAnalysis(filingId);
      if (existing) {
        return NextResponse.json({ analysis: existing, cached: true });
      }
    }

    if (!docUrl) {
      return NextResponse.json(
        { error: 'No document URL available for this filing' },
        { status: 400 }
      );
    }

    // Fetch and extract the document
    let documentText: string;
    try {
      documentText = await fetchSECDocumentText(docUrl);
    } catch (fetchError) {
      const errMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error('Failed to fetch SEC document:', errMsg, 'URL:', docUrl);
      return NextResponse.json(
        { error: `Failed to fetch SEC document: ${errMsg}` },
        { status: 502 }
      );
    }

    // Extract only the strategically relevant sections
    const relevantContent = extractFilingSections(documentText, formType);

    if (!relevantContent || relevantContent.length < 100) {
      console.error('Content extraction too short:', relevantContent?.length, 'chars for', docUrl);
      return NextResponse.json(
        { error: `Could not extract meaningful content (got ${relevantContent?.length ?? 0} chars)` },
        { status: 422 }
      );
    }

    // Call Claude for competitive intelligence
    const aiSummary = await analyzeSecFiling(relevantContent, companyName || companyId, formType);

    // Store the result
    const id = await insertSecFilingAnalysis({
      company_id: companyId,
      filing_id: filingId,
      form_type: formType,
      filed_date: filedDate || '',
      document_url: docUrl,
      ai_summary: aiSummary,
    });

    const analysis = {
      id,
      company_id: companyId,
      filing_id: filingId,
      form_type: formType,
      filed_date: filedDate || '',
      document_url: docUrl,
      ai_summary: aiSummary,
      analyzed_at: new Date().toISOString(),
    };

    return NextResponse.json({ analysis, cached: false });
  } catch (error) {
    console.error('Error analyzing SEC filing:', error);
    return NextResponse.json(
      { error: 'Failed to analyze SEC filing' },
      { status: 500 }
    );
  }
}
