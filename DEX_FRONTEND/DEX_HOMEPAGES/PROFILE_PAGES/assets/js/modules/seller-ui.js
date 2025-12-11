// assets/js/modules/seller-ui.js
// UI Interactions & Global Features — FIXED THEME + WELCOME BANNER

const escapeHtml = (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

const DEFAULT_PIC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

const handleImageError = (img) => {
  if (img && !img.src.startsWith('data:image/svg')) {
    img.src = DEFAULT_PIC;
    img.onerror = null;
  }
};

// Toast System
const showToast = (msg, type = "info") => {
  const toast = document.createElement("div");
  toast.textContent = msg;
  const colors = {
    success: "#2b7a0b",
    error: "#e74c3c",
    info: "#3498db",
    warning: "#f39c12",
  };
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10000;
    padding: 14px 28px; border-radius: 12px; color: #fff; font-weight: 600;
    background: ${colors[type] || colors.info};
    box-shadow: 0 8px 30px rgba(0,0,0,0.4);
    animation: slideInToast 0.5s ease, fadeOutToast 0.5s ease 3.5s forwards;
    transform: translateX(120%);
  `;
  document.body.appendChild(toast);
  toast.offsetHeight;
  toast.style.transform = "translateX(0)";
  setTimeout(() => toast.remove(), 4500);
};

const toastStyle = document.createElement("style");
toastStyle.textContent = `
  @keyframes slideInToast { from { transform: translateX(120%); } to { transform: translateX(0); } }
  @keyframes fadeOutToast { to { opacity: 0; transform: translateX(120%); } }
`;
document.head.appendChild(toastStyle);

// ────── UPDATE PROFILE + THEME + WELCOME BANNER (FIXED!) ──────
const updateProfile = (u) => {
  if (!u || !window.elements) return;

  console.log("🔧 updateProfile called with:", {
    name: u.name,
    id: u.id,
    category: u.productCategory
  });
  console.trace("Called from:");
  console.log("📄 Current DOM values BEFORE update:", {
    fullName: window.elements.fullName.textContent,
    storeName: window.elements.storeName.textContent
  });

  // 🔥 CLEAR OLD DATA FIRST
  window.elements.fullName.textContent = "";
  window.elements.storeName.textContent = "";
  window.elements.email.textContent = "";
  window.elements.phone.textContent = "";
  window.elements.profilePic.src = DEFAULT_PIC;
  window.elements.headerAvatar.src = DEFAULT_PIC;

  // Force DOM to update
  window.elements.fullName.offsetHeight;

  // Update text
  window.elements.fullName.textContent = u.name || "Seller";
  window.elements.storeName.textContent = u.storeName
    ? `Shop: ${u.storeName}`
    : "No store name";
  window.elements.email.textContent = u.email || "No email";
  window.elements.phone.textContent = u.phone
    ? `Phone: ${u.phone}`
    : "No phone";

  // Update avatar with error handling
  const pic = u.profilePic && u.profilePic.startsWith('data:image')
    ? u.profilePic
    : u.profilePic
    ? `http://localhost:5000${u.profilePic}`
    : DEFAULT_PIC;
  
  window.elements.profilePic.onerror = () => handleImageError(window.elements.profilePic);
  window.elements.headerAvatar.onerror = () => handleImageError(window.elements.headerAvatar);
  
  window.elements.profilePic.src = window.elements.headerAvatar.src = pic;

  // Welcome Greeting
  const greetings = [
    `Hey ${u.name || "Boss"}! Ready to shine?`,
    `Welcome back, ${u.name || "Seller"}! You're on fire!`,
    `Hello ${u.name || "Seller"}! Let's make sales!`,
    `Hi ${u.name || "Seller"}! You're crushing it!`,
    `Yo ${u.name || "Seller"}! Time to dominate!`,
  ];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  // Category & Icon
  const rawCat = (u.productCategory || "electronics").toLowerCase().trim();
  const cat = rawCat.includes("hostel") ? "hostels" : rawCat; // Normalize
  const displayCat = cat.charAt(0).toUpperCase() + cat.slice(1);
  const isHostelSeller = cat === "hostels"; // 🔥 ADD THIS LINE

  const icons = {
    electronics: "microchip",
    fashion: "shirt",
    hostels: "bed",
    hostel: "bed",
    default: "store",
  };
  const icon = icons[cat] || icons.default;

  window.elements.welcomeBanner.innerHTML = `
    <div style="text-align:center; animation: fadeInUp 0.8s ease-out;">
      <span style="font-size:1.5rem; font-weight:800; display:block; margin-bottom:12px;
                   background: linear-gradient(90deg, var(--green-light), #fff);
                   -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                   animation: glowPulse 2s infinite alternate;">
        ${escapeHtml(greeting)}
      </span>
      <small style="color:#fff; opacity:0.9; font-size:1rem;">
        <i class="fas fa-${escapeHtml(icon)}" style="color:var(--green-light); animation:iconPop 1.5s infinite;"></i>
        Category: <strong style="color:var(--green-light); font-weight:700;">${escapeHtml(displayCat)}</strong>
      </small>
    </div>
  `;

  // ────── ADDED: ensure we mark the page for hostel sellers and hide links via class ──────
  // toggle body class once so CSS can reliably hide/show items
  document.body.classList.toggle("is-hostel-seller", isHostelSeller);

  // ensure sections are visible/hidden (fallback JS for immediate effect)
  const ordersSection = document.getElementById("orders");
  const hostelBookingsSection = document.getElementById("hostel-bookings");
  if (ordersSection) ordersSection.style.display = isHostelSeller ? "none" : "";
  if (hostelBookingsSection)
    hostelBookingsSection.style.display = isHostelSeller ? "" : "none";

  // also ensure sidebar/mobile links are hidden/shown (defensive)
  [
    '.sidebar [data-section="orders"]',
    '.mobile-menu [data-section="orders"]',
  ].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) {
      el.style.display = isHostelSeller ? "none" : "";
      el.setAttribute("aria-hidden", isHostelSeller ? "true" : "false");
    }
  });

  [
    '.sidebar [data-section="hostel-bookings"]',
    '.mobile-menu [data-section="hostel-bookings"]',
  ].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) {
      el.style.display = isHostelSeller ? "" : "none";
      el.setAttribute("aria-hidden", isHostelSeller ? "false" : "true");
    }
  });

  // ────── THEME SWITCHING (NOW WORKS 100%) ──────
  const themeMap = {
    electronics: "theme-electronics",
    fashion: "theme-fashion",
    hostels: "theme-hostels",
    hostel: "theme-hostels",
  };

  // Remove all old themes
  document.body.className = document.body.className
    .replace(/theme-\w+/g, "")
    .trim();

  // Add correct theme
  const themeClass = themeMap[cat] || "theme-electronics";
  document.body.classList.add(themeClass);

  // WhatsApp Float
  if (window.elements.whatsappFloat && window.elements.whatsappBtn) {
    const phone = (u.phone || "").replace(/\D/g, "");
    const email = (u.email || "").trim();
    const tooltip =
      window.elements.whatsappFloat.querySelector(".whatsapp-tooltip") ||
      document.createElement("div");
    tooltip.className = "whatsapp-tooltip";
    tooltip.innerHTML = phone
      ? `<div><i class="fab fa-whatsapp" style="color:#25d366"></i> ${escapeHtml(u.phone)}</div>`
      : email
      ? `<div><i class="fas fa-envelope"></i> ${escapeHtml(email)}</div>`
      : `<div style="color:#aaa">No contact</div>`;
    if (!tooltip.parentNode) window.elements.whatsappFloat.appendChild(tooltip);

    window.elements.whatsappBtn.onclick = () => {
      if (phone) window.open(`https://wa.me/${phone}`, "_blank");
      else if (email) location.href = `mailto:${email}`;
      else showToast("No contact info", "warning");
    };
  }

  // Initialize safety tips
  if (typeof initSafetyTips === 'function') {
    initSafetyTips(cat);
  }

  // Trigger share card update
  if (typeof window.initShareCard === "function") {
    setTimeout(() => window.initShareCard(() => u), 100);
  }

  // Update View Shop links
  const shopUrl = `../sellerShop.html?sellerId=${u.id}`;
  const viewShopLink = document.getElementById('viewShopLink');
  const mobileViewShopLink = document.getElementById('mobileViewShopLink');
  if (viewShopLink) {
    viewShopLink.href = shopUrl;
    viewShopLink.style.pointerEvents = 'auto';
  }
  if (mobileViewShopLink) {
    mobileViewShopLink.href = shopUrl;
    mobileViewShopLink.style.pointerEvents = 'auto';
  }
  console.log('✅ View Shop links updated:', shopUrl);
};

