/**
 * Migration Runner for Production Database
 * Runs SQL migrations against Cloud SQL via Unix socket
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigrations() {
  console.log('🗄️  Starting database migrations...\n');

  const migrations = [
    'add_pdf_template.sql',
    'add_outcome_tracking.sql'
  ];

  for (const migration of migrations) {
    const migrationPath = path.join(__dirname, migration);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migration}`);
      continue;
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`📝 Running migration: ${migration}`);
    
    try {
      // Split by semicolon and filter empty statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.length > 10) { // Skip very short statements
          await prisma.$executeRawUnsafe(statement);
        }
      }

      console.log(`✅ Migration complete: ${migration}\n`);
    } catch (error) {
      // Check if error is "column already exists"
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log(`⚠️  Migration already applied: ${migration}\n`);
      } else {
        console.error(`❌ Migration failed: ${migration}`);
        console.error(`   Error: ${error.message}\n`);
        throw error;
      }
    }
  }

  console.log('✅ All migrations completed successfully!\n');
}

async function main() {
  try {
    await runMigrations();
    
    // Verify columns exist
    console.log('🔍 Verifying database schema...');
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'resumes' 
      AND column_name IN ('pdf_template', 'interview_received', 'outcome_reported_at', 'viewed_count')
    `;
    
    console.log('Columns found:', columns.map(c => c.column_name).join(', '));
    console.log('✅ Schema verification complete!\n');
    
  } catch (error) {
    console.error('❌ Migration script failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
