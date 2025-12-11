// Product Details Page - Dex™ Campus Marketplace
// Trust-focused, modern UI with comprehensive features

import config from './assets/js/config.js';
const baseUrl = config.API_BASE_URL;
const productId = new URLSearchParams(location.search).get('id');

// Safety Tips with Real Scam Situations
const SAFETY_TIPS = [
  {
    title: '🚨 Fake Payment Screenshot Scam',
    text: 'A student showed a fake mobile money screenshot claiming payment was sent. Always verify payment in your account before handing over items. Never trust screenshots alone.'
  },
  {
    title: '⚠️ Meet in Public Places',
    text: 'Always meet in well-lit, public campus locations like the library entrance or cafeteria. Avoid isolated areas, dorm rooms, or off-campus locations for your safety.'
  },
  {
    title: '🔍 Inspect Before Paying',
    text: 'A buyer received a laptop with missing parts after paying without inspection. Always thoroughly check items before payment. Test electronics, check for damages, and verify authenticity.'
  },
  {
    title: '💳 Use Secure Payment Methods',
    text: 'Avoid large cash transactions. Use mobile money, bank transfers, or campus-approved payment methods. Keep transaction receipts and screenshots as proof of payment.'
  },
  {
    title: '📧 Verify Seller Identity',
    text: 'Someone impersonated a student using a fake profile. Always verify the seller is a real student through their campus email or student ID before meeting.'
  },
  {
    title: '🎯 Too Good to Be True Prices',
    text: 'A brand new iPhone sold for half price turned out to be stolen. If the price seems unrealistic, it probably is. Research market prices before buying.'
  },
  {
    title: '👥 Bring a Friend',
    text: 'Never meet alone, especially for high-value items. Bring a trusted friend along. There is safety in numbers and witnesses deter scammers.'
  },
  {
    title: '📱 Keep Communication on Platform',
    text: 'Scammers often move conversations off-platform to avoid detection. Keep all communication on Dex for your protection and to report suspicious behavior.'
  }
];

// DOM Elements
const loading = document.getElementById('loading');
const productLayout = document.getElementById('product-layout');
const breadcrumbCategory = document.getElementById('breadcrumb-category');
const breadcrumbProduct = document.getElementById('breadcrumb-product');

// Get Auth Token
const getToken = () => {
  try {
    const stored = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    if (!stored) return '';
    const user = JSON.parse(stored);
    return user?.token || '';
  } catch (e) {
    console.warn('Corrupted user data', e);
    return '';
  }
};

const token = getToken();
let currentUser = null;
let productData = null;
let currentImageIndex = 0;

// Initialize
(async function init() {
  if (!token) {
    loading.innerHTML = '<p>Please <a href="REGISTRY_PAGES/Sign_in.html" style="color: var(--green-light);">sign in</a> to view products</p>';
    return;
  }

  try {
    const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    currentUser = userStr ? JSON.parse(userStr) : null;
    await loadProduct();
  } catch (err) {
    loading.innerHTML = '<p>Failed to load product ❌</p>';
  }
})();