// Safety Tips by Category
const SAFETY_TIPS = {
  electronics: [
    { icon: 'handshake', text: 'Meet buyers in public campus locations (library, cafeteria)' },
    { icon: 'check-circle', text: 'Test devices before handing over - show functionality' },
    { icon: 'shield-alt', text: 'Never share banking passwords or OTPs' },
    { icon: 'camera', text: 'Take clear photos showing serial numbers and condition' },
    { icon: 'file-invoice', text: 'Keep original receipts and warranty cards' },
    { icon: 'lightbulb', text: 'Price competitively - check similar listings' },
    { icon: 'battery-full', text: 'Charge devices fully before meetups to demonstrate battery health' },
    { icon: 'box', text: 'Include original packaging and accessories to increase value' },
    { icon: 'clock', text: 'Respond to inquiries within 24 hours to maintain buyer interest' },
    { icon: 'exclamation-triangle', text: 'Report suspicious buyers or scam attempts immediately' },
    { icon: 'mobile-alt', text: 'Remove personal data and accounts before selling phones/laptops' },
    { icon: 'star', text: 'Build reputation - good reviews lead to faster sales' }
  ],
  fashion: [
    { icon: 'handshake', text: 'Meet in well-lit public areas on campus' },
    { icon: 'tshirt', text: 'Describe condition honestly (new, gently used, etc.)' },
    { icon: 'ruler', text: 'Provide accurate measurements and sizing' },
    { icon: 'camera', text: 'Show multiple angles and any flaws clearly' },
    { icon: 'spray-can', text: 'Mention if items are washed/cleaned' },
    { icon: 'tags', text: 'Research prices - don\'t undersell quality items' },
    { icon: 'sun', text: 'Take photos in natural lighting for accurate colors' },
    { icon: 'shopping-bag', text: 'Bundle similar items for better deals' },
    { icon: 'clock', text: 'Seasonal items sell faster - list winter clothes early' },
    { icon: 'certificate', text: 'Mention brand authenticity and provide proof if available' },
    { icon: 'recycle', text: 'Promote sustainability - appeal to eco-conscious buyers' },
    { icon: 'heart', text: 'Share styling tips to help buyers visualize the item' }
  ],
  hostels: [
    { icon: 'video', text: 'Offer virtual tours via video call first' },
    { icon: 'clipboard-check', text: 'Be transparent about rules and facilities' },
    { icon: 'users', text: 'Screen tenants - ask for student ID verification' },
    { icon: 'file-contract', text: 'Use written agreements for bookings' },
    { icon: 'shield-alt', text: 'Never accept full payment before viewing' },
    { icon: 'phone', text: 'Keep communication on platform initially' },
    { icon: 'wifi', text: 'Highlight amenities like WiFi, water, and security clearly' },
    { icon: 'map-marker-alt', text: 'Mention exact distance from campus and landmarks' },
    { icon: 'money-bill-wave', text: 'Be clear about payment terms and deposit requirements' },
    { icon: 'tools', text: 'Address maintenance issues promptly to keep good ratings' },
    { icon: 'calendar-check', text: 'Update availability status immediately after bookings' },
    { icon: 'comments', text: 'Respond professionally to all inquiries - builds trust' }
  ]
};

