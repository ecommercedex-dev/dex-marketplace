// Sort and Order functionality
import { render } from './products.js';

let currentProducts = [];

export function initSort() {
  const sortSelect = document.getElementById('sortSelect');
  if (!sortSelect) return;

  sortSelect.addEventListener('change', (e) => {
    const sortType = e.target.value;
    sortProducts(sortType);
  });
}

export function setProducts(products) {
  currentProducts = products;
  updateProductCount();
}

// Make setProducts available globally for filters
window.setProducts = setProducts;

function updateProductCount() {
  const countEl = document.getElementById('productCount');
  if (countEl) {
    countEl.textContent = `${currentProducts.length} product${currentProducts.length !== 1 ? 's' : ''} found`;
  }
}

function sortProducts(type) {
  let sorted = [...currentProducts];

  switch(type) {
    case 'newest':
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'price-low':
      sorted.sort((a, b) => Number(a.price) - Number(b.price));
      break;
    case 'price-high':
      sorted.sort((a, b) => Number(b.price) - Number(a.price));
      break;
    case 'popular':
      sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
      break;
  }

  render(sorted);
}

// Order Modal Functions
export function initOrderModal() {
  const modal = document.getElementById('orderModal');
  const closeBtn = document.getElementById('closeOrderModal');
  const form = document.getElementById('quickOrderForm');

  if (!modal || !form) return;

  // Close modal
  closeBtn?.addEventListener('click', closeOrderModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeOrderModal();
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitOrder();
  });

  // Make openOrderModal global
  window.openOrderModal = openOrderModal;
}

function openOrderModal(productId, productName) {
  const user = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || 'null');
  
  if (!user || user.role !== 'buyer') {
    alert('Please sign in as a buyer to place orders');
    window.location.href = 'REGISTRY_PAGES/Sign_in.html';
    return;
  }

  const modal = document.getElementById('orderModal');
  document.getElementById('orderProductId').value = productId;
  
  // Pre-fill user data if available
  document.getElementById('orderName').value = user.name || '';
  document.getElementById('orderPhone').value = user.phone || '';
  
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
  const modal = document.getElementById('orderModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  document.getElementById('quickOrderForm').reset();
}

async function submitOrder() {
  const btn = document.getElementById('submitOrderBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';
  btn.disabled = true;

  const productId = document.getElementById('orderProductId').value;
  const name = document.getElementById('orderName').value;
  const phone = document.getElementById('orderPhone').value;
  const address = document.getElementById('orderAddress').value;
  const notes = document.getElementById('orderNotes').value;

  const user = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || 'null');
  const token = user?.token;

  if (!token) {
    alert('Please sign in to place orders');
    btn.innerHTML = originalText;
    btn.disabled = false;
    return;
  }

  try {
    const res = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        productId: Number(productId),
        buyerName: name,
        buyerPhone: phone,
        deliveryAddress: address,
        notes: notes
      })
    });

    if (res.ok) {
      const data = await res.json();
      closeOrderModal();
      
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#2ecc71;color:#fff;padding:1rem 2rem;border-radius:8px;z-index:10001;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
      successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Order placed successfully! Seller will contact you soon.';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 4000);
    } else {
      const error = await res.json();
      throw new Error(error.message || 'Failed to place order');
    }
  } catch (err) {
    console.error('Order error:', err);
    alert('Failed to place order. Please try again.');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}
