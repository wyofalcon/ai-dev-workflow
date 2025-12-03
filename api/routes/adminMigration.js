/**
 * TEMPORARY ADMIN ROUTE - FOR MIGRATION ONLY
 * DELETE AFTER USE
 *
 * This route allows checking and applying the onboarding_completed migration
 * Access: Only via secret token
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Secret token for this migration (change after use)
const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'cvstomize-migration-2025-12-03';

// Middleware to check secret
const checkSecret = (req, res, next) => {
  const secret = req.headers['x-migration-secret'] || req.query.secret;
  if (secret !== MIGRATION_SECRET) {
    return res.status(403).json({ error: 'Forbidden: Invalid migration secret' });
  }
  next();
};

/**
 * GET /api/admin-migration/check
 * Check if onboarding_completed column exists
 */
router.get('/check', checkSecret, async (req, res) => {
  try {
    console.log('🔍 Checking onboarding_completed column...');

    const columnCheck = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'onboarding_completed'
    `;

    const exists = columnCheck.length > 0;

    if (exists) {
      // Column exists - check stats
      const stats = await prisma.$queryRaw`
        SELECT onboarding_completed, COUNT(*) as count
        FROM users
        GROUP BY onboarding_completed
      `;

      return res.json({
        exists: true,
        column: columnCheck[0],
        stats: stats,
        message: 'Column exists - no migration needed'
      });
    } else {
      return res.json({
        exists: false,
        message: 'Column does NOT exist - migration required'
      });
    }
  } catch (error) {
    console.error('❌ Error checking column:', error);
    return res.status(500).json({
      error: error.message,
      message: 'If error mentions column not found, then column definitely does not exist'
    });
  }
});

/**
 * POST /api/admin-migration/apply
 * Apply the onboarding_completed migration
 */
router.post('/apply', checkSecret, async (req, res) => {
  try {
    console.log('🔧 Applying onboarding_completed migration...');

    // Check if column already exists
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'onboarding_completed'
    `;

    if (columnCheck.length > 0) {
      return res.json({
        success: false,
        message: 'Column already exists - no migration needed',
        alreadyExists: true
      });
    }

    // Apply migration
    await prisma.$executeRaw`
      ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE
    `;

    console.log('✅ Column added successfully');

    // Add index
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed
        ON users(onboarding_completed)
        WHERE onboarding_completed = FALSE
    `;

    console.log('✅ Index created successfully');

    // Verify
    const verification = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'onboarding_completed'
    `;

    return res.json({
      success: true,
      message: 'Migration applied successfully',
      column: verification[0],
      steps: [
        'Added onboarding_completed column',
        'Created index on onboarding_completed',
        'Verified column exists'
      ]
    });
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    return res.status(500).json({
      error: error.message,
      success: false
    });
  }
});

/**
 * GET /api/admin-migration/test-user
 * Check test user status
 */
router.get('/test-user', checkSecret, async (req, res) => {
  try {
    const testUser = await prisma.user.findUnique({
      where: { email: 'test-gold-standard-dec3@example.com' },
      include: {
        profile: true
      }
    });

    if (!testUser) {
      return res.json({
        found: false,
        message: 'Test user not found in database'
      });
    }

    return res.json({
      found: true,
      user: {
        id: testUser.id,
        email: testUser.email,
        onboardingCompleted: testUser.onboardingCompleted,
        createdAt: testUser.createdAt,
        hasProfile: !!testUser.profile
      }
    });
  } catch (error) {
    console.error('❌ Error checking test user:', error);
    return res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;