// Load Product
async function loadProduct() {
  try {
    const res = await fetch(`${baseUrl}/api/products/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(config.REQUEST_TIMEOUT)
    });
    
    if (!res.ok) throw new Error('Product not found');
    
    productData = await res.json();
    document.title = `${productData.name} • Dex™`;
    
    renderProduct();
    setupEventListeners();
    loadReviews();
    loadRelatedProducts();
    setupSafetyTips();
    
    loading.style.display = 'none';
    productLayout.style.display = 'grid';
    document.getElementById('safety-tips').style.display = 'block';
  } catch (err) {
    loading.innerHTML = '<p>Product not found ❌</p>';
  }
}

// Render Product
function renderProduct() {
  const p = productData;
  const isBuyer = currentUser?.role === 'buyer';
  const isThisSeller = currentUser?.role === 'seller' && p.sellerId && 
    String(p.sellerId) === String(currentUser.id);

  // Breadcrumb
  breadcrumbCategory.textContent = p.category || 'Uncategorized';
  breadcrumbProduct.textContent = p.name;

  // Gallery
  renderGallery(p.images);
  renderBadges(p);

  // Product Info
  document.getElementById('product-name').textContent = p.name;
  document.getElementById('category-tag').textContent = p.category || 'Uncategorized';
  document.getElementById('product-price').textContent = `₵${Number(p.price).toLocaleString()}`;
  document.getElementById('mobile-price').textContent = `₵${Number(p.price).toLocaleString()}`;
  document.getElementById('product-description').textContent = p.description || 'No description available.';

  // Specs
  if (p.details) {
    document.getElementById('specs-grid').innerHTML = renderSpecs(p.details);
  }

  // Seller Card
  renderSellerCard(p.seller, isThisSeller);

  // Action Buttons
  setupActionButtons(p, isBuyer);

  // Review Form
  if (isBuyer) {
    document.getElementById('review-form').style.display = 'block';
    setupReviewForm();
  } else if (currentUser?.role === 'seller') {
    document.getElementById('review-form').innerHTML = '<p style="text-align: center; color: #aaa; padding: 2rem; background: rgba(255,255,255,0.05); border-radius: 12px;"><i class="fas fa-info-circle"></i> Only buyers can review products</p>';
    document.getElementById('review-form').style.display = 'block';
  }
}

// Render Gallery
function renderGallery(images) {
  const mainImage = document.getElementById('main-image');
  const thumbnailContainer = document.getElementById('thumbnail-container');
  const imageCounter = document.getElementById('image-counter');

  mainImage.src = `${baseUrl}${images[0]}`;
  imageCounter.textContent = `1 / ${images.length}`;

  thumbnailContainer.innerHTML = images.map((img, i) => `
    <img src="${baseUrl}${img}" alt="Thumbnail ${i + 1}" 
         class="thumbnail ${i === 0 ? 'active' : ''}" 
         data-index="${i}" />
  `).join('');

  // Thumbnail click
  thumbnailContainer.querySelectorAll('.thumbnail').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const index = parseInt(thumb.dataset.index);
      currentImageIndex = index;
      mainImage.src = thumb.src;
      imageCounter.textContent = `${index + 1} / ${images.length}`;
      
      thumbnailContainer.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
}

// Render Badges
function renderBadges(product) {
  const badgesContainer = document.getElementById('gallery-badges');
  const badges = [];

  // Check if product is new (created within last 7 days)
  const createdDate = new Date(product.createdAt);
  const daysSinceCreated = (Date.now() - createdDate) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated <= 7) {
    badges.push('<span class="badge badge-new">New</span>');
  }

  // Low stock badge (if quantity available)
  if (product.quantity && product.quantity <= 5) {
    badges.push('<span class="badge badge-low-stock">Low Stock</span>');
  }

  // Verified seller badge
  if (product.seller?.verified) {
    badges.push('<span class="badge badge-verified">Verified</span>');
  }

  badgesContainer.innerHTML = badges.join('');
}

// Render Specs
function renderSpecs(details) {
  const sanitizeText = (text) => {
    return String(text || '').replace(/[<>"'&]/g, (match) => {
      const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
      return entities[match];
    });
  };
  
  return Object.entries(details).map(([key, value]) => {
    if (!value) return '';
    
    const sanitizedKey = sanitizeText(key);
    const sanitizedValue = sanitizeText(value);
    const label = sanitizedKey.charAt(0).toUpperCase() + sanitizedKey.slice(1).replace(/([A-Z])/g, ' $1');

    if (key.toLowerCase() === 'color') {
      // Validate color value to prevent CSS injection - only allow safe hex colors and basic color names
      const safeColor = /^#[0-9A-Fa-f]{6}$|^(red|blue|green|yellow|black|white|gray|grey|purple|orange|pink|brown)$/i.test(value) ? sanitizeText(value) : '#cccccc';
      return `
        <div class="spec-item">
          <div class="spec-label">${label}</div>
          <div class="spec-value" style="display: flex; align-items: center; gap: 10px;">
            <span style="width: 32px; height: 32px; border-radius: 50%; background: ${safeColor}; border: 3px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.4);"></span>
            ${sanitizedValue.toUpperCase()}
          </div>
        </div>
      `;
    } else if (key.toLowerCase() === 'condition') {
      // Validate condition value and use safe background colors
      const isNew = sanitizedValue.toLowerCase().includes('new') || sanitizedValue.toLowerCase().includes('brand');
      const bg = isNew ? '#6ecf45' : '#f1c40f';
      return `
        <div class="spec-item">
          <div class="spec-label">${label}</div>
          <div class="spec-value">
            <span style="background: ${bg}; color: #000; padding: 8px 18px; border-radius: 50px; font-weight: bold;">
              ${sanitizedValue}
            </span>
          </div>
        </div>
      `;
    }

    return `
      <div class="spec-item">
        <div class="spec-label">${label}</div>
        <div class="spec-value">${sanitizedValue}</div>
      </div>
    `;
  }).join('');
}

// Render Seller Card
async function renderSellerCard(seller, isThisSeller) {
  if (!seller) return;

  const sellerName = seller.name || 'Seller';
  const sellerId = seller._id || seller.id;
  const sellerPic = seller.profilePic 
    ? `${baseUrl}${seller.profilePic}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName)}&background=333&color=fff&bold=true`;

  // Get seller product count
  let productCount = 0;
  try {
    const res = await fetch(`${baseUrl}/api/products?sellerId=${sellerId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(config.REQUEST_TIMEOUT)
    });
    if (res.ok) {
      const data = await res.json();
      productCount = (Array.isArray(data) ? data : data.products || []).length;
    }
  } catch (e) {}

  // If it's your own product, go to dashboard. Otherwise, go to their shop
  const shopLink = isThisSeller ? 'PROFILE_PAGES/Sellers_page.html' : `sellerShop.html?sellerId=${sellerId}`;
  const shopButtonText = isThisSeller ? 'My Dashboard' : 'Visit Shop';

  const sanitizeText = (text) => {
    return String(text || '').replace(/[<>"'&]/g, (match) => {
      const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
      return entities[match];
    });
  };
  
  const sanitizeUrl = (url) => {
    // Only allow safe characters in URLs
    return String(url || '').replace(/[^a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]/g, '');
  };
  
  const sanitizedSellerName = sanitizeText(sellerName);
  const sanitizedSellerId = String(sellerId).replace(/[^0-9a-zA-Z]/g, '');
  const sanitizedSellerPic = sanitizeUrl(sellerPic);
  const sanitizedShopLink = sanitizeUrl(shopLink);
  const sanitizedShopButtonText = sanitizeText(shopButtonText);
  const sanitizedPhone = sanitizeText(seller.phone || 'Not available');
  const sanitizedEmail = sanitizeText(seller.email || 'Not available');
  
  document.getElementById('seller-card').innerHTML = `
    <div class="seller-header">
      <img src="${sanitizedSellerPic}" alt="${sanitizedSellerName}" class="seller-avatar" 
           onclick="window.location.href='sellerProfile.html?id=${sanitizedSellerId}'" />
      <div class="seller-info-text">
        <h3 onclick="window.location.href='sellerProfile.html?id=${sanitizedSellerId}'">
          ${sanitizedSellerName} ${isThisSeller ? '(You)' : ''}
        </h3>
        <div class="seller-badges">
          ${seller.verified ? '<span class="seller-badge" style="background: var(--green-light); color: #000;">✓ Verified</span>' : ''}
          <span class="seller-badge">⚡ Fast Response</span>
        </div>
      </div>
    </div>

    <div class="seller-stats">
      <div class="stat-item">
        <div class="stat-value">${productCount}</div>
        <div class="stat-label">Products</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">4.8</div>
        <div class="stat-label">Rating</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">98%</div>
        <div class="stat-label">Response</div>
      </div>
    </div>

    <div class="seller-actions">
      <button class="btn btn-primary" onclick="window.location.href='${sanitizedShopLink}'" style="flex: 1;">
        <i class="fas fa-store"></i> ${sanitizedShopButtonText}
      </button>
    </div>

    <div style="margin-top: 16px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 12px; font-size: 0.9rem; color: #ddd;">
      <div style="margin-bottom: 8px;"><i class="fas fa-phone" style="color: var(--green-light); margin-right: 8px;"></i>${sanitizedPhone}</div>
      <div><i class="fas fa-envelope" style="color: var(--green-light); margin-right: 8px;"></i>${sanitizedEmail}</div>
    </div>
  `;
}

