// Test setup and global configuration
const { PrismaClient } = require('@prisma/client');

// Use test database (SQLite for fast in-memory testing)
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';

// Mock Secret Manager for tests
jest.mock('@google-cloud/secret-manager', () => {
  return {
    SecretManagerServiceClient: jest.fn().mockImplementation(() => ({
      accessSecretVersion: jest.fn().mockResolvedValue([{
        payload: {
          data: Buffer.from(JSON.stringify({
            type: 'service_account',
            project_id: 'cvstomize-test',
            private_key: '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----\n',
            client_email: 'test@cvstomize-test.iam.gserviceaccount.com',
          }))
        }
      }])
    }))
  };
});

const prisma = new PrismaClient();

// Clean up database before all tests
beforeAll(async () => {
  // Delete test data
  try {
    await prisma.auditLog.deleteMany({});
    await prisma.resume.deleteMany({});
    await prisma.personalityTraits.deleteMany({});
    await prisma.profile.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (error) {
    console.log('Database cleanup skipped (tables may not exist yet)');
  }
}, 10000); // 10 second timeout

// Clean up after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Make prisma available globally
global.prisma = prisma;
