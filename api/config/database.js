const { PrismaClient } = require('@prisma/client');

/**
 * Production-ready Prisma Client singleton with connection pooling
 *
 * Connection Pool Configuration:
 * - Production: 10 connections (Cloud SQL db-f1-micro supports 25 max)
 * - Development: 5 connections
 * - Test: 2 connections
 *
 * Prevents "too many clients" errors under load
 */

// Singleton Prisma Client instance
let prisma;

const poolConfig = {
  production: {
    connection_limit: 10,
    pool_timeout: 20,
  },
  development: {
    connection_limit: 5,
    pool_timeout: 10,
  },
  test: {
    connection_limit: 2,
    pool_timeout: 5,
  },
};

const env = process.env.NODE_ENV || 'development';
const config = poolConfig[env] || poolConfig.development;

// Build connection URL with pool parameters
function getDatabaseUrl() {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Add connection pool parameters if not in test mode
  if (env === 'test') {
    return baseUrl;
  }

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}connection_limit=${config.connection_limit}&pool_timeout=${config.pool_timeout}`;
}

const prismaConfig = {
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
  log: env === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
};

if (env === 'production') {
  prisma = new PrismaClient(prismaConfig);
} else {
  // In development/test, use a global variable to prevent multiple instances during hot reload
  if (!global.prisma) {
    global.prisma = new PrismaClient(prismaConfig);
  }
  prisma = global.prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
