/**
 * Test Production Endpoints
 * Tests both upload and conversation complete with real authentication
 */

const admin = require('firebase-admin');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('/mnt/storage/shared_windows/cvstomize-deployer-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'cvstomize'
  });
}

const PROD_API_URL = 'https://cvstomize-api-351889420459.us-central1.run.app';
const FIREBASE_API_KEY = 'AIzaSyDJd-QHJAbpj_vWcRCX4QD0vBj03z9B6qI';
const REAL_USER_UID = 'FlL9pUGsChanpqyacXhmHaNFuiE2';

async function testProductionEndpoints() {
  try {
    console.log('🔑 Creating custom token for production user...\n');

    const customToken = await admin.auth().createCustomToken(REAL_USER_UID);
    console.log('✅ Custom token created');

    console.log('\n🔄 Exchanging for ID token...\n');

    const tokenExchangeResponse = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
      {
        token: customToken,
        returnSecureToken: true
      }
    );

    const idToken = tokenExchangeResponse.data.idToken;
    console.log('✅ ID token obtained');

    // TEST 1: Upload endpoint
    console.log('\n📤 TEST 1: Upload endpoint...\n');

    const testResume = `John Doe
Senior Software Engineer

EXPERIENCE:
- 5 years experience with React, Node.js, PostgreSQL
- Led team of 5 developers at Tech Company

SKILLS:
JavaScript, TypeScript, React, Node.js

EDUCATION:
B.S. Computer Science - University of Technology (2018)`;

    fs.writeFileSync('/tmp/test-resume.txt', testResume);

    const form = new FormData();
    form.append('resumes', fs.createReadStream('/tmp/test-resume.txt'));

    try {
      const uploadResponse = await axios.post(
        `${PROD_API_URL}/api/resume/extract-text`,
        form,
        {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            ...form.getHeaders()
          }
        }
      );

      console.log('✅ UPLOAD SUCCESS!');
      console.log('Response:', JSON.stringify(uploadResponse.data, null, 2));
    } catch (uploadError) {
      console.log('❌ UPLOAD FAILED');
      console.log('Status:', uploadError.response?.status);
      console.log('Error:', uploadError.response?.data);
    }

    // TEST 2: Conversation complete endpoint
    console.log('\n💬 TEST 2: Conversation complete endpoint...\n');

    try {
      const completeResponse = await axios.post(
        `${PROD_API_URL}/api/conversation/complete`,
        {
          responses: {
            "personality": "analytical",
            "goals": "career advancement"
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ CONVERSATION COMPLETE SUCCESS!');
      console.log('Response:', JSON.stringify(completeResponse.data, null, 2));
    } catch (completeError) {
      console.log('❌ CONVERSATION COMPLETE FAILED');
      console.log('Status:', completeError.response?.status);
      console.log('Error:', completeError.response?.data);
    }

    // Cleanup
    fs.unlinkSync('/tmp/test-resume.txt');

    console.log('\n✅ Testing complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

testProductionEndpoints();
