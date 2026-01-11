const admin = require("firebase-admin");
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const fs = require("fs");
const path = require("path");

// Promise-based lock to prevent concurrent initialization
let firebaseInitPromise = null;
let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK from local service account file
 * Used for local development
 */
async function initializeFromLocalFile() {
  try {
    const keyPath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS || "./gcp-key.json";
    const absolutePath = path.resolve(__dirname, "..", keyPath);

    console.log(`📁 Looking for Firebase credentials at: ${absolutePath}`);

    if (!fs.existsSync(absolutePath)) {
      console.log(
        "📁 No local key file found, trying Application Default Credentials (ADC)..."
      );
      return initializeFromADC();
    }

    // Check if it's a directory (common Docker mistake)
    const stats = fs.statSync(absolutePath);
    if (stats.isDirectory()) {
      console.warn(
        "⚠️ gcp-key.json is a directory, not a file. This happens when Docker mounts a non-existent file."
      );
      console.log(
        "📁 Falling back to Application Default Credentials (ADC)..."
      );
      return initializeFromADC();
    }

    const credentials = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
    let credential;
    let projectId = 
      credentials.project_id ||
      credentials.quota_project_id ||
      process.env.GCP_PROJECT_ID;

    if (credentials.type === "service_account") {
      console.log("🔑 Using Service Account credentials");
      credential = admin.credential.cert(credentials);
    } else {
      console.log(
        `🔑 Using Application Default Credentials (type: ${ 
          credentials.type || "unknown"
        })`
      );
      credential = admin.credential.applicationDefault();
    }

    // Initialize Firebase Admin
    const app = admin.initializeApp({
      credential,
      projectId,
    });

    console.log(
      `✅ Firebase Admin SDK initialized from local file (project: ${projectId})`
    );
    return app;
  } catch (error) {
    console.error(
      "❌ Failed to initialize Firebase from local file:",
      error.message
    );
    console.log("📁 Falling back to Application Default Credentials (ADC)...");

    try {
      return await initializeFromADC();
    } catch (adcError) {
      console.error(
        "❌ Failed to initialize Firebase from ADC:",
        adcError.message
      );

      // In development, allow proceeding without Firebase (for Dev Auth only)
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "⚠️  CONTINUING WITHOUT FIREBASE (Dev Auth only). Some features may be broken."
        );
        // Return a mock app object if needed, or just null.
        // The server will start, but verifyFirebaseToken must rely on dev tokens.
        return null;
      }
      throw error;
    }
  }
}

/**
 * Initialize Firebase Admin SDK using Application Default Credentials
 * Works with gcloud auth application-default login or service account attached to the environment
 */
async function initializeFromADC() {
  try {
    const projectId = process.env.GCP_PROJECT_ID || "cvstomize";

    // If app already initialized, return it
    if (admin.apps.length > 0) {
      return admin.app();
    }

    const app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: projectId,
    });

    console.log(
      `✅ Firebase Admin SDK initialized with ADC (project: ${projectId})`
    );
    return app;
  } catch (error) {
    console.error("❌ Failed to initialize Firebase from ADC:", error.message);
    throw new Error(
      "Could not initialize Firebase. Either:\n" +
        "  1. Create a gcp-key.json file with service account credentials, or\n" +
        "  2. Run: gcloud auth application-default login"
    );
  }
}

/**
 * Initialize Firebase Admin SDK from Google Secret Manager
 * Production-grade initialization with proper error handling
 */
async function initializeFromSecretManager() {
  try {
    const client = new SecretManagerServiceClient();

    // Detect current GCP project (staging vs production)
    // Use K_SERVICE to determine environment, or default to production
    const isStaging = process.env.NODE_ENV === "staging";
    const currentGcpProject = isStaging ? "cvstomize-staging" : "cvstomize";

    // Get project ID from Secret Manager first
    const [projectIdResponse] = await client.accessSecretVersion({
      name: `projects/${currentGcpProject}/secrets/cvstomize-project-id/versions/latest`,
    });
    const projectId = projectIdResponse.payload.data.toString("utf8").trim();

    // Get service account key from Secret Manager (stored in the same GCP project as DATABASE_URL)
    const [serviceAccountResponse] = await client.accessSecretVersion({
      name: `projects/${currentGcpProject}/secrets/cvstomize-service-account-key/versions/latest`,
    });
    const serviceAccountKey = JSON.parse(
      serviceAccountResponse.payload.data.toString("utf8")
    );

    // Initialize Firebase Admin
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
      projectId: projectId,
    });

    console.log("✅ Firebase Admin SDK initialized from Secret Manager");
    return app;
  } catch (error) {
    console.error(
      "❌ Failed to initialize Firebase from Secret Manager:",
      error
    );
    throw error;
  }
}

/**
 * Initialize Firebase Admin SDK with environment detection
 * Supports test, development (with optional emulator), and production environments
 */
async function initializeFirebase() {
  // If already initialized, return existing app
  if (admin.apps.length > 0) {
    console.log("🔥 Firebase app already exists, reusing...");
    return admin.app();
  }

  // If initialization in progress, wait for it
  if (firebaseInitPromise) {
    console.log("⏳ Firebase initialization in progress, waiting...");
    return firebaseInitPromise;
  }

  // Test environment - return mock (handled by jest.mock)
  if (process.env.NODE_ENV === "test") {
    console.log("🧪 Test environment detected - using mocked Firebase");
    // The mock is set up in tests/setup.js
    return admin.app();
  }

  // Firebase Auth Emulator mode (FREE - no GCP costs)
  // Start with: docker compose --profile emulators up
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.log(
      `🔧 Using Firebase Auth Emulator at ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`
    );
    firebaseInitPromise = Promise.resolve().then(() => {
      const app = admin.initializeApp({
        projectId: "demo-cvstomize",
      });
      firebaseApp = app;
      return app;
    });
    return firebaseInitPromise;
  }

  // Development - use local service account file
  if (process.env.NODE_ENV === "development") {
    console.log("🔧 Development environment - using local credentials");
    firebaseInitPromise = initializeFromLocalFile()
      .then((app) => {
        firebaseApp = app;
        return app;
      })
      .catch((error) => {
        firebaseInitPromise = null;
        throw error;
      });
    return firebaseInitPromise;
  }

  // Production/Staging - initialize from Secret Manager
  console.log("🚀 Initializing Firebase Admin SDK from Secret Manager...");
  firebaseInitPromise = initializeFromSecretManager()
    .then((app) => {
      firebaseApp = app;
      return app;
    })
    .catch((error) => {
      firebaseInitPromise = null; // Reset on error to allow retry
      throw error;
    });

  return firebaseInitPromise;
}

/**
 * Get Firebase Admin instance (for testing/mocking)
 * This allows tests to inject their own Firebase mock
 */
function getFirebaseAdmin() {
  if (process.env.NODE_ENV === "test") {
    return admin;
  }
  return admin;
}

module.exports = {
  initializeFirebase,
  getFirebaseAdmin,
};