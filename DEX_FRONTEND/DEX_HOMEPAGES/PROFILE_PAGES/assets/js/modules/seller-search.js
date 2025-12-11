// Search & Filter Products Module - V1 Complete
let allProducts = [];
let filteredProducts = [];

const initSearch = () => {
  const container = document.getElementById('searchContent');
  if (!container) return;

  const user = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || '{}');
  const mainCategory = user.productCategory?.toLowerCase();
  
  const subcategories = {
    electronics: ['phones', 'laptops', 'tablets', 'headsets', 'speakers', 'chargers', 'accessories'],
    fashion: ['shirts', 'pants', 'shoes', 'bags', 'watches', 'accessories', 'dresses', 'tops', 'skirts', 'jewelry']
  };
  
  const categoryOptions = subcategories[mainCategory] 
    ? subcategories[mainCategory].map(c => `<option value="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('')
    : '';

  container.innerHTML = `
    <div style="margin-bottom: 2rem;">
      <h2 style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
        <i class="fas fa-search"></i> Search & Filter Products
      </h2>
      
      <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
        <input 
          type="text" 
          id="searchInput" 
          placeholder="Search products by name, category, or price..." 
          style="flex: 1; padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: #fff;"
        >
        <button 
          id="searchBtn" 
          style="padding: 12px 24px; background: #6ecf45; color: #000; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;"
        >
          <i class="fas fa-search"></i>
        </button>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <select id="categoryFilter" style="padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: #fff;">
          <option value="">All ${mainCategory || 'Categories'}</option>
          ${categoryOptions}
        </select>
        <select id="statusFilter" style="padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: #fff;">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select id="stockFilter" style="padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: #fff;">
          <option value="">All Stock</option>
          <option value="instock">In Stock</option>
          <option value="lowstock">Low Stock</option>
          <option value="outofstock">Out of Stock</option>
        </select>
        <button id="clearFilters" style="padding: 10px 20px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer;">
          Clear
        </button>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div id="resultsCount" style="color: #aaa;"></div>
        <button id="exportCSV" style="padding: 8px 16px; background: #3498db; color: #fff; border: none; border-radius: 8px; cursor: pointer;">
          <i class="fas fa-download"></i> Export CSV
        </button>
      </div>
    </div>
    
    <div id="searchResults"></div>
  `;

  loadProducts();
  setupHandlers();
};

const loadProducts = async () => {
  const token = window.authToken || localStorage.getItem('authToken');
  const results = document.getElementById('searchResults');
  
  results.innerHTML = '<div style="text-align: center; padding: 2rem; color: #aaa;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i></div>';
  
  try {
    const res = await fetch('http://localhost:5000/api/products/my', {
      headers: { Authorization: `Bearer ${token}` }
    });
    allProducts = await res.json();
    filteredProducts = allProducts;
    displayResults();
  } catch (err) {
    results.innerHTML = '<div style="text-align: center; padding: 2rem; color: #e74c3c;"><i class="fas fa-exclamation-circle"></i> Failed to load products</div>';
  }
};

const setupHandlers = () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const categoryFilter = document.getElementById('categoryFilter');
  const statusFilter = document.getElementById('statusFilter');
  const stockFilter = document.getElementById('stockFilter');
  const clearBtn = document.getElementById('clearFilters');
  const exportBtn = document.getElementById('exportCSV');

  const performSearch = () => {
    const query = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const status = statusFilter.value;
    const stock = stockFilter.value;

    filteredProducts = allProducts.filter(p => {
      const matchQuery = !query || 
        p.name.toLowerCase().includes(query) || 
        p.subCategory?.toLowerCase().includes(query) ||
        p.price.toString().includes(query);
      
      const matchCategory = !category || p.subCategory?.toLowerCase() === category;
      const matchStatus = !status || (status === 'active' ? p.deployed : !p.deployed);
      const matchStock = !stock || 
        (stock === 'instock' && p.stock > 10) ||
        (stock === 'lowstock' && p.stock > 0 && p.stock <= 10) ||
        (stock === 'outofstock' && p.stock === 0);
      
      return matchQuery && matchCategory && matchStatus && matchStock;
    });

    displayResults();
  };

  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keyup', (e) => e.key === 'Enter' && performSearch());
  categoryFilter.addEventListener('change', performSearch);
  statusFilter.addEventListener('change', performSearch);
  stockFilter.addEventListener('change', performSearch);
  
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    categoryFilter.value = '';
    statusFilter.value = '';
    stockFilter.value = '';
    filteredProducts = allProducts;
    displayResults();
  });

  exportBtn.addEventListener('click', exportToCSV);
};

const displayResults = () => {
  const results = document.getElementById('searchResults');
  const count = document.getElementById('resultsCount');
  
  count.textContent = `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`;
  
  if (!filteredProducts.length) {
    results.innerHTML = '<div style="text-align: center; padding: 3rem; color: #aaa;"><i class="fas fa-search" style="font-size: 3rem; opacity: 0.3;"></i><p style="margin-top: 1rem;">No products found</p></div>';
    return;
  }

  results.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
      ${filteredProducts.map(p => createProductCard(p)).join('')}
    </div>
  `;
  
  attachCardHandlers();
};