// Setup Action Buttons
function setupActionButtons(product, isBuyer) {
  const placeOrderBtn = document.getElementById('place-order-btn');
  const wishlistBtn = document.getElementById('wishlist-btn');

  if (isBuyer) {
    placeOrderBtn.onclick = () => openOrderModal(product);
    setupWishlist(wishlistBtn);
  } else {
    placeOrderBtn.disabled = true;
    placeOrderBtn.style.opacity = '0.5';
    placeOrderBtn.title = 'Orders (Buyers only)';
    wishlistBtn.disabled = true;
    wishlistBtn.style.opacity = '0.5';
    wishlistBtn.title = 'Wishlist (Buyers only)';
  }
}

// Open Order Modal
function openOrderModal(product) {
  // Check purchase eligibility first
  if (window.PurchaseVerification && currentUser) {
    const eligibility = window.PurchaseVerification.checkEligibility(product.price, currentUser);
    if (!eligibility.allowed) {
      alert(eligibility.message);
      return;
    }
  }
  
  const modal = document.getElementById('order-modal');
  const overlay = document.querySelector('.overlay');
  const quantityInput = document.getElementById('order-quantity');
  const addressInput = document.getElementById('order-address');
  
  // Pre-fill address from user profile
  if (currentUser?.address) {
    addressInput.value = currentUser.address;
  }
  
  // Update price display
  updateOrderSummary(product);
  
  // Quantity change handler
  quantityInput.oninput = () => updateOrderSummary(product);
  
  modal.classList.add('active');
  overlay.classList.add('active');
  
  // Close on overlay click
  overlay.onclick = () => {
    modal.classList.remove('active');
    overlay.classList.remove('active');
  };
}

