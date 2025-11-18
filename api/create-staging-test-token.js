/**
 * Generate Firebase Custom Tokens for Staging Test Users
 *
 * This script creates authentication tokens for testing in staging environment.
 * Tokens are valid for 1 hour and can be used to make authenticated API calls.
 *
 * Usage:
 *   node api/create-staging-test-token.js staging-test-user-1
 *   node api/create-staging-test-token.js staging-test-user-unlimited
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // Use the same Firebase project (cvstomize) but tokens work against staging API
  const serviceAccount = require('./cvstomize-deployer-key.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'cvstomize'
  });
}

async function createTestToken(uid) {
  try {
    // Create custom token for test user
    const customToken = await admin.auth().createCustomToken(uid);

    console.log('✅ Firebase Custom Token Generated\n');
    console.log('Firebase UID:', uid);
    console.log('Token (use as Bearer token in API calls):\n');
    console.log(customToken);
    console.log('\n📋 Usage:');
    console.log(`curl -H "Authorization: Bearer ${customToken}" \\`);
    console.log('  https://cvstomize-api-staging-1036528578375.us-central1.run.app/health');
    console.log('\n⏰ Token expires in 1 hour\n');

    return customToken;
  } catch (error) {
    console.error('❌ Error creating token:', error.message);
    process.exit(1);
  }
}

// Get UID from command line
const uid = process.argv[2];

if (!uid) {
  console.error('❌ Usage: node create-staging-test-token.js <firebase-uid>');
  console.error('\nAvailable test users:');
  console.error('  - staging-test-user-1 (free tier)');
  console.error('  - staging-test-user-2 (premium tier)');
  console.error('  - staging-test-user-unlimited (unlimited tier)');
  process.exit(1);
}

createTestToken(uid).then(() => process.exit(0));
