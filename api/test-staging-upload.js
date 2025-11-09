/**
 * Test Staging Upload Endpoint
 *
 * This script:
 * 1. Creates a custom Firebase token
 * 2. Exchanges it for an ID token
 * 3. Tests the upload endpoint with real authentication
 */

const admin = require('firebase-admin');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./cvstomize-deployer-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'cvstomize'
  });
}

const STAGING_API_URL = 'https://cvstomize-api-staging-1036528578375.us-central1.run.app';
const FIREBASE_API_KEY = 'AIzaSyDJd-QHJAbpj_vWcRCX4QD0vBj03z9B6qI'; // From Firebase project (cvstomize)

async function testUploadEndpoint() {
  try {
    console.log('🔑 Step 1: Creating custom token for staging-test-user-unlimited...\n');

    // Create custom token
    const customToken = await admin.auth().createCustomToken('staging-test-user-unlimited');
    console.log('✅ Custom token created');

    console.log('\n🔄 Step 2: Exchanging custom token for ID token...\n');

    // Exchange custom token for ID token
    const tokenExchangeResponse = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
      {
        token: customToken,
        returnSecureToken: true
      }
    );

    const idToken = tokenExchangeResponse.data.idToken;
    console.log('✅ ID token obtained');
    console.log('Token expires in:', tokenExchangeResponse.data.expiresIn, 'seconds');

    console.log('\n📤 Step 3: Testing upload endpoint with test resume...\n');

    // Create test resume content
    const testResume = `John Doe
Senior Software Engineer

EXPERIENCE:
- 5 years experience with React, Node.js, PostgreSQL
- Led team of 5 developers at Tech Company
- Built scalable APIs handling 1M requests/day
- Reduced page load time by 40% through optimization

SKILLS:
JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, AWS, Docker, Kubernetes

EDUCATION:
B.S. Computer Science - University of Technology (2018)`;

    // Write to temp file
    fs.writeFileSync('/tmp/test-resume.txt', testResume);

    // Create form data
    const form = new FormData();
    form.append('resumes', fs.createReadStream('/tmp/test-resume.txt'));

    // Test upload endpoint
    const uploadResponse = await axios.post(
      `${STAGING_API_URL}/api/resume/extract-text`,
      form,
      {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          ...form.getHeaders()
        }
      }
    );

    console.log('✅ UPLOAD ENDPOINT TEST SUCCESSFUL!\n');
    console.log('Response:', JSON.stringify(uploadResponse.data, null, 2));

    console.log('\n🎉 STAGING UPLOAD FEATURE WORKING!\n');
    console.log('Next steps:');
    console.log('  1. Test full resume-first flow (JD + resume → gap questions)');
    console.log('  2. Fix any bugs discovered');
    console.log('  3. Route production traffic to working revision');

    // Cleanup
    fs.unlinkSync('/tmp/test-resume.txt');

  } catch (error) {
    console.error('❌ Error testing upload endpoint:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testUploadEndpoint();
