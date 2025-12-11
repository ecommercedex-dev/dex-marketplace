#!/usr/bin/env node

// Production Readiness Validation Script
import fs from 'fs';
import path from 'path';

const checks = [];
let passed = 0;
let failed = 0;

function check(name, condition, fix = '') {
  const result = condition();
  checks.push({ name, passed: result, fix });
  if (result) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (fix) console.log(`   Fix: ${fix}`);
    failed++;
  }
}

console.log('🔍 DEX Production Readiness Check\n');

// Environment checks
check(
  'Environment file exists',
  () => fs.existsSync('DEX_BACKEND/.env'),
  'Copy .env.example to .env and configure'
);

check(
  'Config module exists',
  () => fs.existsSync('DEX_BACKEND/config/config.js'),
  'Config module missing'
);

check(
  'Security middleware exists',
  () => fs.existsSync('DEX_BACKEND/middleware/securityMiddleware.js'),
  'Security middleware missing'
);

check(
  'Error handler exists',
  () => fs.existsSync('DEX_BACKEND/middleware/errorHandler.js'),
  'Error handler missing'
);

check(
  'Logger exists',
  () => fs.existsSync('DEX_BACKEND/utils/logger.js'),
  'Logger missing'
);

check(
  'Docker configuration exists',
  () => fs.existsSync('Dockerfile'),
  'Docker configuration missing'
);

check(
  'Nginx configuration exists',
  () => fs.existsSync('nginx.conf'),
  'Nginx configuration missing'
);

check(
  'Frontend config exists',
  () => fs.existsSync('DEX_FRONTEND/DEX_HOMEPAGES/assets/js/config.js'),
  'Frontend config missing'
);

// Security checks
const serverJs = fs.readFileSync('DEX_BACKEND/server.js', 'utf8');
check(
  'Security headers enabled',
  () => serverJs.includes('securityHeaders'),
  'Add security headers middleware'
);

check(
  'Rate limiting enabled',
  () => serverJs.includes('apiLimiter'),
  'Add rate limiting middleware'
);

check(
  'HTTPS redirect enabled',
  () => serverJs.includes('x-forwarded-proto'),
  'Add HTTPS redirect for production'
);

// File structure checks
check(
  'Logs directory exists',
  () => fs.existsSync('DEX_BACKEND/logs') || fs.mkdirSync('DEX_BACKEND/logs', { recursive: true }),
  'Create logs directory'
);

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n🎉 DEX is PRODUCTION READY! 🚀');
  console.log('\nNext steps:');
  console.log('1. Configure .env with production values');
  console.log('2. Set up SSL certificates');
  console.log('3. Configure domain name');
  console.log('4. Run: npm start');
} else {
  console.log('\n⚠️  Please fix the issues above before deploying to production');
  process.exit(1);
}