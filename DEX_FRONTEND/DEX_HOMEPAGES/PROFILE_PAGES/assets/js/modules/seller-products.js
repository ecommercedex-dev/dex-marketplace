// assets/js/modules/seller-products.js
// Products Module — 100% FINAL, DYNAMIC FIELDS + DROPDOWNS
import { fetchWithCache, Paginator, cacheManager } from './performance-cache.js';

const $ = (id) => document.getElementById(id);

let editingProductId = null;
let selectedImages = [];
let existingImages = [];
let deletedImages = [];
let productPaginator = null;
let allProducts = [];

// Injected dependencies
let elements, user, token, API_BASE, notificationSystem, showToast;

// Color palette
const COLOR_PALETTE = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#FFC0CB",
  "#A52A2A",
  "#808080",
  "#FFD700",
  "#4B0082",
  "#87CEEB",
  "#228B22",
  "#D2691E",
  "#708090",
  "#FFB6C1",
];

// ─────────────────────── FORM TEMPLATES ───────────────────────
const regularProductForm = `
  <div class="form-group">
    <input type="text" id="productName" placeholder="e.g. iPhone 14 Pro Max 256GB" required>
    <label for="productName">Product Name <span class="required">*</span></label>
  </div>
  <div class="form-group" id="genderFieldContainer" style="display:none;">
    <select id="productGender" required>
      <option value="">Select gender...</option>
      <option value="male">Men's</option>
      <option value="female">Women's</option>
    </select>
    <label for="productGender">Gender <span class="required">*</span></label>
  </div>
  <div class="form-group">
    <select id="productCategory" required>
      <option value="">Choose subcategory...</option>
    </select>
    <label for="productCategory">Subcategory <span class="required">*</span></label>
  </div>
  <div class="form-row">
    <div class="form-group">
      <input type="number" id="productPrice" min="1" step="0.01" placeholder="e.g. 4999" required>
      <label for="productPrice">Price (₵) <span class="required">*</span></label>
    </div>
    <div class="form-group">
      <input type="number" id="productStock" min="0" placeholder="e.g. 5" required>
      <label for="productStock">Stock <span class="required">*</span></label>
    </div>
  </div>
  <div class="form-group">
    <textarea id="productDetails" rows="4" placeholder="Describe your product: condition, features, what's included..."></textarea>
    <label for="productDetails">Description (Recommended)</label>
  </div>
`;

const hostelListingForm = `
  <div class="form-group">
    <input type="text" id="hostelName" placeholder="e.g. Platinum Hostel Block A" required>
    <label for="hostelName">Hostel Name <span class="required">*</span></label>
  </div>
  <div class="form-group">
    <input type="text" id="hostelLocation" placeholder="e.g. Behind KNUST Main Gate, Ayeduase" required>
    <label for="hostelLocation">Location <span class="required">*</span></label>
  </div>
  <div class="form-row">
    <div class="form-group">
      <input type="number" id="hostelPrice" min="100" placeholder="e.g. 2500" required>
      <label for="hostelPrice">Price per Semester (₵) <span class="required">*</span></label>
    </div>
    <div class="form-group">
      <select id="roomType" required>
        <option>Single Room</option>
        <option>Double Room</option>
        <option>Triple Room</option>
        <option>Quad Room</option>
      </select>
      <label for="roomType">Room Type <span class="required">*</span></label>
    </div>
  </div>
  <div class="form-group">
    <input type="tel" id="caretakerPhone" placeholder="e.g. 0244567890" required>
    <label for="caretakerPhone">Caretaker Phone <span class="required">*</span></label>
  </div>
  <div class="form-group">
    <select id="availability">
      <option>Available Now</option>
      <option>Next Semester</option>
      <option>Fully Booked</option>
    </select>
    <label for="availability">Availability</label>
  </div>
  <div class="form-group">
    <input type="number" id="distanceFromCampus" step="0.1" min="0" placeholder="e.g. 1.5">
    <label for="distanceFromCampus">Distance from Campus (km)</label>
  </div>
  <div class="form-group">
    <textarea id="hostelDescription" rows="3" placeholder="Describe your hostel: security, water supply, rules, nearby facilities..."></textarea>
    <label for="hostelDescription">Description (Recommended)</label>
  </div>
  <div class="form-group">
    <label>Amenities (select all that apply)</label>
    <div class="amenities-grid">
      <label><input type="checkbox" class="amenity-checkbox" value="WiFi" id="amenity-wifi"> <i class="fas fa-wifi"></i> WiFi</label>
      <label><input type="checkbox" class="amenity-checkbox" value="Water" id="amenity-water"> <i class="fas fa-tint"></i> 24/7 Water</label>
      <label><input type="checkbox" class="amenity-checkbox" value="Electricity" id="amenity-electricity"> <i class="fas fa-bolt"></i> Stable Electricity</label>
      <label><input type="checkbox" class="amenity-checkbox" value="Kitchen" id="amenity-kitchen"> <i class="fas fa-utensils"></i> Kitchen</label>
      <label><input type="checkbox" class="amenity-checkbox" value="Air Conditioning" id="amenity-ac"> <i class="fas fa-snowflake"></i> Air Conditioning</label>
      <label><input type="checkbox" class="amenity-checkbox" value="Washroom Inside" id="amenity-washroom"> <i class="fas fa-bath"></i> Washroom Inside</label>
      <label><input type="checkbox" class="amenity-checkbox" value="Security" id="amenity-security"> <i class="fas fa-shield-alt"></i> 24/7 Security</label>
      <label><input type="checkbox" class="amenity-checkbox" value="Parking" id="amenity-parking"> <i class="fas fa-car"></i> Parking Space</label>
      <label><input type="checkbox" class="amenity-checkbox" value="Study Area" id="amenity-study"> <i class="fas fa-book"></i> Study Area</label>
    </div>
  </div>
`;

