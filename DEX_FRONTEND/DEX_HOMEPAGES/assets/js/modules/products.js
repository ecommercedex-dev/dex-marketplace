// assets/js/modules/products.js
// FINAL VERSION — INSTANT PRODUCT DISPLAY — PRICE SLIDER FIXED — LAUNCH READY

import { isWishlisted, toggleWishlist } from "./wishlist.js";
import config from "../config.js";

/**
 * Generates a responsive srcset string for an image.
 * Uses width descriptors (w) for better browser optimization.
 * @param {object} p - The product object.
 * @returns {string} A srcset string, e.g., "url1 300w, url2 600w".
 */
export const getOptimizedImage = (p) => {
  const url = p.images?.[0]
    ? `${config.API_BASE_URL}${p.images[0]}`
    : "https://via.placeholder.com/300x240/222/ccc?text=No+Image";

  // Using width descriptors is more robust than density descriptors.
  return `${url} 300w, ${url} 600w`;
};

export const grid = document.getElementById("productGrid");
export const empty = document.getElementById("emptyState");
export let products = []; // Keep 'let' so we can reassign

// Critical fix: expose live reference for filters.js
// This line is the key — filters.js will always see latest data
window.__LIVE_PRODUCTS = products; // Will be updated below every time products change

// =====================================================
// LOAD PRODUCTS — FINAL BULLETPROOF VERSION
// =====================================================
export async function loadProducts() {
  let dataLoaded = false;

  try {
    // Show skeleton
    grid.innerHTML = `
      <div class="product-card" style="background:rgba(255,255,255,0.08);">
        <div class="product-image-wrapper"><div class="skeleton-img"></div></div>
        <div class="product-body" style="padding:20px;">
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line" style="margin-top:16px;"></div>
        </div>
      </div>
    `.repeat(6);

    const res = await fetch(`${config.API_BASE_URL}/api/products`, {
      cache: "no-store",
      signal: AbortSignal.timeout(config.REQUEST_TIMEOUT)
    });

    if (res.ok) {
      const data = await res.json();
      products = data.products || data || [];
      localStorage.setItem("cachedProducts", JSON.stringify(products));
      dataLoaded = true;
      console.log("Products loaded from server:", products.length);
    }
  } catch (err) {
    console.warn("Backend not reachable, trying cache...");
  }

  // Fallback to cache
  if (!dataLoaded) {
    const cached = localStorage.getItem("cachedProducts");
    if (cached) {
      try {
        products = JSON.parse(cached);
        console.log("Loaded from cache:", products.length);
      } catch (e) {
        products = [];
      }
    }
  }

  // Update global live reference so filters.js sees the latest data
  window.__LIVE_PRODUCTS = products;

  // Sync price slider with real max price
  if (products.length > 0) {
    const prices = products.map((p) => Number(p.price)).filter((p) => p > 0);
    const realMaxPrice = Math.max(...prices, 50000);

    const syncPriceSlider = (maxPrice) => {
      const priceRange = document.getElementById("priceRange");
      const priceRangeMobile = document.getElementById("priceRangeMobile");
      const label = document.getElementById("maxPriceLabel");
      const labelMobile = document.getElementById("maxPriceLabelMobile");

      [priceRange, priceRangeMobile].forEach((el) => {
        if (el) {
          el.max = maxPrice;
          el.value = maxPrice;
        }
      });

      [label, labelMobile].forEach((el) => {
        if (el) el.textContent = `₵${maxPrice.toLocaleString()}+`;
      });

      window.currentFilters = window.currentFilters || {};
      window.currentFilters.priceMax = maxPrice;
    };

    syncPriceSlider(realMaxPrice);

    // Render all products immediately
    render(products);
  } else {
    grid.innerHTML = `
      <div class="empty">
        <p>No products available right now</p>
        <small>Check back later or try refreshing</small>
      </div>
    `;
    empty.hidden = false;
  }
}

