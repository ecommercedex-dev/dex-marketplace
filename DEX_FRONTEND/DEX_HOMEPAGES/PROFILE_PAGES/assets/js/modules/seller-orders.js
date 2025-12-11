// assets/js/modules/seller-orders.js
// Orders Management — Fully Fixed & Dependency-Injected
import { fetchWithCache, cacheManager } from './performance-cache.js';

let elements, token, API_BASE, notificationSystem, showToast;

// Helper function to sanitize text
const escapeHtml = (text) => {
  return String(text || '').replace(/[<>"'&]/g, (match) => {
    const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
    return entities[match];
  });
};

// Create a single order card
const createOrderCard = (order) => {
  const card = document.createElement("div");
  card.className = "order-card";
  
  const safeOrderId = String(order.id || '').replace(/[^0-9a-zA-Z_-]/g, '');
  card.dataset.orderId = safeOrderId;

  const sanitizedProductImage = (order.productImage || '').replace(/["'<>]/g, '');
  const productImage = order.productImage?.startsWith("http")
    ? sanitizedProductImage
    : sanitizedProductImage
    ? `http://localhost:5000${sanitizedProductImage}`
    : order.product?.images?.[0]
    ? `http://localhost:5000${(order.product.images[0] || '').replace(/["'<>]/g, '')}`
    : "../PROFILE_PAGES/default_account_picture/product-placeholder.jpg";

  const showContact = ["accepted", "delivered"].includes(order.status);

  // Sanitize user input
  const sanitizedProductName = escapeHtml(order.product?.name || "Product");
  const sanitizedBuyerName = escapeHtml(order.buyer?.name || "Anonymous");
  const sanitizedBuyerPhone = escapeHtml(order.buyer?.phone || "");
  const sanitizedAddress = escapeHtml(order.address || "Not provided");
  const safeQuantity = parseInt(order.quantity) || 1;
  const safeTotalPrice = parseFloat(order.totalPrice) || 0;
  const safeOrderIdShort = safeOrderId.slice(-8);
  
  card.innerHTML = `
    <div class="order-image">
      <img src="${productImage}" alt="${sanitizedProductName}">
    </div>
    <div class="order-details">
      ${order.status === 'pending' ? '<button class="chat-btn" style="position:absolute;top:10px;right:10px;background:#6ecf45;border:none;padding:8px 12px;border-radius:8px;color:#000;font-weight:600;cursor:pointer;font-size:0.85rem;">💬 Chat</button>' : ''}
      <p><strong>Order ID:</strong> <span class="order-id">#${safeOrderIdShort}</span></p>
      <p><strong>Product:</strong> ${sanitizedProductName} ×${safeQuantity}</p>
      <p><strong>Total:</strong> ₵${safeTotalPrice.toFixed(2)}</p>
      <p><strong>Buyer:</strong> ${sanitizedBuyerName}</p>
      ${
        showContact
          ? `
      <div style="margin-top:1rem;padding:1rem;background:rgba(39,174,96,0.15);border-radius:12px;border-left:4px solid #27ae60;">
        <p style="margin:0 0 0.5rem;color:#27ae60;font-weight:600;"><i class="fas fa-shield-alt"></i> Safe to Contact</p>
        <p style="margin:0.5rem 0;"><strong>Phone:</strong> <a href="tel:${sanitizedBuyerPhone}" style="color:#6ecf45;font-weight:600;font-size:1.05rem;">${sanitizedBuyerPhone || "N/A"}</a></p>
        <div style="display:flex;gap:0.5rem;margin-top:0.75rem;">
          <a href="https://wa.me/${sanitizedBuyerPhone.replace(/\D/g, "")}" target="_blank" rel="noopener noreferrer" style="flex:1;padding:0.75rem;background:#25D366;color:#fff;text-decoration:none;border-radius:8px;text-align:center;font-weight:600;display:flex;align-items:center;justify-content:center;gap:0.5rem;"><i class="fab fa-whatsapp"></i> WhatsApp</a>
          <a href="tel:${sanitizedBuyerPhone}" style="flex:1;padding:0.75rem;background:#3498db;color:#fff;text-decoration:none;border-radius:8px;text-align:center;font-weight:600;display:flex;align-items:center;justify-content:center;gap:0.5rem;"><i class="fas fa-phone"></i> Call</a>
        </div>
      </div>
      `
          : `
      <div style="margin-top:1rem;padding:1rem;background:rgba(243,156,18,0.15);border-radius:12px;border-left:4px solid #f39c12;">
        <p style="margin:0 0 0.5rem;color:#f39c12;font-weight:600;"><i class="fas fa-shield-alt"></i> Protected Transaction</p>
        <p style="margin:0;font-size:0.9rem;color:#ddd;line-height:1.5;">Accept this order to unlock buyer contact. This protects both parties and ensures commitment.</p>
        <div style="margin-top:0.75rem;padding:0.75rem;background:rgba(0,0,0,0.2);border-radius:8px;">
          <p style="margin:0;font-size:0.85rem;color:#aaa;"><i class="fas fa-info-circle"></i> <strong>Why?</strong> Prevents spam & ensures serious buyers only</p>
        </div>
      </div>
      `
      }
      <p><strong>Address:</strong> ${sanitizedAddress}</p>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString(
        "en-GH"
      )}</p>
      <div class="status-wrapper">
        <span class="status-label status-${order.status}">
          ${order.status.toUpperCase()}
        </span>
      </div>
    </div>
    <div class="order-actions">
      ${
        order.status === "pending"
          ? `
        <button class="accept-btn" title="Accept Order">Accept</button>
        <button class="reject-btn" title="Reject Order">Reject</button>
      `
          : ""
      }
      ${
        order.status === "accepted"
          ? `
        <button class="delivered-btn" title="Mark as Delivered">Mark Delivered</button>
      `
          : ""
      }

      ${
        order.status === "delivered"
          ? `
        <span class="delivered-check" title="Delivered">Delivered</span>
      `
          : ""
      }
    </div>
  `;

  // Button handlers
  if (order.status === 'pending') {
    card.querySelector('.chat-btn')?.addEventListener('click', () => {
      window.OrderChat.open({ id: order.id, sellerPhone: order.buyer?.phone }, 'seller', token);
    });
  }
  card
    .querySelector(".accept-btn")
    ?.addEventListener("click", () =>
      updateOrderStatus(order, card, "accepted", elements.newOrdersContainer)
    );
  card
    .querySelector(".reject-btn")
    ?.addEventListener("click", () =>
      updateOrderStatus(order, card, "rejected", elements.trashContainer)
    );
  card
    .querySelector(".delivered-btn")
    ?.addEventListener("click", () =>
      updateOrderStatus(order, card, "delivered", elements.ordersContainer)
    );

  return card;
};



// Custom confirm modal to replace browser confirm
const showConfirmModal = (message, onConfirm) => {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;';
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

// Update order status
const updateOrderStatus = async (order, card, newStatus, targetContainer) => {
  showConfirmModal(`Are you sure you want to mark this order as ${newStatus}?`, async () => {

  try {
    const endpoint =
      newStatus === "delivered"
        ? `${API_BASE}/orders/${order.id}/deliver`
        : `${API_BASE}/orders/${order.id}/status`;

    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body:
        newStatus === "delivered"
          ? null
          : JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) throw new Error("Failed to update");

    const data = await res.json();

    if (newStatus === "delivered" && data.oldStock !== undefined) {
      showToast(
        `Order delivered! Stock updated: ${data.oldStock} → ${data.newStock}`,
        "success"
      );
    }

    order.status = newStatus;

    const statusLabel = card.querySelector(".status-label");
    if (statusLabel) {
      statusLabel.className = `status-label status-${newStatus}`;
      statusLabel.textContent = newStatus.toUpperCase();
    }

    const actionsDiv = card.querySelector(".order-actions");
    const sanitizedStatus = escapeHtml(newStatus);
    actionsDiv.innerHTML =
      newStatus === "delivered"
        ? `<span class="delivered-check" title="Delivered">Delivered</span>`
        : newStatus === "rejected" || newStatus === "cancelled"
        ? `<span style="color:#e74c3c;font-weight:600;">${sanitizedStatus === "cancelled" ? "Cancelled by Buyer" : "Rejected"}</span>`
        : newStatus === "accepted"
        ? `<button class="delivered-btn">Mark Delivered</button>`
        : `<button class="accept-btn">Accept</button><button class="reject-btn">Reject</button>`;

    actionsDiv
      .querySelector(".delivered-btn")
      ?.addEventListener("click", () =>
        updateOrderStatus(order, card, "delivered", elements.ordersContainer)
      );

    // If accepted, update contact info BEFORE moving card
    if (newStatus === "accepted") {
      const detailsDiv = card.querySelector(".order-details");
      const protectedBox = detailsDiv.querySelector('div[style*="rgba(243,156,18"]');
      if (protectedBox && order.buyer?.phone) {
        const sanitizedPhone = escapeHtml(order.buyer.phone);
        const cleanPhoneForWhatsApp = (order.buyer.phone || '').replace(/\D/g, '');
        protectedBox.outerHTML = `
          <div style="margin-top:1rem;padding:1rem;background:rgba(39,174,96,0.15);border-radius:12px;border-left:4px solid #27ae60;">
            <p style="margin:0 0 0.5rem;color:#27ae60;font-weight:600;"><i class="fas fa-shield-alt"></i> Safe to Contact</p>
            <p style="margin:0.5rem 0;"><strong>Phone:</strong> <a href="tel:${sanitizedPhone}" style="color:#6ecf45;font-weight:600;font-size:1.05rem;">${sanitizedPhone}</a></p>
            <div style="display:flex;gap:0.5rem;margin-top:0.75rem;">
              <a href="https://wa.me/${cleanPhoneForWhatsApp}" target="_blank" rel="noopener noreferrer" style="flex:1;padding:0.75rem;background:#25D366;color:#fff;text-decoration:none;border-radius:8px;text-align:center;font-weight:600;display:flex;align-items:center;justify-content:center;gap:0.5rem;"><i class="fab fa-whatsapp"></i> WhatsApp</a>
              <a href="tel:${sanitizedPhone}" style="flex:1;padding:0.75rem;background:#3498db;color:#fff;text-decoration:none;border-radius:8px;text-align:center;font-weight:600;display:flex;align-items:center;justify-content:center;gap:0.5rem;"><i class="fas fa-phone"></i> Call</a>
            </div>
          </div>
        `;
      }
      showToast("✅ Order accepted! You can now contact the buyer safely", "success");
    }

    // Remove from current container first
    const sourceContainer = card.parentElement;
    if (sourceContainer) {
      sourceContainer.removeChild(card);
    }
    
    // Remove empty state from target container if it exists
    const emptyState = targetContainer.querySelector('p[style*="text-align:center"]');
    if (emptyState) {
      emptyState.remove();
    }
    
    // Add to target container
    targetContainer.appendChild(card);
    
    // Update badge counts
    const deliveredCount = elements.ordersContainer.querySelectorAll('.order-card').length;
    const rejectedCount = elements.trashContainer.querySelectorAll('.order-card').length;
    updateOrderBadges(deliveredCount, rejectedCount);
    
    // Check ALL containers and add empty state if needed
    const checkAndAddEmptyState = (container) => {
      const cards = container.querySelectorAll('.order-card');
      const hasEmptyState = container.querySelector('p[style*="text-align:center"]');
      
      if (!cards.length && !hasEmptyState) {
        let emptyHTML = '';
        if (container === elements.newOrdersContainer) {
          emptyHTML = `
            <p style="text-align:center; color:#aaa; padding:3rem; grid-column:1/-1;">
              <i class="fas fa-shopping-cart" style="font-size:3rem; opacity:0.3; display:block; margin-bottom:1rem;"></i>
              No orders yet.<br>
              Your first sale is coming soon!
            </p>`;
        } else if (container === elements.ordersContainer) {
          emptyHTML = `
            <p style="text-align:center; color:#aaa; padding:3rem; grid-column:1/-1;">
              <i class="fas fa-truck" style="font-size:3rem; opacity:0.3; display:block; margin-bottom:1rem;"></i>
              No delivered orders yet
            </p>`;
        } else if (container === elements.trashContainer) {
          emptyHTML = `
            <p style="text-align:center; color:#aaa; padding:3rem; grid-column:1/-1;">
              <i class="fas fa-times-circle" style="font-size:3rem; opacity:0.3; display:block; margin-bottom:1rem;"></i>
              No rejected/cancelled orders
            </p>`;
        }
        if (emptyHTML) container.innerHTML = emptyHTML;
      } else if (cards.length && hasEmptyState) {
        // Remove empty state if cards exist
        hasEmptyState.remove();
      }
    };
    
    // Check all containers
    checkAndAddEmptyState(elements.newOrdersContainer);
    checkAndAddEmptyState(elements.ordersContainer);
    checkAndAddEmptyState(elements.trashContainer);

    // Clear cache after status update
    cacheManager.clear('seller-orders');
    
    notificationSystem?.show?.(
      `Order #${String(order.id).slice(-8)} is now ${newStatus}!`,
      "order"
    );
  } catch (err) {
    console.error('Order update error:', err);
    showToast("Failed to update order status", "error");
  }
  });
};

// Fetch all orders with caching
const fetchSellerOrders = async (forceRefresh = false) => {
  if (!elements) {
    console.error('Elements not initialized');
    return;
  }

  // Only show loader on initial load, not on refresh
  if (!forceRefresh) {
    [
      elements.newOrdersContainer,
      elements.ordersContainer,
      elements.trashContainer,
    ].forEach((c) => {
      c.innerHTML = "<div class='loader-small'><i class='fas fa-spinner fa-spin'></i></div>";
    });
  }

  try {
    if (forceRefresh) cacheManager.clear('seller-orders');
    
    let orders = await fetchWithCache(
      `${API_BASE}/orders`,
      { headers: { Authorization: `Bearer ${token}` } },
      'seller-orders'
    );
    


    console.log(`✅ Fetched ${orders?.length || 0} orders`);

    [
      elements.newOrdersContainer,
      elements.ordersContainer,
      elements.trashContainer,
    ].forEach((c) => (c.innerHTML = ""));

    if (!orders || orders.length === 0) {
      elements.newOrdersContainer.innerHTML = `
        <p style="text-align:center; color:#aaa; padding:3rem; grid-column:1/-1;">
          <i class="fas fa-shopping-cart" style="font-size:3rem; opacity:0.3; display:block; margin-bottom:1rem;"></i>
          No orders yet.<br>
          Your first sale is coming soon!
        </p>`;
      elements.ordersContainer.innerHTML = `
        <p style="text-align:center; color:#aaa; padding:3rem; grid-column:1/-1;">
          <i class="fas fa-truck" style="font-size:3rem; opacity:0.3; display:block; margin-bottom:1rem;"></i>
          No delivered orders yet
        </p>`;
      elements.trashContainer.innerHTML = `
        <p style="text-align:center; color:#aaa; padding:3rem; grid-column:1/-1;">
          <i class="fas fa-times-circle" style="font-size:3rem; opacity:0.3; display:block; margin-bottom:1rem;"></i>
          No rejected/cancelled orders 🚫
        </p>`;
      updateOrderBadges(0, 0);
      return;
    }

    let deliveredCount = 0;
    let rejectedCount = 0;

    orders.forEach((order) => {
      const card = createOrderCard(order);
      if (order.status === "pending" || order.status === "accepted") {
        elements.newOrdersContainer.appendChild(card);
      } else if (order.status === "delivered") {
        elements.ordersContainer.appendChild(card);
        deliveredCount++;
      } else if (["rejected", "cancelled"].includes(order.status)) {
        elements.trashContainer.appendChild(card);
        rejectedCount++;
      }
    });

    updateOrderBadges(deliveredCount, rejectedCount);
  } catch (err) {
    console.error("Orders fetch error:", err);
    [
      elements.newOrdersContainer,
      elements.ordersContainer,
      elements.trashContainer,
    ].forEach((c) => (c.innerHTML = ""));
    
    elements.newOrdersContainer.innerHTML = `
      <p style="color:#e74c3c; text-align:center; padding:2rem; grid-column:1/-1;">
        Failed to load orders<br>
        <small style="color:#999;">${err.message}</small><br><br>
        <button onclick="window.fetchSellerOrders(true)" style="padding:8px 16px; background:var(--green-light); color:#000; border:none; border-radius:8px; cursor:pointer;">
          Try Again
        </button>
      </p>`;
  }
};

// Auto-refresh when Orders tab is active
let lastOrderCount = 0;
let lastOrderIds = new Set();
let refreshInterval = null;
const startAutoRefresh = () => {
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const orders = await res.json();
        const currentIds = new Set(orders.map(o => o.id));
        
        // Check if there are new orders or order count changed
        const hasNewOrders = orders.length !== lastOrderCount || 
                            [...currentIds].some(id => !lastOrderIds.has(id));
        
        if (hasNewOrders && lastOrderCount > 0) {
          console.log('📦 New order detected, refreshing...');
          fetchSellerOrders(true); // Force refresh
        }
        
        lastOrderCount = orders.length;
        lastOrderIds = currentIds;
      }
    } catch (err) {
      console.error('Auto-refresh error:', err);
    }
  }, 5000); // Check every 5 seconds for new orders
};