// ─────────────────────── DYNAMIC FIELDS DATA ───────────────────────
const dynamicFieldsMap = {
  electronics: {
    laptops: [
      "Brand",
      "Model",
      "Processor",
      "RAM (e.g. 16GB)",
      "Storage (e.g. 512GB SSD)",
      "Screen Size",
      "Graphics Card",
      "Color",
      "Condition",
    ],
    phones: [
      "Brand",
      "Model",
      "Storage (e.g. 128GB)",
      "RAM (e.g. 8GB)",
      "Battery Health (%)",
      "Screen Size",
      "Camera",
      "Color",
      "Condition",
    ],
    tablets: [
      "Brand",
      "Model",
      "Storage (e.g. 128GB)",
      "RAM (e.g. 8GB)",
      "Screen Size",
      "Battery Life (hrs)",
      "Color",
      "Condition",
    ],
    headsets: [
      "Brand",
      "Wired or Wireless",
      "Noise Cancellation",
      "Battery Life (hrs)",
      "Mic Quality",
      "Color",
      "Condition",
    ],
    speakers: [
      "Brand",
      "Battery Life (hrs)",
      "Waterproof",
      "Wattage",
      "Color",
      "Condition",
    ],
    chargers: [
      "Type (e.g. USB-C, Lightning)",
      "Wattage (e.g. 65W)",
      "Length (m)",
      "Original or Generic",
      "Fast Charging",
    ],
    accessories: [
      "Type (Mouse, Keyboard, etc.)",
      "Brand",
      "Connection (Wired/Wireless)",
      "Color",
      "Condition",
    ],
  },
  fashion: {
    shirts: ["Size", "Color", "Material", "Brand", "Gender", "Condition"],
    pants: ["Size", "Color", "Material", "Brand", "Gender", "Condition"],
    shoes: ["Shoe Size (UK/EU)", "Color", "Brand", "Gender", "Material", "Condition"],
    bags: ["Type (Backpack, Handbag, etc.)", "Color", "Material", "Brand", "Gender", "Condition"],
    watches: ["Brand", "Color", "Material", "Gender", "Condition"],
    accessories: ["Type", "Brand", "Color", "Gender", "Material", "Condition"],
    dresses: ["Size", "Color", "Material", "Brand", "Condition"],
    tops: ["Size", "Color", "Material", "Brand", "Condition"],
    skirts: ["Size", "Color", "Material", "Brand", "Condition"],
    jewelry: ["Type", "Material", "Color", "Brand", "Condition"],
  },
};

// ─────────────────────── POPULATE SUBCATEGORY DROPDOWN ───────────────────────
const populateCategoryDropdown = () => {
  const select = document.getElementById("productCategory");
  if (!select) {
    console.error("❌ productCategory select element not found!");
    return;
  }

  select.innerHTML = '<option value="">Choose subcategory...</option>';

  const mainCat = user.productCategory?.toLowerCase();
  if (!mainCat) {
    console.error("❌ user.productCategory not found!");
    return;
  }

  const subCategories = dynamicFieldsMap[mainCat];
  if (!subCategories) {
    console.error(`❌ No subcategories found for ${mainCat}`);
    return;
  }

  Object.keys(subCategories).forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ");
    select.appendChild(opt);
  });

  console.log(
    `✅ Populated ${
      Object.keys(subCategories).length
    } subcategories for ${mainCat}`
  );
};

// ─────────────────────── RENDER DYNAMIC FIELDS ───────────────────────
const renderDynamicFields = (
  mainCat,
  subCat,
  container = document.getElementById("dynamicFieldsContainer"),
  savedData = {}
) => {
  if (!container) return;
  container.innerHTML = "";

  const fields = dynamicFieldsMap[mainCat]?.[subCat] || [];
  if (!fields.length) return;

  fields.forEach((field) => {
    const id = `df_${field.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const label = field;
    let inputHTML = "";

    if (field === "Color") {
      const colorOptions = COLOR_PALETTE.map(
        (c) => `<option value="${c}">${c}</option>`
      ).join("");
      inputHTML = `
        <div style="display:flex;gap:8px;align-items:center">
          <input type="color" id="${id}" value="${
        savedData[field] || "#000000"
      }" list="${id}_list">
          <datalist id="${id}_list">${colorOptions}</datalist>
        </div>`;
    } else if (field === "Condition") {
      inputHTML = `
        <select id="${id}" required>
          <option value="">Select condition...</option>
          <option ${savedData[field] === "New" ? "selected" : ""}>New</option>
          <option ${savedData[field] === "Like New" ? "selected" : ""}>Like New</option>
          <option ${savedData[field] === "Used" ? "selected" : ""}>Used</option>
          <option ${savedData[field] === "Fair" ? "selected" : ""}>Fair</option>
        </select>`;
    } else if (field === "Gender") {
      inputHTML = `
        <select id="${id}">
          <option ${savedData[field] === "Male" ? "selected" : ""}>Male</option>
          <option ${
            savedData[field] === "Female" ? "selected" : ""
          }>Female</option>
        </select>`;
    } else {
      inputHTML = `<input type="text" id="${id}" value="${
        savedData[field] || ""
      }" placeholder="${field}">`;
    }

    const div = document.createElement("div");
    div.className = "form-group";
    div.innerHTML = `<label for="${id}">${label}</label>${inputHTML}`;
    
    // Add data attribute to store original field name
    const input = div.querySelector('input, select');
    if (input) input.setAttribute('data-field-name', field);
    
    container.appendChild(div);
  });
};

