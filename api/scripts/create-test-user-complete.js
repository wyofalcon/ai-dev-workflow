/**
 * Create a complete test user in both Firebase Auth AND Database
 * This ensures the user can actually log in
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
      url: process.env.DATABASE_URL || 'postgresql://cvstomize_app:CVstomize_Fresh_2025_2157@34.67.70.34:5432/cvstomize_production'
    }
  }
});

async function createTestUser(email, password, displayName) {
  try {
    console.log(`\n🔧 Creating complete test user: ${email}`);
    console.log('=' .repeat(60));

    // Step 1: Create user in Firebase Auth
    console.log('\n1️⃣ Creating Firebase Auth user...');
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: displayName,
        emailVerified: true // Auto-verify for testing
      });
      console.log(`✅ Firebase user created: ${firebaseUser.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️ User already exists in Firebase, fetching...`);
        firebaseUser = await admin.auth().getUserByEmail(email);
        // Update password
        await admin.auth().updateUser(firebaseUser.uid, { password: password });
        console.log(`✅ Password updated for existing user: ${firebaseUser.uid}`);
      } else if (error.code === 'auth/insufficient-permission') {
        console.error('❌ Firebase Admin SDK lacks permissions');
        console.error('Run this command as owner (ashley.caban.c@gmail.com):');
        console.error('gcloud projects add-iam-policy-binding cvstomize --member="serviceAccount:cvstomize-deployer@cvstomize.iam.gserviceaccount.com" --role="roles/firebase.admin"');
        throw error;
      } else {
        throw error;
      }
    }

    // Step 2: Create user in Database
    console.log('\n2️⃣ Creating database user...');
    let dbUser;
    try {
      dbUser = await prisma.user.upsert({
        where: { firebaseUid: firebaseUser.uid },
        update: {
          email: email,
          displayName: displayName,
          subscriptionTier: 'gold',
          updatedAt: new Date()
        },
        create: {
          firebaseUid: firebaseUser.uid,
          email: email,
          displayName: displayName,
          subscriptionTier: 'gold', // Grant Gold immediately
          subscriptionStatus: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Database user created/updated: ${dbUser.id}`);
    } catch (error) {
      console.error('❌ Database error:', error.message);
      throw error;
    }

    // Step 3: Verify everything
    console.log('\n3️⃣ Verifying user setup...');
    const verifyUser = await prisma.user.findUnique({
      where: { id: dbUser.id },
      include: {
        _count: {
          select: { resumes: true }
        }
      }
    });

    console.log('\n' + '=' .repeat(60));
    console.log('✅ TEST USER READY!');
    console.log('=' .repeat(60));
    console.log(`Email:            ${email}`);
    console.log(`Password:         ${password}`);
    console.log(`Display Name:     ${displayName}`);
    console.log(`Firebase UID:     ${firebaseUser.uid}`);
    console.log(`Database ID:      ${dbUser.id}`);
    console.log(`Subscription:     ${verifyUser.subscriptionTier} (${verifyUser.subscriptionStatus || 'N/A'})`);
    console.log(`Resume Count:     ${verifyUser._count.resumes}`);
    console.log(`Created:          ${verifyUser.createdAt}`);
    console.log('=' .repeat(60));
    console.log('\n🎯 You can now log in with this account!');
    console.log(`   URL: https://cvstomize-frontend-q4mdi7os3q-uc.a.run.app`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating test user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const email = process.argv[2] || 'test.gold.dec5.2025@example.com';
const password = process.argv[3] || 'TestGold2025!';
const displayName = process.argv[4] || 'Test Gold User';

createTestUser(email, password, displayName);
