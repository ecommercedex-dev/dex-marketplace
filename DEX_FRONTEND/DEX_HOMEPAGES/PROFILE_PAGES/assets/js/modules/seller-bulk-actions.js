// Bulk Product Actions Module
let selectedProducts = new Set();

// XSS Protection Helper
const escapeHtml = (str) => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

// Custom confirm modal
const showConfirmModal = (message, onConfirm) => {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10001;';
  modal.innerHTML = `
    <div style="background:#1a1a1a;padding:2rem;border-radius:16px;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
      <p style="color:#fff;font-size:1.1rem;margin-bottom:1.5rem;">${escapeHtml(message)}</p>
      <div style="display:flex;gap:1rem;justify-content:flex-end;">
        <button class="cancel-btn" style="padding:0.75rem 1.5rem;background:rgba(255,255,255,0.1);color:#fff;border:none;border-radius:8px;cursor:pointer;">Cancel</button>
        <button class="confirm-btn" style="padding:0.75rem 1.5rem;background:#6ecf45;color:#000;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Confirm</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.cancel-btn').onclick = () => modal.remove();
  modal.querySelector('.confirm-btn').onclick = () => { modal.remove(); onConfirm(); };
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
};

const initBulkActions = () => {
  const container = document.getElementById('bulkActionsContent');
  if (!container) return;

  container.innerHTML = `
    <div class="bulk-toolbar">
      <label class="select-all-wrapper">
        <input type="checkbox" id="selectAllProducts">
        <span>Select All</span>
      </label>
      <span class="selected-count">0 selected</span>
      <div class="bulk-actions-btns">
        <button class="bulk-btn" data-action="deploy" disabled title="Make products visible to buyers">
          <i class="fas fa-rocket"></i> Deploy
        </button>
        <button class="bulk-btn" data-action="undeploy" disabled title="Hide products from shop">
          <i class="fas fa-eye-slash"></i> Hide
        </button>
        <button class="bulk-btn" data-action="stock" disabled title="Update stock status">
          <i class="fas fa-boxes"></i> Stock
        </button>
        <button class="bulk-btn" data-action="condition" disabled title="Update product condition">
          <i class="fas fa-star"></i> Condition
        </button>
        <button class="bulk-btn" data-action="safety" disabled title="Add safety notes">
          <i class="fas fa-shield-alt"></i> Safety
        </button>
        <button class="bulk-btn" data-action="archive" disabled title="Archive products">
          <i class="fas fa-archive"></i> Archive
        </button>
      </div>
    </div>
    <div class="bulk-products-list" id="bulkProductsList"></div>
  `;

  loadBulkProducts();
  setupBulkHandlers();
};

const loadBulkProducts = async () => {
  const list = document.getElementById('bulkProductsList');
  const token = window.authToken || localStorage.getItem('authToken');
  
  try {
    const res = await fetch('http://localhost:5000/api/products/my', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const products = await res.json();
    
    if (!products.length) {
      list.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>No products found</p></div>';
      return;
    }

    const sanitizeText = (text) => {
      return String(text || '').replace(/[<>"'&]/g, (match) => {
        const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
        return entities[match];
      });
    };
    
    list.innerHTML = products.map(p => {
      const sanitizedName = sanitizeText(p.name);
      const sanitizedImage = (p.images?.[0] || '').replace(/["'<>]/g, '');
      const safeId = String(p.id).replace(/[^0-9a-zA-Z_-]/g, '');
      const safePrice = parseFloat(p.price) || 0;
      const safeStock = parseInt(p.stock) || 0;
      const deployedStatus = p.deployed ? 'active' : 'inactive';
      const deployedText = p.deployed ? 'Active' : 'Inactive';
      
      return `
        <div class="bulk-product-item" data-id="${safeId}">
          <input type="checkbox" class="product-checkbox" data-id="${safeId}">
          <img src="http://localhost:5000${sanitizedImage}" alt="${sanitizedName}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27%23ccc%27%3E%3Cpath d=%27M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z%27/%3E%3C/svg%3E'">
          <div class="bulk-product-info">
            <h4>${sanitizedName}</h4>
            <p>₵${safePrice} • Stock: ${safeStock}</p>
            <span class="status-badge ${deployedStatus}">${deployedText}</span>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.product-checkbox').forEach(cb => {
      cb.addEventListener('change', updateSelection);
    });
  } catch (err) {
    list.innerHTML = '<div class="error-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load products</p></div>';
  }
};

