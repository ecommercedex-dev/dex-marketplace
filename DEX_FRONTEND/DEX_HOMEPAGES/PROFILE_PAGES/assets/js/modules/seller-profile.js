// assets/js/modules/seller-profile.js
// Profile Editing & Management — Fully Exported

const elements = window.elements || {};
// don't capture window.elements at module-eval time — read it at runtime
const getElements = () => window.elements || {};
const getToken = () => window.authToken || window.token || null; // 🔥 ADD THIS
const API_BASE = window.API_BASE || "http://localhost:5000/api";
const updateProfile = window.updateProfile || (() => {});
const showToast = window.showToast || ((m, t) => console.log(t || "info", m));
const DEFAULT_PIC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

const handleImageError = (img) => {
  if (img && img.src !== DEFAULT_PIC) {
    img.src = DEFAULT_PIC;
    img.onerror = null;
  }
};

// Runtime accessors (avoid capturing window.* at module-eval time)
const getUserRuntime = () =>
  typeof window.getUser === "function"
    ? window.getUser()
    : (() => {
        try {
          return (
            JSON.parse(localStorage.getItem("currentUser")) ||
            JSON.parse(sessionStorage.getItem("currentUser")) ||
            window.currentSeller ||
            null
          );
        } catch {
          return window.currentSeller || null;
        }
      })();

const setUserRuntime = (newUser) => {
  if (typeof window.setUser === "function") {
    window.setUser(newUser);
  } else {
    try {
      localStorage.setItem("currentUser", JSON.stringify(newUser));
    } catch {}
    window.currentSeller = newUser;
  }
};

// Apply updated profile to UI using runtime updater or DOM fallback
const applyProfileUpdate = (newUser) => {
  console.log("🔄 applyProfileUpdate:", {
    name: newUser?.name,
    id: newUser?.id,
    category: newUser?.productCategory
  });
  if (typeof window.updateProfile === "function") {
    window.updateProfile(newUser);
    return;
  }

  // DOM fallback
  const els = getElements();
  const fullNameEl = els.fullName || document.getElementById("fullName");
  const storeNameEl = els.storeName || document.getElementById("storeName");
  const emailEl = els.email || document.getElementById("email");
  const phoneEl = els.phone || document.getElementById("phone");
  const picEl = els.profilePic || document.getElementById("profilePic");
  const headerEl = els.headerAvatar || document.getElementById("headerAvatar");
  if (fullNameEl)
    fullNameEl.textContent = newUser.name || newUser.fullName || "Seller";
  if (storeNameEl) storeNameEl.textContent = newUser.storeName || "My Store";
  if (emailEl) emailEl.textContent = newUser.email || "";
  if (phoneEl)
    phoneEl.textContent = newUser.phone ? `Phone: ${newUser.phone}` : "Phone: ";
  if (newUser.profilePic) {
    const fullUrl = newUser.profilePic.startsWith('data:image')
      ? newUser.profilePic
      : newUser.profilePic.startsWith("http")
      ? newUser.profilePic
      : `http://localhost:5000${newUser.profilePic.startsWith("/") ? "" : "/"}${newUser.profilePic}`;

    if (picEl) {
      picEl.onerror = () => handleImageError(picEl);
      picEl.src = fullUrl;
    }
    if (headerEl) {
      headerEl.onerror = () => handleImageError(headerEl);
      headerEl.src = fullUrl;
    }
  } else {
    if (picEl) picEl.src = DEFAULT_PIC;
    if (headerEl) headerEl.src = DEFAULT_PIC;
  }
};

// 🔥 ADD: simple $ helper and defensive DOM-getter
const $ = (id) => document.getElementById(id) || null;
const safeSetValue = (id, v) => {
  const el = $(id);
  if (el) el.value = v ?? "";
};

// Open Edit Profile Dropdown
const openEditProfile = () => {
  const u = getUser();
  if (!u) {
    showToast("User not loaded", "error");
    return;
  }

  // use safe setter (no ReferenceError if inputs missing)
  safeSetValue("editShopName", u.storeName || "");
  safeSetValue("editFullName", u.name || "");
  safeSetValue("editEmail", u.email || "");
  safeSetValue("editPhone", u.phone || "");

  // 🔥 FIXED: Always use runtime getter, never the stale elements object
  const els = getElements();
  const dropdown = els.editDropdown || document.getElementById("editDropdown");
  if (dropdown) {
    dropdown.style.display = "block";
    console.log("✅ Edit dropdown opened");
  } else {
    console.error("❌ editDropdown element still missing");
  }
};

