// assets/js/modules/seller-gallery.js
// Gallery Module — Fully Fixed & Dependency-Injected

let draggedItem = null;
let profileImages = [];

// These will be injected
let elements,
  user,
  token,
  API_BASE,
  DEFAULT_PIC,
  getUser,
  setUser,
  updateProfile,
  showToast;

// Helper: Build full image URL
const getImageUrl = (path) => {
  return path.startsWith("http") ? path : `http://localhost:5000${path}`;
};

const openGallery = () => {
  elements.dialogGalleryGrid.innerHTML = "";
  profileImages.forEach((src, idx) => {
    const div = document.createElement("div");
    div.className = "dialog-gallery-item";
    div.dataset.idx = idx;
    div.draggable = true;

    const img = document.createElement("img");
    img.src = getImageUrl(src);
    img.loading = "lazy";
    img.onclick = () => {
      setUser({ ...getUser(), profilePic: src });
      updateProfile(getUser());
      closeGallery();
    };

    const del = document.createElement("div");
    del.className = "gallery-delete-btn";
    del.textContent = "×";
    del.onclick = (e) => {
      e.stopPropagation();
      if (confirm("Delete this image permanently?")) {
        deleteImage(src);
      }
    };

    // Drag & Drop
    div.addEventListener("dragstart", () => {
      draggedItem = div;
      div.classList.add("dragging");
    });
    div.addEventListener("dragend", () => {
      div.classList.remove("dragging");
      draggedItem = null;
    });
    div.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (div !== draggedItem) div.classList.add("drop-target");
    });
    div.addEventListener("dragleave", () =>
      div.classList.remove("drop-target")
    );
    div.addEventListener("drop", (e) => {
      e.preventDefault();
      div.classList.remove("drop-target");
      if (draggedItem && draggedItem !== div) {
        const from = +draggedItem.dataset.idx;
        const to = +div.dataset.idx;
        const [moved] = profileImages.splice(from, 1);
        profileImages.splice(to, 0, moved);
        openGallery();
        saveOrder();
      }
    });

    div.append(img, del);
    elements.dialogGalleryGrid.appendChild(div);
  });

  elements.galleryOverlay.classList.add("show");
};

const closeGallery = () => {
  elements.galleryOverlay.classList.remove("show");
};

const saveOrder = async () => {
  if (!profileImages.length) return;

  try {
    const res = await fetch(`${API_BASE}/seller/profile/gallery/reorder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order: profileImages }),
    });

    if (!res.ok) throw new Error((await res.json()).message || "Save failed");

    localStorage.setItem(
      `profileImages_${user.id}`,
      JSON.stringify(profileImages)
    );

    if (profileImages[0] && profileImages[0] !== getUser().profilePic) {
      setUser({ ...getUser(), profilePic: profileImages[0] });
      updateProfile(getUser());
    }

    showToast("Gallery order saved!", "success");
  } catch (err) {
    console.error(err);
    showToast(err.message || "Failed to save order", "error");
  }
};

const deleteImage = async (url) => {
  try {
    const filename = url.split("/").pop();
    const res = await fetch(`${API_BASE}/seller/profile/gallery/${filename}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Delete failed");

    profileImages = profileImages.filter((u) => u !== url);
    localStorage.setItem(
      `profileImages_${user.id}`,
      JSON.stringify(profileImages)
    );

    if (!profileImages.length || getUser().profilePic === url) {
      const updatedUser = { ...getUser(), profilePic: DEFAULT_PIC };
      setUser(updatedUser);
      elements.profilePic.src = DEFAULT_PIC;
      elements.headerAvatar.src = DEFAULT_PIC;
      updateProfile(updatedUser);
    }

    if (profileImages.length) await saveOrder();
    openGallery();
    showToast("Image deleted", "success");
  } catch (err) {
    showToast(err.message || "Delete failed", "error");
  }
};

const refreshGallery = async () => {
  try {
    const r = await fetch(`${API_BASE}/seller/profile/gallery`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      const g = await r.json();
      profileImages = g.map((i) => getImageUrl(i.url));
      localStorage.setItem(
        `profileImages_${user.id}`,
        JSON.stringify(profileImages)
      );
    }
  } catch (e) {
    console.error("Refresh gallery failed:", e);
  }
};

// MAIN INITIALIZATION — ONLY THIS RUNS FROM main-seller.js
const initGallery = async (deps) => {
  ({
    elements,
    user,
    token,
    API_BASE = "http://localhost:5000/api",
    DEFAULT_PIC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E",
    getUser,
    setUser,
    updateProfile,
    showToast,
  } = deps);

  // Don't load profile data here - it's already loaded in main-seller.js
  // Loading it again causes wrong user data to be loaded from server cache

  // Load gallery from localStorage + server
  profileImages = JSON.parse(
    localStorage.getItem(`profileImages_${user.id}`) || "[]"
  );
  await refreshGallery();

  // EVENT LISTENERS — attached only AFTER elements exist!
  elements.openGalleryBtn.onclick = openGallery;
  elements.closeGalleryBtn.onclick = closeGallery;
  elements.galleryOverlay.onclick = (e) => {
    if (e.target === elements.galleryOverlay) closeGallery();
  };

  // Profile picture upload — moved inside initGallery!
  elements.picInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return showToast("Please select an image", "error");
    if (file.size > 5 * 1024 * 1024)
      return showToast("Image must be under 5MB", "error");

    const previewUrl = URL.createObjectURL(file);
    elements.profilePic.src = elements.headerAvatar.src = previewUrl;

    const fd = new FormData();
    fd.append("profilePic", file);

    try {
      const r = await fetch(`${API_BASE}/seller/profile/uploadProfilePic`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!r.ok) throw new Error((await r.json()).message || "Upload failed");

      const d = await r.json();
      const newUrl = `http://localhost:5000${d.profilePic}`;
      elements.profilePic.src = elements.headerAvatar.src = newUrl;
      setUser({ ...getUser(), profilePic: newUrl });
      showToast("Profile picture updated!", "success");

      await refreshGallery();
      if (elements.galleryOverlay.classList.contains("show")) openGallery();
    } catch (err) {
      showToast(err.message || "Upload failed", "error");
      elements.profilePic.src = elements.headerAvatar.src = DEFAULT_PIC;
    } finally {
      e.target.value = "";
    }
  };

  console.log("Gallery module fully initialized");
};

// EXPORT
export {
  initGallery,
  openGallery,
  closeGallery,
  refreshGallery,
  saveOrder,
  deleteImage,
};
