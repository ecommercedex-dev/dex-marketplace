// Shop Enhancements: Stats, Filters, Recently Viewed, Skeleton, Quick View

// Configuration - can be overridden by environment
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000';

// 1. Stats Bar
export function updateStats(products) {
  const totalProducts = products.length;
  const sellers = new Set(products.map(p => p.seller?.id || p.sellerId)).size;
  
  document.getElementById('totalProducts').textContent = totalProducts;
  document.getElementById('totalSellers').textContent = sellers;
}

// 2. Active Filters Chips
export function updateActiveFilters() {
  const container = document.getElementById('activeFilters');
  const filters = window.currentFilters || {};
  const chips = [];

  if (filters.mainCat && filters.mainCat !== 'all') {
    chips.push({ label: filters.mainCat, key: 'mainCat' });
  }

  if (filters.subCat) {
    chips.push({ label: filters.subCat.replace(/_/g, ' '), key: 'subCat' });
  }

  if (filters.priceMin > 0 || filters.priceMax < 100000) {
    const min = filters.priceMin || 0;
    const max = filters.priceMax >= 100000 ? '∞' : `₵${filters.priceMax.toLocaleString()}`;
    chips.push({ label: `₵${min.toLocaleString()} - ${max}`, key: 'price' });
  }

  if (filters.condition?.length) {
    filters.condition.forEach(c => {
      chips.push({ label: c, key: `condition_${c}` });
    });
  }

  if (filters.gender?.length) {
    filters.gender.forEach(g => {
      chips.push({ label: g, key: `gender_${g}` });
    });
  }

  if (chips.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  container.innerHTML = `
    <span style="color:var(--text-dim);font-size:0.85rem;font-weight:600;">Active Filters:</span>
    ${chips.map(chip => `
      <div class="filter-chip" onclick="window.removeFilter('${chip.key}')">
        ${chip.label} <i class="fas fa-times"></i>
      </div>
    `).join('')}
    <button class="clear-all-filters" onclick="window.clearAllFilters()">
      Clear All
    </button>
  `;
}

window.removeFilter = (key) => {
  const filters = window.currentFilters;
  
  if (key === 'mainCat') {
    filters.mainCat = 'all';
    document.querySelector('input[value="all"]').checked = true;
  } else if (key === 'subCat') {
    filters.subCat = null;
  } else if (key === 'price') {
    filters.priceMin = 0;
    filters.priceMax = 100000;
  } else if (key.startsWith('condition_')) {
    const val = key.replace('condition_', '');
    filters.condition = filters.condition.filter(c => c !== val);
  } else if (key.startsWith('gender_')) {
    const val = key.replace('gender_', '');
    filters.gender = filters.gender.filter(g => g !== val);
  }

  if (window.applyFilters) window.applyFilters();
  updateActiveFilters();
};

window.clearAllFilters = () => {
  document.getElementById('resetFiltersBtn')?.click();
  updateActiveFilters();
};

// 3. Recently Viewed
export async function addToRecentlyViewed(productId) {
  // Get buyer ID from currentUser
  const user = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || '{}');
  const buyerId = user?.id;
  
  if (!buyerId || user?.role !== 'buyer') {
    console.log('Not logged in as buyer, skipping recently viewed');
    return;
  }
  
  try {
    const token = user.token;
    await fetch(`${API_BASE_URL}/api/recently-viewed`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ buyerId: parseInt(buyerId), productId })
    });
    console.log('Product tracked:', productId);
    await loadRecentlyViewed();
  } catch (err) {
    console.error('Failed to add recently viewed:', err);
  }
}