// Close Edit Dropdown
const closeEditProfile = () => {
  // 🔥 FIXED: Always use runtime getter
  const els = getElements();
  const dropdown = els.editDropdown || document.getElementById("editDropdown");
  if (dropdown) {
    dropdown.style.display = "none";
  }
};

// Save Profile Changes
const saveProfile = async () => {
  const payload = {
    storeName: $("editShopName").value.trim(),
    name: $("editFullName").value.trim(),
    email: $("editEmail").value.trim(),
    phone: $("editPhone").value.trim(),
  };

  // Validation
  if (!payload.name) {
    showToast("Full name is required", "error");
    return;
  }
  if (!payload.email) {
    showToast("Email is required", "error");
    return;
  }
  if (payload.email && !/^\S+@\S+\.\S+$/.test(payload.email)) {
    showToast("Please enter a valid email", "error");
    return;
  }

  try {
    // 🔥 FIXED: Use runtime getter for token
    const currentToken = getToken();
    if (!currentToken) {
      showToast("Not authenticated. Please refresh and log in again.", "error");
      return;
    }

    const els = getElements();
    const saveBtnEl = els.saveEditBtn || document.getElementById("saveEditBtn");
    if (saveBtnEl) {
      saveBtnEl.disabled = true;
      saveBtnEl.innerHTML = "Saving...";
    }

    const res = await fetch(`${API_BASE}/seller/profile/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`, // 🔥 USE RUNTIME TOKEN
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update profile");
    }

    const updated = await res.json();

    // Build merged user object
    const newUser = { ...(getUserRuntime() || {}), ...updated };

    // Save to storage / global
    setUserRuntime(newUser);

    // Update UI
    applyProfileUpdate(newUser);

    // Close dropdown
    closeEditProfile();

    // Success!
    showToast("Profile updated successfully!", "success");

    // Trigger share card refresh (in case shop name changed)
    if (typeof initShareCard === "function") {
      setTimeout(initShareCard, 100);
    }
    if (typeof window.initShareCard === "function") {
      // pass a getter so initShareCard always has a function it can call
      setTimeout(() => window.initShareCard(() => getUser()), 100);
    }
    if (typeof window.initShareCard === "function") {
      setTimeout(() => window.initShareCard(() => getUserRuntime()), 100);
    }
  } catch (err) {
    console.error("Profile update failed:", err);
    showToast(err.message || "Profile update failed", "error");
  } finally {
    // 🔥 FIXED: Use runtime getter in finally block too
    const els = getElements();
    const saveBtnEl = els.saveEditBtn || document.getElementById("saveEditBtn");
    if (saveBtnEl) {
      saveBtnEl.disabled = false;
      saveBtnEl.innerHTML = "Save";
    }
  }
};

// Setup Event Listeners
const setupProfileEvents = () => {
  const els = getElements();
  const editBtn =
    els.editProfileBtn || document.getElementById("editProfileBtn");
  const cancelBtn =
    els.cancelEditBtn || document.getElementById("cancelEditBtn");
  const saveBtn = els.saveEditBtn || document.getElementById("saveEditBtn");
  const dropdownEl =
    els.editDropdown || document.getElementById("editDropdown");

  // ✅ ADD: Attach click handlers
  if (editBtn) {
    editBtn.onclick = openEditProfile;
  }
  if (cancelBtn) {
    cancelBtn.onclick = closeEditProfile;
  }
  if (saveBtn) {
    saveBtn.onclick = saveProfile;
  }

  // Close dropdown when clicking outside (defensive)
  document.addEventListener("click", (e) => {
    const isOpen =
      dropdownEl &&
      (dropdownEl.style.display === "block" ||
        dropdownEl.classList.contains("open"));
    if (
      dropdownEl &&
      isOpen &&
      !dropdownEl.contains(e.target) &&
      e.target !== editBtn
    ) {
      closeEditProfile();
    }
  });

  console.log("Profile events wired:", {
    editBtn: !!editBtn,
    cancelBtn: !!cancelBtn,
    saveBtn: !!saveBtn,
    dropdown: !!dropdownEl,
  });
};

// Main initialization
const initProfile = () => {
  setupProfileEvents();
  console.log("Profile Module Initialized");
};

// ───────────────────────────────
// EXPORT EVERYTHING
// ───────────────────────────────
export {
  initProfile, // Required by main-seller.js
  openEditProfile,
  closeEditProfile,
  saveProfile,
};
