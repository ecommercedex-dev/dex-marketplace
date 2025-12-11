// Enhanced Shop Customization Module
let settings = {};
let token, API_BASE, showToast;
let bannerConfig = { type: 'color', bgColor: '#6ecf45', text: '', textColor: '#ffffff', image: null };

const initShopCustomize = async (deps) => {
  ({ token, API_BASE, showToast } = deps);
  await loadSettings();
  
  window.initShopCustomizeContent = () => {
    renderCustomizeUI();
  };
};

const loadSettings = async () => {
  try {
    const res = await fetch(`${API_BASE}/shop/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      settings = await res.json();
      if (settings.bannerConfig) bannerConfig = settings.bannerConfig;
    }
  } catch (err) {
    console.error("Load settings error:", err);
  }
};

const calculateProgress = () => {
  const fields = [
    settings.tagline,
    settings.shopLogo || settings.bannerImage || settings.logoType,
    settings.primaryColor,
    settings.businessHours,
    settings.paymentMethods,
    settings.socialLinks?.instagram || settings.socialLinks?.facebook
  ];
  const completed = fields.filter(f => f).length;
  return Math.round((completed / fields.length) * 100);
};

const getChecklist = () => {
  return [
    { label: '🎨 Set shop colors', done: !!settings.primaryColor },
    { label: '📝 Add tagline', done: !!settings.tagline },
    { label: '🖼️ Create logo & banner', done: !!(settings.shopLogo || settings.bannerImage || settings.logoType) },
    { label: '🕐 Add business hours', done: !!settings.businessHours },
    { label: '💳 Set payment methods', done: !!settings.paymentMethods },
    { label: '📱 Connect social media', done: !!(settings.socialLinks?.instagram || settings.socialLinks?.facebook) }
  ];
};

// HTML escaping function to prevent XSS
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const renderCustomizeUI = () => {
  const container = document.getElementById("customizeShopContent");
  if (!container) return;

  const progress = calculateProgress();
  const checklist = getChecklist();
  const completedCount = checklist.filter(i => i.done).length;

  container.innerHTML = `
    <div class="customize-layout">
      <div class="customize-form">
        <div class="hero-card">
          <div class="hero-bg"></div>
          <div class="hero-content">
            <div class="hero-icon">🎨</div>
            <h2>Customize Your Shop</h2>
            <p class="hero-subtitle">Create a unique brand experience that attracts more customers</p>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
                <div class="progress-glow" style="width: ${progress}%"></div>
              </div>
              <div class="progress-text">
                <span class="progress-percent">${progress}%</span>
                <span class="progress-status">${completedCount}/${checklist.length} completed</span>
              </div>
            </div>
          </div>
        </div>

        <div class="checklist-card">
          <div class="checklist-header">
            <h3><i class="fas fa-tasks"></i> Setup Checklist</h3>
            <div class="checklist-badge">${completedCount}/${checklist.length}</div>
          </div>
          <div class="checklist-items">
            ${checklist.map((item, index) => `
              <div class="checklist-item ${item.done ? 'completed' : ''}" style="animation-delay: ${index * 0.1}s">
                <div class="checklist-icon">
                  <i class="fas ${item.done ? 'fa-check-circle' : 'fa-circle'}"></i>
                </div>
                <span class="checklist-text">${escapeHtml(item.label)}</span>
                ${item.done ? '<div class="completion-sparkle">✨</div>' : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <form id="shopCustomizeForm">
          <div class="customize-card banner-builder">
            <div class="card-header">
              <div class="card-icon">🎨</div>
              <h3>Banner Builder</h3>
              <div class="card-badge">Pro</div>
            </div>
            <div class="banner-type-selector">
              <div class="banner-option ${bannerConfig.type === 'color' ? 'active' : ''}" onclick="window.updateBannerType('color')">
                <div class="option-preview" style="background: linear-gradient(135deg, #6ecf45, #6ecf45);"></div>
                <span>Solid Color</span>
              </div>
              <div class="banner-option ${bannerConfig.type === 'gradient' ? 'active' : ''}" onclick="window.updateBannerType('gradient')">
                <div class="option-preview" style="background: linear-gradient(135deg, #6ecf45, #2b7a0b);"></div>
                <span>Gradient</span>
              </div>
              <div class="banner-option ${bannerConfig.type === 'pattern' ? 'active' : ''}" onclick="window.updateBannerType('pattern')">
                <div class="option-preview" style="background: #6ecf45; background-image: radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px); background-size: 20px 20px;"></div>
                <span>Pattern</span>
              </div>
              <div class="banner-option ${bannerConfig.type === 'image' ? 'active' : ''}" onclick="window.updateBannerType('image')">
                <div class="option-preview" style="background: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%); background-size: 10px 10px;"></div>
                <span>Custom Image</span>
              </div>
            </div>
            
            <div class="banner-templates" style="margin: 20px 0;">
              <h4 style="margin: 0 0 12px 0; color: #6ecf45;">🎨 Quick Templates</h4>
              <div class="template-grid">
                <div class="template-item" onclick="window.applyBannerTemplate('sale')">
                  <div class="template-preview" style="background: linear-gradient(135deg, #ff6b6b, #ee5a52); color: white; padding: 8px; text-align: center; font-size: 0.8rem; font-weight: bold;">🔥 SALE</div>
                  <span>Sale Banner</span>
                </div>
                <div class="template-item" onclick="window.applyBannerTemplate('new')">
                  <div class="template-preview" style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 8px; text-align: center; font-size: 0.8rem; font-weight: bold;">✨ NEW</div>
                  <span>New Arrival</span>
                </div>
                <div class="template-item" onclick="window.applyBannerTemplate('premium')">
                  <div class="template-preview" style="background: linear-gradient(135deg, #f39c12, #e67e22); color: white; padding: 8px; text-align: center; font-size: 0.8rem; font-weight: bold;">👑 VIP</div>
                  <span>Premium</span>
                </div>
                <div class="template-item" onclick="window.applyBannerTemplate('eco')">
                  <div class="template-preview" style="background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; padding: 8px; text-align: center; font-size: 0.8rem; font-weight: bold;">🌱 ECO</div>
                  <span>Eco-Friendly</span>
                </div>
              </div>
            </div>
            <div id="bannerControls"></div>
            <div class="banner-text-editor">
              <div class="form-group">
                <label>Banner Text</label>
                <input type="text" id="bannerText" value="${escapeHtml(bannerConfig.text || '')}" placeholder="e.g., 🎉 20% OFF Everything!" oninput="window.updatePreview()">
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label>Text Color</label>
                  <input type="color" id="bannerTextColor" value="${bannerConfig.textColor || '#ffffff'}" oninput="window.updatePreview()">
                </div>
                <div class="form-group">
                  <label>Text Size</label>
                  <select id="bannerTextSize" onchange="window.updatePreview()">
                    <option value="small" ${bannerConfig.textSize === 'small' ? 'selected' : ''}>Small</option>
                    <option value="medium" ${bannerConfig.textSize === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="large" ${bannerConfig.textSize === 'large' ? 'selected' : ''}>Large</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Text Style</label>
                  <select id="bannerTextStyle" onchange="window.updatePreview()">
                    <option value="normal" ${bannerConfig.textStyle === 'normal' ? 'selected' : ''}>Normal</option>
                    <option value="bold" ${bannerConfig.textStyle === 'bold' ? 'selected' : ''}>Bold</option>
                    <option value="italic" ${bannerConfig.textStyle === 'italic' ? 'selected' : ''}>Italic</option>
                    <option value="shadow" ${bannerConfig.textStyle === 'shadow' ? 'selected' : ''}>Shadow</option>
                  </select>
                </div>
              </div>
              
              <div class="form-group">
                <label>Text Position</label>
                <div class="position-grid">
                  <button type="button" class="position-btn ${bannerConfig.textPosition === 'top-left' ? 'active' : ''}" onclick="window.setBannerTextPosition('top-left')">↖</button>
                  <button type="button" class="position-btn ${bannerConfig.textPosition === 'top-center' ? 'active' : ''}" onclick="window.setBannerTextPosition('top-center')">↑</button>
                  <button type="button" class="position-btn ${bannerConfig.textPosition === 'top-right' ? 'active' : ''}" onclick="window.setBannerTextPosition('top-right')">↗</button>
                  <button type="button" class="position-btn ${bannerConfig.textPosition === 'center-left' ? 'active' : ''}" onclick="window.setBannerTextPosition('center-left')">←</button>
                  <button type="button" class="position-btn ${bannerConfig.textPosition === 'center' ? 'active' : ''}" onclick="window.setBannerTextPosition('center')">⊙</button>
                  <button type="button" class="position-btn ${bannerConfig.textPosition === 'center-right' ? 'active' : ''}" onclick="window.setBannerTextPosition('center-right')">→</button>
                  <button type="button" class="position-btn ${bannerConfig.textPosition === 'bottom-left' ? 'active' : ''}" onclick="window.setBannerTextPosition('bottom-left')">↙</button>
                  <button type="button" class="position-btn ${bannerConfig.textPosition === 'bottom-center' ? 'active' : ''}" onclick="window.setBannerTextPosition('bottom-center')">↓</button>
                  <button type="button" class="position-btn ${bannerConfig.textPosition === 'bottom-right' ? 'active' : ''}" onclick="window.setBannerTextPosition('bottom-right')">↘</button>
                </div>
              </div>
            </div>
          </div>

          <div class="customize-card branding-card">
            <div class="card-header">
              <div class="card-icon">🏷️</div>
              <h3>Branding</h3>
            </div>
            <div class="form-group">
              <label>Shop Tagline <span style="opacity: 0.6; font-size: 0.85rem;">(${(settings.tagline || '').length}/100)</span></label>
              <input type="text" id="tagline" value="${escapeHtml(settings.tagline || '')}" placeholder="e.g., Quality Electronics at Best Prices ⚡" maxlength="100" oninput="window.updatePreview()">
            </div>
            <div class="form-group">
              <label>About Your Shop <span style="opacity: 0.6; font-size: 0.85rem;">(${(settings.aboutShop || '').length}/500)</span></label>
              <textarea id="aboutShop" rows="4" maxlength="500" placeholder="Tell customers about your shop... 📖" oninput="window.updatePreview()">${escapeHtml(settings.aboutShop || '')}</textarea>
            </div>
            <div class="logo-builder">
              <h4 style="margin: 0 0 16px 0; color: #6ecf45;">🎨 Logo Builder</h4>
              
              <div class="logo-type-selector">
                <div class="logo-option ${settings.logoType === 'text' ? 'active' : ''}" onclick="window.setLogoType('text')">
                  <div class="logo-preview-mini" style="background: #6ecf45; color: #000; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem;">AB</div>
                  <span>Text Logo</span>
                </div>
                <div class="logo-option ${settings.logoType === 'icon' ? 'active' : ''}" onclick="window.setLogoType('icon')">
                  <div class="logo-preview-mini" style="background: #6ecf45; color: #000; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">🏪</div>
                  <span>Icon Logo</span>
                </div>
                <div class="logo-option ${settings.logoType === 'combo' ? 'active' : ''}" onclick="window.setLogoType('combo')">
                  <div class="logo-preview-mini" style="background: #6ecf45; color: #000; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; flex-direction: column;">🏪<span style="font-size: 0.6rem;">AB</span></div>
                  <span>Icon + Text</span>
                </div>
                <div class="logo-option ${settings.logoType === 'upload' ? 'active' : ''}" onclick="window.setLogoType('upload')">
                  <div class="logo-preview-mini" style="background: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%); background-size: 8px 8px;"></div>
                  <span>Upload Image</span>
                </div>
              </div>
              
              <div id="logoControls"></div>
              
              <div class="logo-preview-container">
                <h5 style="margin: 16px 0 8px 0; color: #e0e0e0;">Preview</h5>
                <div id="logoPreview" class="logo-preview-large"></div>
              </div>
            </div>
          </div>

          <div class="customize-card color-scheme">
            <div class="card-header">
              <div class="card-icon">🎨</div>
              <h3>Color Scheme</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="form-group">
                <label>Primary Color</label>
                <input type="color" id="primaryColor" value="${settings.primaryColor || '#6ecf45'}" oninput="window.updatePreview()" style="width: 100%; height: 50px;">
              </div>
              <div class="form-group">
                <label>Accent Color</label>
                <input type="color" id="accentColor" value="${settings.accentColor || '#2b7a0b'}" oninput="window.updatePreview()" style="width: 100%; height: 50px;">
              </div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
              <button type="button" onclick="window.applyColorPreset('#6ecf45', '#2b7a0b')" style="padding: 8px 16px; background: #6ecf45; color: #000; border: none; border-radius: 6px; cursor: pointer;">🟢 Green</button>
              <button type="button" onclick="window.applyColorPreset('#3498db', '#2980b9')" style="padding: 8px 16px; background: #3498db; color: #fff; border: none; border-radius: 6px; cursor: pointer;">🔵 Blue</button>
              <button type="button" onclick="window.applyColorPreset('#e74c3c', '#c0392b')" style="padding: 8px 16px; background: #e74c3c; color: #fff; border: none; border-radius: 6px; cursor: pointer;">🔴 Red</button>
              <button type="button" onclick="window.applyColorPreset('#f39c12', '#e67e22')" style="padding: 8px 16px; background: #f39c12; color: #000; border: none; border-radius: 6px; cursor: pointer;">🟠 Orange</button>
              <button type="button" onclick="window.applyColorPreset('#9b59b6', '#8e44ad')" style="padding: 8px 16px; background: #9b59b6; color: #fff; border: none; border-radius: 6px; cursor: pointer;">🟣 Purple</button>
            </div>
          </div>

          <div class="customize-card shop-info">
            <div class="card-header">
              <div class="card-icon">ℹ️</div>
              <h3>Shop Information</h3>
            </div>
            <div class="form-group">
              <label>Location 📍</label>
              <input type="text" id="location" value="${escapeHtml(settings.location || '')}" placeholder="e.g., Main Campus, Block A" oninput="window.updatePreview()">
            </div>
            <div class="form-group">
              <label>Business Hours 🕐</label>
              <input type="text" id="businessHours" value="${escapeHtml(settings.businessHours || '')}" placeholder="e.g., Mon-Fri 9AM-6PM" oninput="window.updatePreview()">
            </div>
            <div class="form-group">
              <label>Delivery Info 🚚</label>
              <input type="text" id="deliveryInfo" value="${escapeHtml(settings.deliveryInfo || '')}" placeholder="e.g., Campus-wide delivery, Meet at library" oninput="window.updatePreview()">
            </div>
            <div class="form-group">
              <label>Payment Methods 💳</label>
              <input type="text" id="paymentMethods" value="${escapeHtml(settings.paymentMethods || '')}" placeholder="e.g., Cash, Mobile Money, Bank Transfer" oninput="window.updatePreview()">
            </div>
            <div class="form-group">
              <label>Return Policy ↩️</label>
              <textarea id="returnPolicy" rows="3" placeholder="Describe your return policy...">${escapeHtml(settings.returnPolicy || '')}</textarea>
            </div>
          </div>

          <div class="customize-card social-media">
            <div class="card-header">
              <div class="card-icon">📱</div>
              <h3>Social Media</h3>
            </div>
            <div class="form-group">
              <label>Instagram</label>
              <input type="text" id="instagram" value="${escapeHtml(settings.socialLinks?.instagram || '')}" placeholder="@yourshop">
            </div>
            <div class="form-group">
              <label>Facebook</label>
              <input type="text" id="facebook" value="${escapeHtml(settings.socialLinks?.facebook || '')}" placeholder="facebook.com/yourshop">
            </div>
            <div class="form-group">
              <label>TikTok</label>
              <input type="text" id="tiktok" value="${escapeHtml(settings.socialLinks?.tiktok || '')}" placeholder="@yourshop">
            </div>
          </div>



          <div class="customize-card templates-card">
            <div class="card-header">
              <div class="card-icon">💾</div>
              <h3>Templates</h3>
            </div>
            <div class="template-actions">
              <button type="button" class="template-btn" onclick="window.saveAsTemplate()">
                <i class="fas fa-bookmark"></i> Save as Template
              </button>
              <button type="button" class="template-btn secondary" onclick="window.loadTemplates()">
                <i class="fas fa-folder-open"></i> My Templates
              </button>
            </div>
            <div id="templatesList" class="templates-list" style="display: none;"></div>
          </div>

          <button type="submit" class="save-btn-enhanced">
            <div class="btn-content">
              <i class="fas fa-save"></i>
              <span>Save All Changes</span>
            </div>
            <div class="btn-glow"></div>
          </button>
        </form>
      </div>

      <div class="customize-preview">
        <div class="preview-container">
          <h3 class="preview-title">👁️ Live Preview</h3>
          <div id="livePreview" class="preview-frame"></div>
          <p class="preview-hint">Changes appear instantly ⚡</p>
        </div>
      </div>
    </div>

    <style>
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes shimmer {
        0% { background-position: -200px 0; }
        100% { background-position: calc(200px + 100%) 0; }
      }
      @keyframes glow {
        0%, 100% { box-shadow: 0 0 20px rgba(110, 207, 69, 0.3); }
        50% { box-shadow: 0 0 40px rgba(110, 207, 69, 0.6); }
      }
      
      .customize-layout {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 32px;
        color: #fff;
        animation: fadeInUp 0.6s ease-out;
      }
      @media (max-width: 1200px) {
        .customize-layout { grid-template-columns: 1fr; }
        .customize-preview { position: static !important; }
      }
      
      .hero-card {
        position: relative;
        background: linear-gradient(135deg, #6ecf45 0%, #2b7a0b 100%);
        border-radius: 20px;
        padding: 0;
        margin-bottom: 32px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(110, 207, 69, 0.2);
      }
      .hero-bg {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        opacity: 0.3;
      }
      .hero-content {
        position: relative;
        padding: 32px;
        text-align: center;
      }
      .hero-icon {
        font-size: 3rem;
        margin-bottom: 16px;
        animation: pulse 2s infinite;
      }
      .hero-card h2 {
        margin: 0 0 8px 0;
        font-size: 2rem;
        font-weight: 700;
        text-shadow: 0 2px 10px rgba(0,0,0,0.3);
      }
      .hero-subtitle {
        margin: 0 0 24px 0;
        opacity: 0.9;
        font-size: 1.1rem;
      }
      
      .progress-container {
        background: rgba(0,0,0,0.2);
        border-radius: 50px;
        padding: 8px;
        backdrop-filter: blur(10px);
      }
      .progress-bar {
        position: relative;
        background: rgba(255,255,255,0.2);
        border-radius: 50px;
        height: 12px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #fff, #f0f0f0);
        border-radius: 50px;
        transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .progress-glow {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
        border-radius: 50px;
        animation: shimmer 2s infinite;
      }
      .progress-text {
        display: flex;
        justify-content: space-between;
        margin-top: 12px;
        font-size: 0.9rem;
      }
      .progress-percent {
        font-weight: 700;
        font-size: 1.1rem;
      }
      
      .checklist-card {
        background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 32px;
        backdrop-filter: blur(20px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      }
      .checklist-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .checklist-header h3 {
        margin: 0;
        font-size: 1.2rem;
        color: #6ecf45;
      }
      .checklist-badge {
        background: linear-gradient(135deg, #6ecf45, #2b7a0b);
        color: #000;
        padding: 6px 12px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 0.85rem;
      }
      .checklist-items {
        display: grid;
        gap: 12px;
      }
      .checklist-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 16px;
        background: rgba(255,255,255,0.05);
        border-radius: 12px;
        transition: all 0.3s ease;
        animation: fadeInUp 0.5s ease-out;
        position: relative;
        overflow: hidden;
      }
      .checklist-item:hover {
        background: rgba(255,255,255,0.1);
        transform: translateX(8px);
      }
      .checklist-item.completed {
        background: linear-gradient(135deg, rgba(110, 207, 69, 0.2), rgba(110, 207, 69, 0.1));
        border: 1px solid rgba(110, 207, 69, 0.3);
      }
      .checklist-icon {
        font-size: 1.2rem;
        color: #6ecf45;
        transition: all 0.3s ease;
      }
      .checklist-item.completed .checklist-icon {
        animation: pulse 1s ease-out;
      }
      .checklist-text {
        flex: 1;
        transition: all 0.3s ease;
      }
      .checklist-item.completed .checklist-text {
        opacity: 0.8;
        text-decoration: line-through;
      }
      .completion-sparkle {
        position: absolute;
        right: 16px;
        animation: pulse 2s infinite;
      }
      
      .customize-form {
        overflow-y: auto;
        max-height: calc(100vh - 150px);
        padding-right: 16px;
      }
      .customize-form::-webkit-scrollbar { width: 8px; }
      .customize-form::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; }
      .customize-form::-webkit-scrollbar-thumb { background: rgba(110, 207, 69, 0.3); border-radius: 4px; }
      
      .customize-preview {
        position: sticky;
        top: 20px;
        height: fit-content;
      }
      .preview-container {
        background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 20px;
        padding: 24px;
        backdrop-filter: blur(20px);
        box-shadow: 0 20px 60px rgba(0,0,0,0.1);
      }
      .preview-title {
        margin: 0 0 20px 0;
        font-size: 1.3rem;
        font-weight: 700;
        text-align: center;
        color: #6ecf45;
      }
      .preview-frame {
        background: linear-gradient(135deg, #1a1a1a, #0f0f0f);
        border-radius: 16px;
        overflow: hidden;
        border: 2px solid rgba(110, 207, 69, 0.2);
        min-height: 400px;
        box-shadow: inset 0 0 50px rgba(0,0,0,0.5);
        position: relative;
      }
      .preview-frame::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 49%, rgba(110, 207, 69, 0.1) 50%, transparent 51%);
        pointer-events: none;
      }
      .preview-hint {
        margin: 16px 0 0 0;
        font-size: 0.9rem;
        opacity: 0.7;
        text-align: center;
        font-style: italic;
      }
      
      .customize-card {
        background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;
        backdrop-filter: blur(20px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        animation: fadeInUp 0.6s ease-out;
      }
      .customize-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 16px 48px rgba(0,0,0,0.15);
        border-color: rgba(110, 207, 69, 0.3);
      }
      

      
      .card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }
      .card-icon {
        font-size: 1.5rem;
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #6ecf45, #2b7a0b);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(110, 207, 69, 0.3);
      }
      .card-header h3 {
        margin: 0;
        font-size: 1.2rem;
        color: #fff;
        flex: 1;
      }
      .card-badge {
        background: linear-gradient(135deg, #ff6b6b, #ee5a52);
        color: #fff;
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .form-group {
        margin-bottom: 20px;
      }
      .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #e0e0e0;
      }
      .form-group input[type="text"],
      .form-group textarea,
      .form-group select {
        width: 100%;
        padding: 12px 16px;
        background: rgba(255,255,255,0.08);
        border: 2px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        color: #fff;
        font-family: 'Quicksand', sans-serif;
        transition: all 0.3s ease;
        font-size: 0.95rem;
      }
      .form-group input:focus,
      .form-group textarea:focus,
      .form-group select:focus {
        outline: none;
        border-color: #6ecf45;
        background: rgba(255,255,255,0.12);
        box-shadow: 0 0 20px rgba(110, 207, 69, 0.2);
        transform: translateY(-2px);
      }
      
      .upload-zone {
        border: 2px dashed rgba(255,255,255,0.3);
        border-radius: 16px;
        padding: 32px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        background: rgba(255,255,255,0.02);
      }
      .upload-zone:hover {
        border-color: #6ecf45;
        background: rgba(110, 207, 69, 0.1);
        transform: translateY(-4px);
        box-shadow: 0 8px 32px rgba(110, 207, 69, 0.2);
      }
      
      .save-btn-enhanced {
        width: 100%;
        padding: 0;
        margin-top: 32px;
        background: none;
        border: none;
        border-radius: 16px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
      }
      .btn-content {
        position: relative;
        z-index: 2;
        background: linear-gradient(135deg, #6ecf45, #2b7a0b);
        padding: 20px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        font-size: 1.1rem;
        font-weight: 700;
        color: #000;
        transition: all 0.3s ease;
      }
      .btn-glow {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, #6ecf45, #2b7a0b);
        border-radius: 16px;
        opacity: 0;
        transition: all 0.3s ease;
      }
      .save-btn-enhanced:hover {
        transform: translateY(-4px);
        box-shadow: 0 16px 48px rgba(110, 207, 69, 0.4);
      }
      .save-btn-enhanced:hover .btn-glow {
        opacity: 0.3;
        animation: glow 2s infinite;
      }
      .save-btn-enhanced:hover .btn-content {
        background: linear-gradient(135deg, #7dd957, #3a8f0f);
      }
      
      .banner-type-selector {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;
        margin-bottom: 20px;
      }
      .banner-option {
        background: rgba(255,255,255,0.05);
        border: 2px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .banner-option:hover {
        border-color: rgba(110, 207, 69, 0.5);
        transform: translateY(-2px);
      }
      .banner-option.active {
        border-color: #6ecf45;
        background: rgba(110, 207, 69, 0.1);
        box-shadow: 0 0 20px rgba(110, 207, 69, 0.2);
      }
      .option-preview {
        width: 100%;
        height: 40px;
        border-radius: 8px;
        margin-bottom: 8px;
      }
      .banner-option span {
        font-size: 0.85rem;
        font-weight: 600;
        color: #e0e0e0;
      }
      
      .template-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 12px;
      }
      .template-item {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 12px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .template-item:hover {
        border-color: #6ecf45;
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(110, 207, 69, 0.2);
      }
      .template-preview {
        border-radius: 6px;
        margin-bottom: 8px;
        min-height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .template-item span {
        font-size: 0.75rem;
        color: #ccc;
      }
      
      .banner-text-editor {
        background: rgba(255,255,255,0.03);
        border-radius: 12px;
        padding: 20px;
        margin-top: 16px;
      }
      
      .position-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        max-width: 150px;
      }
      .position-btn {
        width: 40px;
        height: 40px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        color: #fff;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1.2rem;
      }
      .position-btn:hover {
        background: rgba(110, 207, 69, 0.2);
        border-color: #6ecf45;
      }
      .position-btn.active {
        background: #6ecf45;
        color: #000;
        border-color: #6ecf45;
      }
      
      .logo-builder {
        background: rgba(255,255,255,0.03);
        border-radius: 12px;
        padding: 20px;
        margin-top: 16px;
      }
      
      .logo-type-selector {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 12px;
        margin-bottom: 20px;
      }
      .logo-option {
        background: rgba(255,255,255,0.05);
        border: 2px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 16px 12px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .logo-option:hover {
        border-color: rgba(110, 207, 69, 0.5);
        transform: translateY(-2px);
      }
      .logo-option.active {
        border-color: #6ecf45;
        background: rgba(110, 207, 69, 0.1);
        box-shadow: 0 0 20px rgba(110, 207, 69, 0.2);
      }
      .logo-preview-mini {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        margin: 0 auto 8px;
      }
      .logo-option span {
        font-size: 0.8rem;
        font-weight: 600;
        color: #e0e0e0;
      }
      
      .logo-preview-container {
        background: rgba(0,0,0,0.3);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
      }
      .logo-preview-large {
        width: 120px;
        height: 120px;
        background: rgba(255,255,255,0.1);
        border: 2px dashed rgba(255,255,255,0.3);
        border-radius: 50%;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        color: #6ecf45;
        transition: all 0.3s ease;
      }
      
      .icon-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 8px;
        max-height: 200px;
        overflow-y: auto;
        padding: 8px;
        background: rgba(0,0,0,0.2);
        border-radius: 8px;
      }
      .icon-item {
        width: 40px;
        height: 40px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1.2rem;
      }
      .icon-item:hover {
        background: rgba(110, 207, 69, 0.2);
        border-color: #6ecf45;
        transform: scale(1.1);
      }
      .icon-item.selected {
        background: #6ecf45;
        color: #000;
        border-color: #6ecf45;
      }
      
      .templates-card {
        border: 2px solid rgba(110, 207, 69, 0.3);
      }
      
      .template-actions {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .template-btn {
        flex: 1;
        padding: 12px 16px;
        background: linear-gradient(135deg, #6ecf45, #2b7a0b);
        color: #000;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      
      .template-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(110, 207, 69, 0.3);
      }
      
      .template-btn.secondary {
        background: rgba(255,255,255,0.1);
        color: #fff;
        border: 1px solid rgba(255,255,255,0.2);
      }
      
      .templates-list {
        max-height: 200px;
        overflow-y: auto;
      }
      
      .template-item {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .template-icon {
        font-size: 1.5rem;
        width: 40px;
        height: 40px;
        background: rgba(110, 207, 69, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      
      .template-info {
        flex: 1;
      }
      
      .template-info h4 {
        margin: 0 0 4px 0;
        color: #6ecf45;
        font-size: 0.9rem;
      }
      
      .template-info p {
        margin: 0;
        color: #888;
        font-size: 0.8rem;
      }
      
      .template-actions-small {
        display: flex;
        gap: 8px;
      }
      
      .template-action-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.2s ease;
      }
      
      .template-action-btn.apply {
        background: #6ecf45;
        color: #000;
      }
      
      .template-action-btn.edit {
        background: #3498db;
        color: #fff;
      }
      
      .template-action-btn.delete {
        background: #e74c3c;
        color: #fff;
      }
      
      .template-action-btn:hover {
        transform: scale(1.05);
      }
      
      .font-selector {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-top: 12px;
      }
      .font-option {
        padding: 8px 12px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 6px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
      }
      .font-option:hover {
        border-color: #6ecf45;
      }
      .font-option.selected {
        background: #6ecf45;
        color: #000;
        border-color: #6ecf45;
      }
    </style>
  `;

  renderBannerControls();
  updatePreview();
  document.getElementById("shopCustomizeForm").onsubmit = saveCustomization;
  
  // Initialize logo builder
  if (!settings.logoType) settings.logoType = 'text';
  renderLogoControls();
  updateLogoPreview();
};

const renderBannerControls = () => {
  const controls = document.getElementById('bannerControls');
  if (!controls) return;

  if (bannerConfig.type === 'color') {
    controls.innerHTML = `<div class="form-group"><label>Background Color</label><input type="color" id="bannerBgColor" value="${bannerConfig.bgColor || '#6ecf45'}" oninput="window.updateBannerPreview()" style="width: 100%; height: 50px;"></div>`;
  } else if (bannerConfig.type === 'gradient') {
    controls.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group"><label>Color 1</label><input type="color" id="bannerColor1" value="${bannerConfig.color1 || '#6ecf45'}" oninput="window.updateBannerPreview()" style="width: 100%; height: 50px;"></div>
        <div class="form-group"><label>Color 2</label><input type="color" id="bannerColor2" value="${bannerConfig.color2 || '#2b7a0b'}" oninput="window.updateBannerPreview()" style="width: 100%; height: 50px;"></div>
      </div>
      <div class="form-group">
        <label>Gradient Direction</label>
        <select id="gradientDirection" onchange="window.updateBannerPreview()">
          <option value="135deg" ${bannerConfig.gradientDirection === '135deg' ? 'selected' : ''}>Diagonal ↘</option>
          <option value="90deg" ${bannerConfig.gradientDirection === '90deg' ? 'selected' : ''}>Horizontal →</option>
          <option value="0deg" ${bannerConfig.gradientDirection === '0deg' ? 'selected' : ''}>Vertical ↓</option>
          <option value="45deg" ${bannerConfig.gradientDirection === '45deg' ? 'selected' : ''}>Diagonal ↗</option>
        </select>
      </div>`;
  } else if (bannerConfig.type === 'pattern') {
    controls.innerHTML = `
      <div class="form-group"><label>Base Color</label><input type="color" id="patternBaseColor" value="${bannerConfig.patternBaseColor || '#6ecf45'}" oninput="window.updateBannerPreview()" style="width: 100%; height: 50px;"></div>
      <div class="form-group">
        <label>Pattern Type</label>
        <select id="patternType" onchange="window.updateBannerPreview()">
          <option value="dots" ${bannerConfig.patternType === 'dots' ? 'selected' : ''}>Dots</option>
          <option value="stripes" ${bannerConfig.patternType === 'stripes' ? 'selected' : ''}>Stripes</option>
          <option value="grid" ${bannerConfig.patternType === 'grid' ? 'selected' : ''}>Grid</option>
          <option value="waves" ${bannerConfig.patternType === 'waves' ? 'selected' : ''}>Waves</option>
        </select>
      </div>`;
  } else {
    controls.innerHTML = `
      <div class="form-group"><label>Background Image</label><input type="file" id="bannerImageFile" accept="image/*" onchange="window.handleBannerImage(event)"></div>
      <div class="form-group">
        <label>Image Position</label>
        <select id="imagePosition" onchange="window.updateBannerPreview()">
          <option value="center" ${bannerConfig.imagePosition === 'center' ? 'selected' : ''}>Center</option>
          <option value="top" ${bannerConfig.imagePosition === 'top' ? 'selected' : ''}>Top</option>
          <option value="bottom" ${bannerConfig.imagePosition === 'bottom' ? 'selected' : ''}>Bottom</option>
          <option value="left" ${bannerConfig.imagePosition === 'left' ? 'selected' : ''}>Left</option>
          <option value="right" ${bannerConfig.imagePosition === 'right' ? 'selected' : ''}>Right</option>
        </select>
      </div>`;
  }
};

window.updateBannerType = (type) => {
  bannerConfig.type = type;
  renderBannerControls();
  updateBannerPreview();
};

window.updateBannerPreview = () => {
  bannerConfig.text = document.getElementById('bannerText')?.value || '';
  bannerConfig.textColor = document.getElementById('bannerTextColor')?.value || '#ffffff';
  bannerConfig.textSize = document.getElementById('bannerTextSize')?.value || 'medium';
  bannerConfig.textStyle = document.getElementById('bannerTextStyle')?.value || 'normal';
  
  if (bannerConfig.type === 'color') {
    bannerConfig.bgColor = document.getElementById('bannerBgColor')?.value || '#6ecf45';
  } else if (bannerConfig.type === 'gradient') {
    bannerConfig.color1 = document.getElementById('bannerColor1')?.value || '#6ecf45';
    bannerConfig.color2 = document.getElementById('bannerColor2')?.value || '#2b7a0b';
    bannerConfig.gradientDirection = document.getElementById('gradientDirection')?.value || '135deg';
  } else if (bannerConfig.type === 'pattern') {
    bannerConfig.patternBaseColor = document.getElementById('patternBaseColor')?.value || '#6ecf45';
    bannerConfig.patternType = document.getElementById('patternType')?.value || 'dots';
  } else if (bannerConfig.type === 'image') {
    bannerConfig.imagePosition = document.getElementById('imagePosition')?.value || 'center';
  }
  updatePreview();
};

window.handleBannerImage = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      bannerConfig.image = event.target.result;
      updatePreview();
    };
    reader.readAsDataURL(file);
  }
};

window.handleLogoUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      settings.shopLogo = event.target.result;
      settings.logoType = 'upload';
      updateLogoPreview();
      updatePreview();
    };
    reader.readAsDataURL(file);
  }
};

window.setLogoType = (type) => {
  settings.logoType = type;
  document.querySelectorAll('.logo-option').forEach(opt => opt.classList.remove('active'));
  event.target.closest('.logo-option').classList.add('active');
  renderLogoControls();
  updateLogoPreview();
};

const renderLogoControls = () => {
  const controls = document.getElementById('logoControls');
  if (!controls) return;
  
  const logoType = settings.logoType || 'text';
  
  if (logoType === 'text') {
    controls.innerHTML = `
      <div class="form-group">
        <label>Logo Text</label>
        <input type="text" id="logoText" value="${escapeHtml(settings.logoText || settings.tagline || 'My Shop')}" placeholder="Enter your shop name" oninput="window.updateLogoPreview()">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label>Text Color</label>
          <input type="color" id="logoTextColor" value="${settings.logoTextColor || '#ffffff'}" oninput="window.updateLogoPreview()">
        </div>
        <div class="form-group">
          <label>Background</label>
          <input type="color" id="logoBackgroundColor" value="${settings.logoBackgroundColor || '#6ecf45'}" oninput="window.updateLogoPreview()">
        </div>
      </div>
      <div class="form-group">
        <label>Font Style</label>
        <div class="font-selector">
          <div class="font-option ${settings.logoFont === 'modern' ? 'selected' : ''}" onclick="window.setLogoFont('modern')" style="font-family: 'Arial', sans-serif; font-weight: bold;">Modern</div>
          <div class="font-option ${settings.logoFont === 'classic' ? 'selected' : ''}" onclick="window.setLogoFont('classic')" style="font-family: 'Times', serif;">Classic</div>
          <div class="font-option ${settings.logoFont === 'playful' ? 'selected' : ''}" onclick="window.setLogoFont('playful')" style="font-family: 'Comic Sans MS', cursive;">Playful</div>
        </div>
      </div>`;
  } else if (logoType === 'icon') {
    controls.innerHTML = `
      <div class="form-group">
        <label>Choose Icon</label>
        <div class="icon-grid">
          ${getLogoIcons().map(icon => `<div class="icon-item ${settings.logoIcon === icon ? 'selected' : ''}" onclick="window.setLogoIcon('${icon}')">${icon}</div>`).join('')}
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label>Icon Color</label>
          <input type="color" id="logoIconColor" value="${settings.logoIconColor || '#ffffff'}" oninput="window.updateLogoPreview()">
        </div>
        <div class="form-group">
          <label>Background</label>
          <input type="color" id="logoBackgroundColor" value="${settings.logoBackgroundColor || '#6ecf45'}" oninput="window.updateLogoPreview()">
        </div>
      </div>`;
  } else if (logoType === 'combo') {
    controls.innerHTML = `
      <div class="form-group">
        <label>Logo Text</label>
        <input type="text" id="logoText" value="${escapeHtml(settings.logoText || settings.tagline || 'My Shop')}" placeholder="Enter your shop name" oninput="window.updateLogoPreview()">
      </div>
      <div class="form-group">
        <label>Choose Icon</label>
        <div class="icon-grid">
          ${getLogoIcons().map(icon => `<div class="icon-item ${settings.logoIcon === icon ? 'selected' : ''}" onclick="window.setLogoIcon('${icon}')">${icon}</div>`).join('')}
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label>Text Color</label>
          <input type="color" id="logoTextColor" value="${settings.logoTextColor || '#ffffff'}" oninput="window.updateLogoPreview()">
        </div>
        <div class="form-group">
          <label>Icon Color</label>
          <input type="color" id="logoIconColor" value="${settings.logoIconColor || '#ffffff'}" oninput="window.updateLogoPreview()">
        </div>
        <div class="form-group">
          <label>Background</label>
          <input type="color" id="logoBackgroundColor" value="${settings.logoBackgroundColor || '#6ecf45'}" oninput="window.updateLogoPreview()">
        </div>
      </div>
      <div class="form-group">
        <label>Layout</label>
        <select id="logoLayout" onchange="window.updateLogoPreview()">
          <option value="horizontal" ${settings.logoLayout === 'horizontal' ? 'selected' : ''}>Icon + Text (Horizontal)</option>
          <option value="vertical" ${settings.logoLayout === 'vertical' ? 'selected' : ''}>Icon + Text (Vertical)</option>
        </select>
      </div>`;
  } else {
    controls.innerHTML = `
      <div class="form-group">
        <label>Upload Logo Image</label>
        <div class="upload-zone" onclick="document.getElementById('shopLogo').click()">
          <input type="file" id="shopLogo" accept="image/*" style="display: none;" onchange="window.handleLogoUpload(event)">
          ${settings.shopLogo ? `<img src="${escapeHtml(settings.shopLogo)}" style="max-width: 80px; border-radius: 8px;">` : '<p>📤 Click to upload logo</p>'}
        </div>
      </div>`;
  }
};

const getLogoIcons = () => {
  return ['🏪', '🛍️', '📱', '👕', '📚', '🎮', '☕', '🍔', '🏀', '🎵', '🎨', '✨', '🔥', '👑', '🌱', '🚀', '❤️', '🌟', '💫', '🌈', '🔍', '📎', '🏆', '💰'];
};

window.setLogoIcon = (icon) => {
  settings.logoIcon = icon;
  document.querySelectorAll('.icon-item').forEach(item => item.classList.remove('selected'));
  event.target.classList.add('selected');
  updateLogoPreview();
};

window.setLogoFont = (font) => {
  settings.logoFont = font;
  document.querySelectorAll('.font-option').forEach(opt => opt.classList.remove('selected'));
  event.target.classList.add('selected');
  updateLogoPreview();
};

window.updateLogoPreview = () => {
  const preview = document.getElementById('logoPreview');
  if (!preview) return;
  
  const logoType = settings.logoType || 'text';
  
  // Update settings from form
  if (document.getElementById('logoText')) settings.logoText = document.getElementById('logoText').value;
  if (document.getElementById('logoTextColor')) settings.logoTextColor = document.getElementById('logoTextColor').value;
  if (document.getElementById('logoIconColor')) settings.logoIconColor = document.getElementById('logoIconColor').value;
  if (document.getElementById('logoBackgroundColor')) settings.logoBackgroundColor = document.getElementById('logoBackgroundColor').value;
  if (document.getElementById('logoLayout')) settings.logoLayout = document.getElementById('logoLayout').value;
  
  const bgColor = settings.logoBackgroundColor || '#6ecf45';
  const textColor = settings.logoTextColor || '#ffffff';
  const iconColor = settings.logoIconColor || '#ffffff';
  const text = settings.logoText || 'My Shop';
  const icon = settings.logoIcon || '🏪';
  const font = settings.logoFont || 'modern';
  const layout = settings.logoLayout || 'horizontal';
  
  const fontStyles = {
    modern: 'font-family: Arial, sans-serif; font-weight: bold;',
    classic: 'font-family: Times, serif; font-weight: normal;',
    playful: 'font-family: Comic Sans MS, cursive; font-weight: bold;'
  };
  
  if (logoType === 'text') {
    preview.innerHTML = `<div style="background: ${escapeHtml(bgColor)}; color: ${escapeHtml(textColor)}; padding: 16px; border-radius: 50%; ${fontStyles[font]} font-size: 1rem; text-align: center; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">${escapeHtml(text.substring(0, 8))}</div>`;
  } else if (logoType === 'icon') {
    preview.innerHTML = `<div style="background: ${escapeHtml(bgColor)}; color: ${escapeHtml(iconColor)}; border-radius: 50%; font-size: 3rem; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">${escapeHtml(icon)}</div>`;
  } else if (logoType === 'combo') {
    if (layout === 'vertical') {
      preview.innerHTML = `<div style="background: ${escapeHtml(bgColor)}; border-radius: 50%; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px;"><div style="color: ${escapeHtml(iconColor)}; font-size: 2rem;">${escapeHtml(icon)}</div><div style="color: ${escapeHtml(textColor)}; font-size: 0.7rem; ${fontStyles[font]} margin-top: 4px;">${escapeHtml(text.substring(0, 6))}</div></div>`;
    } else {
      preview.innerHTML = `<div style="background: ${escapeHtml(bgColor)}; border-radius: 50%; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px;"><div style="color: ${escapeHtml(iconColor)}; font-size: 1.8rem;">${escapeHtml(icon)}</div><div style="color: ${escapeHtml(textColor)}; font-size: 0.8rem; ${fontStyles[font]}">${escapeHtml(text.substring(0, 4))}</div></div>`;
    }
  } else if (logoType === 'upload' && settings.shopLogo) {
    preview.innerHTML = `<img src="${escapeHtml(settings.shopLogo)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
  } else {
    preview.innerHTML = `<div style="color: #666; font-size: 1rem;">🇼️</div>`;
  }
  
  updatePreview();
};

window.applyColorPreset = (primary, accent) => {
  document.getElementById('primaryColor').value = primary;
  document.getElementById('accentColor').value = accent;
  updatePreview();
};

window.applyBannerTemplate = (template) => {
  const templates = {
    sale: { type: 'gradient', color1: '#ff6b6b', color2: '#ee5a52', text: '🔥 MEGA SALE - 50% OFF!', textColor: '#ffffff', textSize: 'large', textStyle: 'bold', textPosition: 'center' },
    new: { type: 'gradient', color1: '#3498db', color2: '#2980b9', text: '✨ NEW ARRIVALS', textColor: '#ffffff', textSize: 'large', textStyle: 'bold', textPosition: 'center' },
    premium: { type: 'gradient', color1: '#f39c12', color2: '#e67e22', text: '👑 PREMIUM COLLECTION', textColor: '#ffffff', textSize: 'medium', textStyle: 'bold', textPosition: 'center' },
    eco: { type: 'gradient', color1: '#27ae60', color2: '#2ecc71', text: '🌱 ECO-FRIENDLY PRODUCTS', textColor: '#ffffff', textSize: 'medium', textStyle: 'bold', textPosition: 'center' }
  };
  
  const selectedTemplate = templates[template];
  if (selectedTemplate) {
    Object.assign(bannerConfig, selectedTemplate);
    renderBannerControls();
    
    // Update form fields
    document.getElementById('bannerText').value = bannerConfig.text;
    document.getElementById('bannerTextColor').value = bannerConfig.textColor;
    document.getElementById('bannerTextSize').value = bannerConfig.textSize;
    document.getElementById('bannerTextStyle').value = bannerConfig.textStyle;
    
    updatePreview();
  }
};

window.setBannerTextPosition = (position) => {
  bannerConfig.textPosition = position;
  document.querySelectorAll('.position-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  updatePreview();
};

window.updatePreview = async () => {
  const preview = document.getElementById('livePreview');
  if (!preview) return;

  const tagline = document.getElementById('tagline')?.value || '';
  const aboutShop = document.getElementById('aboutShop')?.value || '';
  const primaryColor = document.getElementById('primaryColor')?.value || '#6ecf45';
  const businessHours = document.getElementById('businessHours')?.value || '';
  const paymentMethods = document.getElementById('paymentMethods')?.value || '';

  let sellerName = 'Your Shop';
  let productCount = 0;
  let availableCount = 0;
  
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      sellerName = user.name || 'Your Shop';
    }
    const productsRes = await fetch(`${API_BASE}/products`, { headers: { Authorization: `Bearer ${token}` } });
    if (productsRes.ok) {
      const products = await productsRes.json();
      productCount = products.length;
      availableCount = products.filter(p => p.stock > 0).length;
    }
  } catch (err) {}

  let bannerStyle = '';
  let bannerHTML = '';
  
  if (bannerConfig.type === 'color') {
    bannerStyle = `background: ${bannerConfig.bgColor || '#6ecf45'};`;
  } else if (bannerConfig.type === 'gradient') {
    const direction = bannerConfig.gradientDirection || '135deg';
    bannerStyle = `background: linear-gradient(${direction}, ${bannerConfig.color1 || '#6ecf45'}, ${bannerConfig.color2 || '#2b7a0b'});`;
  } else if (bannerConfig.type === 'pattern') {
    const baseColor = bannerConfig.patternBaseColor || '#6ecf45';
    const patternType = bannerConfig.patternType || 'dots';
    const patterns = {
      dots: `background: ${baseColor}; background-image: radial-gradient(circle, rgba(255,255,255,0.3) 2px, transparent 2px); background-size: 20px 20px;`,
      stripes: `background: repeating-linear-gradient(45deg, ${baseColor}, ${baseColor} 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px);`,
      grid: `background: ${baseColor}; background-image: linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px); background-size: 20px 20px;`,
      waves: `background: ${baseColor}; background-image: repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px);`
    };
    bannerStyle = patterns[patternType];
  } else if (bannerConfig.image) {
    const position = bannerConfig.imagePosition || 'center';
    bannerStyle = `background: url('${bannerConfig.image}') ${position}/cover;`;
  }
  
  if (bannerConfig.text || bannerStyle) {
    const textSize = bannerConfig.textSize === 'small' ? '1rem' : bannerConfig.textSize === 'large' ? '1.6rem' : '1.3rem';
    const textStyle = bannerConfig.textStyle === 'bold' ? 'font-weight: 700;' : 
                     bannerConfig.textStyle === 'italic' ? 'font-style: italic;' :
                     bannerConfig.textStyle === 'shadow' ? 'text-shadow: 2px 2px 4px rgba(0,0,0,0.5);' : '';
    
    const position = bannerConfig.textPosition || 'center';
    const alignments = {
      'top-left': 'justify-content: flex-start; align-items: flex-start; text-align: left;',
      'top-center': 'justify-content: center; align-items: flex-start; text-align: center;',
      'top-right': 'justify-content: flex-end; align-items: flex-start; text-align: right;',
      'center-left': 'justify-content: flex-start; align-items: center; text-align: left;',
      'center': 'justify-content: center; align-items: center; text-align: center;',
      'center-right': 'justify-content: flex-end; align-items: center; text-align: right;',
      'bottom-left': 'justify-content: flex-start; align-items: flex-end; text-align: left;',
      'bottom-center': 'justify-content: center; align-items: flex-end; text-align: center;',
      'bottom-right': 'justify-content: flex-end; align-items: flex-end; text-align: right;'
    };
    
    bannerHTML = `<div style="${bannerStyle} padding: 40px 20px; display: flex; ${alignments[position]}"><h2 style="margin: 0; color: ${escapeHtml(bannerConfig.textColor)}; font-size: ${textSize}; ${textStyle}">${escapeHtml(bannerConfig.text || '')}</h2></div>`;
  }

  // Generate logo HTML
  let logoHTML = '';
  const logoType = settings.logoType || 'text';
  const bgColor = settings.logoBackgroundColor || primaryColor;
  const textColor = settings.logoTextColor || '#ffffff';
  const iconColor = settings.logoIconColor || '#ffffff';
  const text = settings.logoText || sellerName;
  const icon = settings.logoIcon || '🏪';
  const font = settings.logoFont || 'modern';
  const layout = settings.logoLayout || 'horizontal';
  
  const fontStyles = {
    modern: 'font-family: Arial, sans-serif; font-weight: bold;',
    classic: 'font-family: Times, serif; font-weight: normal;',
    playful: 'font-family: Comic Sans MS, cursive; font-weight: bold;'
  };
  
  if (logoType === 'text') {
    logoHTML = `<div style="width: 60px; height: 60px; border-radius: 50%; background: ${escapeHtml(bgColor)}; color: ${escapeHtml(textColor)}; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; ${fontStyles[font]} font-size: 0.8rem; border: 3px solid rgba(255,255,255,0.1);">${escapeHtml(text.substring(0, 3))}</div>`;
  } else if (logoType === 'icon') {
    logoHTML = `<div style="width: 60px; height: 60px; border-radius: 50%; background: ${escapeHtml(bgColor)}; color: ${escapeHtml(iconColor)}; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; border: 3px solid rgba(255,255,255,0.1);">${escapeHtml(icon)}</div>`;
  } else if (logoType === 'combo') {
    if (layout === 'vertical') {
      logoHTML = `<div style="width: 60px; height: 60px; border-radius: 50%; background: ${escapeHtml(bgColor)}; margin: 0 auto 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 3px solid rgba(255,255,255,0.1); padding: 4px;"><div style="color: ${escapeHtml(iconColor)}; font-size: 1.2rem;">${escapeHtml(icon)}</div><div style="color: ${escapeHtml(textColor)}; font-size: 0.5rem; ${fontStyles[font]}">${escapeHtml(text.substring(0, 4))}</div></div>`;
    } else {
      logoHTML = `<div style="width: 60px; height: 60px; border-radius: 50%; background: ${escapeHtml(bgColor)}; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; gap: 4px; border: 3px solid rgba(255,255,255,0.1); padding: 4px;"><div style="color: ${escapeHtml(iconColor)}; font-size: 1.2rem;">${escapeHtml(icon)}</div><div style="color: ${escapeHtml(textColor)}; font-size: 0.6rem; ${fontStyles[font]}">${escapeHtml(text.substring(0, 2))}</div></div>`;
    }
  } else if (logoType === 'upload' && settings.shopLogo) {
    logoHTML = `<img src="${escapeHtml(settings.shopLogo)}" style="width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 12px; object-fit: cover; border: 3px solid rgba(255,255,255,0.1);">`;
  } else {
    logoHTML = `<div style="width: 60px; height: 60px; border-radius: 50%; background: ${escapeHtml(primaryColor)}; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border: 3px solid rgba(255,255,255,0.1);">🏪</div>`;
  }
  
  // Simple V1 preview
  preview.innerHTML = `
    ${bannerHTML}
    <div style="padding: 20px; text-align: center; background: rgba(255,255,255,0.05); color: #fff;">
      ${logoHTML}
      <h3 style="margin: 0 0 4px 0; color: #fff; font-size: 1.1rem;">${escapeHtml(sellerName)}</h3>
      ${tagline ? `<p style="margin: 0 0 8px 0; color: #888; font-size: 0.85rem;">${escapeHtml(tagline)}</p>` : ''}
      ${businessHours ? `<p style="margin: 4px 0; color: #888; font-size: 0.8rem;">🕐 ${escapeHtml(businessHours)}</p>` : ''}
      <div style="display: flex; gap: 8px; justify-content: center; margin-top: 12px;">
        <div style="background: ${primaryColor}; color: #000; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">❤️ Like</div>
        <div style="background: rgba(255,255,255,0.1); color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">👤 Follow</div>
      </div>
    </div>
    <div style="padding: 0 20px 20px; background: rgba(255,255,255,0.05); color: #fff;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
        <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 1.2rem; color: ${primaryColor}; font-weight: 700;">${productCount}</div>
          <div style="font-size: 0.7rem; color: #888;">📦 Products</div>
        </div>
        <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 1.2rem; color: ${primaryColor}; font-weight: 700;">${availableCount}</div>
          <div style="font-size: 0.7rem; color: #888;">✅ Available</div>
        </div>
      </div>
      ${aboutShop ? `<div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; border-left: 3px solid ${escapeHtml(primaryColor)};"><div style="font-size: 0.75rem; color: #888; margin-bottom: 4px;">📖 Our Story</div><div style="font-size: 0.8rem; color: #ccc; line-height: 1.4;">${escapeHtml(aboutShop.substring(0, 100))}${aboutShop.length > 100 ? '...' : ''}</div></div>` : ''}
      ${paymentMethods ? `<div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 10px; margin-top: 8px; text-align: center;"><div style="font-size: 0.75rem; color: #888;">💳 ${escapeHtml(paymentMethods)}</div></div>` : ''}
    </div>
  `;
};

const saveCustomization = async (e) => {
  e.preventDefault();
  const formData = new FormData();
  
  // Basic shop info
  formData.append("tagline", document.getElementById("tagline").value);
  formData.append("aboutShop", document.getElementById("aboutShop").value);
  formData.append("primaryColor", document.getElementById("primaryColor").value);
  formData.append("accentColor", document.getElementById("accentColor").value);
  formData.append("businessHours", document.getElementById("businessHours").value);
  formData.append("returnPolicy", document.getElementById("returnPolicy").value);
  formData.append("paymentMethods", document.getElementById("paymentMethods").value);
  
  const socialLinks = {
    instagram: document.getElementById("instagram").value,
    facebook: document.getElementById("facebook").value,
    tiktok: document.getElementById("tiktok").value,
  };
  formData.append("socialLinks", JSON.stringify(socialLinks));
  
  // Handle banner configuration - send bannerConfig if using builder, clear bannerImage
  if (bannerConfig.type && (bannerConfig.text || bannerConfig.bgColor || bannerConfig.color1)) {
    formData.append("bannerConfig", JSON.stringify(bannerConfig));
    formData.append("clearBannerImage", "true"); // Signal to clear uploaded banner
  }
  
  // Handle logo configuration - send logoType and settings if using builder, clear shopLogo
  const logoType = settings.logoType || 'text';
  if (logoType !== 'upload') {
    formData.append("logoType", logoType);
    formData.append("logoText", settings.logoText || '');
    formData.append("logoIcon", settings.logoIcon || '');
    formData.append("logoTextColor", settings.logoTextColor || '');
    formData.append("logoIconColor", settings.logoIconColor || '');
    formData.append("logoBackgroundColor", settings.logoBackgroundColor || '');
    formData.append("logoFont", settings.logoFont || '');
    formData.append("logoLayout", settings.logoLayout || '');
    formData.append("clearShopLogo", "true"); // Signal to clear uploaded logo
  }
  
  // Handle file uploads
  const logoFile = document.getElementById("shopLogo")?.files?.[0];
  if (logoFile) {
    formData.append("shopLogo", logoFile);
    formData.append("logoType", "upload"); // Override logoType for uploads
  }

  try {
    const res = await fetch(`${API_BASE}/shop/settings`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to save");
    settings = await res.json();
    showToast("✅ Shop customization saved successfully!", "success");
    renderCustomizeUI();
  } catch (err) {
    console.error("Save error:", err);
    showToast("❌ Failed to save customization", "error");
  }
};

window.saveAsTemplate = async () => {
  const name = prompt('Template name:');
  if (!name) return;
  
  const description = prompt('Description (optional):') || '';
  const icon = prompt('Icon (emoji):') || '🎨';
  
  try {
    const res = await fetch(`${API_BASE}/shop/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, description, icon })
    });
    
    if (res.ok) {
      showToast('✅ Template saved!', 'success');
      loadTemplates();
    } else {
      throw new Error('Failed to save');
    }
  } catch (err) {
    showToast('❌ Failed to save template', 'error');
  }
};