// ─────────────────────── OPEN PRODUCT MODAL (WITH DYNAMIC FIELDS) ───────────────────────
const openProductModal = (product = null) => {
  if (!elements) return;

  editingProductId = product?._id || product?.id || null;
  existingImages = product?.images || []; // Store original image paths
  deletedImages = []; // 🔥 ADD THIS LINE - Reset deleted images
  selectedImages = [];

  const isHostel = user.productCategory.toLowerCase().includes("hostel");
  const mainCat = user.productCategory.toLowerCase();

  elements.modalTitle.textContent = editingProductId
    ? isHostel
      ? "Edit Hostel"
      : "Edit Product"
    : isHostel
    ? "Add Hostel"
    : "Add Product";

  elements.modalFormContainer.innerHTML = `
    ${isHostel ? hostelListingForm : regularProductForm}
    <div id="dynamicFieldsContainer" style="margin:20px 0"></div>
    <div style="margin-top:20px">
      <div class="image-upload-drop" id="imageUpload">
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Drag & drop photos or <span id="browseLink">click to browse</span><br>
        <small style="color:#aaa">Min ${
          isHostel ? 4 : 1
        }, Max 10 photos</small></p>
      </div>
      <div id="imagePreview" class="image-preview"></div>
    </div>`;

  elements.productModal.classList.add("open");

  // 🔥 CLEAR ALL FORM STATE
  // Clear all amenity checkboxes
  document.querySelectorAll(".amenity-checkbox").forEach((cb) => {
    cb.checked = false;
  });

  // 🔥 CLEAR IMAGE PREVIEW
  const imagePreview = document.getElementById("imagePreview");
  if (imagePreview) {
    imagePreview.innerHTML = "";
  }

  // 🔥 CRITICAL FIX: Populate categories AFTER DOM is ready
  setTimeout(() => {
    if (!isHostel) {
      const isFashion = user.productCategory.toLowerCase() === 'fashion';
      if (isFashion) {
        const genderContainer = document.getElementById('genderFieldContainer');
        if (genderContainer) genderContainer.style.display = 'block';
      }
      populateCategoryDropdown();

      const categorySelect = document.getElementById("productCategory");
      if (categorySelect) {
        // If editing, populate dynamic fields with saved data
        if (product && product.subCategory) {
          categorySelect.value = product.subCategory;
          const savedDetails = typeof product.details === "string"
            ? JSON.parse(product.details || "{}")
            : product.details || {};
          renderDynamicFields(
            mainCat,
            product.subCategory,
            document.getElementById("dynamicFieldsContainer"),
            savedDetails
          );
          
          // Set onchange AFTER populating to preserve data
          categorySelect.onchange = (e) => {
            renderDynamicFields(mainCat, e.target.value);
          };
        } else {
          // For new products, set onchange immediately
          categorySelect.onchange = (e) => {
            renderDynamicFields(mainCat, e.target.value);
          };
        }
      }
    } else {
      // 🔥 EDIT HOSTEL: Pre-populate hostel form fields
      if (product) {
        $("hostelName").value = product.name || "";
        $("hostelLocation").value = product.location || "";
        $("hostelPrice").value = product.price || "";
        $("roomType").value = product.roomType || "Single Room";
        $("caretakerPhone").value = product.caretakerPhone || "";
        $("availability").value = product.availability || "Available Now";
        $("distanceFromCampus").value = product.distanceFromCampus || "";
        $("hostelDescription").value = product.description || "";

        // Pre-select amenities checkboxes
        const amenities =
          typeof product.amenities === "string"
            ? JSON.parse(product.amenities || "[]")
            : product.amenities || [];
        amenities.forEach((amenity) => {
          const checkbox = document.querySelector(
            `.amenity-checkbox[value="${amenity}"]`
          );
          if (checkbox) checkbox.checked = true;
        });
      }
    }

    // 🔥 EDIT REGULAR PRODUCT: Pre-populate regular product form fields
    if (!isHostel && product) {
      const nameField = $("productName");
      const priceField = $("productPrice");
      const stockField = $("productStock");
      const detailsField = $("productDetails");
      const genderField = $("productGender");

      if (nameField) nameField.value = product.name || "";
      if (priceField) priceField.value = product.price || "";
      if (stockField) stockField.value = product.stock || 0;
      if (detailsField) detailsField.value = product.description || "";
      if (genderField && product.details) {
        const details = typeof product.details === 'string' ? JSON.parse(product.details) : product.details;
        const gender = details.Gender || details.gender;
        if (gender) genderField.value = gender.toLowerCase();
      }
    }
  }, 100);

  // Image upload logic
  const imageUpload = document.getElementById("imageUpload");
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.multiple = true;
  fileInput.style.display = "none";
  imageUpload.appendChild(fileInput);
  imageUpload.onclick = () => fileInput.click();
  document.getElementById("browseLink").onclick = () => fileInput.click();

  ["dragover", "dragleave", "drop"].forEach((ev) => {
    imageUpload.addEventListener(ev, (e) => {
      e.preventDefault();
      imageUpload.classList.toggle("dragover", ev === "dragover");
      if (ev === "drop") {
        const files = Array.from(e.dataTransfer.files).filter((f) =>
          f.type.startsWith("image/")
        );
        if (files.length) handleFiles(files);
      }
    });
  });

  fileInput.onchange = () =>
    fileInput.files.length && handleFiles(Array.from(fileInput.files));

  const addPreview = (file, isExisting = false, originalPath = null) => {
    const imagePreview = document.getElementById("imagePreview");
    if (!imagePreview) return;

    const previewItem = document.createElement("div");
    previewItem.className = "preview-item";
    previewItem.style.cssText = `
    position: relative;
    display: inline-block;
    margin: 5px;
    border: 2px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    width: 100px;
    height: 100px;
  `;

    const img = document.createElement("img");
    img.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: cover;
  `;

    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://api.yourdomain.com';
    img.src = isExisting
      ? `${baseUrl}${file}`
      : URL.createObjectURL(file);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.innerHTML = "×";
    removeBtn.className = "remove-image";
    removeBtn.style.cssText = `
    position: absolute;
    top: 2px;
    right: 2px;
    background: rgba(255,0,0,0.7);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

    removeBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (isExisting && originalPath) {
        existingImages = existingImages.filter((path) => path !== originalPath);
        deletedImages.push(originalPath);
      } else {
        selectedImages = selectedImages.filter((f) => f.name !== file.name);
        URL.revokeObjectURL(img.src);
      }
      previewItem.remove();
    };

    previewItem.appendChild(img);
    previewItem.appendChild(removeBtn);
    imagePreview.appendChild(previewItem);
  };

  const handleFiles = async (files) => {
    const isHostel = user.productCategory.toLowerCase().includes("hostel");
    const minImages = isHostel ? 4 : 1;
    const maxImages = 10;

    const currentTotal = selectedImages.length + existingImages.length;

    if (currentTotal + files.length > maxImages) {
      showToast(`Maximum ${maxImages} photos allowed`, "error");
      return;
    }

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      showToast("Please select valid image files", "error");
      return;
    }

    const webps = await Promise.all(imageFiles.map(toWebP));
    selectedImages.push(...webps);

    webps.forEach((file) => addPreview(file, false));

    const newTotal = selectedImages.length + existingImages.length;
    if (newTotal < minImages) {
      showToast(`Please upload at least ${minImages} photo(s)`, "warning");
    }
  };

  // Display existing images if editing
  if (existingImages.length > 0) {
    existingImages.forEach((imgPath) => {
      addPreview(imgPath, true, imgPath);
    });
  }
};
// ─────────────────────── REST OF YOUR CODE (100% Working) ───────────────────────
const toWebP = (file) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.type === "image/webp")
      return resolve(file);
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          const webpFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".webp"),
            {
              type: "image/webp",
              lastModified: Date.now(),
            }
          );
          resolve(webpFile);
        },
        "image/webp",
        0.85
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
};

