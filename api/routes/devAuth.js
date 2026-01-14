/**
 * Development-only authentication routes
 *
 * SECURITY: These routes are ONLY available when:
 *   - NODE_ENV === 'development'
 *   - DEV_AUTH_ENABLED === 'true' (optional extra gate)
 *
 * This allows bypassing Firebase Auth for local development/testing.
 */

const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const prisma = require("../config/database");
const cloudStorage = require("../services/cloudStorage");

// Security gate - block all routes in production
// SECURITY: ENABLE_DEV_AUTH should NEVER be set in production deployments!
const isDevMode =
  process.env.NODE_ENV === "development" ||
  process.env.ENABLE_DEV_AUTH === "true";

if (!isDevMode) {
  router.use((req, res) => {
    return res.status(403).json({
      error: "Forbidden",
      message: "Dev auth routes are disabled in production",
    });
  });
}

// In-memory store for dev tokens (only for development)
const devTokenStore = new Map();

// Dev user configurations
const DEV_USERS = {
  persistent: {
    firebaseUid: "dev-persistent-user",
    email: "dev@cvstomize.local",
    displayName: "Dev User (Persistent)",
    photoUrl: null,
    authProvider: "dev-auth",
    description: "Data persists across sessions",
  },
  ephemeral: {
    firebaseUid: "dev-ephemeral-user",
    email: "ephemeral@cvstomize.local",
    displayName: "Dev User (Ephemeral)",
    photoUrl: null,
    authProvider: "dev-auth",
    description: "Data resets on logout",
  },
};

/**
 * GET /api/auth/dev/users
 * List available dev users
 */
router.get("/users", (req, res) => {
  const users = Object.entries(DEV_USERS).map(([key, user]) => ({
    type: key,
    email: user.email,
    displayName: user.displayName,
    description: user.description,
  }));

  res.json({
    message: "Available dev users",
    users,
    warning: "DEV ONLY - Not available in production",
  });
});

/**
 * POST /api/auth/dev/login
 * Login as a dev user (bypasses Firebase)
 *
 * Body: { userType: 'persistent' | 'ephemeral' }
 */
