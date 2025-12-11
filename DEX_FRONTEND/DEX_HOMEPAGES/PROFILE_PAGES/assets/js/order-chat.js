// Minimal Order Chat System
window.OrderChat = (function() {
  const API = 'http://localhost:5000/api';
  let ws = null;
  let currentOrderId = null;
  let currentToken = null;
  let currentUserType = null;
  
  function init(userId) {
    ws = new WebSocket(`ws://localhost:5000?userId=${userId}`);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'message') {
        if (data.orderId === currentOrderId) {
          loadMessages(currentOrderId, currentUserType, currentToken);
        } else {
          showBadge(data.orderId);
        }
      }
    };
  }
  
  function showBadge(orderId) {
    const btns = document.querySelectorAll(`[data-order-id="${orderId}"] .chat-btn, [data-order-id="${orderId}"] .chat-btn-buyer`);
    btns.forEach(btn => {
      let badge = btn.querySelector('.chat-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'chat-badge';
        badge.style.cssText = 'position:absolute;top:-8px;right:-8px;background:#e74c3c;color:#fff;font-size:0.7rem;font-weight:700;min-width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;animation:pulse 2s infinite;';
        badge.textContent = '1';
        btn.style.position = 'relative';
        btn.appendChild(badge);
      } else {
        badge.textContent = String(parseInt(badge.textContent) + 1);
      }
    });
  }
  
  function open(order, userType, token) {
    currentOrderId = order.id;
    currentToken = token;
    currentUserType = userType;
    
    const btns = document.querySelectorAll(`[data-order-id="${order.id}"] .chat-badge`);
    btns.forEach(b => b.remove());
    
    const panel = document.createElement('div');
    panel.id = 'chatPanel';
    panel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;max-width:450px;height:600px;max-height:85vh;background:linear-gradient(135deg,#1a1a1a,#0f0f0f);border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.7);z-index:9999;display:flex;flex-direction:column;border:1px solid rgba(110,207,69,0.4);animation:slideUp 0.3s ease-out;';
    
    const style = document.createElement('style');
    style.textContent = '@keyframes slideUp{from{opacity:0;transform:translate(-50%,-45%)}to{opacity:1;transform:translate(-50%,-50%)}}';
    document.head.appendChild(style);
    
    panel.innerHTML = `
      <div style="padding:1.2rem;background:linear-gradient(135deg,rgba(110,207,69,0.15),rgba(110,207,69,0.05));border-bottom:1px solid rgba(110,207,69,0.3);display:flex;justify-content:space-between;align-items:center;border-radius:20px 20px 0 0;">
        <h4 style="margin:0;color:#6ecf45;font-size:1.1rem;">💬 Order #${escapeHtml(String(order.id).slice(-8))}</h4>
        <button onclick="OrderChat.close()" style="background:rgba(255,255,255,0.1);border:none;color:#fff;font-size:1.5rem;cursor:pointer;width:32px;height:32px;border-radius:50%;transition:0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">×</button>
      </div>
      <div style="padding:0.9rem;background:rgba(255,193,7,0.12);border-bottom:1px solid rgba(255,193,7,0.3);">
        <p style="margin:0;font-size:0.85rem;color:#ffc107;line-height:1.5;">⚠️ Chat closes when order is accepted. Use WhatsApp after: <strong>${escapeHtml(order.sellerPhone || order.buyerPhone || 'N/A')}</strong></p>
      </div>
      <div id="chatMessages" style="flex:1;overflow-y:auto;padding:1.2rem;display:flex;flex-direction:column;gap:0.7rem;background:rgba(0,0,0,0.2);"></div>
      <div style="padding:1.2rem;border-top:1px solid rgba(255,255,255,0.1);display:flex;gap:0.7rem;background:rgba(0,0,0,0.3);border-radius:0 0 20px 20px;">
        <input id="chatInput" type="text" placeholder="Type message..." maxlength="200" style="flex:1;padding:0.9rem 1rem;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:12px;color:#fff;font-size:0.95rem;transition:0.3s;" onfocus="this.style.background='rgba(255,255,255,0.12)'" onblur="this.style.background='rgba(255,255,255,0.08)'">
        <button onclick="OrderChat.send()" style="padding:0.9rem 1.3rem;background:linear-gradient(135deg,#27ae60,#2ecc71);border:none;border-radius:12px;color:#fff;font-weight:700;cursor:pointer;transition:0.3s;box-shadow:0 4px 15px rgba(39,174,96,0.3);" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 20px rgba(39,174,96,0.4)'" onmouseout="this.style.transform='';this.style.boxShadow='0 4px 15px rgba(39,174,96,0.3)'">Send</button>
      </div>
    `;
    
    document.body.appendChild(panel);
    loadMessages(order.id, userType, token);
    
    document.getElementById('chatInput').onkeypress = (e) => {
      if (e.key === 'Enter') send(order.id, userType, token);
    };
  }
  
  async function loadMessages(orderId, userType, token) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    try {
      const res = await fetch(`${API}/orders/${orderId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const messages = await res.json();
      
      container.innerHTML = messages.length ? messages.map(m => `
        <div style="max-width:75%;padding:0.9rem 1.1rem;border-radius:16px;${m.senderType === userType ? 'align-self:flex-end;background:linear-gradient(135deg,#27ae60,#2ecc71);color:#fff;box-shadow:0 4px 12px rgba(39,174,96,0.3);' : 'align-self:flex-start;background:rgba(255,255,255,0.1);color:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.2);'}">
          <p style="margin:0 0 0.4rem 0;font-size:0.95rem;word-wrap:break-word;line-height:1.4;">${escapeHtml(m.message)}</p>
          <span style="font-size:0.75rem;opacity:0.8;">${new Date(m.createdAt).toLocaleTimeString('en-GH',{hour:'2-digit',minute:'2-digit'})}</span>
        </div>
      `).join('') : '<p style="text-align:center;color:#666;margin:auto;font-size:0.95rem;">No messages yet. Start the conversation! 💬</p>';
      
      container.scrollTop = container.scrollHeight;
      
      await fetch(`${API}/orders/${orderId}/messages/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      container.innerHTML = '<p style="color:#e74c3c;text-align:center;">Failed to load</p>';
    }
  }
  
  async function send(orderId, userType, token) {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    
    try {
      await fetch(`${API}/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text })
      });
      input.value = '';
      loadMessages(orderId, userType, token);
    } catch (err) {
      alert('Failed to send');
    }
  }
  
  function close() {
    document.getElementById('chatPanel')?.remove();
    currentOrderId = null;
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  return { init, open, close, send };
})();
