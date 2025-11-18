/**
 * Create Firebase Test Users for Staging
 *
 * Creates actual Firebase Auth users that match our staging database records
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./cvstomize-deployer-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'cvstomize'
  });
}

async function createTestUsers() {
  const testUsers = [
    {
      uid: 'staging-test-user-1',
      email: 'test1@cvstomize.dev',
      displayName: 'Test User Free',
      password: 'TestPassword123!'
    },
    {
      uid: 'staging-test-user-2',
      email: 'test2@cvstomize.dev',
      displayName: 'Test User Premium',
      password: 'TestPassword123!'
    },
    {
      uid: 'staging-test-user-unlimited',
      email: 'unlimited@cvstomize.dev',
      displayName: 'Test User Unlimited',
      password: 'TestPassword123!'
    }
  ];

  console.log('🔑 Creating Firebase test users...\n');

  for (const user of testUsers) {
    try {
      // Try to create user
      const userRecord = await admin.auth().createUser({
        uid: user.uid,
        email: user.email,
        emailVerified: true,
        password: user.password,
        displayName: user.displayName,
        disabled: false
      });

      console.log('✅ Created:', user.email, '(UID:', user.uid, ')');
    } catch (error) {
      if (error.code === 'auth/uid-already-exists') {
        console.log('⚠️  Already exists:', user.email);

        // Update existing user
        try {
          await admin.auth().updateUser(user.uid, {
            email: user.email,
            emailVerified: true,
            displayName: user.displayName,
            password: user.password
          });
          console.log('   ↳ Updated existing user');
        } catch (updateError) {
          console.error('   ↳ Error updating:', updateError.message);
        }
      } else {
        console.error('❌ Error creating', user.email, ':', error.message);
      }
    }
  }

  console.log('\n✅ Firebase test users created/updated!\n');
  console.log('📋 Test credentials:');
  console.log('   Email: test1@cvstomize.dev');
  console.log('   Email: test2@cvstomize.dev');
  console.log('   Email: unlimited@cvstomize.dev');
  console.log('   Password: TestPassword123!');
  console.log('\n🔑 Now run: node test-staging-upload.js');
}

createTestUsers().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