export async function loadRecentlyViewed() {
  const user = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || '{}');
  const buyerId = user?.id;
  
  if (!buyerId || user?.role !== 'buyer') {
    const container = document.getElementById('recentlyViewed');
    if (container) container.style.display = 'none';
    return;
  }
  
  try {
    const token = user.token;
    const res = await fetch(`${API_BASE_URL}/api/recently-viewed/${buyerId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    renderRecentlyViewed(data.slice(0, 20));
  } catch (err) {
    console.error('Failed to load recently viewed:', err);
    const container = document.getElementById('recentlyViewed');
    if (container) container.style.display = 'none';
  }
}

export async function updateRecentlyViewed() {
  await loadRecentlyViewed();
}

function renderRecentlyViewed(items) {
  const container = document.getElementById('recentlyViewed');
  const list = document.getElementById('recentlyViewedList');
  
  if (!items || items.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'block';
  list.innerHTML = items.map(item => {
    const p = item.product;
    return `
      <div class="recent-item" onclick="location.href='Dex-product-details.html?id=${p.id}'">
        <img src="${API_BASE_URL}${p.images?.[0] || ''}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/50'">
        <div class="recent-item-info">
          <div class="recent-item-name">${p.name}</div>
          <div class="recent-item-price">₵${Number(p.price).toLocaleString()}</div>
        </div>
      </div>
    `;
  }).join('');
}

// 4. Skeleton Loaders
export function showSkeletons(count = 6) {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = Array(count).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-line title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line price"></div>
      </div>
    </div>
  `).join('');
}

// 5. Quick View Modal
let quickViewModal;

export function initQuickView() {
  // Create modal
  quickViewModal = document.createElement('div');
  quickViewModal.className = 'quick-view-modal';
  quickViewModal.innerHTML = `
    <div class="quick-view-content">
      <button class="quick-view-close" onclick="window.closeQuickView()">×</button>
      <div class="quick-view-body" id="quickViewBody"></div>
    </div>
  `;
  document.body.appendChild(quickViewModal);
  
  // Close on overlay click
  quickViewModal.addEventListener('click', (e) => {
    if (e.target === quickViewModal) window.closeQuickView();
  });
}

window.openQuickView = async (productId) => {
  quickViewModal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  const body = document.getElementById('quickViewBody');
  body.innerHTML = '<div style="text-align:center;padding:3rem;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--primary);"></i></div>';
  
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/${productId}`);
    const product = await res.json();
    
    body.innerHTML = `
      <div class="quick-view-image">
        <img src="${API_BASE_URL}${product.images?.[0] || ''}" alt="${product.name}">
      </div>
      <div class="quick-view-info">
        <h2>${product.name}</h2>
        <div class="quick-view-price">₵${Number(product.price).toLocaleString()}</div>
        <p style="color:var(--text-dim);line-height:1.6;margin:1rem 0;">
          ${product.description || 'No description available'}
        </p>
        <div style="margin:1rem 0;">
          <span style="color:var(--text-dim);">Seller:</span>
          <span style="color:var(--text);font-weight:600;margin-left:0.5rem;">
            ${product.seller?.name || 'Unknown'}
          </span>
        </div>
        <div style="margin:1rem 0;">
          <span style="color:var(--text-dim);">Stock:</span>
          <span style="color:var(--primary);font-weight:600;margin-left:0.5rem;">
            ${product.stock || 0} available
          </span>
        </div>
        <div class="quick-view-actions">
          <button style="background:var(--primary);color:#000;border:none;" 
                  onclick="window.openOrderModal(${product.id}, '${product.name.replace(/'/g, "\\'")}')">
            <i class="fas fa-shopping-cart"></i> Order Now
          </button>
          <a href="Dex-product-details.html?id=${product.id}" 
             style="background:var(--card);color:var(--text);border:1px solid var(--border);">
            View Full Details
          </a>
        </div>
      </div>
    `;
  } catch (err) {
    body.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--error);">Failed to load product</div>';
  }
};

window.closeQuickView = () => {
  quickViewModal.classList.remove('active');
  document.body.style.overflow = 'auto';
};

// Initialize
export async function initEnhancements() {
  initQuickView();
  await loadRecentlyViewed();
  updateActiveFilters();
}
