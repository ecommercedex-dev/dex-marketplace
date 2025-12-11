// Service Worker for Offline Mode
const CACHE_NAME = 'dex-seller-v3-20251208';
const ASSETS_TO_CACHE = [
  '/DEX_HOMEPAGES/PROFILE_PAGES/assets/css/seller-dashboard.css',
  'https://fonts.googleapis.com/css2?family=Fredoka+One&family=Quicksand:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.log('Cache failed for some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // NEVER cache HTML pages or API calls
  if (event.request.url.includes('.html') || 
      event.request.url.includes('/api/') ||
      event.request.url.includes('localhost:5000')) {
    return; // Let browser handle it normally
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        if (event.request.destination === 'image') {
          return new Response('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ccc"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>', {
            headers: { 'Content-Type': 'image/svg+xml' }
          });
        }
        return new Response('Offline - Please check your connection', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});
