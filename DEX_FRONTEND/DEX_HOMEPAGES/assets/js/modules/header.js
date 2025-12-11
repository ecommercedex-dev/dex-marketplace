// =====================================================
// =====================================================
// HEADER UTILITIES + MOBILE MENU — FINAL VERSION (NO DUPLICATES)
// =====================================================
const headerUtils = document.getElementById("header-utils");

// Keep a reference to the mobile toggle so we never lose it
const mobileToggle = headerUtils.querySelector("#menuToggle");

function createLink(href, text, iconClass) {
  const a = document.createElement("a");
  a.href = href;
  if (iconClass) {
    const i = document.createElement("i");
    i.className = iconClass;
    i.style.marginRight = "6px";
    a.appendChild(i);
  }
  a.appendChild(document.createTextNode(text));
  return a;
}

function handleLogout(e) {
  e?.preventDefault();
  if (!confirm("Logout?")) return;
  localStorage.removeItem("currentUser");
  sessionStorage.removeItem("currentUser");
  window.location.href = "Dex-shop.html";
}

function loadUserUI(currentUser) {
  const headerUtils = document.getElementById("header-utils");
  const mobileToggle = headerUtils.querySelector("#menuToggle");
  const guestContainer = document.getElementById("guestLoginContainer");

  // === 1. Clean everything except mobile menu toggle ===
  Array.from(headerUtils.children).forEach((child) => {
    if (child !== mobileToggle && child !== guestContainer) child.remove();
  });

  if (currentUser) {
    // === LOGGED IN USER ===
    guestContainer?.remove(); // Hide guest login button

    const profileDiv = document.createElement("div");
    profileDiv.style.cssText = "display:flex;align-items:center;gap:12px;";

    // Profile picture
    const img = document.createElement("img");
    const pic = currentUser.profilePic
      ? currentUser.profilePic.startsWith("http")
        ? currentUser.profilePic
        : `http://localhost:5000${
            currentUser.profilePic.startsWith("/") ? "" : "/"
          }${currentUser.profilePic}`
      : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
    img.src = pic;
    img.alt = "Profile";
    img.width = img.height = 44;
    img.loading = "lazy";
    Object.assign(img.style, {
      borderRadius: "50%",
      objectFit: "cover",
      border: "3px solid #fff",
      cursor: "pointer",
      boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
      transition: "var(--transition)",
    });
    img.onclick = () =>
      (location.href =
        currentUser.role === "buyer"
          ? "PROFILE_PAGES/Buyer_profile.html"
          : "PROFILE_PAGES/Sellers_page.html");
    profileDiv.appendChild(img);

    // Role icons
    if (currentUser.role === "buyer") {
      const a = document.createElement("a");
      a.href = "PROFILE_PAGES/Buyer_profile.html";
      a.innerHTML = '<i class="fas fa-user"></i>';
      a.title = "My Profile";
      a.style.cssText = "color:#fff;font-size:1.6rem;";
      profileDiv.appendChild(a);
    } else if (currentUser.role === "seller") {
      const a = document.createElement("a");
      a.href = "PROFILE_PAGES/Sellers_page.html";
      a.innerHTML = '<i class="fas fa-store"></i>';
      a.title = "Seller Dashboard";
      a.style.cssText = "color:#fff;font-size:1.6rem;";
      profileDiv.appendChild(a);
    }

    // Notification bell
    const notifBtn = document.createElement("div");
    notifBtn.id = "notificationBtn";
    notifBtn.style.cssText = "position:relative;cursor:pointer;padding:10px;border-radius:50%;background:rgba(255,255,255,0.08);backdrop-filter:blur(8px);transition:0.35s;display:none;";
    notifBtn.innerHTML = `
      <i class="fas fa-bell" style="font-size:1.75rem;color:#fff;transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1);"></i>
      <span id="notificationBadge" style="position:absolute;top:-4px;right:-4px;background:#e74c3c;color:#fff;font-size:0.68rem;font-weight:700;min-width:22px;height:22px;border-radius:50%;border:2.5px solid #000;display:none;place-items:center;box-shadow:0 4px 12px rgba(231,76,60,0.5);"></span>
    `;
    profileDiv.appendChild(notifBtn);

    // Logout
    const logout = document.createElement("a");
    logout.href = "#";
    logout.innerHTML = '<i class="fas fa-right-from-bracket"></i>';
    logout.title = "Logout";
    logout.style.cssText = "color:#fff;font-size:1.4rem;cursor:pointer;";
    logout.onclick = handleLogout;
    profileDiv.appendChild(logout);

    headerUtils.appendChild(profileDiv);


  } else {
    // === GUEST USER: Show unified "Log in" dropdown ===
    if (!guestContainer) {
      const container = document.createElement("div");
      container.className = "login-role-container";
      container.id = "guestLoginContainer";
      container.innerHTML = `
        <button id="loginRoleTrigger">
          <i class="fas fa-user-circle"></i>
          <span>Log in</span>
          <i class="fas fa-chevron-down chevron"></i>
        </button>
        <div id="loginRoleDropdown">
          <a href="REGISTRY_PAGES/Sign_in.html" class="role-option buyer">
            <i class="fas fa-shopping-bag"></i>
            Sign in as Buyer
          </a>
          <a href="REGISTRY_PAGES/Seller_sign_in.html" class="role-option seller">
            <i class="fas fa-store"></i>
            Sell on Dex™
            <i class="fas fa-crown premium-icon"></i>
          </a>
        </div>
      `;
      headerUtils.insertBefore(
        container,
        document.getElementById("notificationBtn") || null
      );
    }
  }
}