router.post("/login", async (req, res, next) => {
  try {
    const { userType = "persistent" } = req.body;

    if (!DEV_USERS[userType]) {
      return res.status(400).json({
        error: "Invalid User Type",
        message: `Valid types: ${Object.keys(DEV_USERS).join(", ")}`,
      });
    }

    const devUser = DEV_USERS[userType];

    // For ephemeral user, clear any existing data first
    if (userType === "ephemeral") {
      await clearUserData(devUser.firebaseUid);
    }

    // Find or create the dev user in the database
    let user = await prisma.user.findUnique({
      where: { firebaseUid: devUser.firebaseUid },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: devUser.firebaseUid,
          email: devUser.email,
          emailVerified: true,
          displayName: devUser.displayName,
          photoUrl: devUser.photoUrl,
          authProvider: devUser.authProvider,
          subscriptionTier: "free",
          resumesGenerated: 0,
          resumesLimit: 10, // Give dev users extra resumes
          lastLoginAt: new Date(),
        },
      });
      console.log(`✅ Created dev user: ${devUser.email}`);
    } else {
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // Generate a dev token
    const devToken = `dev_${crypto.randomBytes(32).toString("hex")}`;

    // Store token with user info (expires in 24 hours)
    devTokenStore.set(devToken, {
      firebaseUid: devUser.firebaseUid,
      email: devUser.email,
      displayName: devUser.displayName,
      photoUrl: devUser.photoUrl,
      authProvider: devUser.authProvider,
      emailVerified: true,
      userType,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    console.log(`🔐 Dev login: ${devUser.email} (${userType})`);

    res.json({
      message: "Dev login successful",
      token: devToken,
      userType,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        subscriptionTier: user.subscriptionTier,
        resumesGenerated: user.resumesGenerated,
        resumesLimit: user.resumesLimit,
        onboardingCompleted: user.onboardingCompleted || false,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/dev/logout
 * Logout dev user and optionally clear data (for ephemeral user)
 */
router.post("/logout", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "No token provided",
      });
    }

    const token = authHeader.split("Bearer ")[1];
    const tokenData = devTokenStore.get(token);

    if (!tokenData) {
      return res.status(401).json({
        error: "Invalid Token",
        message: "Dev token not found or expired",
      });
    }

    // For ephemeral user, clear all their data
    if (tokenData.userType === "ephemeral") {
      await clearUserData(tokenData.firebaseUid);
      console.log(`🧹 Cleared ephemeral user data: ${tokenData.email}`);
    }

    // Remove the token
    devTokenStore.delete(token);

    console.log(`🚪 Dev logout: ${tokenData.email} (${tokenData.userType})`);

    res.json({
      message: "Dev logout successful",
      dataCleared: tokenData.userType === "ephemeral",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/dev/verify
 * Verify a dev token (used by middleware)
 */
router.get("/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "No token provided",
    });
  }

  const token = authHeader.split("Bearer ")[1];
  const tokenData = verifyDevToken(token);

  if (!tokenData) {
    return res.status(401).json({
      error: "Invalid Token",
      message: "Dev token not found or expired",
    });
  }

  res.json({
    valid: true,
    user: {
      firebaseUid: tokenData.firebaseUid,
      email: tokenData.email,
      displayName: tokenData.displayName,
      userType: tokenData.userType,
    },
  });
});

/**
 * Helper: Clear all data for a user (for ephemeral logout)
 */
async function clearUserData(firebaseUid) {
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
    select: { id: true },
  });

  if (!user) return;

  // First, get all uploaded resumes to delete their cloud storage files
  const uploadedResumes = await prisma.uploadedResume.findMany({
    where: { userId: user.id },
    select: { storagePath: true },
  });

  // Delete uploaded resume files from cloud storage
  for (const resume of uploadedResumes) {
    if (resume.storagePath) {
      try {
        await cloudStorage.deletePDF(resume.storagePath);
      } catch (error) {
        console.warn(
          `Failed to delete cloud storage file: ${resume.storagePath}`,
          error.message
        );
      }
    }
  }

  // Get generated resumes to delete their PDFs from cloud storage
  const generatedResumes = await prisma.resume.findMany({
    where: { userId: user.id },
    select: { pdfPath: true },
  });

  // Delete generated resume PDFs from cloud storage
  for (const resume of generatedResumes) {
    if (resume.pdfPath) {
      try {
        await cloudStorage.deletePDF(resume.pdfPath);
      } catch (error) {
        console.warn(
          `Failed to delete cloud storage file: ${resume.pdfPath}`,
          error.message
        );
      }
    }
  }

  // Delete database records in order to respect foreign key constraints
  await prisma.$transaction([
    prisma.conversation.deleteMany({ where: { userId: user.id } }),
    prisma.resume.deleteMany({ where: { userId: user.id } }),
    prisma.uploadedResume.deleteMany({ where: { userId: user.id } }),
    prisma.profileStory.deleteMany({ where: { userId: user.id } }),
    prisma.personalityProfile.deleteMany({ where: { userId: user.id } }),
    prisma.personalityTraits.deleteMany({ where: { userId: user.id } }),
    prisma.userProfile.deleteMany({ where: { userId: user.id } }),
    // Reset user to fresh state but keep the account
    prisma.user.update({
      where: { id: user.id },
      data: {
        resumesGenerated: 0,
        onboardingCompleted: false,
        personalityProfileComplete: false,
      },
    }),
  ]);
}

/**
 * Verify a dev token and return user data if valid
 * Exported for use by auth middleware
 */
function verifyDevToken(token) {
  if (!token || !token.startsWith("dev_")) {
    return null;
  }

  const tokenData = devTokenStore.get(token);
  if (!tokenData) {
    return null;
  }

  // Check expiration
  if (Date.now() > tokenData.expiresAt) {
    devTokenStore.delete(token);
    return null;
  }

  return tokenData;
}

// Export both router and helper function
module.exports = router;
module.exports.verifyDevToken = verifyDevToken;
module.exports.DEV_USERS = DEV_USERS;