const setupBulkHandlers = () => {
  const selectAll = document.getElementById('selectAllProducts');
  selectAll?.addEventListener('change', (e) => {
    document.querySelectorAll('.product-checkbox').forEach(cb => {
      cb.checked = e.target.checked;
      if (e.target.checked) selectedProducts.add(cb.dataset.id);
      else selectedProducts.delete(cb.dataset.id);
    });
    updateBulkUI();
  });

  document.querySelectorAll('.bulk-btn').forEach(btn => {
    btn.addEventListener('click', () => handleBulkAction(btn.dataset.action));
  });
};

const updateSelection = (e) => {
  if (e.target.checked) selectedProducts.add(e.target.dataset.id);
  else selectedProducts.delete(e.target.dataset.id);
  updateBulkUI();
};

const updateBulkUI = () => {
  const count = selectedProducts.size;
  document.querySelector('.selected-count').textContent = `${count} selected`;
  document.querySelectorAll('.bulk-btn').forEach(btn => btn.disabled = count === 0);
};

const handleBulkAction = async (action) => {
  if (!selectedProducts.size) return;
  
  const token = window.authToken || localStorage.getItem('authToken');
  const ids = Array.from(selectedProducts);
  
  // Handle actions that need input modals
  if (action === 'stock') {
    showStockModal(ids, token);
    return;
  }
  if (action === 'condition') {
    showConditionModal(ids, token);
    return;
  }
  if (action === 'safety') {
    showSafetyModal(ids, token);
    return;
  }
  
  const confirmMsg = {
    deploy: 'Deploy selected products to your shop?',
    undeploy: 'Hide selected products from buyers?',
    archive: 'Archive selected products? You can restore them later.'
  };
  
  showConfirmModal(confirmMsg[action], async () => {
    await executeBulkAction(action, ids, token);
  });
};

const executeBulkAction = async (action, ids, token, data = {}) => {
  try {
    let endpoint, method, body;
    
    if (action === 'archive') {
      endpoint = 'undeploy';
      method = 'POST';
      body = { ids };
    } else if (action === 'deploy') {
      endpoint = 'deploy';
      method = 'POST';
      body = { ids };
    } else if (action === 'undeploy') {
      endpoint = 'undeploy';
      method = 'POST';
      body = { ids };
    } else if (action === 'updateStock' || action === 'updateCondition' || action === 'addSafety') {
      endpoint = action;
      method = 'POST';
      body = { ids, ...data };
    }
    
    const res = await fetch(`http://localhost:5000/api/products/bulk/${endpoint}`, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      const actionText = {
        deploy: 'deployed',
        undeploy: 'hidden from shop',
        archive: 'archived',
        updateStock: 'stock updated',
        updateCondition: 'condition updated',
        addSafety: 'safety notes added'
      };
      if (window.showToast) window.showToast(`${ids.length} products ${actionText[action]}`, 'success');
      selectedProducts.clear();
      loadBulkProducts();
      if (window.loadProducts) window.loadProducts(true);
    } else {
      throw new Error('Bulk action failed');
    }
  } catch (err) {
    console.error('Bulk action error:', err);
    if (window.showToast) window.showToast('Action failed', 'error');
  }
};