// === Unified Dropdown Script (only one needed) ===
document.addEventListener("DOMContentLoaded", () => {
  const trigger = document.getElementById("loginRoleTrigger");
  const dropdown = document.getElementById("loginRoleDropdown");
  const chevron = trigger?.querySelector(".chevron");

  if (!trigger || !dropdown) return;

  trigger.onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
    if (chevron) {
      chevron.style.transform = dropdown.classList.contains("open")
        ? "rotate(180deg)"
        : "";
    }
  };

  document.addEventListener("click", () => {
    dropdown.classList.remove("open");
    if (chevron) chevron.style.transform = "";
  });

  dropdown.onclick = (e) => e.stopPropagation();
});

function loadHeaderLinks() {
  const stored =
    localStorage.getItem("currentUser") ||
    sessionStorage.getItem("currentUser");
  const currentUser = stored && stored !== "null" ? JSON.parse(stored) : null;
  loadUserUI(currentUser);
}

// Run on page load
loadHeaderLinks();

// MOBILE MENU TOGGLE — SMOOTH & BEAUTIFUL
document.addEventListener("click", (e) => {
  const toggleBtn = e.target.closest("#menuToggle");
  if (!toggleBtn) return;

  e.stopPropagation();
  const nav = document.querySelector("header nav");
  const icon = toggleBtn.querySelector("i");

  nav.classList.toggle("open");

  // Toggle icon: bars to times
  icon.classList.toggle("fa-bars");
  icon.classList.toggle("fa-times");
});

// Close when clicking a link
document.querySelectorAll("header nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelector("header nav").classList.remove("open");
    document
      .querySelector("#menuToggle i")
      .classList.replace("fa-times", "fa-bars");
  });
});

// Close when clicking outside
document.addEventListener("click", (e) => {
  const nav = document.querySelector("header nav");
  const toggle = document.getElementById("menuToggle");
  if (
    nav.classList.contains("open") &&
    !nav.contains(e.target) &&
    !toggle.contains(e.target)
  ) {
    nav.classList.remove("open");
    toggle.querySelector("i").classList.replace("fa-times", "fa-bars");
  }
});
