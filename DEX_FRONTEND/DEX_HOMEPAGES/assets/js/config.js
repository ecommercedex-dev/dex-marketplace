// Frontend Configuration
const config = {
  API_BASE_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://localhost:5000' 
    : 'https://api.yourdomain.com',
  
  WS_URL: window.location.hostname === 'localhost'
    ? 'ws://localhost:5000'
    : 'wss://api.yourdomain.com',
    
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  REQUEST_TIMEOUT: 30000, // 30 seconds
  
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  }
};

// Export for modules
window.DEX_CONFIG = config;
export default config;