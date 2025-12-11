#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 DEX Production Optimization\n');

// Optimize frontend assets
function optimizeFrontend() {
  console.log('📦 Optimizing frontend assets...');
  
  // Add cache headers to HTML files
  const htmlFiles = [
    'DEX_FRONTEND/Dex-home.html',
    'DEX_FRONTEND/DEX_HOMEPAGES/Dex-shop.html',
    'DEX_FRONTEND/DEX_HOMEPAGES/PROFILE_PAGES/Sellers_page.html'
  ];

  htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Add performance meta tags if not present
      if (!content.includes('dns-prefetch')) {
        const metaTags = `
    <!-- Performance Optimization -->
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    <link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
    <link rel="preconnect" href="//fonts.gstatic.com" crossorigin>
    <meta name="theme-color" content="#008000">`;
        
        content = content.replace('<meta name="viewport"', metaTags + '\n    <meta name="viewport"');
        fs.writeFileSync(filePath, content);
      }
    }
  });
  
  console.log('✅ Frontend optimization complete');
}

// Create production .htaccess for Apache
function createHtaccess() {
  const htaccess = `# DEX Production .htaccess
RewriteEngine On

# HTTPS Redirect
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Cache Control
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Security Headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>`;

  fs.writeFileSync(path.join(__dirname, 'DEX_FRONTEND', '.htaccess'), htaccess);
  console.log('✅ Created .htaccess for Apache');
}

// Database optimization suggestions
function databaseOptimization() {
  console.log('🗄️ Database optimization recommendations:');
  console.log('   • Add indexes on frequently queried fields');
  console.log('   • Enable connection pooling');
  console.log('   • Set up read replicas for scaling');
  console.log('   • Configure automated backups');
}

// Main optimization
function main() {
  try {
    optimizeFrontend();
    createHtaccess();
    databaseOptimization();
    
    console.log('\n🎉 Production optimization complete!');
    console.log('\n📊 Performance improvements:');
    console.log('   • Frontend asset caching enabled');
    console.log('   • Compression configured');
    console.log('   • Security headers added');
    console.log('   • DNS prefetching optimized');
    
  } catch (error) {
    console.error('❌ Optimization failed:', error.message);
  }
}

main();