// Stock Status Modal
const showStockModal = (ids, token) => {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10001;';
  modal.innerHTML = `
    <div style="background:#1a1a1a;padding:2rem;border-radius:16px;max-width:400px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
      <h3 style="color:#fff;margin-bottom:1.5rem;display:flex;align-items:center;gap:0.5rem;"><i class="fas fa-boxes" style="color:#6ecf45;"></i> Update Stock Status</h3>
      <select id="stockStatus" style="width:100%;padding:0.75rem;background:#2a2a2a;color:#fff;border:1px solid #444;border-radius:8px;margin-bottom:1.5rem;font-size:1rem;">
        <option value="in-stock">In Stock</option>
        <option value="out-of-stock">Out of Stock</option>
        <option value="low-stock">Low Stock</option>
      </select>
      <div style="display:flex;gap:1rem;">
        <button class="cancel-btn" style="flex:1;padding:0.75rem;background:rgba(255,255,255,0.1);color:#fff;border:none;border-radius:8px;cursor:pointer;">Cancel</button>
        <button class="confirm-btn" style="flex:1;padding:0.75rem;background:#6ecf45;color:#000;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Update</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.cancel-btn').onclick = () => modal.remove();
  modal.querySelector('.confirm-btn').onclick = () => {
    const status = document.getElementById('stockStatus').value;
    modal.remove();
    executeBulkAction('updateStock', ids, token, { stockStatus: status });
  };
};

// Condition Modal
const showConditionModal = (ids, token) => {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10001;';
  modal.innerHTML = `
    <div style="background:#1a1a1a;padding:2rem;border-radius:16px;max-width:400px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
      <h3 style="color:#fff;margin-bottom:1.5rem;display:flex;align-items:center;gap:0.5rem;"><i class="fas fa-star" style="color:#f39c12;"></i> Update Condition</h3>
      <select id="conditionValue" style="width:100%;padding:0.75rem;background:#2a2a2a;color:#fff;border:1px solid #444;border-radius:8px;margin-bottom:1.5rem;font-size:1rem;">
        <option value="New">New</option>
        <option value="Like New">Like New</option>
        <option value="Used">Used</option>
        <option value="Fair">Fair</option>
      </select>
      <div style="display:flex;gap:1rem;">
        <button class="cancel-btn" style="flex:1;padding:0.75rem;background:rgba(255,255,255,0.1);color:#fff;border:none;border-radius:8px;cursor:pointer;">Cancel</button>
        <button class="confirm-btn" style="flex:1;padding:0.75rem;background:#f39c12;color:#000;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Update</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.cancel-btn').onclick = () => modal.remove();
  modal.querySelector('.confirm-btn').onclick = () => {
    const condition = document.getElementById('conditionValue').value;
    modal.remove();
    executeBulkAction('updateCondition', ids, token, { condition });
  };
};

// Safety Notes Modal
const showSafetyModal = (ids, token) => {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10001;';
  modal.innerHTML = `
    <div style="background:#1a1a1a;padding:2rem;border-radius:16px;max-width:500px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
      <h3 style="color:#fff;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;"><i class="fas fa-shield-alt" style="color:#3498db;"></i> Add Safety Notes</h3>
      <p style="color:#aaa;font-size:0.9rem;margin-bottom:1.5rem;">Add safety instructions or warnings for buyers</p>
      <textarea id="safetyNotes" placeholder="e.g., Meet in public places, Inspect before purchase, Test electronics before buying..." style="width:100%;padding:0.75rem;background:#2a2a2a;color:#fff;border:1px solid #444;border-radius:8px;margin-bottom:1.5rem;font-size:0.95rem;min-height:120px;resize:vertical;"></textarea>
      <div style="display:flex;gap:1rem;">
        <button class="cancel-btn" style="flex:1;padding:0.75rem;background:rgba(255,255,255,0.1);color:#fff;border:none;border-radius:8px;cursor:pointer;">Cancel</button>
        <button class="confirm-btn" style="flex:1;padding:0.75rem;background:#3498db;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Add Notes</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.cancel-btn').onclick = () => modal.remove();
  modal.querySelector('.confirm-btn').onclick = () => {
    const notes = document.getElementById('safetyNotes').value.trim();
    if (!notes) {
      if (window.showToast) window.showToast('Please enter safety notes', 'error');
      return;
    }
    modal.remove();
    executeBulkAction('addSafety', ids, token, { safetyNotes: notes });
  };
};

window.initBulkActionsContent = initBulkActions;
window.showStockModal = showStockModal;
window.showConditionModal = showConditionModal;
window.showSafetyModal = showSafetyModal;
export { initBulkActions };
