/**
 * Restore Firebase Auth users from PostgreSQL database
 * This recreates all users that exist in DB but not in Firebase Auth
 */

const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../gcp-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'cvstomize'
});

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://cvstomize_app:CVstomize_Fresh_2025_2157@34.67.70.34:5432/cvstomize_production'
    }
  }
});

async function restoreFirebaseUsers() {
  try {
    console.log('\n🔄 RESTORING FIREBASE AUTH FROM POSTGRESQL');
    console.log('=' .repeat(70));

    // Step 1: Get all users from PostgreSQL
    console.log('\n1️⃣ Fetching users from PostgreSQL database...');
    const dbUsers = await prisma.user.findMany({
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        displayName: true,
        subscriptionTier: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`   Found ${dbUsers.length} users in database\n`);

    // Step 2: Get all users from Firebase
    console.log('2️⃣ Fetching users from Firebase Auth...');
    const firebaseUsers = await admin.auth().listUsers(1000);
    const firebaseUids = new Set(firebaseUsers.users.map(u => u.uid));
    console.log(`   Found ${firebaseUsers.users.length} users in Firebase Auth\n`);

    // Step 3: Find missing users
    const missingUsers = dbUsers.filter(u => !firebaseUids.has(u.firebaseUid));
    console.log(`3️⃣ Found ${missingUsers.length} users missing from Firebase Auth\n`);

    if (missingUsers.length === 0) {
      console.log('✅ All users are already in Firebase Auth!');
      process.exit(0);
    }

    // Step 4: Restore missing users
    console.log('4️⃣ Restoring missing users to Firebase Auth...\n');

    const defaultPassword = 'TestGold2025!'; // Temporary password for all restored users
    let restored = 0;
    let failed = 0;

    for (const user of missingUsers) {
      try {
        console.log(`   📝 Restoring: ${user.email}`);

        const newUser = await admin.auth().createUser({
          uid: user.firebaseUid, // Use existing UID from database
          email: user.email,
          password: defaultPassword,
          displayName: user.displayName || user.email.split('@')[0],
          emailVerified: true
        });

        console.log(`      ✅ Created: ${newUser.uid}`);
        console.log(`      📧 Email: ${user.email}`);
        console.log(`      🔑 Password: ${defaultPassword}`);
        console.log(`      ⭐ Tier: ${user.subscriptionTier}`);
        console.log('');

        restored++;
      } catch (error) {
        console.error(`      ❌ Failed: ${error.message}\n`);
        failed++;
      }
    }

    // Step 5: Summary
    console.log('\n' + '=' .repeat(70));
    console.log('✅ RESTORATION COMPLETE');
    console.log('=' .repeat(70));
    console.log(`Total users in database:     ${dbUsers.length}`);
    console.log(`Users already in Firebase:   ${firebaseUsers.users.length}`);
    console.log(`Users restored:              ${restored}`);
    console.log(`Restoration failures:        ${failed}`);
    console.log('=' .repeat(70));

    if (restored > 0) {
      console.log(`\n🔐 All restored users have password: ${defaultPassword}`);
      console.log('\n📋 Restored user accounts:');
      missingUsers.forEach((user, idx) => {
        if (idx < 10) { // Show first 10
          console.log(`   ${idx + 1}. ${user.email} (${user.subscriptionTier} tier)`);
        }
      });
      if (missingUsers.length > 10) {
        console.log(`   ... and ${missingUsers.length - 10} more`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ RESTORATION ERROR:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restoreFirebaseUsers();
