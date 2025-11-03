// Test setup and global configuration
const { PrismaClient } = require('@prisma/client');

// Use test database
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://cvstomize_app:CVst0mize_App_2025!@34.67.70.34:5432/cvstomize_test?schema=public';

const prisma = new PrismaClient();

// Clean up database before all tests
beforeAll(async () => {
  // Delete test data
  await prisma.auditLog.deleteMany({});
  await prisma.resume.deleteMany({});
  await prisma.personalityTraits.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});
});

// Clean up after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Make prisma available globally
global.prisma = prisma;
