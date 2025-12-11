// Hostel Payment Tracking Module
let tenants = [];

const initHostelPayments = () => {
  const container = document.getElementById('hostelPaymentsContent');
  if (!container) return;

  renderPaymentDashboard();
  loadTenants();
  
  window.initHostelPaymentsContent = () => {
    renderPaymentDashboard();
  };
};

const loadTenants = async () => {
  const token = window.authToken || localStorage.getItem('authToken');
  try {
    const res = await fetch('http://localhost:5000/api/products/hostel/tenants', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      tenants = Array.isArray(data) ? data : [];
    } else {
      tenants = [];
    }
  } catch (err) {
    tenants = [];
  }
  renderPaymentDashboard();
};

const renderPaymentDashboard = () => {
  const container = document.getElementById('hostelPaymentsContent');
  if (!container) return;

  const sanitizeText = (text) => {
    return String(text || '').replace(/[<>"'&]/g, (match) => {
      const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
      return entities[match];
    });
  };

  const tenantList = Array.isArray(tenants) ? tenants : [];
  const totalTenants = tenantList.length;
  const paidCount = tenantList.filter(t => t.paymentStatus === 'paid').length;
  const unpaidCount = tenantList.filter(t => t.paymentStatus === 'unpaid').length;
  const totalRevenue = tenantList.filter(t => t.paymentStatus === 'paid').reduce((sum, t) => sum + (t.rent || 0), 0);

  container.innerHTML = `
    <div style="color: #fff;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div style="background: linear-gradient(135deg, #ffaa00, #cc8800); padding: 20px; border-radius: 12px; text-align: center;">
          <div style="font-size: 2.5rem; font-weight: 700;">${totalTenants}</div>
          <div>Total Tenants</div>
        </div>
        <div style="background: linear-gradient(135deg, #27ae60, #2b7a0b); padding: 20px; border-radius: 12px; text-align: center;">
          <div style="font-size: 2.5rem; font-weight: 700;">${paidCount}</div>
          <div>Paid This Month</div>
        </div>
        <div style="background: linear-gradient(135deg, #e74c3c, #c0392b); padding: 20px; border-radius: 12px; text-align: center;">
          <div style="font-size: 2.5rem; font-weight: 700;">${unpaidCount}</div>
          <div>Unpaid</div>
        </div>
        <div style="background: linear-gradient(135deg, #6ecf45, #2b7a0b); padding: 20px; border-radius: 12px; text-align: center;">
          <div style="font-size: 2.5rem; font-weight: 700;">₵${totalRevenue.toLocaleString()}</div>
          <div>Monthly Revenue</div>
        </div>
      </div>

      <div style="background: rgba(255,255,255,0.08); border-radius: 12px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0;">Tenant Payment Status</h3>
          <button onclick="window.addTenant()" style="padding: 8px 16px; background: #ffaa00; color: #000; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
            <i class="fas fa-plus"></i> Add Tenant
          </button>
        </div>
        
        ${tenantList.length === 0 ? `
          <div style="text-align: center; padding: 3rem; color: #aaa;">
            <i class="fas fa-users" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
            <p>No tenants yet. Add your first tenant to start tracking payments.</p>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${tenantList.map(t => {
              const sanitizedName = sanitizeText(t.name);
              const sanitizedRoom = sanitizeText(t.room);
              const sanitizedPhone = sanitizeText(t.phone);
              const safeRent = parseFloat(t.rent) || 0;
              const safeId = String(t.id).replace(/[^a-zA-Z0-9_-]/g, '');
              const safeStatus = t.paymentStatus === 'paid' ? 'paid' : 'unpaid';
              
              return `
                <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                  <div style="flex: 1; min-width: 200px;">
                    <div style="font-weight: 600; font-size: 1.1rem;">${sanitizedName}</div>
                    <div style="color: #aaa; font-size: 0.9rem;">${sanitizedRoom} • ₵${safeRent}/month</div>
                    <div style="color: #aaa; font-size: 0.85rem;">Phone: ${sanitizedPhone}</div>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <span style="padding: 6px 12px; border-radius: 50px; font-size: 0.85rem; font-weight: 600; ${safeStatus === 'paid' ? 'background: #27ae60; color: #fff;' : 'background: #e74c3c; color: #fff;'}">
                      ${safeStatus === 'paid' ? '✓ Paid' : '✗ Unpaid'}
                    </span>
                    <button onclick="window.togglePayment('${safeId}')" style="padding: 8px 12px; background: rgba(255,255,255,0.1); color: #fff; border: none; border-radius: 8px; cursor: pointer;">
                      Mark ${safeStatus === 'paid' ? 'Unpaid' : 'Paid'}
                    </button>
                    <button onclick="window.removeTenant('${safeId}')" style="padding: 8px 12px; background: #e74c3c; color: #fff; border: none; border-radius: 8px; cursor: pointer;">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    </div>
  `;
};

window.addTenant = () => {
  const name = prompt('Tenant Name:');
  if (!name) return;
  const room = prompt('Room Number:');
  if (!room) return;
  const rent = prompt('Monthly Rent (₵):');
  if (!rent) return;
  const phone = prompt('Phone Number:');
  if (!phone) return;

  const token = window.authToken || localStorage.getItem('authToken');
  fetch('http://localhost:5000/api/products/hostel/tenants', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ name, room, rent: parseFloat(rent), phone, paymentStatus: 'unpaid' })
  }).then(() => {
    if (window.showToast) window.showToast('Tenant added', 'success');
    loadTenants();
  }).catch(() => {
    if (window.showToast) window.showToast('Failed to add tenant', 'error');
  });
};

window.togglePayment = (id) => {
  const token = window.authToken || localStorage.getItem('authToken');
  fetch(`http://localhost:5000/api/products/hostel/tenants/${id}/toggle-payment`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  }).then(() => {
    if (window.showToast) window.showToast('Payment status updated', 'success');
    loadTenants();
  }).catch(() => {
    if (window.showToast) window.showToast('Update failed', 'error');
  });
};

window.removeTenant = (id) => {
  if (!confirm('Remove this tenant?')) return;
  const token = window.authToken || localStorage.getItem('authToken');
  fetch(`http://localhost:5000/api/products/hostel/tenants/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  }).then(() => {
    if (window.showToast) window.showToast('Tenant removed', 'success');
    loadTenants();
  }).catch(() => {
    if (window.showToast) window.showToast('Delete failed', 'error');
  });
};

export { initHostelPayments };
