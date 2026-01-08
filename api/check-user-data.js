const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: true
      }
    });

    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log('------------------------------------------------');
      console.log(`User ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Firebase UID: ${user.firebaseUid}`);
      console.log(`Has Profile: ${!!user.profile}`);
      if (user.profile) {
        console.log('Profile Data Summary:');
        console.log(`  Full Name: ${user.profile.fullName}`);
        console.log(`  Skills Count: ${user.profile.skills?.length || 0}`);
        console.log(`  Work Exp Count: ${user.profile.workExperience?.length || 0}`);
        console.log(`  Contact: ${user.profile.phone}, ${user.profile.location}`);
      } else {
        console.log('⚠️  NO PROFILE DATA FOUND');
      }
    });
    console.log('------------------------------------------------');
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