const createProductCard = (p) => {
  const stockBadge = p.stock === 0 ? 
    '<span style="background: #e74c3c; color: #fff; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">OUT OF STOCK</span>' :
    p.stock <= 10 ?
    `<span style="background: #f39c12; color: #000; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">STOCK: ${p.stock}</span>` :
    `<span style="background: #2ecc71; color: #000; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">STOCK: ${p.stock}</span>`;
  
  const statusBadge = p.deployed ?
    '<span style="background: #6ecf45; color: #000; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">ACTIVE</span>' :
    '<span style="background: #95a5a6; color: #fff; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">INACTIVE</span>';

  return `
    <div style="background: rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); transition: transform 0.2s;">
      <img src="http://localhost:5000${(p.images?.[0] || '').replace(/["'<>]/g, '')}" alt="${String(p.name || '').replace(/["'<>&]/g, '')}" style="width: 100%; height: 200px; object-fit: cover;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27%23ccc%27%3E%3Cpath d=%27M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z%27/%3E%3C/svg%3E'">
      <div style="padding: 1rem;">
        <h4 style="color: #fff; margin-bottom: 0.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${String(p.name || '').replace(/[<>&"']/g, (m) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[m]))}</h4>
        <p style="color: #6ecf45; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem;">₵${Number(p.price).toLocaleString()}</p>
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
          ${statusBadge}
          ${stockBadge}
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="preview-btn" data-id="${String(p.id || '').replace(/[^0-9a-zA-Z_-]/g, '')}" style="flex: 1; padding: 8px; background: #3498db; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem;">
            <i class="fas fa-eye"></i> Preview
          </button>
          <button class="edit-btn" data-id="${String(p.id || '').replace(/[^0-9a-zA-Z_-]/g, '')}" style="flex: 1; padding: 8px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; font-size: 0.85rem;">
            <i class="fas fa-edit"></i> Edit
          </button>
        </div>
      </div>
    </div>
  `;
};

const attachCardHandlers = () => {
  document.querySelectorAll('.preview-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      if (window.showProductPreview) window.showProductPreview(id);
    });
  });
  
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const product = allProducts.find(p => p.id === id);
      if (product && window.openProductModal) {
        window.openProductModal(product);
      }
    });
  });
};

const exportToCSV = () => {
  if (!filteredProducts.length) return;
  
  const headers = ['ID', 'Name', 'Category', 'Price', 'Stock', 'Status', 'Created'];
  const rows = filteredProducts.map(p => [
    p.id,
    p.name,
    p.subCategory || 'N/A',
    p.price,
    p.stock,
    p.deployed ? 'Active' : 'Inactive',
    new Date(p.createdAt).toLocaleDateString()
  ]);
  
  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dex-products-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  
  if (window.showToast) window.showToast('Products exported successfully', 'success');
};

window.initSearchContent = initSearch;
export { initSearch };
