#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 DEX Production Deployment Setup\n');

// Generate secure secrets
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// Create production .env
function createProductionEnv() {
  const envTemplate = `# Production Environment - Generated ${new Date().toISOString()}
DATABASE_URL="postgresql://username:password@your-db-host:5432/dexdb?schema=public&sslmode=require"

NODE_ENV=production
PORT=5000
FRONTEND_URL="https://yourdomain.com"

JWT_SECRET="${generateSecret(32)}"
JWT_EXPIRES_IN="7d"

EMAIL_SERVICE="gmail"
EMAIL_USER="your-production-email@gmail.com"
EMAIL_PASS="your-app-password"

TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_production_token
TWILIO_PHONE_NUMBER=+1234567890

ADMIN_SECRET_KEY="${generateSecret(32)}"
ADMIN_CREATOR_SECRET="${generateSecret(32)}"

BCRYPT_ROUNDS=14
SESSION_SECRET="${generateSecret(32)}"

RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=50

MAX_FILE_SIZE=5242880
UPLOAD_PATH="./uploads"

LOG_LEVEL="warn"
FORCE_HTTPS=true
TRUST_PROXY=true`;

  fs.writeFileSync(path.join(__dirname, 'DEX_BACKEND', '.env.production-generated'), envTemplate);
  console.log('✅ Generated .env.production-generated with secure secrets');
}

// Update package.json scripts
function updatePackageScripts() {
  const packagePath = path.join(__dirname, 'DEX_BACKEND', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  pkg.scripts = {
    ...pkg.scripts,
    "start:prod": "NODE_ENV=production node server.js",
    "deploy": "npm run build && npm run start:prod",
    "health-check": "curl -f http://localhost:5000/health || exit 1"
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
  console.log('✅ Updated package.json with production scripts');
}

// Create nginx config
function createNginxConfig() {
  const nginxConfig = `server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Frontend
    location / {
        root /var/www/dex-frontend;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # File uploads
    location /uploads/ {
        root /var/www/dex-backend;
        expires 1y;
        add_header Cache-Control "public";
    }
}`;

  fs.writeFileSync(path.join(__dirname, 'nginx-dex.conf'), nginxConfig);
  console.log('✅ Created nginx configuration');
}

// Main deployment setup
function main() {
  try {
    createProductionEnv();
    updatePackageScripts();
    createNginxConfig();
    
    console.log('\n🎉 Production setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Update .env.production-generated with your actual values');
    console.log('2. Copy to .env in production');
    console.log('3. Set up SSL certificates');
    console.log('4. Configure nginx with the generated config');
    console.log('5. Set up database with SSL');
    console.log('6. Run: npm run deploy');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();