// Buyer Orders Messaging Module
(function() {
  'use strict';
  
  var API_BASE = 'http://localhost:5000/api';
  
  function safeEscapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function addMessagingToOrders() {
    document.querySelectorAll('.order-card').forEach(function(card) {
      var orderId = card.dataset.orderId;
      if (!orderId) return;
      
      var actionsDiv = card.querySelector('.order-actions');
      if (!actionsDiv || actionsDiv.querySelector('.msg-btn-buyer')) return;
      
      var msgBtn = document.createElement('button');
      msgBtn.className = 'btn btn-track msg-btn-buyer';
      msgBtn.innerHTML = '<i class="fas fa-comment-dots"></i> Message';
      msgBtn.style.cssText = 'background:#6ecf45;margin-right:0.5rem;';
      msgBtn.onclick = function(e) {
        e.stopPropagation();
        openBuyerMessagePanel(orderId);
      };
      
      actionsDiv.prepend(msgBtn);
    });
  }
  
  var buyerWs = null;
  
  function connectBuyerWebSocket() {
    try {
      var userId = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || '{}').id;
      if (!userId || buyerWs) return;
      buyerWs = new WebSocket('ws://localhost:5000?userId=' + userId);
      buyerWs.onopen = function() { console.log('✅ Buyer WebSocket connected'); };
      buyerWs.onerror = function() { console.log('Buyer WebSocket error'); };
      buyerWs.onclose = function() { buyerWs = null; setTimeout(connectBuyerWebSocket, 5000); };
    } catch (err) {}
  }
  
  function openBuyerMessagePanel(orderId) {
    var token = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || '{}').token;
    
    var panel = document.createElement('div');
    panel.className = 'msg-panel';
    panel.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';
    panel.innerHTML = '<div style="background:#1a1a1a;border-radius:16px;width:90%;max-width:500px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1px solid rgba(110,207,69,0.3);"><div style="padding:1.2rem;background:rgba(110,207,69,0.1);border-bottom:1px solid rgba(110,207,69,0.3);display:flex;align-items:center;justify-content:space-between;"><h3 style="margin:0;color:#6ecf45;font-size:1.1rem;"><i class="fas fa-comment-dots"></i> Order #' + String(orderId).slice(-8) + '</h3><button class="msg-close" style="background:rgba(255,255,255,0.1);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;"><i class="fas fa-times"></i></button></div><div class="msg-thread" id="buyerMsgThread" style="flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:0.8rem;max-height:400px;"><div style="text-align:center;padding:2rem;color:#666;"><i class="fas fa-spinner fa-spin"></i></div></div><div style="padding:1rem;background:rgba(0,0,0,0.3);border-top:1px solid rgba(255,255,255,0.1);display:flex;gap:0.5rem;"><input type="text" id="buyerMsgInput" placeholder="Type a message..." maxlength="500" style="flex:1;padding:0.8rem 1rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:12px;color:#fff;font-size:0.95rem;"><button id="buyerMsgSend" style="padding:0.8rem 1.2rem;background:linear-gradient(135deg,#27ae60,#2ecc71);border:none;border-radius:12px;color:#fff;cursor:pointer;"><i class="fas fa-paper-plane"></i></button></div></div>';
    document.body.appendChild(panel);
    
    var thread = panel.querySelector('#buyerMsgThread');
    var input = panel.querySelector('#buyerMsgInput');
    var sendBtn = panel.querySelector('#buyerMsgSend');
    
    function loadMessages() {
      fetch(API_BASE + '/orders/' + orderId + '/messages', {
        headers: { Authorization: 'Bearer ' + token }
      }).then(function(res) { return res.json(); }).then(function(messages) {
        if (!messages.length) {
          thread.innerHTML = '<p style="text-align:center;color:#666;padding:2rem;">No messages yet. Start the conversation!</p>';
          return;
        }
        thread.innerHTML = messages.map(function(m) {
          return '<div style="max-width:75%;padding:0.8rem 1rem;border-radius:12px;' + (m.senderType === 'buyer' ? 'align-self:flex-end;background:linear-gradient(135deg,#27ae60,#2ecc71);color:#fff;border-bottom-right-radius:4px;' : 'align-self:flex-start;background:rgba(255,255,255,0.1);color:#fff;border-bottom-left-radius:4px;') + '"><p style="margin:0 0 0.3rem 0;word-wrap:break-word;">' + safeEscapeHtml(m.message) + '</p><span style="font-size:0.7rem;opacity:0.7;">' + new Date(m.createdAt).toLocaleTimeString('en-GH', {hour: '2-digit', minute: '2-digit'}) + '</span></div>';
        }).join('');
        thread.scrollTop = thread.scrollHeight;
        fetch(API_BASE + '/orders/' + orderId + '/messages/read', {
          method: 'PATCH',
          headers: { Authorization: 'Bearer ' + token }
        });
      }).catch(function() {
        thread.innerHTML = '<p style="color:#e74c3c;text-align:center;padding:2rem;">Failed to load messages</p>';
      });
    }
    
    function sendMessage() {
      var text = input.value.trim();
      if (!text) return;
      sendBtn.disabled = true;
      fetch(API_BASE + '/orders/' + orderId + '/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ message: text })
      }).then(function() {
        input.value = '';
        loadMessages();
      }).catch(function() {
        alert('Failed to send message');
      }).finally(function() {
        sendBtn.disabled = false;
      });
    }
    
    function wsMessageHandler(event) {
      try {
        var notification = JSON.parse(event.data);
        if (notification.type === 'message' && notification.orderId === orderId) {
          loadMessages();
        }
      } catch (err) {}
    }
    
    if (buyerWs && buyerWs.readyState === WebSocket.OPEN) {
      buyerWs.addEventListener('message', wsMessageHandler);
    }
    
    sendBtn.onclick = sendMessage;
    input.onkeypress = function(e) { if (e.key === 'Enter') sendMessage(); };
    panel.querySelector('.msg-close').onclick = function() {
      if (buyerWs) buyerWs.removeEventListener('message', wsMessageHandler);
      panel.remove();
    };
    panel.onclick = function(e) {
      if (e.target === panel) {
        if (buyerWs) buyerWs.removeEventListener('message', wsMessageHandler);
        panel.remove();
      }
    };
    loadMessages();
  }
  
  connectBuyerWebSocket();
  
  if (buyerWs) {
    buyerWs.addEventListener('message', function(event) {
      try {
        var notification = JSON.parse(event.data);
        if (notification.type === 'message') {
          var card = document.querySelector('[data-order-id="' + notification.orderId + '"]');
          if (card) {
            var existingBadge = card.querySelector('.msg-badge');
            if (!existingBadge) {
              var img = card.querySelector('img');
              var badge = document.createElement('span');
              badge.className = 'msg-badge';
              badge.style.cssText = 'position:absolute;top:10px;right:10px;background:#e74c3c;color:#fff;font-size:0.75rem;font-weight:700;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);animation:pulse 2s infinite;';
              badge.textContent = '1';
              var imgContainer = img.parentElement;
              if (imgContainer) imgContainer.appendChild(badge);
            } else {
              existingBadge.textContent = String(parseInt(existingBadge.textContent) + 1);
            }
          }
        }
      } catch (err) {}
    });
  }
  
  var observer = new MutationObserver(addMessagingToOrders);
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(addMessagingToOrders, 1000);
})();