// WebSocket listener for real-time order updates
let ws = null;
const connectWebSocket = () => {
  try {
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    if (!userId) {
      console.warn('No userId found, skipping WebSocket connection');
      return;
    }
    
    ws = new WebSocket(`ws://localhost:5000?userId=${userId}`);
    
    ws.onopen = () => console.log('✅ WebSocket connected for real-time orders');
    
    ws.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        if (notification.type === 'order') {
          console.log('📦 Real-time order update received!');
          fetchSellerOrders(true);
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      console.log('Falling back to polling only');
    };
    
    ws.onclose = () => {
      console.log('WebSocket closed, reconnecting in 5s...');
      setTimeout(connectWebSocket, 5000);
    };
  } catch (err) {
    console.error('WebSocket connection failed:', err);
  }
};

// MAIN INIT — Dependency Injection
const initOrders = (deps) => {
  elements = deps.elements;
  token = deps.token;
  API_BASE = deps.API_BASE || "http://localhost:5000/api";
  notificationSystem = deps.notificationSystem;
  showToast = deps.showToast || console.log;

  // Make fetch function globally accessible for retry button
  window.fetchSellerOrders = fetchSellerOrders;

  // Tab switching logic with active state
  const switchOrderTab = (tab) => {
    document.querySelectorAll('.order-tab-icon').forEach(t => t.classList.remove('active'));
    document.getElementById(tab + 'Tab')?.classList.add('active');
    
    if (tab === 'active') {
      elements.newOrdersContainer.style.display = 'grid';
      document.getElementById('deliveredSection').style.display = 'none';
      document.getElementById('rejectedSection').style.display = 'none';
      if (!elements.newOrdersContainer.querySelectorAll('.order-card').length) {
        elements.newOrdersContainer.innerHTML = `
          <p style="text-align:center; color:#aaa; padding:3rem; grid-column:1/-1;">
            <i class="fas fa-shopping-cart" style="font-size:3rem; opacity:0.3; display:block; margin-bottom:1rem;"></i>
            No orders yet.<br>
            Your first sale is coming soon!
          </p>`;
      }
    } else if (tab === 'delivered') {
      elements.newOrdersContainer.style.display = 'none';
      document.getElementById('deliveredSection').style.display = 'block';
      document.getElementById('rejectedSection').style.display = 'none';
      if (!elements.ordersContainer.querySelectorAll('.order-card').length) {
        elements.ordersContainer.innerHTML = `
          <p style="text-align:center; color:#aaa; padding:3rem; grid-column:1/-1;">
            <i class="fas fa-truck" style="font-size:3rem; opacity:0.3; display:block; margin-bottom:1rem;"></i>
            No delivered orders yet
          </p>`;
      }
    } else if (tab === 'rejected') {
      elements.newOrdersContainer.style.display = 'none';
      document.getElementById('deliveredSection').style.display = 'none';
      document.getElementById('rejectedSection').style.display = 'block';
      if (!elements.trashContainer.querySelectorAll('.order-card').length) {
        elements.trashContainer.innerHTML = `
          <p style="text-align:center; color:#aaa; padding:3rem; grid-column:1/-1;">
            <i class="fas fa-times-circle" style="font-size:3rem; opacity:0.3; display:block; margin-bottom:1rem;"></i>
            No rejected/cancelled orders
          </p>`;
      }
    }
  };
  
  window.switchOrderTab = switchOrderTab;
  
  document.getElementById('activeTab')?.addEventListener('click', () => switchOrderTab('active'));
  document.getElementById('deliveredTab')?.addEventListener('click', () => switchOrderTab('delivered'));
  document.getElementById('rejectedTab')?.addEventListener('click', () => switchOrderTab('rejected'));
  
  // Set initial active tab
  document.getElementById('activeTab')?.classList.add('active');

  // Clear All buttons
  document.getElementById('clearDeliveredBtn')?.addEventListener('click', async () => {
    showConfirmModal('Clear all delivered orders? This will permanently delete them.', async () => {
      try {
        await fetch(`${API_BASE}/orders/seller/clear/delivered`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        elements.ordersContainer.innerHTML = `
          <p style="text-align:center; color:#aaa; padding:3rem; grid-column:1/-1;">
            <i class="fas fa-truck" style="font-size:3rem; opacity:0.3; display:block; margin-bottom:1rem;"></i>
            No delivered orders yet
          </p>`;
        document.getElementById('deliveredBadge').style.display = 'none';
        showToast('✨ Delivered orders cleared', 'success');
      } catch (err) {
        console.error('Clear delivered error:', err);
        showToast('❌ Failed to clear orders', 'error');
      }
    });
  });

  document.getElementById('clearRejectedBtn')?.addEventListener('click', async () => {
    showConfirmModal('Clear all rejected/cancelled orders? This will permanently delete them.', async () => {
      try {
        await fetch(`${API_BASE}/orders/seller/clear/rejected`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        elements.trashContainer.innerHTML = `
          <p style="text-align:center; color:#aaa; padding:3rem; grid-column:1/-1;">
            <i class="fas fa-times-circle" style="font-size:3rem; opacity:0.3; display:block; margin-bottom:1rem;"></i>
            No rejected/cancelled orders 🚫
          </p>`;
        document.getElementById('rejectedBadge').style.display = 'none';
        showToast('✨ Rejected orders cleared', 'success');
      } catch (err) {
        console.error('Clear rejected error:', err);
        showToast('❌ Failed to clear orders', 'error');
      }
    });
  });

  fetchSellerOrders();
  connectWebSocket();
  startAutoRefresh();
  
  const userId = JSON.parse(localStorage.getItem('user'))?.id;
  if (userId && window.OrderChat) window.OrderChat.init(userId);

  console.log("Orders Module Initialized — 100% working with real-time updates");
};

// Cleanup function
const cleanup = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
};

// Update badge counts
const updateOrderBadges = (deliveredCount, rejectedCount) => {
  const deliveredBadge = document.getElementById('deliveredBadge');
  const rejectedBadge = document.getElementById('rejectedBadge');
  
  if (deliveredBadge) {
    deliveredBadge.textContent = deliveredCount;
    deliveredBadge.style.display = deliveredCount > 0 ? 'flex' : 'none';
  }
  
  if (rejectedBadge) {
    rejectedBadge.textContent = rejectedCount;
    rejectedBadge.style.display = rejectedCount > 0 ? 'flex' : 'none';
  }
};



// EXPORT
export { initOrders, fetchSellerOrders, createOrderCard, updateOrderStatus, cleanup };
