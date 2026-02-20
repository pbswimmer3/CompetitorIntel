import { NextResponse } from 'next/server';
import { initializeSchema, seedCompanies, getAllCompanies } from '@/lib/db';

export async function POST() {
  try {
    // Initialize schema
    await initializeSchema();

    // Seed companies
    await seedCompanies();

    // Return success with company count
    const companies = await getAllCompanies();

    return NextResponse.json({
      success: true,
      message: 'Database initialized and seeded',
      companyCount: companies.length
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if database is initialized
    const companies = await getAllCompanies();

    return NextResponse.json({
      initialized: companies.length > 0,
      companyCount: companies.length
    });
  } catch {
    return NextResponse.json({
      initialized: false,
      companyCount: 0
    });
  }
}
