// Buyer Dashboard Performance Optimizations
// Add this script BEFORE the main buyer script

(function() {
  'use strict';

  // ==================== CACHE MANAGER ====================
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const cache = new Map();

  window.cacheManager = {
    get(key) {
      const item = cache.get(key);
      if (!item) return null;
      if (Date.now() - item.timestamp > CACHE_DURATION) {
        cache.delete(key);
        return null;
      }
      return item.data;
    },

    set(key, data) {
      cache.set(key, { data, timestamp: Date.now() });
    },

    clear(key) {
      if (key) cache.delete(key);
      else cache.clear();
    }
  };

  // ==================== OPTIMIZED FETCH ====================
  const originalFetch = window.fetch;
  window.fetchWithCache = async function(url, options = {}, cacheKey = url) {
    // Don't cache mutations
    if (options.method && options.method !== 'GET') {
      return originalFetch(url, options);
    }

    const cached = window.cacheManager.get(cacheKey);
    if (cached) {
      console.log('✅ Cache hit:', cacheKey);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(cached),
        clone: function() { return this; }
      });
    }

    const response = await originalFetch(url, options);
    if (response.ok && options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE') {
      const clone = response.clone();
      const data = await clone.json();
      window.cacheManager.set(cacheKey, data);
    }
    return response;
  };

  // ==================== PAGINATION ====================
  window.Paginator = class {
    constructor(items, pageSize = 20) {
      this.items = items;
      this.pageSize = pageSize;
      this.currentPage = 0;
    }

    getPage() {
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      return this.items.slice(start, end);
    }

    nextPage() {
      if (this.hasMore()) {
        this.currentPage++;
        return this.getPage();
      }
      return [];
    }

    hasMore() {
      return (this.currentPage + 1) * this.pageSize < this.items.length;
    }

    reset() {
      this.currentPage = 0;
    }
  };

  // ==================== DEBOUNCE ====================
  window.debounce = function(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // ==================== LAZY LOAD IMAGES ====================
  window.lazyLoadImages = function() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            imageObserver.unobserve(img);
          }
        });
      }, { rootMargin: '50px' });

      document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  };

  // ==================== TAB LAZY LOADING ====================
  const loadedTabs = new Set(['profile']); // Profile loads by default

  window.lazyLoadTab = function(tabName, loadFunction) {
    if (loadedTabs.has(tabName)) return;
    loadedTabs.add(tabName);
    console.log('⚡ Lazy loading tab:', tabName);
    loadFunction();
  };

  // ==================== PARALLEL FETCH ====================
  window.fetchAllParallel = async function(requests) {
    return Promise.all(
      requests.map(({ url, options, cacheKey }) =>
        window.fetchWithCache(url, options, cacheKey).then(r => r.json()).catch(err => {
          console.error(`Failed to fetch ${url}:`, err);
          return null;
        })
      )
    );
  };

  // ==================== REQUEST QUEUE (Prevent duplicate requests) ====================
  const pendingRequests = new Map();

  window.fetchOnce = async function(key, fetchFn) {
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key);
    }

    const promise = fetchFn();
    pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      pendingRequests.delete(key);
    }
  };

  // ==================== PERFORMANCE MONITORING ====================
  window.perfMonitor = {
    start(label) {
      performance.mark(`${label}-start`);
    },
    
    end(label) {
      performance.mark(`${label}-end`);
      try {
        performance.measure(label, `${label}-start`, `${label}-end`);
        const measure = performance.getEntriesByName(label)[0];
        console.log(`⏱️ ${label}: ${measure.duration.toFixed(2)}ms`);
      } catch (e) {}
    }
  };

  // ==================== AUTO CLEANUP ====================
  window.addEventListener('beforeunload', () => {
    cache.clear();
    pendingRequests.clear();
  });

  console.log('⚡ Performance optimizations loaded');
})();
