import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'db', 'intel.db');
const SCHEMA_PATH = path.join(process.cwd(), 'db', 'schema.sql');
const COMPANIES_PATH = path.join(process.cwd(), 'src', 'data', 'companies.json');

// Ensure db directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log('Initializing database...');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Run schema
console.log('Creating schema...');
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);

// Load companies data
console.log('Loading companies...');
const companiesJson = fs.readFileSync(COMPANIES_PATH, 'utf-8');
const companies = JSON.parse(companiesJson);

// Insert companies
const insertCompany = db.prepare(`
  INSERT OR REPLACE INTO companies (id, name, slug, description, website, founded_year, funding_total, valuation, employee_count_estimate, category)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((companies: any[]) => {
  for (const company of companies) {
    insertCompany.run(
      company.id,
      company.name,
      company.slug,
      company.description,
      company.website,
      company.founded_year,
      company.funding_total,
      company.valuation,
      company.employee_count_estimate,
      company.category
    );
  }
});

insertMany(companies);
console.log(`Inserted ${companies.length} companies.`);

// Verify
const count = db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number };
console.log(`Total companies in database: ${count.count}`);

db.close();
console.log('Database seeded successfully!');
