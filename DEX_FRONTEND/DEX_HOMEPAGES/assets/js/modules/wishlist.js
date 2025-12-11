// assets/js/modules/wishlist.js

import config from '../config.js';

// =====================================================
// GLOBAL WISHLIST STATE
// =====================================================
export let wishlistCache = new Set();

export function updateWishlistCount() {
  const badge = document.getElementById("wishlistCount");
  if (!badge) return;
  const count = wishlistCache.size;
  badge.textContent = count > 99 ? "99+" : count;
  badge.style.display = count ? "grid" : "none";
}

// =====================================================
// GET TOKEN SAFELY
// =====================================================
function getToken() {
  try {
    const user = JSON.parse(
      localStorage.getItem("currentUser") ||
        sessionStorage.getItem("currentUser") ||
        "null"
    );
    return user?.token || user?.accessToken || "";
  } catch {
    return "";
  }
}

// =====================================================
// LOAD WISHLIST FROM BACKEND — FULL SYNC
// =====================================================
export async function loadWishlistFromBackend() {
  const user = JSON.parse(
    localStorage.getItem("currentUser") ||
      sessionStorage.getItem("currentUser") ||
      "null"
  );
  if (!user || user.role !== "buyer") return;

  try {
    const res = await fetch(`${config.API_BASE_URL}/api/wishlist`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      signal: AbortSignal.timeout(config.REQUEST_TIMEOUT)
    });

    if (res.ok) {
      const data = await res.json();
      const ids = data
        .map((item) => item.product?.id || item.productId) // ← handles both formats
        .filter(Boolean);

      wishlistCache = new Set(ids); // ← FULL REPLACE, no merge
      updateWishlistCount();

      // BETTER — only update heart icons, don't re-render whole grid
      document.querySelectorAll(".wishlist-btn").forEach((btn) => {
        const id = Number(
          btn.closest(".product-card")?.dataset.id ||
            btn.onclick.toString().match(/\d+/)?.[0]
        );
        if (id && wishlistCache.has(id)) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    }
  } catch (err) {
    console.warn("Failed to sync wishlist from server");
  }
}

// =====================================================
// CHECK IF WISHLISTED
// =====================================================
export function isWishlisted(productId) {
  return wishlistCache.has(Number(productId));
}

// =====================================================
// TOGGLE WISHLIST — FINAL, BULLETPROOF VERSION
// =====================================================
export async function toggleWishlist(productId, e) {
  e.stopPropagation();
  const btn = e.target.closest(".wishlist-btn");
  if (!btn) return;

  const id = Number(productId);
  const isCurrentlyActive = btn.classList.contains("active");
  const shouldBeActive = !isCurrentlyActive;

  // Optimistic UI: show intended state immediately
  if (shouldBeActive) {
    btn.classList.add("active");
  } else {
    btn.classList.remove("active");
  }

  try {
    if (shouldBeActive) {
      // Trying to ADD
      const response = await fetch(`${config.API_BASE_URL}/api/wishlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ productId: id }),
        signal: AbortSignal.timeout(config.REQUEST_TIMEOUT)
      });

      if (response.ok) {
        wishlistCache.add(id);
        // Refresh notifications immediately
        setTimeout(() => {
          if (window.fetchNotifications) {
            window.fetchNotifications();
            console.log('🔔 Triggered notification refresh after wishlist');
          }
        }, 500);
      } else {
        const error = await response.json();
        if (error.message === "Already in wishlist") {
          // Already exists → just sync cache (this is NOT an error)
          wishlistCache.add(id);
        } else {
          throw new Error(error.message || "Failed to add");
        }
      }
    } else {
      // Trying to REMOVE
      const response = await fetch(`${config.API_BASE_URL}/api/wishlist/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
        signal: AbortSignal.timeout(config.REQUEST_TIMEOUT)
      });

      if (response.ok || response.status === 404) {
        wishlistCache.delete(id);
      } else {
        throw new Error("Failed to remove from wishlist");
      }
    }

    updateWishlistCount();
  } catch (err) {
    console.error("Wishlist sync failed:", err);
    // Revert UI to actual state
    btn.classList.toggle("active");
    alert("Sync failed. Try again.");
  }
}
