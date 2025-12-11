// Performance Cache Module - Fast data loading with smart caching
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

export const cacheManager = {
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
  },

  has(key) {
    return this.get(key) !== null;
  }
};

// Fetch with cache
export const fetchWithCache = async (url, options = {}, cacheKey = url) => {
  const cached = cacheManager.get(cacheKey);
  if (cached) return cached;

  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const data = await response.json();
  cacheManager.set(cacheKey, data);
  return data;
};

// Parallel fetch with cache
export const fetchAllParallel = async (requests) => {
  return Promise.all(
    requests.map(({ url, options, cacheKey }) =>
      fetchWithCache(url, options, cacheKey).catch(err => {
        console.error(`Failed to fetch ${url}:`, err);
        return null;
      })
    )
  );
};

// Pagination helper
export class Paginator {
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
}

// Debounce helper
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Image lazy loader
export const lazyLoadImages = () => {
  const images = document.querySelectorAll('img[loading="lazy"]');
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
    
    images.forEach(img => imageObserver.observe(img));
  }
};