const escapeHtml = (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

// Calculate product quality score for trust building
const calculateQualityScore = (product) => {
  let score = 0;
  if (product.images?.length >= 3) score += 25;
  if (product.description?.length > 50) score += 25;
  if (product.details && Object.keys(product.details).length > 3) score += 25;
  if (product.price > 0 && product.stock > 0) score += 25;
  return score;
};

// Create product/hostel card
const createProductCard = (p) => {
  const isHostel =
    p.isHostel || user.productCategory?.toLowerCase().includes("hostel");
  const card = document.createElement("div");
  card.className = "product-card";
  
  const qualityScore = calculateQualityScore(p);
  const scoreColor = qualityScore >= 75 ? '#6ecf45' : qualityScore >= 50 ? '#f39c12' : '#e74c3c';

  const images = p.images || [];
  const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://api.yourdomain.com';
  const mainImageSrc = p.images?.[0] ? `${baseUrl}${p.images[0]}` : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='%23333'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23999' font-size='20' font-family='Arial'%3ENo Image%3C/text%3E%3C/svg%3E";
  const hasMultiple = images.length > 1;

  const thumbnailsHTML = images
    .map(
      (img, i) => `
      <img src="${baseUrl}${img}" class="${
        i === 0 ? "active" : ""
      }" loading="lazy"
           onclick="event.stopPropagation(); 
                    this.closest('.product-card').querySelector('.main-image').src = this.src;
                    this.parentElement.querySelectorAll('img').forEach((el,j)=>el.classList.toggle('active',j===${i}));">
    `
    )
    .join("");

  if (isHostel) {
    const amenities =
      typeof p.amenities === "string"
        ? JSON.parse(p.amenities || "[]")
        : p.amenities || [];
    const amenityIcons = {
      WiFi: "wifi",
      Water: "tint",
      Electricity: "bolt",
      Kitchen: "utensils",
      "Air Conditioning": "snowflake",
      "Washroom Inside": "bath",
      Security: "shield-alt",
      Parking: "car",
      "Study Area": "book",
    };
    const badgeHTML = amenities
      .slice(0, 5)
      .map(
        (a) =>
          `<span class="amenity-badge"><i class="fas fa-${
            amenityIcons[a] || "check"
          }"></i> ${a}</span>`
      )
      .join("");
    const more = amenities.length > 5 ? ` +${amenities.length - 5} more` : "";

    card.innerHTML = `
      <div class="hostel-image-wrapper">
        <div style="position:absolute;top:8px;left:8px;z-index:10;display:flex;gap:6px;">
          <span style="background:${scoreColor};color:#000;padding:4px 10px;border-radius:12px;font-size:0.75rem;font-weight:700;backdrop-filter:blur(8px);"><i class="fas fa-star"></i> ${qualityScore}%</span>
          ${p.deployed ? '<span style="background:#6ecf45;color:#000;padding:4px 10px;border-radius:12px;font-size:0.75rem;font-weight:700;backdrop-filter:blur(8px);"><i class="fas fa-eye"></i> Live</span>' : '<span style="background:#f39c12;color:#000;padding:4px 10px;border-radius:12px;font-size:0.75rem;font-weight:700;backdrop-filter:blur(8px);"><i class="fas fa-clock"></i> Draft</span>'}
        </div>
        <img class="main-image" src="${mainImageSrc}" loading="lazy" alt="${escapeHtml(
      p.name
    )}"
             onclick="event.stopPropagation(); openLightbox(this.src, ${JSON.stringify(
               images
             )})">
        ${hasMultiple ? `<div class="thumbnails">${thumbnailsHTML}</div>` : ""}
        <div class="hostel-badges">
          <span class="badge-room">${p.roomType || "Room"}</span>
          <span class="badge-availability ${
            p.availability?.toLowerCase().includes("available")
              ? "available"
              : "booked"
          }">
            ${p.availability || "Available"}
          </span>
        </div>
      </div>
      <div class="hostel-info">
        <h3>${escapeHtml(p.name || "Unnamed Hostel")}</h3>
        <div class="hostel-location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(
          p.location || "No location"
        )}</div>
        ${
          p.distanceFromCampus
            ? `<div class="hostel-distance"><i class="fas fa-walking"></i> ${p.distanceFromCampus} km from campus</div>`
            : ""
        }
        <div class="hostel-price">₵${Number(p.price).toFixed(
          0
        )} <small>/ semester</small></div>
        <div class="hostel-caretaker"><i class="fas fa-phone"></i> ${escapeHtml(
          p.caretakerPhone || "No contact"
        )}</div>
        <div class="hostel-amenities">${badgeHTML}<span class="amenity-more">${more}</span></div>
      </div>`;
  } else {
    const details =
      typeof p.details === "string"
        ? JSON.parse(p.details || "{}")
        : p.details || {};
    const subCat = (p.subCategory || "").toLowerCase();
    let specsHTML = "";

    const getDetail = (keys) =>
      details[
        Object.keys(details).find((k) =>
          keys.some((key) => k.toLowerCase().includes(key.toLowerCase()))
        )
      ] || "N/A";

    if (subCat.includes("phone")) {
      specsHTML = `
        <div style="font-size:0.95rem;line-height:1.65;margin-top:8px;">
          <div style="font-weight:700;font-size:1.05rem;margin-bottom:4px;">${escapeHtml(
            p.name
          )}</div>
          <div>Brand: <strong>${
            details.brand || getDetail(["brand"])
          }</strong></div>
          <div>Model: <strong>${
            details.model || getDetail(["model"])
          }</strong></div>
          <div>Storage: <strong>${getDetail(["storage", "gb"])}</strong></div>
          <div>RAM: <strong>${getDetail(["ram"])}</strong></div>
          <div>Condition: <strong style="color:#6ecf45;">${getDetail([
            "condition",
          ])}</strong></div>
        </div>`;
    } else if (subCat.includes("laptop")) {
      specsHTML = `
        <div style="font-size:0.95rem;line-height:1.65;margin-top:8px;">
          <div style="font-weight:700;font-size:1.05rem;margin-bottom:4px;">${escapeHtml(
            p.name
          )}</div>
          <div>Brand: <strong>${
            details.brand || getDetail(["brand"])
          }</strong></div>
          <div>Processor: <strong>${getDetail([
            "processor",
            "cpu",
          ])}</strong></div>
          <div>RAM: <strong>${getDetail(["ram"])}</strong></div>
          <div>Storage: <strong>${getDetail([
            "storage",
            "ssd",
            "hdd",
          ])}</strong></div>
          <div>Screen: <strong>${getDetail([
            "screen",
            "display",
            "inch",
          ])}</strong></div>
          <div>Condition: <strong style="color:#6ecf45;">${getDetail([
            "condition",
          ])}</strong></div>
        </div>`;
    } else {
      specsHTML = `
        <div style="font-size:0.95rem;line-height:1.6;margin-top:8px;">
          <div><strong>${escapeHtml(p.name)}</strong></div>
          <div style="color:#aaa;margin-top:8px;">${
            p.subCategory || "Uncategorized"
          }</div>
        </div>`;
    }

    const imageWrapper = document.createElement('div');
    imageWrapper.style.cssText = 'position:relative;';
    
    const trustBadges = document.createElement('div');
    trustBadges.style.cssText = 'position:absolute;top:8px;left:8px;z-index:10;display:flex;gap:6px;';
    trustBadges.innerHTML = `
      <span style="background:${scoreColor};color:#000;padding:4px 10px;border-radius:12px;font-size:0.75rem;font-weight:700;backdrop-filter:blur(8px);"><i class="fas fa-star"></i> ${qualityScore}%</span>
      ${p.deployed ? '<span style="background:#6ecf45;color:#000;padding:4px 10px;border-radius:12px;font-size:0.75rem;font-weight:700;backdrop-filter:blur(8px);"><i class="fas fa-eye"></i> Live</span>' : '<span style="background:#f39c12;color:#000;padding:4px 10px;border-radius:12px;font-size:0.75rem;font-weight:700;backdrop-filter:blur(8px);"><i class="fas fa-clock"></i> Draft</span>'}
    `;
    imageWrapper.appendChild(trustBadges);
    
    const imgElement = document.createElement('img');
    imgElement.className = 'main-image';
    imgElement.alt = escapeHtml(p.name);
    imgElement.src = mainImageSrc;
    console.log('🖼️ Setting image src:', mainImageSrc);
    imgElement.onerror = function() {
      console.error('❌ Image failed to load:', this.src);
      this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="%23333"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="20" font-family="Arial"%3ENo Image%3C/text%3E%3C/svg%3E';
    };
    imgElement.onload = function() {
      console.log('✅ Image loaded successfully:', this.src);
    };
    imgElement.onclick = (e) => {
      e.stopPropagation();
      if (typeof openLightbox === 'function') openLightbox(imgElement.src, images);
    };
    
    imageWrapper.appendChild(imgElement);
    
    if (hasMultiple) {
      const thumbDiv = document.createElement('div');
      thumbDiv.className = 'thumbnails';
      thumbDiv.innerHTML = thumbnailsHTML;
      imageWrapper.appendChild(thumbDiv);
    }
    
    card.appendChild(imageWrapper);
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'product-info';
    infoDiv.style.cssText = 'padding:16px;flex-grow:1;display:flex;flex-direction:column;';
    infoDiv.innerHTML = `
      ${specsHTML}
      <div class="price" style="margin-top:auto;padding-top:12px;font-size:1.4rem;font-weight:bold;">
        ₵${Number(p.price).toFixed(2)}
      </div>
      <div class="stock" style="font-size:0.85rem;color:#ccc;margin-top:4px;">Stock: ${p.stock ?? 0}</div>
    `;
    card.appendChild(infoDiv);
  }

  // Add action buttons
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'product-actions';
  actionsDiv.style.cssText = 'display:flex;gap:8px;padding:12px 16px;background:rgba(0,0,0,0.2);';
  actionsDiv.onclick = (e) => e.stopPropagation();
  
  const deployBtnTitle = p.deployed ? 'Hide from marketplace' : (qualityScore < 75 ? 'Deploy (Quality check recommended)' : 'Deploy to marketplace');
  actionsDiv.innerHTML = `
    <button class="action-btn preview-btn" onclick="event.stopPropagation();window.showProductPreview(${p.id})" style="flex:1;padding:10px;border:none;border-radius:12px;background:#3498db;color:#fff;font-weight:700;cursor:pointer;transition:0.25s;display:flex;align-items:center;justify-content:center;gap:6px;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" title="Preview as buyer">
      <i class="fas fa-eye"></i> Preview
    </button>
    <button class="action-btn edit-btn" onclick="event.stopPropagation();window.openProductModal(${escapeHtml(JSON.stringify(p)).replace(/"/g, '&quot;')})" style="flex:1;padding:10px;border:none;border-radius:12px;background:#fff;color:var(--green);font-weight:700;cursor:pointer;transition:0.25s;display:flex;align-items:center;justify-content:center;gap:6px;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" title="Edit listing">
      <i class="fas fa-edit"></i> Edit
    </button>
    <button class="action-btn deploy-btn" onclick="event.stopPropagation();window.toggleDeploy(${p.id},${p.deployed})" style="flex:1;padding:10px;border:none;border-radius:12px;background:${p.deployed ? '#f39c12' : (qualityScore < 75 ? '#e67e22' : '#6ecf45')};color:${p.deployed ? '#000' : '#fff'};font-weight:700;cursor:pointer;transition:0.25s;display:flex;align-items:center;justify-content:center;gap:6px;${qualityScore < 75 && !p.deployed ? 'box-shadow:0 0 0 2px #e74c3c;' : ''}" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" title="${deployBtnTitle}">
      <i class="fas fa-${p.deployed ? 'eye-slash' : 'rocket'}"></i> ${p.deployed ? 'Hide' : 'Deploy'}
    </button>
  `;
  
  card.appendChild(actionsDiv);
  return card;
};

// Load products with caching and pagination
const loadProducts = async (forceRefresh = false) => {
  if (!elements?.productsGrid) return;
  elements.loader.classList.add("show");
  elements.productsGrid.innerHTML = "";

  try {
    if (forceRefresh) cacheManager.clear('my-products');
    
    let products = await fetchWithCache(
      `${API_BASE}/products/my`,
      { headers: { Authorization: `Bearer ${token}` } },
      'my-products'
    );

    if (user.productCategory?.toLowerCase().includes("hostel")) {
      products = products.filter((p) => p.isHostel);
    }

    allProducts = products;
    console.log('✅ Loaded products:', products.length);
    products.forEach(p => console.log('Product:', p.name, 'Images:', p.images));

    if (!products.length) {
      elements.productsGrid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3rem;">
          <div style="background:rgba(110,207,69,0.1);border:2px dashed #6ecf45;border-radius:16px;padding:2rem;max-width:500px;margin:0 auto;">
            <i class="fas fa-shield-alt" style="font-size:3rem;color:#6ecf45;margin-bottom:1rem;"></i>
            <h3 style="color:#fff;margin-bottom:1rem;">Start Building Your Reputation</h3>
            <p style="color:#aaa;margin-bottom:1.5rem;">List quality products with clear photos and descriptions to earn buyer trust</p>
            <button onclick="window.openProductModal()" style="background:#6ecf45;color:#000;border:none;padding:12px 24px;border-radius:12px;font-weight:700;cursor:pointer;font-size:1rem;">
              <i class="fas fa-plus"></i> Add Your First Product
            </button>
          </div>
        </div>`;
      return;
    }

    productPaginator = new Paginator(products, 20);
    renderProductPage();
  } catch (err) {
    console.error("Load products error:", err);
    elements.productsGrid.innerHTML = `
      <p style="color:#e74c3c;text-align:center;padding:2rem">
        Failed to load products.<br><small>${err.message}</small><br>
        <button onclick="window.loadProducts(true)" style="padding:0.5rem 1rem;background:#3498db;color:white;border:none;border-radius:8px;cursor:pointer">
          Try Again
        </button>
      </p>`;
  } finally {
    elements.loader.classList.remove("show");
  }
};

const renderProductPage = () => {
  if (!productPaginator) return;
  
  const products = productPaginator.getPage();
  const fragment = document.createDocumentFragment();
  
  products.forEach((p) => fragment.appendChild(createProductCard(p)));
  elements.productsGrid.appendChild(fragment);

  if (productPaginator.hasMore()) {
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.textContent = 'Load More';
    loadMoreBtn.style.cssText = 'grid-column:1/-1;padding:1rem 2rem;background:var(--green-light);color:#000;border:none;border-radius:12px;font-weight:bold;cursor:pointer;margin:1rem auto;';
    loadMoreBtn.onclick = () => {
      loadMoreBtn.remove();
      productPaginator.nextPage();
      renderProductPage();
    };
    elements.productsGrid.appendChild(loadMoreBtn);
  }
};

const closeModal = () => {
  if (!elements?.productModal) return;

  // Clean up blob URLs
  document.querySelectorAll("#imagePreview img").forEach((img) => {
    if (img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
  });

  elements.productModal.classList.remove("open");
  editingProductId = null;
  selectedImages = [];
  existingImages = [];
  deletedImages = [];
};

// Show product preview modal after successful listing
const showProductPreviewModal = (product) => {
  const isHostel = product.isHostel || user.productCategory?.toLowerCase().includes('hostel');
  const modal = document.createElement('div');
  modal.className = 'preview-success-modal';
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 10000;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: fadeIn 0.3s ease;
  `;

  const deploymentBadge = product.deployed 
    ? '<span style="background:#6ecf45;color:#000;padding:6px 12px;border-radius:20px;font-size:0.85rem;font-weight:600;"><i class="fas fa-check-circle"></i> Live</span>'
    : '<span style="background:#f39c12;color:#000;padding:6px 12px;border-radius:20px;font-size:0.85rem;font-weight:600;"><i class="fas fa-clock"></i> Draft</span>';

  const imgSrc = product.images?.[0] ? `http://localhost:5000${product.images[0]}` : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="%23333"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="20" font-family="Arial"%3ENo Image%3C/text%3E%3C/svg%3E';

  modal.innerHTML = `
    <div style="background:#1a1a1a;border-radius:20px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
      <div style="padding:2rem;text-align:center;border-bottom:1px solid #2a2a2a;">
        <div style="width:80px;height:80px;background:#6ecf45;border-radius:50%;margin:0 auto 1rem;display:grid;place-items:center;animation:scaleIn 0.5s ease;">
          <i class="fas fa-check" style="font-size:2.5rem;color:#000;"></i>
        </div>
        <h2 style="color:#fff;margin-bottom:0.5rem;font-size:1.75rem;">🎉 ${isHostel ? 'Hostel' : 'Product'} Listed Successfully!</h2>
        <p style="color:#aaa;font-size:0.95rem;">Your listing is now ${product.deployed ? 'live and visible to buyers' : 'saved as draft'}</p>
      </div>

      <div style="padding:2rem;">
        <div style="background:#0f0f0f;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;margin-bottom:1.5rem;">
          <img src="${imgSrc}" style="width:100%;height:250px;object-fit:cover;" alt="${escapeHtml(product.name)}">
          <div style="padding:1.5rem;">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem;">
              <h3 style="color:#fff;font-size:1.25rem;margin:0;flex:1;">${escapeHtml(product.name)}</h3>
              ${deploymentBadge}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem;">
              <div style="font-size:1.75rem;font-weight:700;color:#6ecf45;">₵${Number(product.price).toLocaleString()}</div>
              ${!isHostel ? `<div style="color:#aaa;font-size:0.9rem;">Stock: ${product.stock || 0}</div>` : ''}
            </div>
            ${product.subCategory ? `<div style="color:#aaa;font-size:0.9rem;margin-top:0.5rem;"><i class="fas fa-tag"></i> ${product.subCategory}</div>` : ''}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem;">
          <button onclick="window.location.href='../Dex-product-details.html?id=${escapeHtml(String(product.id))}'" style="background:#6ecf45;color:#000;border:none;padding:1rem;border-radius:10px;font-weight:600;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:0.5rem;transition:0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
            <i class="fas fa-eye" style="font-size:1.5rem;"></i>
            <span style="font-size:0.85rem;">Preview</span>
          </button>
          <button onclick="document.querySelector('.preview-success-modal').remove();window.openProductModal()" style="background:#3498db;color:#fff;border:none;padding:1rem;border-radius:10px;font-weight:600;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:0.5rem;transition:0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
            <i class="fas fa-plus" style="font-size:1.5rem;"></i>
            <span style="font-size:0.85rem;">List Another</span>
          </button>
          <button onclick="document.querySelector('.preview-success-modal').remove()" style="background:#2a2a2a;color:#fff;border:none;padding:1rem;border-radius:10px;font-weight:600;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:0.5rem;transition:0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
            <i class="fas fa-th" style="font-size:1.5rem;"></i>
            <span style="font-size:0.85rem;">Dashboard</span>
          </button>
        </div>

        <div style="background:rgba(110,207,69,0.1);border:1px solid #6ecf45;border-radius:10px;padding:1rem;text-align:center;">
          <div style="color:#6ecf45;font-weight:600;margin-bottom:0.5rem;"><i class="fas fa-chart-line"></i> Quick Stats</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:0.75rem;">
            <div>
              <div style="font-size:1.5rem;font-weight:700;color:#fff;">${allProducts.length + 1}</div>
              <div style="font-size:0.75rem;color:#aaa;">Total Listings</div>
            </div>
            <div>
              <div style="font-size:1.5rem;font-weight:700;color:#fff;">${product.images?.length || 0}</div>
              <div style="font-size:0.75rem;color:#aaa;">Photos</div>
            </div>
            <div>
              <div style="font-size:1.5rem;font-weight:700;color:#fff;">0</div>
              <div style="font-size:0.75rem;color:#aaa;">Views</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
  `;
  document.head.appendChild(style);

  // Close on overlay click
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
};

const initProducts = (deps) => {
  console.log("🚀 initProducts called with:", deps);
  console.log("👤 User productCategory:", deps.user?.productCategory);
  ({
    elements,
    user,
    token,
    API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://api.yourdomain.com/api',
    notificationSystem,
    showToast = console.log,
  } = deps);
  window.loadProducts = loadProducts;
  window.openProductModal = openProductModal;

  loadProducts();

  elements.addProductBtn.onclick = () => openProductModal();
  elements.closeModalBtn.onclick = closeModal;
  elements.cancelProductBtn.onclick = closeModal;

  let saveHandler = async () => {
    const isHostel = user.productCategory.toLowerCase().includes("hostel");

    // COLLECT DYNAMIC DETAILS FIRST
    let dynamicDetails = {};
    if (!isHostel) {
      const isFashion = user.productCategory.toLowerCase() === 'fashion';
      if (isFashion) {
        const genderField = $("productGender");
        if (!genderField?.value) return showToast("Please select gender", "error");
        dynamicDetails.Gender = genderField.value === 'male' ? 'Male' : 'Female';
      }
      const dynamicContainer = document.getElementById("dynamicFieldsContainer");
      if (dynamicContainer && dynamicContainer.children.length > 0) {
        document.querySelectorAll("#dynamicFieldsContainer input, #dynamicFieldsContainer select").forEach((el) => {
            const key = el.getAttribute('data-field-name');
            if (key && key !== 'Gender' && el.value.trim()) dynamicDetails[key] = el.value.trim();
          });
      }
    }

    // NOW BUILD PAYLOAD
    const payload = isHostel
      ? {
          name: $("hostelName")?.value.trim(),
          location: $("hostelLocation")?.value.trim(),
          caretakerPhone: $("caretakerPhone")?.value.trim(),
          price: parseFloat($("hostelPrice")?.value) || 0,
          roomType: $("roomType")?.value,
          availability: $("availability")?.value || "Available Now",
          distanceFromCampus:
            parseFloat($("distanceFromCampus")?.value) || null,
          description: $("hostelDescription")?.value.trim(),
          amenities: JSON.stringify(
            Array.from(
              document.querySelectorAll(".amenity-checkbox:checked")
            ).map((cb) => cb.value)
          ),
          isHostel: true,
          category: "Hostels",
        }
      : {
          name: $("productName")?.value.trim(),
          category:
            user.productCategory.toLowerCase() === "electronics"
              ? "electronics"
              : "fashion",
          subCategory: $("productCategory")?.value.toLowerCase(),
          price: parseFloat($("productPrice")?.value) || 0,
          stock: parseInt($("productStock")?.value) || 0,
          description: $("productDetails")?.value.trim(),
        };

    // Only include details if we have dynamic fields OR if we're editing (to preserve existing details)
    console.log("🔍 Dynamic details collected:", dynamicDetails);
    if (!isHostel && Object.keys(dynamicDetails).length > 0) {
      payload.details = JSON.stringify(dynamicDetails);
      console.log("✅ Sending details:", payload.details);
    } else {
      console.log("⚠️ No details to send (will preserve existing)");
    }

    const totalImages = selectedImages.length + existingImages.length;
    if (totalImages < (isHostel ? 4 : 1))
      return showToast(
        `Please upload at least ${isHostel ? 4 : 1} photo(s)`,
        "error"
      );
    if (totalImages > 10)
      return showToast("Maximum 10 photos allowed", "error");

    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => fd.append(k, v ?? ""));
    selectedImages.forEach((f) => fd.append("images", f));
    fd.append("existingImages", JSON.stringify(existingImages));
    fd.append("deletedImages", JSON.stringify(deletedImages)); // 🔥 ADD THIS LINE

    const url = editingProductId
      ? `${API_BASE}/products/${isHostel ? "hostel/" : ""}${editingProductId}`
      : `${API_BASE}/products/${isHostel ? "hostel/" : ""}add`;

    try {
      elements.saveText.style.display = "none";
      elements.savingText.style.display = "inline";
      elements.saveProductBtn.disabled = true;

      const res = await fetch(url, {
        method: editingProductId ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok)
        throw new Error(
          (await res.json().catch(() => ({}))).message || "Save failed"
        );

      const savedProduct = await res.json();
      closeModal();
      loadProducts(true); // Force refresh after save
      
      // Show success modal with preview
      if (!editingProductId) {
        showProductPreviewModal(savedProduct);
      } else {
        notificationSystem?.show?.("Updated!", "success");
      }
    } catch (err) {
      showToast(err.message || "Failed to save", "error");
    } finally {
      elements.saveText.style.display = "inline";
      elements.savingText.style.display = "none";
      elements.saveProductBtn.disabled = false;
    }
  };

  elements.saveProductBtn.onclick = saveHandler;

  document.addEventListener("click", (e) => {
    if (
      elements.productModal.classList.contains("open") &&
      !elements.productModal.contains(e.target) &&
      e.target !== elements.addProductBtn &&
      !e.target.closest(".edit-btn")
    ) {
      closeModal();
    }
  });

  console.log("Products module initialized — 100% safe & working");
};

// Show product preview modal (for existing products)
const showProductPreview = async (productId) => {
  const product = allProducts.find(p => p.id === productId || p._id === productId);
  if (!product) return showToast('Product not found', 'error');
  
  const isHostel = product.isHostel || user.productCategory?.toLowerCase().includes('hostel');
  const modal = document.createElement('div');
  modal.className = 'preview-modal-overlay';
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 10000;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: fadeIn 0.3s ease;
  `;

  const deploymentBadge = product.deployed 
    ? '<span style="background:#6ecf45;color:#000;padding:6px 12px;border-radius:20px;font-size:0.85rem;font-weight:600;"><i class="fas fa-check-circle"></i> Live</span>'
    : '<span style="background:#f39c12;color:#000;padding:6px 12px;border-radius:20px;font-size:0.85rem;font-weight:600;"><i class="fas fa-clock"></i> Draft</span>';

  const imgSrc = product.images?.[0] ? `http://localhost:5000${product.images[0]}` : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="%23333"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="20" font-family="Arial"%3ENo Image%3C/text%3E%3C/svg%3E';

  modal.innerHTML = `
    <div style="background:#1a1a1a;border-radius:20px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
      <div style="padding:2rem;text-align:center;border-bottom:1px solid #2a2a2a;">
        <h2 style="color:#fff;margin-bottom:0.5rem;font-size:1.75rem;">📦 Product Preview</h2>
        <p style="color:#aaa;font-size:0.95rem;">This is how buyers will see your listing</p>
      </div>

      <div style="padding:2rem;">
        <div style="background:#0f0f0f;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;margin-bottom:1.5rem;">
          <img src="${imgSrc}" style="width:100%;height:250px;object-fit:cover;" alt="${escapeHtml(product.name)}">
          <div style="padding:1.5rem;">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem;">
              <h3 style="color:#fff;font-size:1.25rem;margin:0;flex:1;">${escapeHtml(product.name)}</h3>
              ${deploymentBadge}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem;">
              <div style="font-size:1.75rem;font-weight:700;color:#6ecf45;">₵${Number(product.price).toLocaleString()}</div>
              ${!isHostel ? `<div style="color:#aaa;font-size:0.9rem;">Stock: ${product.stock || 0}</div>` : ''}
            </div>
            ${product.subCategory ? `<div style="color:#aaa;font-size:0.9rem;margin-top:0.5rem;"><i class="fas fa-tag"></i> ${product.subCategory}</div>` : ''}
            ${product.description ? `<div style="color:#ccc;font-size:0.9rem;margin-top:1rem;line-height:1.6;">${escapeHtml(product.description)}</div>` : ''}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin-bottom:1rem;">
          <button onclick="window.location.href='../Dex-product-details.html?id=${escapeHtml(String(product.id))}'" style="background:#3498db;color:#fff;border:none;padding:1rem;border-radius:10px;font-weight:600;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:0.5rem;transition:0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
            <i class="fas fa-external-link-alt" style="font-size:1.5rem;"></i>
            <span style="font-size:0.85rem;">View as Buyer</span>
          </button>
          <button onclick="document.querySelector('.preview-modal-overlay').remove();window.openProductModal(${escapeHtml(JSON.stringify(product)).replace(/"/g, '&quot;')})" style="background:#6ecf45;color:#000;border:none;padding:1rem;border-radius:10px;font-weight:600;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:0.5rem;transition:0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
            <i class="fas fa-edit" style="font-size:1.5rem;"></i>
            <span style="font-size:0.85rem;">Edit Product</span>
          </button>
        </div>
        
        <button onclick="window.toggleDeploy(${escapeHtml(String(product.id))},${Boolean(product.deployed)}).then(()=>document.querySelector('.preview-modal-overlay').remove())" style="width:100%;background:${product.deployed ? '#f39c12' : '#27ae60'};color:#fff;border:none;padding:1rem;border-radius:10px;font-weight:600;cursor:pointer;margin-bottom:1rem;transition:0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
          <i class="fas fa-${product.deployed ? 'eye-slash' : 'rocket'}"></i> ${product.deployed ? 'Hide from Buyers' : 'Deploy to Marketplace'}
        </button>

        <button onclick="document.querySelector('.preview-modal-overlay').remove()" style="width:100%;background:#2a2a2a;color:#fff;border:none;padding:1rem;border-radius:10px;font-weight:600;cursor:pointer;transition:0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
          <i class="fas fa-times"></i> Close Preview
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
};

// Show safety check dialog
const showSafetyCheckDialog = (product, qualityScore, onProceed) => {
  const issues = [];
  if (product.images?.length < 3) issues.push('Add more photos (min 3 recommended)');
  if (!product.description || product.description.length < 50) issues.push('Write detailed description (50+ characters)');
  if (!product.details || Object.keys(product.details).length < 3) issues.push('Fill product specifications (3+ fields)');
  
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.3s;';
  
  modal.innerHTML = `
    <div style="background:#1a1a1a;border-radius:20px;max-width:500px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:2px solid ${qualityScore < 50 ? '#e74c3c' : '#f39c12'};">
      <div style="padding:2rem;text-align:center;border-bottom:1px solid #2a2a2a;">
        <div style="width:80px;height:80px;background:${qualityScore < 50 ? '#e74c3c' : '#f39c12'};border-radius:50%;margin:0 auto 1rem;display:grid;place-items:center;">
          <i class="fas fa-shield-alt" style="font-size:2.5rem;color:#000;"></i>
        </div>
        <h2 style="color:#fff;margin-bottom:0.5rem;font-size:1.5rem;">⚠️ Safety Check</h2>
        <p style="color:#aaa;font-size:0.95rem;">Quality Score: <strong style="color:${qualityScore < 50 ? '#e74c3c' : '#f39c12'};">${qualityScore}%</strong></p>
      </div>
      
      <div style="padding:2rem;">
        <div style="background:rgba(231,76,60,0.1);border:1px solid #e74c3c;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;">
          <h3 style="color:#e74c3c;margin:0 0 1rem;font-size:1.1rem;"><i class="fas fa-exclamation-triangle"></i> To Build Trust with Buyers:</h3>
          <ul style="margin:0;padding-left:1.5rem;color:#ccc;line-height:1.8;">
            ${issues.map(issue => `<li>${issue}</li>`).join('')}
          </ul>
        </div>
        
        <div style="background:rgba(110,207,69,0.1);border:1px solid #6ecf45;border-radius:12px;padding:1rem;margin-bottom:1.5rem;">
          <p style="color:#6ecf45;margin:0;font-size:0.9rem;"><i class="fas fa-lightbulb"></i> <strong>Tip:</strong> High-quality listings get 3x more views and build your reputation faster!</p>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <button id="safetyCheckCancel" style="background:#2a2a2a;color:#fff;border:none;padding:1rem;border-radius:12px;font-weight:600;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='#333'" onmouseout="this.style.background='#2a2a2a'">
            <i class="fas fa-edit"></i> Improve First
          </button>
          <button id="safetyCheckProceed" style="background:#f39c12;color:#000;border:none;padding:1rem;border-radius:12px;font-weight:600;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='#e67e22'" onmouseout="this.style.background='#f39c12'">
            <i class="fas fa-rocket"></i> Deploy Anyway
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('#safetyCheckCancel').onclick = () => modal.remove();
  modal.querySelector('#safetyCheckProceed').onclick = () => {
    modal.remove();
    onProceed();
  };
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
};

// Toggle product deployment status with safety checklist
const toggleDeploy = async (productId, currentStatus) => {
  const product = allProducts.find(p => p.id === productId);
  
  if (!currentStatus && product) {
    const qualityScore = calculateQualityScore(product);
    if (qualityScore < 75) {
      showSafetyCheckDialog(product, qualityScore, () => deployProduct(productId, currentStatus));
      return;
    }
  }
  
  deployProduct(productId, currentStatus);
};

const deployProduct = async (productId, currentStatus) => {
  try {
    const res = await fetch(`${API_BASE}/products/${productId}/deploy`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ deployed: !currentStatus })
    });
    
    if (!res.ok) throw new Error('Failed to update deployment status');
    
    showToast(currentStatus ? 'Product hidden from buyers' : '✅ Product deployed! Building your reputation...', 'success');
    loadProducts(true);
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// Make functions globally accessible
window.showProductPreview = showProductPreview;
window.toggleDeploy = toggleDeploy;
window.showSafetyCheckDialog = showSafetyCheckDialog;

// Export
export {
  initProducts,
  loadProducts,
  openProductModal,
  closeModal,
  createProductCard,
  showProductPreviewModal,
  showProductPreview,
  toggleDeploy,
};
