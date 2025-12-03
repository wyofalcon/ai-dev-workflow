/**
 * Check if onboarding_completed field exists in users table
 * This script connects to the production database and checks the schema
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOnboardingField() {
  try {
    console.log('🔍 Checking if onboarding_completed column exists...\n');

    // Try to query users with onboarding_completed field
    try {
      const result = await prisma.$queryRaw`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'onboarding_completed'
      `;

      if (result.length > 0) {
        console.log('✅ COLUMN EXISTS: onboarding_completed');
        console.log('Column details:', result[0]);
        console.log('\n📊 Checking column values:');

        const stats = await prisma.$queryRaw`
          SELECT onboarding_completed, COUNT(*) as count
          FROM users
          GROUP BY onboarding_completed
        `;

        console.log('User counts by onboarding status:', stats);
        console.log('\n✅ Issue is NOT a missing column. Checking other possibilities...');

        // Check if any users exist
        const userCount = await prisma.user.count();
        console.log(`\nTotal users: ${userCount}`);

        // Check test user
        const testUser = await prisma.user.findUnique({
          where: { email: 'test-gold-standard-dec3@example.com' },
          select: {
            id: true,
            email: true,
            onboardingCompleted: true,
            createdAt: true,
          },
        });

        if (testUser) {
          console.log('\n👤 Test user found:');
          console.log('  - ID:', testUser.id);
          console.log('  - Email:', testUser.email);
          console.log('  - Onboarding Completed:', testUser.onboardingCompleted);
          console.log('  - Created:', testUser.createdAt);

          // Check if profile exists
          const profile = await prisma.userProfile.findUnique({
            where: { userId: testUser.id },
          });

          console.log('\n📋 User profile exists:', profile ? 'YES' : 'NO');
          if (profile) {
            console.log('  - Profile ID:', profile.id);
            console.log('  - Full Name:', profile.fullName);
          }
        } else {
          console.log('\n⚠️ Test user NOT FOUND in database');
          console.log('Email: test-gold-standard-dec3@example.com');
        }
      } else {
        console.log('❌ COLUMN MISSING: onboarding_completed');
        console.log('\n🔧 Root cause confirmed!');
        console.log('Solution: Run migration to add onboarding_completed column');
        console.log('File: database/migrations/add_onboarding_completed_field.sql');
      }
    } catch (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('❌ COLUMN MISSING: onboarding_completed');
        console.log('Error:', error.message);
        console.log('\n🔧 Root cause confirmed!');
      } else {
        throw error;
      }
    }

    console.log('\n✅ Check complete');
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkOnboardingField();