// Update Order Summary
function updateOrderSummary(product) {
  const quantity = parseInt(document.getElementById('order-quantity').value) || 1;
  const unitPrice = Number(product.price);
  const total = unitPrice * quantity;
  
  document.getElementById('order-unit-price').textContent = `₵${unitPrice.toLocaleString()}`;
  document.getElementById('order-qty-display').textContent = quantity;
  document.getElementById('order-total-price').textContent = `₵${total.toLocaleString()}`;
}

// Confirm Order
document.getElementById('confirm-order-btn')?.addEventListener('click', async () => {
  const quantity = parseInt(document.getElementById('order-quantity').value);
  const address = document.getElementById('order-address').value.trim();
  
  if (!address) {
    alert('Please enter your delivery address');
    return;
  }
  
  if (quantity < 1) {
    alert('Quantity must be at least 1');
    return;
  }
  
  const btn = document.getElementById('confirm-order-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';
  
  try {
    const res = await fetch(`${baseUrl}/api/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        productId: Number(productId),
        quantity,
        address
      })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      // Close order modal
      document.getElementById('order-modal').classList.remove('active');
      
      // Show success modal with seller contact
      showOrderSuccess(productData.seller);
    } else if (data.outOfStock) {
      // Handle out of stock specifically
      alert('❌ This item is currently out of stock. The seller has been notified.');
      // Close modal
      document.getElementById('order-modal').classList.remove('active');
      document.querySelector('.overlay').classList.remove('active');
    } else {
      console.error('Order error:', data);
      alert(data.error || data.message || 'Failed to place order');
    }
  } catch (err) {
    alert('Network error. Please try again.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check"></i> Confirm Order';
  }
});

// Show Order Success Modal
function showOrderSuccess(seller) {
  const modal = document.getElementById('order-success-modal');
  const overlay = document.querySelector('.overlay');
  
  // Hide contact buttons - contact will be available after seller accepts
  const whatsappLink = document.getElementById('seller-whatsapp-link');
  const phoneLink = document.getElementById('seller-phone-link');
  
  if (whatsappLink) whatsappLink.style.display = 'none';
  if (phoneLink) phoneLink.style.display = 'none';
  
  // Update modal message with comprehensive instructions
  const modalMessage = modal.querySelector('.success-message');
  if (modalMessage) {
    modalMessage.innerHTML = `
      <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--green-light); margin-bottom: 1rem;"></i>
      <h2>Order Placed Successfully! 🎉</h2>
      
      <div style="text-align: left; margin: 2rem 0;">
        <h3 style="color: var(--green-light); margin-bottom: 1rem; font-size: 1.1rem;"><i class="fas fa-list-check"></i> What Happens Next?</h3>
        
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="padding: 1rem; background: rgba(243,156,18,0.1); border-radius: 12px; border-left: 4px solid #f39c12;">
            <div style="font-weight: 600; color: #f39c12; margin-bottom: 0.5rem;">1️⃣ Pending Seller Acceptance</div>
            <p style="margin: 0; color: #ddd; font-size: 0.9rem;">Your order is currently <strong>pending</strong>. The seller will review and accept it soon.</p>
          </div>
          
          <div style="padding: 1rem; background: rgba(110,207,69,0.1); border-radius: 12px; border-left: 4px solid var(--green-light);">
            <div style="font-weight: 600; color: var(--green-light); margin-bottom: 0.5rem;">2️⃣ Message the Seller</div>
            <p style="margin: 0; color: #ddd; font-size: 0.9rem;">You can message the seller right now! Go to <strong>My Orders</strong> and click the 💬 <strong>Message</strong> button to ask questions or confirm details.</p>
          </div>
          
          <div style="padding: 1rem; background: rgba(52,152,219,0.1); border-radius: 12px; border-left: 4px solid #3498db;">
            <div style="font-weight: 600; color: #3498db; margin-bottom: 0.5rem;">3️⃣ Get Notified</div>
            <p style="margin: 0; color: #ddd; font-size: 0.9rem;">You'll receive a notification when the seller accepts your order. Seller contact info will be available after acceptance.</p>
          </div>
          
          <div style="padding: 1rem; background: rgba(155,89,182,0.1); border-radius: 12px; border-left: 4px solid #9b59b6;">
            <div style="font-weight: 600; color: #9b59b6; margin-bottom: 0.5rem;">4️⃣ Arrange Meetup</div>
            <p style="margin: 0; color: #ddd; font-size: 0.9rem;">Once accepted, contact the seller via WhatsApp or phone to arrange a safe meetup location on campus.</p>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 1.5rem; padding: 1.5rem; background: rgba(231,76,60,0.1); border-radius: 12px; border: 2px solid rgba(231,76,60,0.3);">
        <div style="font-weight: 600; color: #e74c3c; margin-bottom: 0.75rem; font-size: 1rem;"><i class="fas fa-shield-alt"></i> Safety Reminder</div>
        <ul style="margin: 0; padding-left: 1.5rem; color: #ddd; font-size: 0.9rem; line-height: 1.6;">
          <li>Meet in public campus locations (library, cafeteria)</li>
          <li>Inspect the item before payment</li>
          <li>Verify payment before handing over items</li>
          <li>Never share passwords or OTPs</li>
        </ul>
      </div>
      
      <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
        <a href="PROFILE_PAGES/Buyer_profile.html" class="btn" style="background: var(--green-light); color: #000; padding: 1rem 2rem; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem;">
          <i class="fas fa-shopping-bag"></i> Go to My Orders
        </a>
      </div>
    `;
  }
  
  modal.classList.add('active');
  overlay.classList.add('active');
}

// Setup Wishlist
async function setupWishlist(btn) {
  async function checkStatus() {
    try {
      const res = await fetch(`${baseUrl}/api/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(config.REQUEST_TIMEOUT)
      });
      if (!res.ok) return;
      const wishlist = await res.json();
      const isWishlisted = wishlist.some(item => item.product?.id === Number(productId));
      
      btn.classList.toggle('active', isWishlisted);
      btn.innerHTML = isWishlisted 
        ? '<i class="fas fa-heart"></i>'
        : '<i class="far fa-heart"></i>';
    } catch (err) {
      console.error(err);
    }
  }

  btn.addEventListener('click', async () => {
    const isActive = btn.classList.contains('active');
    try {
      const res = await fetch(`${baseUrl}/api/wishlist${isActive ? `/${productId}` : ''}`, {
        method: isActive ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: isActive ? null : JSON.stringify({ productId: Number(productId) }),
        signal: AbortSignal.timeout(config.REQUEST_TIMEOUT)
      });

      const data = await res.json();
      if (res.ok || data.message?.includes('Already')) {
        btn.classList.toggle('active');
        btn.innerHTML = btn.classList.contains('active')
          ? '<i class="fas fa-heart"></i>'
          : '<i class="far fa-heart"></i>';
        
        alert(btn.classList.contains('active') ? 'Added to wishlist ❤️' : 'Removed from wishlist');
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (err) {
      alert('Network error. Try again later.');
    }
  });

  checkStatus();
}

// Setup Review Form
function setupReviewForm() {
  let selectedRating = 5;
  const stars = document.querySelectorAll('#star-rating .star');
  const submitBtn = document.getElementById('submit-review');
  const reviewText = document.getElementById('review-text');

  const updateStars = () => {
    stars.forEach((s, i) => {
      s.textContent = i < selectedRating ? '★' : '☆';
      s.classList.toggle('active', i < selectedRating);
    });
  };

  stars.forEach((star, i) => {
    star.addEventListener('click', () => {
      selectedRating = i + 1;
      updateStars();
    });
  });

  updateStars();

  submitBtn.addEventListener('click', async () => {
    const text = reviewText.value.trim();
    if (!text || text.length < 10) {
      alert('Review must be at least 10 characters 📝');
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: Number(productId),
          comment: text,
          rating: selectedRating
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        alert('Thank you! Review submitted ⭐');
        reviewText.value = '';
        selectedRating = 5;
        updateStars();
        loadReviews();
      } else {
        console.error('Review error:', data);
        alert(data.message || 'Failed to submit review');
      }
    } catch (err) {
      alert('Network error 🌐');
    }
  });
}

