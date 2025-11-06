/**
 * One-time script to fix table ownership
 * Run this with postgres DATABASE_URL
 */

const { PrismaClient } = require('@prisma/client');

async function fixOwnership() {
  console.log('🔧 Fixing table ownership...\n');
  
  // This will use DATABASE_URL from environment
  const prisma = new PrismaClient();
  
  try {
    const tables = ['resumes', 'users', 'personality_traits', 'conversations'];
    
    for (const table of tables) {
      console.log(`📝 Changing ${table} owner to cvstomize_app...`);
      await prisma.$executeRawUnsafe(`ALTER TABLE ${table} OWNER TO cvstomize_app`);
      console.log(`✅ ${table} ownership changed\n`);
    }
    
    // Verify
    console.log('🔍 Verifying ownership...');
    const result = await prisma.$queryRaw`
      SELECT tablename, tableowner 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;
    console.log('Current ownership:', result);
    
    console.log('\n✅ All ownership changes complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixOwnership();
