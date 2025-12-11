// assets/js/main-seller.js
// MAIN ENTRY POINT — Seller Dashboard (REBUILT)

import { initUI, updateProfile } from "./modules/seller-ui.js";
import { initProducts } from "./modules/seller-products.js";
import { initProfile } from "./modules/seller-profile.js";
import { initGallery } from "./modules/seller-gallery.js";
import {
  initNotifications,
  closeNotificationSidebar,
} from "./modules/seller-notifications.js";
import { initOrders } from "./modules/seller-orders.js";
import { initHostelBookings } from "./modules/seller-hostelBookings.js";
import { initShopCustomize } from "./modules/seller-shop-customize.js";
import { lazyLoadImages } from "./modules/performance-cache.js";
import { SellerGuide } from "./modules/seller-guide.js";

document.addEventListener("DOMContentLoaded", async () => {
  const $ = (id) => document.getElementById(id);

  // ========================
  // LOAD USER FROM STORAGE
  // ========================
  const loadUser = () => {
    try {
      const raw = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
      if (!raw) return null;
      const user = JSON.parse(raw);
      
      // Normalize category
      if (user.productCategory) {
        user.productCategory = user.productCategory.charAt(0).toUpperCase() + user.productCategory.slice(1).toLowerCase();
      }
      return user;
    } catch {
      return null;
    }
  };

  const user = loadUser();
  
  console.log("🔥 DASHBOARD LOAD:", {
    id: user?.id,
    name: user?.name,
    category: user?.productCategory
  });

  // Validate user
  if (!user || user.role !== "seller" || !user.productCategory) {
    document.body.innerHTML = `
      <div style="position:fixed;inset:0;background:#111;color:#fff;display:grid;place-items:center;font-family:'Quicksand',sans-serif;text-align:center;z-index:9999;">
        <div>
          <i class="fas fa-spinner fa-spin" style="font-size:48px;color:#6ecf45;margin-bottom:20px;"></i>
          <h2>Access Denied</h2>
          <p>Please sign in with a valid seller account.</p>
        </div>
      </div>`;
    setTimeout(() => {
      window.location.replace("../REGISTRY_PAGES/seller_sign_in.html");
    }, 1500);
    return;
  }

  const token = user.token;
  if (!token) {
    alert("Session expired. Please log in again.");
    window.location.replace("../REGISTRY_PAGES/seller_sign_in.html");
    return;
  }

  // ========================
  // OPTIMIZED PARALLEL LOAD: Only critical data
  // ========================
  let profileData = null;
  try {
    const [profileRes, notifRes] = await Promise.all([
      fetch("http://localhost:5000/api/seller/profile", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("http://localhost:5000/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
    ]);
    
    if (!profileRes.ok) {
      console.error("❌ User validation failed");
      localStorage.clear();
      sessionStorage.clear();
      alert("Your account no longer exists. Please contact support.");
      window.location.replace("../REGISTRY_PAGES/seller_sign_in.html");
      return;
    }
    
    profileData = await profileRes.json();
    window._cachedNotifications = notifRes.ok ? await notifRes.json() : [];
  } catch (err) {
    console.error("❌ Load error:", err);
  }

  // ========================
  // LOCK USER DATA
  // ========================
  const LOCKED_USER = Object.freeze({ ...user });
  const LOCKED_ID = user.id;
  const LOCKED_CATEGORY = user.productCategory;
  
  console.log("🔒 LOCKED:", { id: LOCKED_ID, category: LOCKED_CATEGORY });
  
  // Set global state
  window.currentSeller = { ...LOCKED_USER };
  window.authToken = token;
  
  // 🔥 IRONCLAD PROTECTION: Block ALL unauthorized writes
  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalSessionSetItem = sessionStorage.setItem.bind(sessionStorage);
  
  const protectStorage = (storage, originalFn) => {
    return function(key, value) {
      if (key === 'currentUser') {
        try {
          const newUser = JSON.parse(value);
          if (newUser.id !== LOCKED_ID) {
            console.error("❌ BLOCKED: Wrong user ID", newUser.id, "!=", LOCKED_ID);
            return;
          }
          // Force correct category
          newUser.productCategory = LOCKED_CATEGORY;
          value = JSON.stringify(newUser);
        } catch (e) {}
      }
      return originalFn.call(storage, key, value);
    };
  };
  
  localStorage.setItem = protectStorage(localStorage, originalSetItem);
  sessionStorage.setItem = protectStorage(sessionStorage, originalSessionSetItem);
  
  // Global helpers
  window.getUser = () => ({ ...LOCKED_USER });
  window.setUser = (newUser) => {
    if (!newUser || newUser.id !== LOCKED_ID) {
      console.error("❌ BLOCKED setUser: Invalid user");
      return;
    }
    // Only allow profile pic updates
    const updated = { ...LOCKED_USER, profilePic: newUser.profilePic };
    try {
      const storage = localStorage.getItem("currentUser") ? localStorage : sessionStorage;
      storage.setItem("currentUser", JSON.stringify(updated));
    } catch {}
    window.currentSeller = updated;
  };

  // ========================
  // DOM ELEMENTS — Shared
  // ========================
  window.elements = {
    notificationBtn: $("notificationBtn"),
    notificationSidebar: $("notificationSidebar"),
    notificationOverlay: $("notificationOverlay"),
    notificationList: $("notificationList"),
    notificationBadge: $("notificationBadge"),
    clearAllBtn: $("clearAllBtn"),
    emptyState: $("emptyState"),

    sidebar: $("sidebar"),
    hamburger: $("hamburger"),
    mobileMenu: $("mobileMenu"),
    globalOverlay: $("globalOverlay"),

    profilePic: $("profilePic"),
    headerAvatar: $("headerAvatar"),
    fullName: $("fullName"),
    storeName: $("storeName"),
    email: $("email"),
    phone: $("phone"),
    editProfileBtn: $("editProfileBtn"),
    editDropdown: $("editDropdown"),
    saveEditBtn: $("saveEditBtn"),
    cancelEditBtn: $("cancelEditBtn"),
    picInput: $("picInput"),

    addProductBtn: $("addProductBtn"),
    productModal: $("productModal"),
    modalTitle: $("modalTitle"),
    modalFormContainer: $("modalFormContainer"),
    imageUpload: $("imageUpload"),
    imagePreview: $("imagePreview"),
    saveProductBtn: $("saveProductBtn"),
    saveText: $("saveText"),
    savingText: $("savingText"),

    productsGrid: $("productsGrid"),
    loader: $("loader"),

    logoutBtn: $("logoutBtn"),
    closeModalBtn: $("closeModalBtn"),
    cancelProductBtn: $("cancelProductBtn"),

    newOrdersContainer: $("newOrdersContainer"),
    ordersContainer: $("ordersContainer"),
    trashContainer: $("trashContainer"),

    openGalleryBtn: $("openGalleryBtn"),
    galleryOverlay: $("galleryOverlay"),
    closeGalleryBtn: $("closeGalleryBtn"),
    dialogGalleryGrid: $("dialogGalleryGrid"),

    welcomeBanner: $("welcomeBanner"),
    whatsappFloat: $("whatsappFloat"),
    whatsappBtn: $("whatsappBtn"),

    bookingsTab: $("bookingsTab"),
    mobileBookingsTab: $("mobileBookingsTab"),
  };

  // Helper: Update profile UI
  const updateProfileUI = (data) => {
    const el = window.elements;
    el.fullName.textContent = data.name || data.fullName || "Seller";
    el.storeName.textContent = data.storeName || "My Store";
    el.email.textContent = data.email || "";
    el.phone.textContent = data.phone || "";
    if (data.profilePic) {
      el.profilePic.src = data.profilePic;
      el.headerAvatar.src = data.profilePic;
    }
    
    if (profileData) {
      checkVerificationStatus(profileData);
    } else {
      checkVerificationStatus(data);
    }
  };
  
  // Helper: Check verification status and show banner
  const checkVerificationStatus = (data) => {
    const banner = document.getElementById('verificationBanner');
    const fullContent = document.getElementById('fullBannerContent');
    const miniContent = document.getElementById('miniBannerContent');
    
    if (!banner || !fullContent || !miniContent) return;
    
    const isMinimized = localStorage.getItem('verificationBannerMinimized');
    const shouldShow = !data.campusVerified;
    
    if (shouldShow) {
      banner.style.display = 'block';
      if (isMinimized) {
        // Show minimized version
        banner.style.padding = '12px 20px';
        fullContent.style.display = 'none';
        miniContent.style.display = 'flex';
      } else {
        // Show full version
        banner.style.padding = '20px';
        fullContent.style.display = 'flex';
        miniContent.style.display = 'none';
      }
    } else {
      banner.style.display = 'none';
    }
  };
  
  // Global function to minimize banner
  window.dismissVerificationBanner = () => {
    const banner = document.getElementById('verificationBanner');
    const fullContent = document.getElementById('fullBannerContent');
    const miniContent = document.getElementById('miniBannerContent');
    
    if (banner && fullContent && miniContent) {
      // Minimize banner
      banner.style.padding = '12px 20px';
      fullContent.style.display = 'none';
      miniContent.style.display = 'flex';
      localStorage.setItem('verificationBannerMinimized', 'true');
    }
  };
  
  // Global function to expand banner
  window.expandVerificationBanner = () => {
    const banner = document.getElementById('verificationBanner');
    const fullContent = document.getElementById('fullBannerContent');
    const miniContent = document.getElementById('miniBannerContent');
    
    if (banner && fullContent && miniContent) {
      // Expand banner
      banner.style.padding = '20px';
      fullContent.style.display = 'flex';
      miniContent.style.display = 'none';
      localStorage.removeItem('verificationBannerMinimized');
    }
  };
  
  // Safety prompts for different sections
  const safetyPrompts = {
    profile: {
      text: "Keep your personal information secure",
      subtext: "Only share necessary details. Never include your full address or financial info in your profile."
    },
    products: {
      text: "Safe product listings build trust",
      subtext: "Use clear photos, honest descriptions, and suggest meeting in public campus areas."
    },
    orders: {
      text: "Meet buyers safely on campus",
      subtext: "Always meet in well-lit public areas. Verify buyer identity before handing over items."
    },
    'hostel-bookings': {
      text: "Verify guest identity for safety",
      subtext: "Request student ID verification and emergency contact before confirming bookings."
    },
    'customize-shop': {
      text: "Professional shops attract serious buyers",
      subtext: "Clear policies and contact methods help buyers trust your business."
    },
    settings: {
      text: "Protect your account security",
      subtext: "Use a strong password and never share your login details with anyone."
    }
  };
  
  // Show contextual safety prompt
  const showSafetyPrompt = (section) => {
    const prompt = document.getElementById('contextualSafetyPrompt');
    const textEl = document.getElementById('safetyPromptText');
    const subtextEl = document.getElementById('safetyPromptSubtext');
    
    if (!prompt || !textEl || !subtextEl) return;
    
    const safetyData = safetyPrompts[section];
    if (!safetyData) return;
    
    const dismissedKey = `safetyPrompt_${section}_dismissed`;
    if (localStorage.getItem(dismissedKey)) return;
    
    textEl.textContent = safetyData.text;
    subtextEl.textContent = safetyData.subtext;
    prompt.style.display = 'block';
    prompt.dataset.section = section;
  };
  
  // Dismiss safety prompt
  window.dismissSafetyPrompt = () => {
    const prompt = document.getElementById('contextualSafetyPrompt');
    if (!prompt) return;
    
    const section = prompt.dataset.section;
    if (section) {
      localStorage.setItem(`safetyPrompt_${section}_dismissed`, 'true');
    }
    prompt.style.display = 'none';
  };
  
  // Simple safety interceptors
  window.safetyCheck = {
    // Check for unsafe content in text
    validateText: (text) => {
      const unsafe = /\b(phone|whatsapp|call me|my number|contact me at)\b/i;
      return !unsafe.test(text);
    },
    
    // Show safety reminder before key actions
    showReminder: (action) => {
      const reminders = {
        'add-product': '💡 Remember: Meet buyers in public campus areas',
        'accept-order': '🛡️ Verify buyer identity before meeting',
        'edit-profile': '🔒 Keep personal details private'
      };
      
      if (reminders[action]) {
        showToast(reminders[action], 'info');
      }
    }
  };

  window.updateProfile = updateProfileUI;

  // Helper: Toast (replace with your real toast system later)
  const showToast = (message, type = "info") => {
    // Simple fallback toast
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      background: ${
        type === "success" ? "#28a745" : type === "error" ? "#dc3545" : "#333"
      };
      color: white; padding: 12px 24px; border-radius: 8px; z-index: 10000;
      font-family: 'Quicksand', sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  elements.notificationOverlay.onclick = closeNotificationSidebar;

  // ========================
  // INIT ALL MODULES
  // ========================
  (async () => {
    try {
      initUI();
      updateProfile(LOCKED_USER);
      await new Promise(resolve => setTimeout(resolve, 50));

      initProfile();

      initGallery({
        elements: window.elements,
        user: LOCKED_USER,
        token,
        API_BASE: "http://localhost:5000/api",
        DEFAULT_PIC: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E",
        getUser: window.getUser,
        setUser: window.setUser,
        updateProfile: updateProfileUI,
        showToast,
      });

      initNotifications({
        elements: window.elements,
        token,
        API_BASE: "http://localhost:5000/api",
        showToast,
      });

      initProducts({
        elements: window.elements,
        user: LOCKED_USER,
        token,
        API_BASE: "http://localhost:5000/api",
        notificationSystem: window.notificationSystem,
        showToast,
      });

      initOrders({
        elements: window.elements,
        token,
        API_BASE: "http://localhost:5000/api",
        notificationSystem: window.notificationSystem,
        showToast,
      });
      
      const chatScript = document.createElement('script');
      chatScript.src = 'assets/js/order-chat.js';
      document.head.appendChild(chatScript);

      if (LOCKED_CATEGORY.toLowerCase().includes("hostel")) {
        initHostelBookings({
          user: LOCKED_USER,
          token,
          API_BASE: "http://localhost:5000/api",
          elements: window.elements,
          notificationSystem: window.notificationSystem,
          showToast
        });
      }

      // Lazy load heavy modules
      const lazyModules = {
        'customize-shop': false,
        'analytics': false,
        'bulk-actions': false,
        'search': false,
        'settings': false,
        'help': false,
        'hostel-payments': false
      };

      // Tab observer for lazy loading and safety prompts
      const observer = new MutationObserver(() => {
        document.querySelectorAll('.section.active').forEach(section => {
          const id = section.id;
          
          // Show contextual safety prompt for current section
          showSafetyPrompt(id);
          
          if (lazyModules.hasOwnProperty(id) && !lazyModules[id]) {
            lazyModules[id] = true;
            switch(id) {
              case 'customize-shop':
                import('./modules/seller-shop-customize.js').then(m => 
                  m.initShopCustomize({ token, API_BASE: "http://localhost:5000/api", showToast })
                );
                break;
              case 'analytics':
                import('./modules/seller-analytics.js').then(m => 
                  m.initAnalytics({ token, API_BASE: "http://localhost:5000/api", showToast })
                );
                break;
              case 'bulk-actions':
                import('./modules/seller-bulk-actions.js').then(m => m.initBulkActions());
                break;
              case 'search':
                import('./modules/seller-search.js').then(m => m.initSearch());
                break;
              case 'settings':
                import('./modules/seller-settings.js').then(m => m.initSettings());
                break;
              case 'help':
                import('./modules/seller-help.js').then(m => m.initHelp());
                break;
              case 'hostel-payments':
                if (LOCKED_CATEGORY.toLowerCase().includes("hostel")) {
                  import('./modules/hostel-payments.js').then(m => m.initHostelPayments());
                }
                break;
            }
          }
        });
      });
      
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
      
      // Safety reminders on key actions
      document.addEventListener('click', (e) => {
        const target = e.target;
        if (target.id === 'addProductBtn') {
          window.safetyCheck.showReminder('add-product');
        } else if (target.id === 'editProfileBtn') {
          window.safetyCheck.showReminder('edit-profile');
        } else if (target.classList.contains('accept-order-btn')) {
          window.safetyCheck.showReminder('accept-order');
        }
      });
      
      // Lazy load images
      setInterval(() => lazyLoadImages(), 1000);

      // Initialize Guide System
      window.sellerGuide = new SellerGuide();
      
      // Show initial safety prompt for profile section
      showSafetyPrompt('profile');

      console.log("✅ Dashboard loaded:", LOCKED_USER.name, "|", LOCKED_CATEGORY);
      console.log("⚡ Performance mode: Lazy loading enabled");
      console.log("📚 Guide system initialized");
      console.log("🛡️ Safety prompts activated");
    } catch (err) {
      console.error("Failed to initialize dashboard:", err);
      showToast("Something went wrong. Please refresh.", "error");
    }
  })();
});
