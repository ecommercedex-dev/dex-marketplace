// assets/js/modules/notifications.js - Exact copy from homepage

import config from '../config.js';
const API = config.API_BASE_URL;
let notifications = [];

function getToken() {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || 'null');
    return user?.token || user?.accessToken || '';
  } catch { return ''; }
}

const typeConfig = {
  order: { emoji: '🛒', color: 'order' },
  message: { emoji: '✉️', color: 'message' },
  review: { emoji: '⭐', color: 'review' },
  verification: { emoji: '✅', color: 'system' },
  system: { emoji: '📢', color: 'system' },
  error: { emoji: '⚠️', color: 'error' },
  default: { emoji: '🔔', color: 'system' }
};

function updateNotificationsUI() {
  const notificationList = document.getElementById('notificationList');
  const notificationBadge = document.getElementById('notificationBadge');
  const notifEmptyState = document.getElementById('notifEmptyState');

  if (!notificationList) return;

  const unreadCount = notifications.filter(n => !n.read).length;
  if (notificationBadge) {
    if (unreadCount > 0) {
      notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      notificationBadge.style.display = 'grid';
    } else {
      notificationBadge.style.display = 'none';
    }
  }

  notificationList.innerHTML = '';
  if (!notifications.length) {
    if (notifEmptyState) notifEmptyState.style.display = 'block';
    return;
  }
  if (notifEmptyState) notifEmptyState.style.display = 'none';

  notifications.forEach((notif, idx) => {
    const config = typeConfig[notif.type] || typeConfig.default;
    const item = document.createElement('div');
    item.className = `notif-item ${notif.read ? '' : 'unread'} visible`;
    item.style.animationDelay = `${idx * 80}ms`;

    const time = new Date(notif.createdAt).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const sanitizeText = (text) => {
      return String(text || '').replace(/[<>"'&]/g, (match) => {
        const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
        return entities[match];
      });
    };
    
    const sanitizedTitle = sanitizeText(notif.title || 'Notification');
    const sanitizedMessage = sanitizeText(notif.message);
    const sanitizedColor = config.color.replace(/[^a-zA-Z0-9_-]/g, '');
    
    item.innerHTML = `
      <div class="notif-inner">
        <div class="notif-icon ${sanitizedColor}">${config.emoji}</div>
        <div class="notif-content">
          <h4>${sanitizedTitle}</h4>
          <p>${sanitizedMessage}</p>
          <div class="notif-time">${time}</div>
        </div>
      </div>
    `;
    item.onclick = () => markAsRead(notif.id);
    notificationList.appendChild(item);
  });
}

async function markAsRead(id) {
  // Optimistic update - mark as read immediately
  notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
  updateNotificationsUI();
  
  // Then sync with server
  try {
    await fetch(`${API}/api/notifications/${id}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(config.REQUEST_TIMEOUT)
    });
  } catch (e) { 
    console.warn('Failed to mark as read on server');
  }
}

async function clearAll() {
  if (!confirm('Clear all notifications?')) return;
  
  // Optimistic update - clear immediately
  notifications = [];
  updateNotificationsUI();
  
  // Then sync with server
  try {
    await fetch(`${API}/api/notifications/clear`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(config.REQUEST_TIMEOUT)
    });
  } catch (e) { 
    console.warn('Failed to clear on server');
  }
}

async function fetchNotifications() {
  try {
    const res = await fetch(`${API}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
      signal: AbortSignal.timeout(config.REQUEST_TIMEOUT)
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    notifications = data.notifications || data || [];
    console.log('📬 Fetched notifications:', notifications.length, 'unread:', notifications.filter(n => !n.read).length);
    updateNotificationsUI();
  } catch (e) { console.warn('Offline notifications'); }
}

function initNotifications() {
  const notificationBtn = document.getElementById('notificationBtn');
  const notificationSidebar = document.getElementById('notificationSidebar');
  const overlay = document.querySelector('.overlay');
  const clearAllBtn = document.getElementById('clearAllBtn');

  if (!getToken() || !notificationBtn) return;

  // Expose globally for wishlist module
  window.fetchNotifications = fetchNotifications;

  notificationBtn.style.display = 'block';

  notificationBtn.onclick = (e) => {
    e.stopPropagation();
    const isOpen = notificationSidebar.classList.contains('open');
    notificationSidebar.classList.toggle('open', !isOpen);
    overlay.classList.toggle('active', !isOpen);
    document.body.style.overflow = isOpen ? '' : 'hidden';
    if (!isOpen) fetchNotifications();
  };

  overlay.onclick = () => {
    notificationSidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  document.addEventListener('click', (e) => {
    if (notificationSidebar.classList.contains('open') && 
        !notificationSidebar.contains(e.target) && 
        !notificationBtn.contains(e.target)) {
      notificationSidebar.classList.remove('open');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  if (clearAllBtn) clearAllBtn.onclick = clearAll;

  fetchNotifications();
  // Reduce interval to 30 seconds to minimize server load
  setInterval(() => getToken() && fetchNotifications(), 30000);
}

// Auto-init when DOM ready
document.addEventListener('DOMContentLoaded', initNotifications);

export { initNotifications, fetchNotifications, updateNotificationsUI };
