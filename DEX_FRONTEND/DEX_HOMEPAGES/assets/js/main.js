// assets/js/main.js
// → FINAL VERSION — 100% WORKING — DO NOT CHANGE

import { cyclePreloadImages, initHero } from "./modules/hero.js";
import "./modules/header.js";
import "./modules/filters.js";
import "./modules/notifications.js";
import "./modules/safety-tips.js";
import "./modules/search.js";
import { initSort, initOrderModal, setProducts } from "./modules/sort-order.js";
import { initEnhancements, updateStats, updateActiveFilters, showSkeletons, addToRecentlyViewed, loadRecentlyViewed } from "./modules/shop-enhancements.js";

import { loadProducts, render as renderProducts } from "./modules/products.js";
import {
  loadWishlistFromBackend,
  toggleWishlist,
  isWishlisted,
} from "./modules/wishlist.js";

// REQUIRED FOR INLINE ONCLICK + HEART SYNC + FILTERS
window.toggleWishlist = toggleWishlist;
window.isWishlisted = isWishlisted;
window.renderProducts = renderProducts;

// REQUIRED FOR PRODUCTS TO SHOW AFTER loadProducts()
import { applyFilters } from "./modules/filters.js";
window.applyFilters = applyFilters;

console.log("Dex™ Shop v1 – All modules loaded");

// Offline detection
const offlineBanner = document.getElementById("offline-banner");

function updateOnlineStatus() {
  if (!navigator.onLine) {
    offlineBanner?.classList.add("show");
  } else {
    offlineBanner?.classList.remove("show");
  }
}

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

window.addEventListener("load", async () => {
  cyclePreloadImages();
  initHero();
  updateOnlineStatus();
  initSort();
  initOrderModal();
  initEnhancements();

  // Show skeletons while loading
  showSkeletons(6);

  await loadProducts(); // → loads + renders + calls applyFilters()
  await loadWishlistFromBackend(); // → syncs hearts + calls renderProducts()
  
  // Set products for sorting
  if (window.__LIVE_PRODUCTS) {
    setProducts(window.__LIVE_PRODUCTS);
    updateStats(window.__LIVE_PRODUCTS);
  }
  
  // Update active filters on filter change
  window.addEventListener('filterChange', updateActiveFilters);
  
  // Track recently viewed
  window.trackRecentView = async (productId) => {
    await addToRecentlyViewed(productId);
    await loadRecentlyViewed();
  };
});