let currentTipIndex = 0;
let tipInterval = null;

const initSafetyTips = (category) => {
  const safetyContent = document.getElementById('safetyContent');
  const toggleBtn = document.getElementById('toggleSafetyBtn');
  if (!safetyContent || !toggleBtn) return;

  const cat = category.toLowerCase().includes('hostel') ? 'hostels' : category.toLowerCase();
  const tips = SAFETY_TIPS[cat] || SAFETY_TIPS.electronics;

  safetyContent.innerHTML = `
    <div class="tips-slideshow">
      <div class="tip-slide">
        <i class="fas fa-${escapeHtml(tips[0].icon)}"></i>
        <span>${escapeHtml(tips[0].text)}</span>
      </div>
      <div class="slide-controls">
        <button class="slide-btn prev"><i class="fas fa-chevron-left"></i></button>
        <div class="slide-dots">${tips.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}"></span>`).join('')}</div>
        <button class="slide-btn next"><i class="fas fa-chevron-right"></i></button>
      </div>
    </div>
  `;

  const slide = safetyContent.querySelector('.tip-slide');
  const dots = safetyContent.querySelectorAll('.dot');
  const prevBtn = safetyContent.querySelector('.prev');
  const nextBtn = safetyContent.querySelector('.next');

  const showTip = (index) => {
    currentTipIndex = (index + tips.length) % tips.length;
    slide.style.opacity = '0';
    setTimeout(() => {
      slide.innerHTML = `<i class="fas fa-${escapeHtml(tips[currentTipIndex].icon)}"></i><span>${escapeHtml(tips[currentTipIndex].text)}</span>`;
      slide.style.opacity = '1';
      dots.forEach((d, i) => d.classList.toggle('active', i === currentTipIndex));
    }, 200);
  };

  prevBtn.onclick = () => showTip(currentTipIndex - 1);
  nextBtn.onclick = () => showTip(currentTipIndex + 1);
  dots.forEach((dot, i) => dot.onclick = () => showTip(i));

  tipInterval = setInterval(() => showTip(currentTipIndex + 1), 6000);

  toggleBtn.onclick = () => {
    safetyContent.classList.toggle('collapsed');
    toggleBtn.innerHTML = safetyContent.classList.contains('collapsed') 
      ? '<i class="fas fa-chevron-down"></i>' 
      : '<i class="fas fa-chevron-up"></i>';
    if (safetyContent.classList.contains('collapsed')) {
      clearInterval(tipInterval);
    } else {
      tipInterval = setInterval(() => showTip(currentTipIndex + 1), 5000);
    }
  };
};

// Share Card — now accepts getUser function
let currentShopUrl = null;
let qrContainer = null;

window.initShareCard = (getUser) => {
  if (!window.elements) return;
  const getter =
    typeof getUser === "function"
      ? getUser
      : typeof window.getUser === "function"
      ? window.getUser
      : () => null;
  const u = getter();
  if (!u || !u.id) return;

  const shopUrl = u.username
    ? `https://dex.com/shop/${u.username}`
    : `https://dex.com/shop/seller-${u.id}`;

  if (currentShopUrl === shopUrl) return;
  currentShopUrl = shopUrl;

  if (window.elements.shopLink) window.elements.shopLink.textContent = shopUrl;

  if (window.elements.copyBtn) {
    window.elements.copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(shopUrl);
        showToast("Shop link copied!", "success");
      } catch {
        const ta = document.createElement("textarea");
        ta.value = shopUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        showToast("Link copied!", "success");
      }
    };
  }

  if (window.elements.shareBtn) {
    window.elements.shareBtn.onclick = () => {
      const msg = `Check out my shop on Dex™! Great deals on ${
        u.productCategory || "amazing products"
      }!\n\n${shopUrl}`;
      if (navigator.share && window.innerWidth <= 768) {
        navigator
          .share({ title: "My Dex Shop", text: msg, url: shopUrl })
          .catch(() =>
            window.open(
              `https://wa.me/?text=${encodeURIComponent(msg)}`,
              "_blank"
            )
          );
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
      }
    };
  }

  if (window.elements.qrPlaceholder) {
    if (qrContainer) qrContainer.remove();
    qrContainer = document.createElement("div");
    qrContainer.innerHTML = `
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
        shopUrl
      )}"
           alt="Shop QR Code" style="border-radius:12px; border:4px solid #fff; box-shadow:0 8px 25px rgba(0,0,0,0.5);">
      <p style="margin:8px 0 0; font-size:0.85rem; color:#ddd; text-align:center;">Scan to visit shop</p>
    `;
    window.elements.qrPlaceholder.appendChild(qrContainer);
  }

  if (window.elements.toggleShareBtn) {
    window.elements.toggleShareBtn.onclick = () => {
      window.elements.shareContent.classList.toggle("collapsed");
      window.elements.toggleShareBtn.innerHTML = `<i class="fas fa-share-alt"></i> ${
        window.elements.shareContent.classList.contains("collapsed")
          ? "Share Your Shop"
          : "Hide"
      }`;
    };
  }
};

