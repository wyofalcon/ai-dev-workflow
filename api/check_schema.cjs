const { PrismaClient } = require('@prisma/client');

async function checkSchema() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://cvstomize_app:CVst0mize_App_2025!@34.67.70.34:5432/cvstomize_production?schema=public'
      }
    }
  });

  try {
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'resumes' 
      AND column_name IN ('pdf_template', 'interview_received', 'outcome_reported_at')
    `;
    
    console.log('Migration columns found:', result);
    console.log('✅ pdf_template exists:', result.some(r => r.column_name === 'pdf_template'));
    console.log('✅ interview_received exists:', result.some(r => r.column_name === 'interview_received'));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
