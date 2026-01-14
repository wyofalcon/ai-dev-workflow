const admin = require('firebase-admin');
const path = require('path');

// Initialize with service account key
const serviceAccount = require(path.join(__dirname, '../gcp-key.json'));

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'cvstomize'
  });
} catch (e) {
  // Already initialized
}

async function resetPassword(email, newPassword) {
  try {
    console.log(`🔍 Looking for user: ${email}`);

    const user = await admin.auth().getUserByEmail(email);
    console.log(`✅ Found user: ${user.uid}`);

    await admin.auth().updateUser(user.uid, {
      password: newPassword
    });

    console.log(`✅ Password updated successfully for ${email}`);
    console.log(`New password: ${newPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'auth/insufficient-permission') {
      console.log('\n💡 Need to grant Firebase Auth permissions to service account:');
      console.log('gcloud projects add-iam-policy-binding cvstomize --member="serviceAccount:cvstomize-deployer@cvstomize.iam.gserviceaccount.com" --role="roles/firebase.admin"');
    }
    process.exit(1);
  }
}

const email = process.argv[2] || 'claude.test.20250403@example.com';
const newPassword = process.argv[3] || 'TestGold2025!';

resetPassword(email, newPassword);