// Section Switching
const setupSectionSwitching = () => {
  document.querySelectorAll("[data-section]").forEach((link) => {
    if (link.id === 'viewShopLink' || link.id === 'mobileViewShopLink') return;
    link.onclick = (e) => {
      e.preventDefault();
      const sectionId = link.dataset.section;
      console.log('Switching to section:', sectionId);
      
      document
        .querySelectorAll("[data-section]")
        .forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
      document
        .querySelectorAll(".section")
        .forEach((s) => s.classList.remove("active"));
      const target = document.getElementById(sectionId);
      if (target) {
        target.classList.add("active");
        console.log('Section found and activated:', sectionId);
        
        // Lazy load section content when clicked
        setTimeout(() => {
          if (sectionId === 'customize-shop' && window.initShopCustomizeContent) {
            window.initShopCustomizeContent();
          } else if (sectionId === 'analytics') {
            if (window.lazyInitAnalytics && !window._analyticsLoaded) {
              window.lazyInitAnalytics();
              window._analyticsLoaded = true;
            } else if (window.initAnalyticsContent) {
              window.initAnalyticsContent();
            }
          } else if (sectionId === 'bulk-actions') {
            if (window.lazyInitBulkActions && !window._bulkActionsLoaded) {
              window.lazyInitBulkActions();
              window._bulkActionsLoaded = true;
            } else if (window.initBulkActionsContent) {
              window.initBulkActionsContent();
            }
          } else if (sectionId === 'search') {
            if (window.lazyInitSearch && !window._searchLoaded) {
              window.lazyInitSearch();
              window._searchLoaded = true;
            } else if (window.initSearchContent) {
              window.initSearchContent();
            }
          } else if (sectionId === 'settings') {
            if (window.lazyInitSettings && !window._settingsLoaded) {
              window.lazyInitSettings();
              window._settingsLoaded = true;
            } else if (window.initSettingsContent) {
              window.initSettingsContent();
            }
          } else if (sectionId === 'help') {
            if (window.lazyInitHelp && !window._helpLoaded) {
              window.lazyInitHelp();
              window._helpLoaded = true;
            } else if (window.initHelpContent) {
              window.initHelpContent();
            }
          } else if (sectionId === 'hostel-payments') {
            if (window.lazyInitHostelPayments && !window._hostelPaymentsLoaded) {
              window.lazyInitHostelPayments();
              window._hostelPaymentsLoaded = true;
            } else if (window.initHostelPaymentsContent) {
              window.initHostelPaymentsContent();
            }
          }
        }, 50);
      } else {
        console.error('Section not found:', sectionId);
      }
    };
  });
};

