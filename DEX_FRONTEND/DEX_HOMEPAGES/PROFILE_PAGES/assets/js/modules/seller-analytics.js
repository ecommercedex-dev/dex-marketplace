// Seller Analytics & Stats Module
let stats = {};
let token, API_BASE, showToast;

const initAnalytics = async (deps = {}) => {
  ({ token, API_BASE, showToast } = deps);
  await loadStats();
  
  renderAnalyticsDashboard();
  
  window.initAnalyticsContent = () => {
    renderAnalyticsDashboard();
  };
};

const loadStats = async () => {
  try {
    const [products, bookings, tenants, analytics] = await Promise.all([
      fetch('http://localhost:5000/api/products/my', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
      fetch('http://localhost:5000/api/products/hostel/incoming-bookings', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('http://localhost:5000/api/products/hostel/tenants', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('http://localhost:5000/api/sellers/analytics', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ({}))
    ]);

    const productList = Array.isArray(products) ? products : [];
    const bookingList = Array.isArray(bookings) ? bookings : [];
    const tenantList = Array.isArray(tenants) ? tenants : [];
    const isHostel = productList.some(p => p.isHostel);
    
    if (isHostel) {
      const totalRooms = productList.length;
      const bookedRooms = productList.filter(p => p.bookingStatus === 'confirmed').length;
      const pendingBookings = bookingList.filter(b => b.status === 'pending').length;
      const monthlyRevenue = tenantList.filter(t => t.paymentStatus === 'paid').reduce((sum, t) => sum + (t.rent || 0), 0);
      
      stats = {
        isHostel: true,
        totalRooms,
        bookedRooms,
        availableRooms: totalRooms - bookedRooms,
        pendingBookings,
        totalTenants: tenantList.length,
        monthlyRevenue,
        occupancyRate: totalRooms ? ((bookedRooms / totalRooms) * 100).toFixed(0) : 0,
        products: productList,
        followers: analytics.followers || 0,
        wishlistCount: analytics.wishlistCount || 0
      };
    } else {
      const lowStockProducts = productList.filter(p => p.stock && p.stock < 5);
      const outOfStock = productList.filter(p => !p.stock || p.stock === 0).length;
      
      stats = {
        isHostel: false,
        totalProducts: analytics.totalProducts || productList.length,
        activeProducts: productList.filter(p => p.stock > 0).length,
        totalOrders: analytics.totalOrders || 0,
        pendingOrders: analytics.pendingOrders || 0,
        completedOrders: analytics.completedOrders || 0,
        totalRevenue: analytics.totalRevenue || 0,
        wishlistCount: analytics.wishlistCount || 0,
        followers: analytics.followers || 0,
        lowStockProducts,
        avgRating: 0,
        totalReviews: 0,
        outOfStock,
        products: productList
      };
    }
  } catch (err) {
    console.error('Stats load error:', err);
  }
};

const renderAnalyticsDashboard = () => {
  const container = document.getElementById('analyticsContent');
  if (!container) return;

  if (stats.isHostel) {
    container.innerHTML = `
      <div style="color: #fff;">
        <h2 style="margin: 0 0 24px 0; font-size: 1.8rem;">🏠 Hostel Dashboard</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div class="stat-card" style="background: linear-gradient(135deg, #ffaa00, #cc8800); padding: 20px; border-radius: 12px; text-align: center;">
            <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 8px;">${stats.totalRooms}</div>
            <div style="opacity: 0.9;">Total Rooms</div>
          </div>
          
          <div class="stat-card" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; text-align: center;">
            <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 8px; color: #27ae60;">${stats.bookedRooms}</div>
            <div style="opacity: 0.9;">Booked Rooms</div>
          </div>
          
          <div class="stat-card" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; text-align: center;">
            <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 8px; color: #3498db;">${stats.availableRooms}</div>
            <div style="opacity: 0.9;">Available</div>
          </div>
          
          <div class="stat-card" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; text-align: center;">
            <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 8px; color: #f39c12;">${stats.occupancyRate}%</div>
            <div style="opacity: 0.9;">Occupancy Rate</div>
          </div>
        </div>

        ${stats.pendingBookings > 0 ? `
          <div style="background: rgba(243,156,18,0.1); border: 1px solid #f39c12; border-radius: 12px; padding: 16px; margin-top: 16px;">
            <p style="margin: 0; color: #f39c12;"><i class="fas fa-clock"></i> ${stats.pendingBookings} pending booking request(s)</p>
          </div>
        ` : ''}

        <div style="margin-top: 32px; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px;">
          <h3 style="margin: 0 0 16px 0; font-size: 1.2rem;">💡 Hostel Management Tips</h3>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            ${stats.pendingBookings > 0 ? '<li style="color: #f39c12;">Respond to pending bookings quickly to secure tenants</li>' : ''}
            ${stats.occupancyRate < 70 ? '<li style="color: #3498db;">Promote your hostel on social media to increase bookings</li>' : ''}
            <li style="color: #ffaa00;">Keep room photos updated and descriptions accurate</li>
            <li style="color: #27ae60;">Maintain good relationships with tenants for positive reviews</li>
          </ul>
        </div>
      </div>
    `;
    return;
  }

  const sanitizeText = (text) => {
    return String(text || '').replace(/[<>"'&]/g, (match) => {
      const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
      return entities[match];
    });
  };
  
  const lowStockHTML = stats.lowStockProducts?.length ? `
    <div style="background: rgba(255,193,7,0.1); border: 1px solid #ffc107; border-radius: 12px; padding: 16px; margin-top: 20px;">
      <h3 style="margin: 0 0 12px 0; color: #ffc107; font-size: 1.1rem;">⚠️ Low Stock Alert (${stats.lowStockProducts.length})</h3>
      ${stats.lowStockProducts.slice(0, 5).map(p => {
        const sanitizedName = sanitizeText(p.name);
        const safeStock = parseInt(p.stock) || 0;
        return `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,193,7,0.2);">
            <span style="color: #fff;">${sanitizedName}</span>
            <span style="color: #ffc107; font-weight: 700;">${safeStock} left</span>
          </div>
        `;
      }).join('')}
      ${stats.lowStockProducts.length > 5 ? `<p style="margin: 8px 0 0 0; color: #aaa; font-size: 0.85rem;">+${stats.lowStockProducts.length - 5} more</p>` : ''}
    </div>
  ` : '';

  container.innerHTML = `
    <div style="color: #fff;">
      <h2 style="margin: 0 0 24px 0; font-size: 1.8rem;">📊 Dashboard Overview</h2>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="stat-card" style="background: linear-gradient(135deg, #6ecf45, #2b7a0b); padding: 20px; border-radius: 12px; text-align: center;">
          <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 8px;">₵${stats.totalRevenue.toLocaleString()}</div>
          <div style="opacity: 0.9;">Potential Revenue</div>
          <div style="font-size: 0.75rem; color: rgba(255,255,255,0.7); margin-top: 4px;">${stats.completedOrders || 0} completed orders</div>
        </div>
        
        <div class="stat-card" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; text-align: center;">
          <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 8px; color: #6ecf45;">${stats.totalProducts}</div>
          <div style="opacity: 0.9;">Total Products</div>
          <div style="font-size: 0.85rem; color: #aaa; margin-top: 4px;">${stats.activeProducts} active</div>
        </div>
        
        <div class="stat-card" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; text-align: center;">
          <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 8px; color: #3498db;">${stats.totalOrders}</div>
          <div style="opacity: 0.9;">Order Requests</div>
          <div style="font-size: 0.85rem; color: #aaa; margin-top: 4px;">${stats.pendingOrders} pending</div>
        </div>
        
        <div class="stat-card" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; text-align: center;">
          <div style="font-size: 2.5rem; font-weight: 700; margin-bottom: 8px; color: #e91e63;">${stats.wishlistCount}</div>
          <div style="opacity: 0.9;">Wishlist Adds</div>
          <div style="font-size: 0.85rem; color: #aaa; margin-top: 4px;">${stats.followers} followers</div>
        </div>
      </div>

      ${lowStockHTML}

      ${stats.outOfStock > 0 ? `
        <div style="background: rgba(231,76,60,0.1); border: 1px solid #e74c3c; border-radius: 12px; padding: 16px; margin-top: 16px;">
          <p style="margin: 0; color: #e74c3c;"><i class="fas fa-exclamation-circle"></i> ${stats.outOfStock} product(s) out of stock</p>
        </div>
      ` : ''}

      <div style="margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap;">
        <button onclick="window.exportProductsCSV()" style="padding: 12px 24px; background: #6ecf45; color: #000; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
          <i class="fas fa-download"></i> Export Products CSV
        </button>
        <button onclick="window.exportOrdersCSV()" style="padding: 12px 24px; background: #3498db; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
          <i class="fas fa-file-export"></i> Export Orders CSV
        </button>
      </div>

      <div style="margin-top: 32px; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px;">
        <h3 style="margin: 0 0 16px 0; font-size: 1.2rem;">💡 Performance Tips</h3>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
          ${stats.lowStockProducts.length > 0 ? '<li style="color: #ffc107;">Restock low inventory items to avoid missing sales</li>' : ''}
          ${stats.avgRating < 4 ? '<li style="color: #e74c3c;">Improve customer service to boost your rating</li>' : ''}
          ${stats.products.filter(p => !p.images || p.images.length < 3).length > 0 ? '<li style="color: #3498db;">Add more photos to products - listings with 3+ images sell faster</li>' : ''}
          ${stats.pendingOrders > 0 ? '<li style="color: #f39c12;">Respond to pending orders quickly to maintain buyer trust</li>' : ''}
          <li style="color: #6ecf45;">Keep your shop info updated for better visibility</li>
        </ul>
      </div>
    </div>
  `;
};

window.exportProductsCSV = () => {
  const sanitizeCSV = (text) => {
    return String(text || '').replace(/[",\r\n]/g, (match) => {
      if (match === '"') return '""';
      return ' ';
    });
  };
  
  const csv = [
    ['Name', 'Category', 'Price', 'Stock', 'Created'],
    ...stats.products.map(p => [
      sanitizeCSV(p.name),
      sanitizeCSV(p.category),
      parseFloat(p.price) || 0,
      parseInt(p.stock) || 0,
      new Date(p.createdAt).toLocaleDateString()
    ])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `products_${Date.now()}.csv`;
  a.click();
  showToast('Products exported!', 'success');
};

window.exportOrdersCSV = async () => {
  try {
    const sanitizeCSV = (text) => {
      return String(text || '').replace(/[",\r\n]/g, (match) => {
        if (match === '"') return '""';
        return ' ';
      });
    };
    
    const orders = [];
    const csv = [
      ['Order ID', 'Product', 'Quantity', 'Total', 'Status', 'Date'],
      ...orders.map(o => [
        parseInt(o.id) || 0,
        sanitizeCSV(o.product?.name || 'N/A'),
        parseInt(o.quantity) || 0,
        parseFloat(o.totalPrice) || 0,
        sanitizeCSV(o.status),
        new Date(o.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${Date.now()}.csv`;
    a.click();
    showToast('Orders exported!', 'success');
  } catch (err) {
    showToast('Export failed', 'error');
  }
};

export { initAnalytics, loadStats, renderAnalyticsDashboard };
