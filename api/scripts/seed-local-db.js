/**
 * Seed Local Database
 * Creates a rich user profile directly in the local Postgres DB.
 * Bypasses Firebase Admin checks by using a fixed/mock Firebase UID.
 */

const { PrismaClient } = require('@prisma/client');

// Use the local dev database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://dev_user:dev_password@localhost:5432/cvstomize_dev?schema=public'
    }
  }
});

async function seedLocal() {
  console.log('🌱 Seeding local database...');

  // 1. Create User
  // Use a fixed UID that matches the "Dev Login" mock or a new one
  const firebaseUid = 'local-dev-uid-123';
  const email = 'test@example.com';
  
  const user = await prisma.user.upsert({
    where: { firebaseUid },
    update: {},
    create: {
      firebaseUid,
      email,
      displayName: 'Local Test User',
      subscriptionTier: 'gold',
      resumesGenerated: 0,
      resumesLimit: 999
    }
  });
  console.log(`✅ User created: ${user.id}`);

  // 2. Create UserProfile
  const profile = await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      currentTitle: 'Senior Software Engineer',
      yearsExperience: 5,
      targetRoles: ['Full Stack Developer', 'Tech Lead'],
      skills: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
      summary: 'Experienced developer passionate about building scalable web applications.',
      location: 'San Francisco, CA',
      linkedinUrl: 'linkedin.com/in/testuser',
      experience: [
        {
          company: 'Tech Corp Inc.',
          position: 'Senior Frontend Developer',
          startDate: '2021-01-01',
          current: true,
          description: 'Leading the frontend team in migrating legacy app to React 18. Improved performance by 40%.'
        },
        {
          company: 'StartupX',
          position: 'Full Stack Engineer',
          startDate: '2018-06-01',
          endDate: '2020-12-31',
          description: 'Built MVP from scratch using Node.js and MongoDB. Scaled to 10k users.'
        }
      ],
      education: [
        {
          school: 'University of Technology',
          degree: 'B.S. Computer Science',
          graduationDate: '2018-05-01'
        }
      ]
    }
  });
  console.log(`✅ Profile created: ${profile.id}`);

  // 3. Create a Resume
  await prisma.resume.create({
    data: {
      userId: user.id,
      title: 'Full Stack Resume (v1)',
      targetCompany: 'Google',
      resumeMarkdown: '# Senior Software Engineer\n\n## Summary\nExperienced developer...', 
    }
  });
  console.log('✅ Resume created');

  console.log('\n🎉 Seeding complete!');
  console.log('👉 To use this user:');
  console.log('   Use the "Dev Login" feature in the app if enabled,');
  console.log('   OR ensure your Firebase Auth UID matches "local-dev-uid-123"');
  console.log('   (Note: If using real Firebase Auth, the UID won\'t match automatically.');
  console.log('    You might need to clear the DB and let the app auto-create your real user first,');
  console.log('    then update that user record with seed data.)');
}

seedLocal()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