// Lightbox
const openLightbox = (currentSrc, allImages = []) => {
  const overlay = document.createElement("div");
  overlay.style.cssText = `position:fixed; inset:0; background:rgba(0,0,0,0.97); z-index:9999; display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(8px);`;
  let index = allImages.findIndex(
    (img) => `http://localhost:5000${img}` === currentSrc
  );
  const img = document.createElement("img");
  img.src = currentSrc;
  img.style.cssText =
    "max-width:94%; max-height:94%; object-fit:contain; border-radius:16px; box-shadow:0 20px 60px rgba(0,0,0,0.7);";

  const prev = document.createElement("div");
  prev.innerHTML = "Previous";
  prev.style.cssText =
    "position:absolute; left:20px; font-size:60px; color:white; opacity:0.7; cursor:pointer;";
  prev.onclick = (e) => {
    e.stopPropagation();
    index = (index - 1 + allImages.length) % allImages.length;
    img.src = `http://localhost:5000${allImages[index]}`;
  };

  const next = document.createElement("div");
  next.innerHTML = "Next";
  next.style.cssText =
    "position:absolute; right:20px; font-size:60px; color:white; opacity:0.7; cursor:pointer;";
  next.onclick = (e) => {
    e.stopPropagation();
    index = (index + 1) % allImages.length;
    img.src = `http://localhost:5000${allImages[index]}`;
  };

  const close = document.createElement("div");
  close.innerHTML = "Close";
  close.style.cssText =
    "position:absolute; top:20px; right:30px; font-size:50px; color:white; cursor:pointer;";
  close.onclick = () => overlay.remove();

  overlay.append(img, close);
  if (allImages.length > 1) overlay.append(prev, next);
  overlay.onclick = (e) => e.target === overlay && overlay.remove();
  document.body.appendChild(overlay);
};

