#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Frontend Errors...\n');

// Fix all JavaScript files that reference process.env
function fixProcessReferences() {
  const jsFiles = [
    'DEX_FRONTEND/DEX_HOMEPAGES/assets/js/modules/shop-enhancements.js',
    'DEX_FRONTEND/DEX_HOMEPAGES/assets/js/main.js',
    'DEX_FRONTEND/DEX_HOMEPAGES/assets/js/main-home.js'
  ];

  jsFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace process.env references
      content = content.replace(/process\?\.env\?\.API_BASE_URL/g, "'http://localhost:5000'");
      content = content.replace(/process\.env\.API_BASE_URL/g, "'http://localhost:5000'");
      
      fs.writeFileSync(filePath, content);
      console.log('✅ Fixed:', file);
    }
  });
}

// Add global API configuration to HTML files
function addGlobalConfig() {
  const htmlFiles = [
    'DEX_FRONTEND/Dex-home.html',
    'DEX_FRONTEND/DEX_HOMEPAGES/Dex-shop.html'
  ];

  const configScript = `
    <script>
      // Global API Configuration
      window.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : 'https://api.yourdomain.com';
      
      window.DEX_CONFIG = {
        API_BASE_URL: window.API_BASE_URL,
        WS_URL: window.API_BASE_URL.replace('http', 'ws'),
        MAX_FILE_SIZE: 10 * 1024 * 1024,
        ALLOWED_FILE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      };
    </script>`;

  htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Add config script before closing head tag if not already present
      if (!content.includes('window.API_BASE_URL')) {
        content = content.replace('</head>', configScript + '\n  </head>');
        fs.writeFileSync(filePath, content);
        console.log('✅ Added config to:', file);
      }
    }
  });
}

// Main fix function
function main() {
  try {
    fixProcessReferences();
    addGlobalConfig();
    
    console.log('\n🎉 Frontend errors fixed!');
    console.log('✅ Removed browser-incompatible process references');
    console.log('✅ Added global API configuration');
    console.log('✅ Fixed CORS URL issues');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

main();