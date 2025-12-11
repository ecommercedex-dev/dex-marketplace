import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function healthCheck() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {}
  };

  try {
    // Database connectivity
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = { status: 'healthy', responseTime: Date.now() };
  } catch (error) {
    checks.checks.database = { status: 'unhealthy', error: error.message };
    checks.status = 'unhealthy';
  }

  try {
    // File system access
    const uploadsPath = path.resolve('./uploads');
    await fs.promises.access(uploadsPath);
    checks.checks.filesystem = { status: 'healthy', uploadsPath };
  } catch (error) {
    checks.checks.filesystem = { status: 'unhealthy', error: error.message };
    checks.status = 'unhealthy';
  }

  // Memory usage
  const memUsage = process.memoryUsage();
  checks.checks.memory = {
    status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning',
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
  };

  // Uptime
  checks.checks.uptime = {
    status: 'healthy',
    seconds: Math.floor(process.uptime()),
    human: formatUptime(process.uptime())
  };

  return checks;
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}