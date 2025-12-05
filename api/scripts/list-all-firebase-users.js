/**
 * List all Firebase Auth users
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '../gcp-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'cvstomize'
});

async function listAllUsers() {
  try {
    console.log('\n📋 ALL FIREBASE AUTH USERS');
    console.log('=' .repeat(80));

    const listUsersResult = await admin.auth().listUsers(1000);

    console.log(`\nFound ${listUsersResult.users.length} users:\n`);

    listUsersResult.users.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email || 'No email'}`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Created: ${user.metadata.creationTime}`);
      console.log(`   Verified: ${user.emailVerified ? '✅' : '❌'}`);
      console.log('');
    });

    // Find test users
    const testUsers = listUsersResult.users.filter(u =>
      u.email && (u.email.includes('test') || u.email.includes('claude'))
    );

    if (testUsers.length > 0) {
      console.log('=' .repeat(80));
      console.log(`\n🧪 TEST USERS (${testUsers.length}):\n`);
      testUsers.forEach(user => {
        console.log(`📧 ${user.email}`);
        console.log(`   UID: ${user.uid}`);
        console.log(`   Password: Use "TestGold2025!" to reset`);
        console.log('');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listAllUsers();