window.loadTemplates = async () => {
  const list = document.getElementById('templatesList');
  
  try {
    const res = await fetch(`${API_BASE}/shop/templates`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const templates = await res.json();
      
      if (templates.length === 0) {
        list.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No templates saved</p>';
      } else {
        list.innerHTML = templates.map(t => `
          <div class="template-item">
            <div class="template-icon">${escapeHtml(t.icon || '🎨')}</div>
            <div class="template-info">
              <h4>${escapeHtml(t.name)}</h4>
              ${t.description ? `<p>${escapeHtml(t.description)}</p>` : ''}
              <small style="color: #666;">${new Date(t.createdAt).toLocaleDateString()}</small>
            </div>
            <div class="template-actions-small">
              <button class="template-action-btn apply" onclick="window.applyTemplate(${t.id})">
                <i class="fas fa-check"></i> Apply
              </button>
              <button class="template-action-btn edit" onclick="window.editTemplate(${t.id})">
                <i class="fas fa-edit"></i>
              </button>
              <button class="template-action-btn delete" onclick="window.deleteTemplate(${t.id})">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `).join('');
      }
      
      list.style.display = 'block';
    }
  } catch (err) {
    showToast('❌ Failed to load templates', 'error');
  }
};

window.applyTemplate = async (templateId) => {
  if (!confirm('Apply this template? Current changes will be overwritten.')) return;
  
  try {
    const res = await fetch(`${API_BASE}/shop/templates/${templateId}/apply`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      showToast('✅ Template applied!', 'success');
      await loadSettings();
      renderCustomizeUI();
    } else {
      throw new Error('Failed to apply');
    }
  } catch (err) {
    showToast('❌ Failed to apply template', 'error');
  }
};

window.editTemplate = async (templateId) => {
  try {
    const res = await fetch(`${API_BASE}/shop/templates/${templateId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const template = await res.json();
      settings = template.settings || {};
      bannerConfig = settings.bannerConfig || { type: 'color', bgColor: '#6ecf45', text: '', textColor: '#ffffff', image: null };
      renderCustomizeUI();
      showToast('✅ Template loaded for editing', 'success');
      document.getElementById('templatesList').style.display = 'none';
    } else {
      throw new Error('Failed to load');
    }
  } catch (err) {
    showToast('❌ Failed to load template', 'error');
  }
};

window.deleteTemplate = async (templateId) => {
  if (!confirm('Delete this template permanently?')) return;
  
  try {
    const res = await fetch(`${API_BASE}/shop/templates/${templateId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      showToast('✅ Template deleted', 'success');
      loadTemplates();
    } else {
      throw new Error('Failed to delete');
    }
  } catch (err) {
    showToast('❌ Failed to delete template', 'error');
  }
};

export { initShopCustomize, renderCustomizeUI };
