// Install security packages for DEX V1
const { execSync } = require('child_process');

console.log('Installing security packages for DEX V1...');

try {
  // Install DOMPurify for XSS protection
  execSync('npm install isomorphic-dompurify', { 
    cwd: './DEX_BACKEND',
    stdio: 'inherit' 
  });
  
  console.log('✅ Security packages installed successfully!');
} catch (error) {
  console.error('❌ Failed to install packages:', error.message);
}