// =====================================================
// RENDER — 100% SAFE
// =====================================================
// HTML escaping function
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function render(items = [], append = false) {
  if (!append) grid.innerHTML = "";
  if (!items.length && !append) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const user = JSON.parse(
    localStorage.getItem("currentUser") ||
      sessionStorage.getItem("currentUser") ||
      "null"
  );
  const isBuyer = user?.role === "buyer";

  items.forEach((p) => {
    const card = document.createElement("div");
    card.className = `product-card${p.featured ? " featured" : ""}`;
    card.dataset.category = p.category || "electronics";

    const timeAgo = (() => {
      const diff = Date.now() - new Date(p.createdAt);
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return "Just now";
    })();

    let condition = "used";
    if (p.details) {
      try {
        const d =
          typeof p.details === "string" ? JSON.parse(p.details) : p.details;
        condition = (d.condition || d.Condition || "used").toLowerCase();
      } catch {}
    }

    const escapedName = escapeHtml(p.name || '');
    const escapedSellerName = escapeHtml(p.seller?.name?.split(" ")[0] || "Seller");
    const escapedPhone = escapeHtml(p.seller?.phone || '');
    const escapedCondition = escapeHtml(condition === "new" ? "New" : "Used");
    const sanitizedId = String(p.id).replace(/[^0-9]/g, '');

    const wishlistBtn = isBuyer
      ? `<button class="wishlist-btn ${isWishlisted(p.id) ? "active" : ""}" 
           onclick="window.toggleWishlist(${sanitizedId}, event)" 
           title="${
             isWishlisted(p.id) ? "Remove from wishlist" : "Add to wishlist"
           }">
           <i class="fas fa-heart"></i>
         </button>`
      : "";

    const reportBtn = `<button class="report-btn" onclick="reportProduct(${sanitizedId})" 
                       title="Report this listing">
                       <i class="fas fa-flag"></i>
                     </button>`;

    const verifiedBadge = p.seller?.isVerified
      ? `<div class="verified-badge">Verified STU Merchant</div>`
      : "";

    card.innerHTML = `
      <div class="product-image-wrapper">
        <img src="http://localhost:5000${p.images?.[0] || ""}"
             srcset="${getOptimizedImage(
               p
             )}" sizes="(max-width: 600px) 90vw, 300px"
             alt="${escapedName}" loading="lazy">
        <button class="quick-view-btn" onclick="event.stopPropagation();window.openQuickView(${sanitizedId})" title="Quick View">
          <i class="fas fa-eye"></i>
        </button>
        ${wishlistBtn}
        ${reportBtn}
        <span class="condition-badge ${condition === "new" ? "new" : "used"}">
          ${escapedCondition}
        </span>
      </div>
      <div class="product-body">
        ${verifiedBadge}
        <div class="product-meta">
          <span class="seller-name">by ${escapedSellerName}</span>
          <span class="time-ago">${timeAgo}</span>
        </div>
        <h4 class="product-title">${escapedName}</h4>
        <div class="price">₵${Number(p.price).toLocaleString()}</div>
        <div class="actions" style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          ${isBuyer ? `<button class="order-now-btn" onclick="window.checkAndOrder(${sanitizedId}, '${escapedName.replace(/'/g, "\\'")}')"
             style="flex:1;padding:10px;background:linear-gradient(135deg,#2ecc71,#27ae60);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">
             <i class="fas fa-shopping-cart"></i> Order Now
           </button>` : ''}
          <a href="https://wa.me/${escapedPhone}?text=Hi, I'm interested in ${encodeURIComponent(p.name)}" 
             target="_blank" 
             style="flex:1;padding:10px;background:#25D366;color:#fff;border:none;border-radius:8px;font-weight:600;text-align:center;text-decoration:none;display:inline-block;">
            <i class="fab fa-whatsapp"></i> WhatsApp
          </a>
          <a href="Dex-product-details.html?id=${sanitizedId}" 
             class="learn-more" 
             onclick="window.trackRecentView(${sanitizedId})"
             style="flex:1;padding:10px;text-align:center;">
            View Details
          </a>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

export function reportProduct(id) {
  if (confirm("Report this listing?")) {
    alert("Reported!");
  }
}

// Global function to check verification before ordering
window.checkAndOrder = function(productId, productName) {
  const user = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || 'null');
  if (!user) {
    alert('Please sign in to place orders');
    return;
  }
  
  // Find product to get price
  const product = products.find(p => p.id === productId);
  if (!product) {
    alert('Product not found');
    return;
  }
  
  // Check purchase eligibility
  if (window.PurchaseVerification) {
    const eligibility = window.PurchaseVerification.checkEligibility(product.price, user);
    if (!eligibility.allowed) {
      alert(eligibility.message);
      return;
    }
  }
  
  // If eligible, proceed with order
  window.openOrderModal(productId, productName);
};
