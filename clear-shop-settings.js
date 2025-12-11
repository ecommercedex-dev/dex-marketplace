// Run this with: node clear-shop-settings.js
const fetch = require('node-fetch');

const sellerId = 9; // Change this to your seller ID
const BASE = 'http://localhost:5000';
const TOKEN = process.env.AUTH_TOKEN || 'YOUR_TOKEN_HERE'; // Use environment variable for token

async function clearShopSettings() {
  try {
    const response = await fetch(`${BASE}/api/shop/settings/${sellerId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('Shop settings cleared successfully!');
    } else {
      console.log('Failed to clear settings:', await response.text());
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

clearShopSettings();
