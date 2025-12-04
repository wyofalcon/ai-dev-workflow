/**
 * Grant Gold Standard access to test account
 * Usage: node scripts/grant-gold-access.js <email>
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function grantGoldAccess(email) {
  try {
    console.log(`🔍 Looking for user: ${email}`);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        _count: {
          select: { resumes: true }
        }
      }
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found user:`, {
      id: user.id,
      email: user.email,
      currentTier: user.subscriptionTier,
      currentStatus: user.subscriptionStatus,
      resumeCount: user._count.resumes
    });

    // Update to Gold tier
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: 'gold',
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      }
    });

    console.log(`✅ Updated user to Gold tier:`, {
      tier: updated.subscriptionTier,
      status: updated.subscriptionStatus,
      startDate: updated.subscriptionStartDate,
      endDate: updated.subscriptionEndDate
    });

    // Check resume count
    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        targetCompany: true,
        createdAt: true,
        status: true
      }
    });

    console.log(`\n📄 Resumes (${resumes.length}):`, resumes);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/grant-gold-access.js <email>');
  process.exit(1);
}

grantGoldAccess(email);