// Main Init
const initUI = (deps = {}) => {
  const { elements = window.elements } = deps;
  if (!elements) return;

  elements.hamburger.onclick = () => {
    elements.mobileMenu.classList.toggle("open");
    elements.globalOverlay.classList.toggle("active");
  };
  elements.globalOverlay.onclick = () => {
    elements.mobileMenu.classList.remove("open");
    elements.globalOverlay.classList.remove("active");
  };

  elements.logoutBtn.onclick = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.currentSeller = null;
    window.authToken = null;
    document.body.className = "";
    window.location.replace("../REGISTRY_PAGES/seller_sign_in.html");
  };

  setupSectionSwitching();

  // ────── NEW: robust Share toggle + actions (attach via elements OR DOM fallback) ──────
  try {
    const toggleShareBtnEl =
      (elements && elements.toggleShareBtn) ||
      document.getElementById("toggleShareBtn");
    const shareContentEl =
      (elements && elements.shareContent) ||
      document.getElementById("shareContent");
    const copyBtn = document.getElementById("copyBtn");
    const shareBtn = document.getElementById("shareBtn");
    const shopLinkEl = document.getElementById("shopLink");
    const qrPlaceholder = document.getElementById("qrPlaceholder");

    if (toggleShareBtnEl && shareContentEl) {
      // ensure initial collapsed state
      if (!shareContentEl.classList.contains("collapsed")) {
        shareContentEl.classList.add("collapsed");
        shareContentEl.style.display = "none";
      }

      const toggleShare = (e) => {
        if (e) e.preventDefault();
        const collapsed = shareContentEl.classList.toggle("collapsed");
        shareContentEl.style.display = collapsed ? "none" : "block";
        toggleShareBtnEl.innerHTML = `<i class="fas fa-share-alt"></i> ${
          collapsed ? "Share Your Shop" : "Hide"
        }`;
      };

      // avoid duplicate listeners
      toggleShareBtnEl.removeEventListener("click", toggleShare);
      toggleShareBtnEl.addEventListener("click", toggleShare);
    }

    // Copy link action
    if (copyBtn && shopLinkEl) {
      copyBtn.onclick = async (e) => {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(shopLinkEl.innerText.trim());
          showToast("Link copied to clipboard", "success");
        } catch {
          showToast("Copy failed", "error");
        }
      };
    }

    // WhatsApp share action
    if (shareBtn && shopLinkEl) {
      shareBtn.onclick = (e) => {
        e.preventDefault();
        const link = encodeURIComponent(shopLinkEl.innerText.trim());
        const whatsappUrl = `https://wa.me/?text=${link}`;
        window.open(whatsappUrl, "_blank");
      };
    }

    // If initShareCard will inject QR, leave qrPlaceholder as target (no-op here)
  } catch (err) {
    console.error("Share toggle init error:", err);
  }
};

// EXPORT
export { initUI, showToast, updateProfile, escapeHtml, openLightbox, initSafetyTips };