// Load Reviews
async function loadReviews() {
  const reviewsList = document.getElementById('reviews-list');
  const ratingBreakdown = document.getElementById('rating-breakdown');
  const reviewForm = document.getElementById('review-form');

  try {
    const res = await fetch(`${baseUrl}/api/reviews/product/${productId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error();
    const reviews = await res.json();
    
    // Check if current user already reviewed
    if (currentUser?.role === 'buyer') {
      const hasReviewed = reviews.some(r => 
        r.buyer?.id === currentUser.id || 
        r.buyer?._id === currentUser.id ||
        r.buyerId === currentUser.id
      );
      
      if (hasReviewed) {
        reviewForm.innerHTML = '<p style="text-align: center; color: #6ecf45; padding: 2rem; background: rgba(110,207,69,0.1); border-radius: 12px;"><i class="fas fa-check-circle"></i> You already reviewed this product</p>';
        reviewForm.style.display = 'block';
      }
    }

    if (!reviews || reviews.length === 0) {
      reviewsList.innerHTML = '<p style="text-align: center; color: #aaa; padding: 3rem;">No reviews yet. Be the first! ⭐</p>';
      return;
    }

    // Calculate rating breakdown
    const ratingCounts = [0, 0, 0, 0, 0];
    let totalRating = 0;
    reviews.forEach(r => {
      ratingCounts[r.rating - 1]++;
      totalRating += r.rating;
    });

    const avgRating = (totalRating / reviews.length).toFixed(1);
    
    // Show rating breakdown
    ratingBreakdown.style.display = 'flex';
    document.getElementById('avg-rating').textContent = avgRating;
    document.getElementById('avg-stars').textContent = '★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating));
    document.getElementById('total-reviews').textContent = `${reviews.length} review${reviews.length > 1 ? 's' : ''}`;

    // Rating bars
    document.getElementById('rating-bars').innerHTML = [5, 4, 3, 2, 1].map(star => {
      const count = ratingCounts[star - 1];
      const percentage = (count / reviews.length * 100).toFixed(0);
      return `
        <div class="rating-bar-item">
          <span>${star} ★</span>
          <div class="rating-bar-bg">
            <div class="rating-bar-fill" style="width: ${percentage}%;"></div>
          </div>
          <span style="width: 40px; text-align: right;">${count}</span>
        </div>
      `;
    }).join('');

    // Render reviews
    reviewsList.innerHTML = reviews
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(r => {
        const buyer = r.buyer || { name: 'Anonymous' };
        const avatar = buyer.profilePic && buyer.profilePic.trim()
          ? `${baseUrl}${buyer.profilePic}`
          : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

        return `
          <div class="review-item">
            <div class="review-header">
              <img src="${avatar}" alt="${buyer.name}" class="review-avatar" />
              <div class="review-author-info">
                <div class="review-author">${buyer.name}</div>
                <div class="review-date">${new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
              <div class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
            </div>
            <div class="review-text">${r.comment || 'No comment'}</div>
          </div>
        `;
      }).join('');

    // Update rating summary
    document.getElementById('rating-summary').innerHTML = `
      <span class="stars">${'★'.repeat(Math.round(avgRating))}${'☆'.repeat(5 - Math.round(avgRating))}</span>
      <span>(${reviews.length} review${reviews.length > 1 ? 's' : ''})</span>
    `;

  } catch (err) {
    reviewsList.innerHTML = '<p style="text-align: center; color: #aaa;">Failed to load reviews</p>';
  }
}

// Load Related Products with Smart Hybrid Algorithm
async function loadRelatedProducts() {
  try {
    const res = await fetch(`${baseUrl}/api/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return;
    const data = await res.json();
    let allProducts = (Array.isArray(data) ? data : data.products || [])
      .filter(p => p.id !== Number(productId) && p.category === productData.category);

    if (allProducts.length === 0) return;

    // Smart scoring algorithm
    const scored = allProducts.map(p => {
      let score = 0;
      const priceDiff = Math.abs(p.price - productData.price) / productData.price;
      
      // Subcategory match (40 points) - if exists
      if (p.subCategory && productData.subCategory && p.subCategory === productData.subCategory) score += 40;
      
      // Price similarity (30 points) - within ±30%
      if (priceDiff <= 0.3) score += 30 * (1 - priceDiff);
      
      // Same seller (20 points)
      if (p.sellerId === productData.sellerId) score += 20;
      
      // Recency bonus (10 points) - products from last 30 days
      const daysSince = (Date.now() - new Date(p.createdAt)) / (1000 * 60 * 60 * 24);
      if (daysSince <= 30) score += 10 * (1 - daysSince / 30);
      
      // In stock bonus (15 points)
      if (p.stock > 0) score += 15;
      
      return { ...p, score };
    });

    // Sort by score and get top products
    let recommended = scored.sort((a, b) => b.score - a.score);
    
    // Ensure at least 2 from same seller if available
    const sameSeller = recommended.filter(p => p.sellerId === productData.sellerId).slice(0, 2);
    const others = recommended.filter(p => p.sellerId !== productData.sellerId);
    
    // Mix: 2 from same seller + 4-6 others
    recommended = [...sameSeller, ...others].slice(0, 8);

    if (recommended.length === 0) {
      document.getElementById('related-products').style.display = 'none';
      return;
    }

    document.getElementById('related-products').style.display = 'block';
    document.getElementById('related-grid').innerHTML = recommended.map(p => {
      const priceDiff = p.price - productData.price;
      const badge = p.sellerId === productData.sellerId ? '<span class="rec-badge same-seller">Same Seller</span>' :
                    Math.abs(priceDiff) / productData.price <= 0.1 ? '<span class="rec-badge similar-price">Similar Price</span>' :
                    priceDiff < 0 ? `<span class="rec-badge cheaper">₵${Math.abs(priceDiff).toFixed(0)} Cheaper</span>` : '';
      
      return `
        <div class="product-card" onclick="window.location.href='Dex-product-details.html?id=${p.id}'">
          ${badge}
          <img src="${baseUrl}${p.images[0]}" alt="${p.name}" class="product-card-img" />
          <div class="product-card-info">
            <div class="product-card-name">${p.name}</div>
            <div class="product-card-price">₵${Number(p.price).toLocaleString()}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load related products', err);
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
    });
  });

  // Lightbox
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');

  fullscreenBtn.addEventListener('click', () => {
    lightbox.classList.add('active');
    lightboxImg.src = document.getElementById('main-image').src;
  });

  lightboxClose.addEventListener('click', () => lightbox.classList.remove('active'));
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.classList.remove('active');
  });

  lightboxPrev.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex - 1 + productData.images.length) % productData.images.length;
    lightboxImg.src = `${baseUrl}${productData.images[currentImageIndex]}`;
  });

  lightboxNext.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex + 1) % productData.images.length;
    lightboxImg.src = `${baseUrl}${productData.images[currentImageIndex]}`;
  });

  // Share Modal
  const shareModal = document.getElementById('share-modal');
  const shareBtn = document.getElementById('share-btn');
  const shareLink = document.getElementById('share-link');

  shareBtn.addEventListener('click', () => {
    shareModal.classList.add('active');
    shareLink.value = window.location.href;
  });

  shareModal.addEventListener('click', (e) => {
    if (e.target === shareModal) shareModal.classList.remove('active');
  });

  document.querySelectorAll('.share-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const platform = btn.dataset.platform;
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`Check out ${productData.name} on Dex™`);

      if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${text} ${url}`, '_blank');
      } else if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
      } else if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
      } else if (platform === 'copy') {
        shareLink.select();
        document.execCommand('copy');
        alert('Link copied to clipboard! 📋');
      }
    });
  });
}

