const admin = require('firebase-admin');
const path = require('path');

// Initialize with service account key file
const serviceAccount = require(path.join(__dirname, '../gcp-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'cvstomize'
});

async function listUsers() {
  try {
    console.log('📋 Listing Firebase users from cvstomize project...');
    const listUsersResult = await admin.auth().listUsers(100);
    
    console.log(`\nFound ${listUsersResult.users.length} users:\n`);
    listUsersResult.users.forEach((userRecord) => {
      console.log('---');
      console.log(`Email: ${userRecord.email || 'N/A'}`);
      console.log(`UID: ${userRecord.uid}`);
      console.log(`Created: ${userRecord.metadata.creationTime}`);
      console.log(`Email Verified: ${userRecord.emailVerified}`);
    });
    
    // Find our test user
    const testUser = listUsersResult.users.find(u => u.email === 'claude.test.20250403@example.com');
    if (testUser) {
      console.log('\n✅ Test user found:', testUser.email);
      console.log('UID:', testUser.uid);
    } else {
      console.log('\n⚠️ Test user claude.test.20250403@example.com NOT found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  }
}

listUsers();
