// assets/js/modules/seller-notifications.js
// Notification System — Clean, Fixed & Dependency-Injected

let polling = null;
let notifications = [];

// Will be injected via initNotifications(deps)
let elements, token, API_BASE, showToast;

// Notification type config with emojis!
const typeCfg = {
  order: { icon: "🛒", color: "order" },
  message: { icon: "✉️", color: "message" },
  review: { icon: "⭐", color: "review" },
  wishlist: { icon: "💝", color: "wishlist" },
  verification: { icon: "✅", color: "system" },
  system: { icon: "💡", color: "system" },
  error: { icon: "❌", color: "error" },
};

const BACKEND_URL = "http://127.0.0.1:5000"; // For image paths

// Close sidebar
const closeNotificationSidebar = () => {
  elements.notificationSidebar.classList.remove("open");
  elements.notificationOverlay.classList.remove("show");
};

// Fetch notifications
const fetchNotifs = async () => {
  try {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const server = (await res.json()).notifications || [];
      notifications = [...notifications.filter((n) => n.isLocal), ...server];
      renderNotifs();
    }
  } catch (e) {
    console.warn("Failed to fetch notifications:", e);
  }
};

// Render notifications
const renderNotifs = () => {
  const unread = notifications.filter((n) => !n.read).length;
  elements.notificationBadge.textContent = unread > 99 ? "99+" : unread;
  elements.notificationBadge.style.display = unread ? "flex" : "none";

  if (!notifications.length) {
    elements.notificationList.innerHTML = "";
    // Inside renderNotifs(), change the empty state button:
    elements.emptyState.innerHTML = `
  <i class="fas fa-bell-slash"></i>
  <p>No notifications yet</p>
  <small>We'll notify you when something important happens</small>
  <button class="cta" data-close-sidebar>Back to Dashboard</button>
`;

    // Then in initNotifications (or anywhere after DOM is ready):
    elements.emptyState.addEventListener("click", (e) => {
      if (e.target.matches("[data-close-sidebar]")) {
        closeNotificationSidebar();
      }
    });
    elements.emptyState.style.display = "block";
    return;
  }

  elements.emptyState.style.display = "none";
  const frag = document.createDocumentFragment();

  notifications.forEach((n, idx) => {
    const item = document.createElement("div");
    item.className = `notif-item ${n.read ? "" : "unread"}`;
    item.dataset.id = n.id;

    const cfg = typeCfg[n.type] || typeCfg.system;
    const time = new Date(n.createdAt).toLocaleString("en-GH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Remove unsafe message processing - will use sanitized message instead

    let actions = "";
    if (n.type === "order" && !n.read) {
      const safeOrderId = String(n.orderId || '').replace(/[^0-9a-zA-Z_-]/g, '');
      actions = `
        <div class="notif-actions">
          <button class="view-order-btn" data-order-id="${safeOrderId}">View Order</button>
        </div>
      `;
    }

    let richData = null;
    try { richData = JSON.parse(n.message); } catch (e) {}

    if (richData && n.type === 'wishlist') {
      const sanitizedBuyerAvatar = (richData.buyerAvatar || '').replace(/["'<>]/g, '');
      const sanitizedProductImage = (richData.productImage || '').replace(/["'<>]/g, '');
      const sanitizedBuyerName = escapeHtml(richData.buyerName || 'Unknown');
      const sanitizedProductName = escapeHtml(richData.productName || 'Product');
      const safeProductPrice = parseFloat(richData.productPrice) || 0;
      
      const avatar = sanitizedBuyerAvatar ? `${BACKEND_URL}${sanitizedBuyerAvatar}` : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';
      const productImg = sanitizedProductImage ? `${BACKEND_URL}${sanitizedProductImage}` : '';
      
      item.innerHTML = `
        <div class="notif-inner">
          <div class="notif-icon ${cfg.color}">${cfg.icon}</div>
          <div class="notif-content" style="flex:1;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <h4 style="margin:0;">${escapeHtml(n.title)}</h4>
              <span style="font-size:0.7rem;color:#888;">${time}</span>
            </div>
            <div style="display:flex;gap:12px;align-items:center;">
              <img src="${avatar}" alt="${sanitizedBuyerName}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #6ecf45;">
              <div style="flex:1;">
                <p style="margin:0 0 6px 0;font-size:0.9rem;"><strong>${sanitizedBuyerName}</strong> wishlisted</p>
                <div style="display:flex;gap:8px;background:rgba(255,255,255,0.05);padding:8px;border-radius:8px;">
                  ${productImg ? `<img src="${productImg}" style="width:50px;height:50px;border-radius:6px;object-fit:cover;">` : ''}
                  <div>
                    <div style="font-size:0.85rem;font-weight:600;">${sanitizedProductName}</div>
                    <div style="font-size:0.8rem;color:#6ecf45;font-weight:700;margin-top:2px;">₵${safeProductPrice.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      const sanitizedBuyerProfilePic = (n.buyerProfilePic || '').replace(/["'<>]/g, '');
      const sanitizedMessage = escapeHtml(n.message || '');
      
      item.innerHTML = `
        <div class="notif-inner">
          <div class="notif-icon ${cfg.color}">${cfg.icon}</div>
          <div class="notif-content">
            ${
              sanitizedBuyerProfilePic
                ? `<img src="${sanitizedBuyerProfilePic}" alt="Buyer" class="buyer-avatar">`
                : ""
            }
            <div style="flex:1;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <h4>${escapeHtml(n.title)}</h4>
                <span style="font-size:0.7rem;color:#888;">${time}</span>
              </div>
              <p style="margin:4px 0;font-size:0.825rem;line-height:1.4;">${sanitizedMessage}</p>
              ${actions}
            </div>
          </div>
        </div>
      `;
    }

    setTimeout(() => item.classList.add("visible"), idx * 80);

    item.onclick = (e) => {
      if (e.target.closest("button")) return;
      markRead(n.id);
      if (n.type === 'message' && n.orderId) {
        closeNotificationSidebar();
        const card = document.querySelector(`[data-order-id="${n.orderId}"]`);
        if (card) {
          const msgBtn = card.querySelector('.msg-btn');
          if (msgBtn) msgBtn.click();
        }
      }
    };

    item.querySelectorAll(".view-order-btn").forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        markRead(n.id);
        closeNotificationSidebar();
        // Switch to orders section
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
        document.getElementById('orders').classList.add('active');
        document.querySelector('[data-section="orders"]').classList.add('active');
      };
    });

    frag.appendChild(item);
  });

  elements.notificationList.innerHTML = "";
  elements.notificationList.appendChild(frag);
};

// Helper: escape HTML
const escapeHtml = (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

// Dummy function — replace with real one from orders module if needed
const updateOrderStatus = async (orderId, status) => {
  // This should call your actual order update endpoint
  console.log(`Order ${orderId} → ${status}`);
  // Example: await fetch(`${API_BASE}/orders/${orderId}/status`, { method: "POST", ... })
};

// Mark as read
const markRead = async (id) => {
  try {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    notifications = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    renderNotifs();
  } catch (e) {}
};

// Clear all
const clearAll = async () => {
  if (!confirm("Clear all notifications?")) return;
  try {
    await fetch(`${API_BASE}/notifications/clear`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    notifications = [];
    renderNotifs();
  } catch (e) {}
};

// Public notification trigger
const notificationSystem = {
  show: async (title, type = "system", msg = "") => {
    const local = {
      id: Date.now(),
      title,
      message: msg,
      type,
      read: false,
      createdAt: new Date().toISOString(),
      isLocal: true,
    };
    notifications.unshift(local);
    renderNotifs();

    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, message: msg, type }),
      });
      if (res.ok) {
        const srv = await res.json();
        notifications = notifications.map((n) => (n.id === local.id ? srv : n));
        renderNotifs();
      }
    } catch (e) {}
  },
};

// Start polling
const startPolling = () => {
  if (polling) clearInterval(polling);
  polling = setInterval(fetchNotifs, 15000);
  fetchNotifs();
};

// MAIN INIT — called from main-seller.js
const initNotifications = (deps) => {
  ({
    elements,
    token,
    API_BASE = "http://localhost:5000/api",
    showToast = console.log,
  } = deps);

  // Attach event listeners only after DOM elements exist
  elements.notificationBtn.onclick = () => {
    elements.notificationSidebar.classList.toggle("open");
    elements.notificationOverlay.classList.toggle("show");
    if (elements.notificationSidebar.classList.contains("open")) {
      fetchNotifs();
    }
  };

  elements.notificationOverlay.onclick = closeNotificationSidebar;
  elements.clearAllBtn.onclick = clearAll;

  startPolling();
  console.log("Notification System Initialized");
};

// EXPORT
export {
  initNotifications,
  notificationSystem,
  closeNotificationSidebar,
  fetchNotifs,
  renderNotifs,
};

// Optional global access
window.notificationSystem = notificationSystem;