// Helper Functions
function getCategoryEmoji(category) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('fashion')) return '👗';
  if (cat.includes('electro')) return '📱';
  if (cat.includes('hostel')) return '🛏️';
  return '📦';
}

function getSpecEmoji(key) {
  const k = key.toLowerCase();
  if (k.includes('storage')) return '💾';
  if (k.includes('ram')) return '🧠';
  if (k.includes('battery')) return '🔋';
  if (k.includes('processor')) return '⚙️';
  if (k.includes('camera')) return '📸';
  if (k.includes('screen')) return '🖥️';
  if (k.includes('condition')) return '✨';
  if (k.includes('color')) return '🎨';
  return '📌';
}

// Setup Safety Tips Slideshow
function setupSafetyTips() {
  const safetySection = document.getElementById('safety-tips');
  if (!safetySection) return;
  
  let currentTip = 0;
  
  const slideshowHTML = `
    <h3><i class="fas fa-shield-alt"></i> Safety Tips & Scam Awareness</h3>
    <div class="tip-slideshow">
      ${SAFETY_TIPS.map((tip, i) => `
        <div class="tip-slide ${i === 0 ? 'active' : ''}">
          <div class="tip-content">
            <div class="tip-title">${tip.title}</div>
            <div class="tip-text">${tip.text}</div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="tip-nav">
      <button class="tip-btn" id="tip-prev"><i class="fas fa-chevron-left"></i></button>
      <div class="tip-dots">
        ${SAFETY_TIPS.map((_, i) => `<span class="tip-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
      </div>
      <button class="tip-btn" id="tip-next"><i class="fas fa-chevron-right"></i></button>
    </div>
  `;
  
  safetySection.innerHTML = slideshowHTML;
  
  const slides = safetySection.querySelectorAll('.tip-slide');
  const dots = safetySection.querySelectorAll('.tip-dot');
  
  function showTip(index) {
    currentTip = (index + SAFETY_TIPS.length) % SAFETY_TIPS.length;
    
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === currentTip);
    });
    
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentTip);
    });
  }
  
  document.getElementById('tip-prev').addEventListener('click', () => showTip(currentTip - 1));
  document.getElementById('tip-next').addEventListener('click', () => showTip(currentTip + 1));
  
  dots.forEach(dot => {
    dot.addEventListener('click', () => showTip(parseInt(dot.dataset.index)));
  });
  
  // Auto-advance every 8 seconds
  setInterval(() => showTip(currentTip + 1), 8000);
}
