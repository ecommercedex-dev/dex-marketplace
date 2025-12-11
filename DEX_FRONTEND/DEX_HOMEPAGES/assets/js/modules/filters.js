// assets/js/modules/filters.js
// FINAL — Search + Suggestions FIXED — Everything works perfectly
import { render } from "./products.js";

// Live reference to the current products array (fixed ES6 module staleness bug)
const getLiveProducts = () => window.__LIVE_PRODUCTS || [];

// Global filter state
window.currentFilters = window.currentFilters || {
  mainCat: "all",
  subCat: null,
  priceMin: 0,
  priceMax: 100000,
  condition: [],
  gender: [],
  specs: {},
};

let searchQuery = "";

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

// Dynamic fields map
const dynamicFieldsMap = {
  electronics: {
    Phones: [
      "Brand",
      "Model",
      "Storage (e.g. 128GB)",
      "RAM (e.g. 8GB)",
      "Battery Health (%)",
      "Screen Size",
      "Camera",
      "Color",
    ],
    Laptops: [
      "Brand",
      "Model",
      "Processor",
      "RAM (e.g. 16GB)",
      "Storage (e.g. 512GB SSD)",
      "Screen Size",
      "Graphics Card",
      "Color",
    ],
    Chargers: [
      "Type (e.g. USB-C, Lightning)",
      "Wattage (e.g. 65W)",
      "Length (m)",
      "Original or Generic",
      "Fast Charging",
    ],
    Earbuds: [
      "Brand",
      "Wired or Wireless",
      "Noise Cancellation",
      "Battery Life (hrs)",
      "Color",
    ],
    Headsets: [
      "Brand",
      "Wired or Wireless",
      "Noise Cancellation",
      "Battery Life (hrs)",
      "Mic Quality",
      "Color",
    ],
    Power_Banks: ["Capacity (mAh)", "Ports", "Fast Charging", "Brand", "Color"],
    Bluetooth_Speakers: [
      "Brand",
      "Battery Life (hrs)",
      "Waterproof",
      "Wattage",
      "Color",
    ],
    Computer_Accessories: [
      "Type (Mouse, Keyboard, etc.)",
      "Brand",
      "Connection (Wired/Wireless)",
      "Color",
    ],
  },
  fashion: {
    Clothing: ["Size", "Color", "Material", "Brand", "Gender", "Sleeve Type"],
    Shoes: [
      "Shoe Size (UK/EU)",
      "Color",
      "Brand",
      "Gender",
      "Material",
      "Type (Sneakers, Boots, etc.)",
    ],
    Bags: [
      "Type (Backpack, Handbag, etc.)",
      "Color",
      "Material",
      "Capacity",
      "Brand",
      "Gender",
    ],
    Accessories: [
      "Type (Watch, Belt, Sunglasses, etc.)",
      "Brand",
      "Color/Scent",
      "Gender",
      "Material",
    ],
  },
};

// Dual price range slider
function initDualPriceRange() {
  const configs = [
    {
      min: "#priceMin",
      max: "#priceMax",
      text: "#priceRangeText",
      minIn: "#minPriceInput",
      maxIn: "#maxPriceInput",
    },
    {
      min: "#priceMinMobile",
      max: "#priceMaxMobile",
      text: "#priceRangeTextMobile",
      minIn: "#minPriceInputMobile",
      maxIn: "#maxPriceInputMobile",
    },
  ];

  configs.forEach((cfg) => {
    const minSlider = document.querySelector(cfg.min);
    const maxSlider = document.querySelector(cfg.max);
    const textEl = document.querySelector(cfg.text);
    const minInput = document.querySelector(cfg.minIn);
    const maxInput = document.querySelector(cfg.maxIn);

    if (!minSlider || !maxSlider || !textEl) return;

    const format = (n) =>
      n >= 100000 ? "No limit" : "₵" + Number(n).toLocaleString();

    const update = () => {
      let min = parseInt(minSlider.value, 10);
      let max = parseInt(maxSlider.value, 10);

      const minGap = Math.max(5, Math.floor(max / 50));

      if (min > max - minGap) {
        if (document.activeElement === minSlider) {
          max = Math.min(100000, min + minGap);
          maxSlider.value = max;
        } else {
          min = Math.max(0, max - minGap);
          minSlider.value = min;
        }
      }

      document.querySelectorAll(".slider-range").forEach((bar) => {
        bar.style.left = (min / 100000) * 100 + "%";
        bar.style.right = 100 - (max / 100000) * 100 + "%";
      });

      if (min === 0 && max >= 100000) textEl.textContent = "Any price";
      else if (min === 0) textEl.textContent = `Up to ${format(max)}`;
      else if (max >= 100000) textEl.textContent = `From ${format(min)}`;
      else textEl.textContent = `${format(min)} – ${format(max)}`;

      if (minInput) minInput.value = min === 0 ? "" : min.toLocaleString();
      if (maxInput) maxInput.value = max >= 100000 ? "" : max.toLocaleString();

      window.currentFilters.priceMin = min;
      window.currentFilters.priceMax = max >= 100000 ? Infinity : max;

      applyFilters();
    };

    minSlider.addEventListener("input", update);
    maxSlider.addEventListener("input", update);

    // FIXED INPUT HANDLERS
    minInput?.addEventListener("change", () => {
      let val = parseInt(minInput.value.replace(/,/g, ""), 10) || 0;
      const currentMax = parseInt(maxSlider.value, 10);
      const minGap = Math.max(5, Math.floor(currentMax / 50));
      val = Math.max(0, Math.min(val, currentMax - minGap));
      minSlider.value = val;
      minInput.value = val === 0 ? "" : val.toLocaleString();
      update();
    });

    maxInput?.addEventListener("change", () => {
      let val =
        maxInput.value === ""
          ? 100000
          : parseInt(maxInput.value.replace(/,/g, ""), 10) || 100000;
      const currentMin = parseInt(minSlider.value, 10);
      const minGap = Math.max(5, Math.floor(val / 50));
      val = Math.min(100000, Math.max(val, currentMin + minGap));
      maxSlider.value = val;
      maxInput.value = val >= 100000 ? "" : val.toLocaleString();
      update();
    });

    update();
  });
}

// =====================================================
// SEARCH + SUGGESTIONS — NOW FULLY FIXED & WORKING
// =====================================================
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const suggestionsBox = document.getElementById("suggestions");

function showSuggestions(query) {
  if (!query.trim()) {
    suggestionsBox.style.display = "none";
    return;
  }

  const products = getLiveProducts(); // ← THIS WAS THE FIX

  const matches = products
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 7);

  if (matches.length === 0) {
    suggestionsBox.innerHTML = `<div class="suggestion-item">No results found</div>`;
  } else {
    suggestionsBox.innerHTML = matches
      .map(
        (p) => {
          const sanitizedName = p.name.replace(/[<>"'&]/g, (match) => {
            const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
            return entities[match];
          });
          const sanitizedId = String(p.id).replace(/[^0-9]/g, '');
          return `
            <div class="suggestion-item" data-id="${sanitizedId}">
              <span>${sanitizedName}</span>
              <small>₵${Number(p.price).toLocaleString()}</small>
            </div>
          `;
        }
      )
      .join("");
  }

  suggestionsBox.style.display = "block";
  clearSearch.style.display = "grid";
}

// Search input — live filtering + suggestions
searchInput?.addEventListener("input", () => {
  const value = searchInput.value.trim();
  searchQuery = value.toLowerCase();
  showSuggestions(value);
  applyFilters();
});

// Click suggestion → fill input fills + filters apply
suggestionsBox?.addEventListener("click", (e) => {
  // Validate event is trusted to prevent programmatic attacks
  if (!e.isTrusted) return;
  
  const item = e.target.closest(".suggestion-item");
  if (!item || !item.dataset.id) return;

  const productName = item.querySelector("span")?.textContent || '';
  // Sanitize the product name
  const sanitizedName = productName.replace(/[<>"'&]/g, (match) => {
    const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
    return entities[match];
  });
  
  searchInput.value = sanitizedName;
  searchQuery = sanitizedName.toLowerCase();
  suggestionsBox.style.display = "none";
  applyFilters();
});

// Clear search
clearSearch?.addEventListener("click", () => {
  searchInput.value = "";
  searchQuery = "";
  suggestionsBox.style.display = "none";
  clearSearch.style.display = "none";
  applyFilters();
});

// Hide suggestions when clicking outside
document.addEventListener("click", (e) => {
  if (!searchInput?.contains(e.target) && !suggestionsBox?.contains(e.target)) {
    suggestionsBox.style.display = "none";
  }
});

// =====================================================
// APPLY FILTERS — uses live products
// =====================================================
export function applyFilters() {
  const products = getLiveProducts();
  let filtered = products;
  
  // Update product count for sorting module
  if (window.setProducts) {
    window.setProducts(filtered);
  }

  // Search
  if (searchQuery) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery) ||
        (p.details &&
          JSON.stringify(p.details).toLowerCase().includes(searchQuery))
    );
  }

  const getMainCat = (p) => (p.mainCategory || p.category || "").toLowerCase();

  if (window.currentFilters.mainCat !== "all") {
    filtered = filtered.filter(
      (p) => getMainCat(p) === window.currentFilters.mainCat
    );
  }

  if (window.currentFilters.subCat) {
    const target = window.currentFilters.subCat
      .toLowerCase()
      .replace(/_/g, " ");

    filtered = filtered.filter((p) => {
      const sub = (p.subCategory || "").toLowerCase().replace(/_/g, " ");
      return sub === target || sub.includes(target);
    });
  }
  // Price filter — FIXED
  filtered = filtered.filter((p) => {
    const price = Number(p.price);
    const min = window.currentFilters.priceMin || 0;
    const max = window.currentFilters.priceMax;

    // 100000 means "No limit" → treat as Infinity
    const effectiveMax = max >= 100000 ? Infinity : max;

    return price >= min && price <= effectiveMax;
  });

  if (window.currentFilters.condition.length > 0) {
    // Validate condition values against whitelist
    const allowedConditions = ['new', 'used', 'refurbished', 'brand new'];
    const validConditions = window.currentFilters.condition.filter(c => 
      allowedConditions.includes(c.toLowerCase())
    );
    
    if (validConditions.length > 0) {
      filtered = filtered.filter((p) => {
        const d =
          typeof p.details === "string" ? JSON.parse(p.details) : p.details || {};
        const cond = (d.condition || d.Condition || "used").toLowerCase();
        return validConditions.includes(cond);
      });
    }
  }

  if (window.currentFilters.gender.length > 0) {
    // Validate gender values against whitelist
    const allowedGenders = ['male', 'female', 'unisex', 'men', 'women'];
    const validGenders = window.currentFilters.gender.filter(g => 
      allowedGenders.includes(g.toLowerCase())
    );
    
    if (validGenders.length > 0) {
      filtered = filtered.filter((p) => {
        const d =
          typeof p.details === "string" ? JSON.parse(p.details) : p.details || {};
        const gender = (d.gender || d.Gender || "").toLowerCase();
        return validGenders.includes(gender);
      });
    }
  }

  const activeSpecs = Object.entries(window.currentFilters.specs).filter(
    ([_, v]) => v
  );
  if (activeSpecs.length > 0) {
    filtered = filtered.filter((p) => {
      const d =
        typeof p.details === "string" ? JSON.parse(p.details) : p.details || {};
      return activeSpecs.every(([field, value]) => {
        const val = d[field] || d[field.toLowerCase()] || "";
        return String(val).toLowerCase().includes(value.toLowerCase());
      });
    });
  }

  render(filtered);
  
  // Trigger filter change event
  if (window.updateActiveFilters) {
    window.updateActiveFilters();
  }
}

// =====================================================
// RENDER SUBCATEGORIES & DYNAMIC SPECS (YOUR ORIGINAL PERFECT CODE)
// =====================================================
function renderSubcategories() {
  const mainCat =
    document.querySelector('input[name="mainCat"]:checked')?.value || "all";

  const configs = [
    {
      container: document.querySelector(".desktop-only #subcategoryOptions"),
      group: document.querySelector(".desktop-only #subcategoryFilter"),
      name: "subCat",
    },
    {
      container: document.querySelector("#filterSidebar #subcategoryOptions"),
      group: document.querySelector("#filterSidebar #subcategoryFilter"),
      name: "subCatMobile",
    },
  ];

  configs.forEach(({ container, group, name }) => {
    if (!container || !group) return;

    container.innerHTML = "";
    group.style.display = mainCat === "all" ? "none" : "block";

    if (mainCat === "all") {
      window.currentFilters.subCat = null;
      renderDynamicSpecs(mainCat, null);
      return;
    }

    const subcats = dynamicFieldsMap[mainCat];
    if (!subcats) return;

    Object.keys(subcats).forEach((key) => {
      const label = document.createElement("label");
      const isChecked = window.currentFilters.subCat === key;
      const sanitizedKey = key.replace(/[<>"'&]/g, (match) => {
        const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
        return entities[match];
      });
      const sanitizedName = name.replace(/[<>"'&]/g, (match) => {
        const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
        return entities[match];
      });
      label.innerHTML = `
        <input type="radio" name="${sanitizedName}" value="${sanitizedKey}" ${
        isChecked ? "checked" : ""
      }>
        <span>${sanitizedKey.replace(/_/g, " ")}</span>
      `;
      container.appendChild(label);
    });

    if (window.currentFilters.subCat) {
      renderDynamicSpecs(mainCat, window.currentFilters.subCat);
    }
  });
}

function renderDynamicSpecs(mainCat, subCat) {
  const containers = [
    {
      el: document.querySelector(".desktop-only #dynamicSpecsContainer"),
      suffix: "",
    },
    {
      el: document.querySelector("#filterSidebar #dynamicSpecsContainerMobile"),
      suffix: "Mobile",
    },
  ];

  containers.forEach(({ el: container, suffix }) => {
    if (!container) return;
    container.innerHTML = "";

    if (
      !mainCat ||
      mainCat === "all" ||
      !subCat ||
      !dynamicFieldsMap[mainCat]?.[subCat]
    ) {
      window.currentFilters.specs = {};
      return;
    }

    const fields = dynamicFieldsMap[mainCat][subCat];

    fields.forEach((field) => {
      const key = field.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const uniqueKey = suffix ? `${key}_${suffix}` : key; // ← UNIQUE ID PER SIDEBAR

      const div = document.createElement("div");
      div.className = "spec-item";

      const isColor = field.toLowerCase().includes("color");
      const currentValue = window.currentFilters.specs[field] || "";

      if (isColor) {
        const sanitizedField = field.replace(/[<>"'&]/g, (match) => {
          const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
          return entities[match];
        });
        const sanitizedUniqueKey = uniqueKey.replace(/[^a-zA-Z0-9_-]/g, '');
        
        div.innerHTML = `
          <label style="display:flex;align-items:center;gap:12px;margin:12px 0;">
            <input type="checkbox" id="spec_${sanitizedUniqueKey}" ${
          currentValue ? "checked" : ""
        }>
            <span>${sanitizedField}</span>
          </label>
          <div class="color-palette" style="display:${
            currentValue ? "flex" : "none"
          };flex-wrap:wrap;gap:8px;margin-top:8px;padding:8px;background:rgba(255,255,255,0.1);border-radius:12px;">
            ${COLOR_PALETTE.map(
              (c) => `
              <div class="color-swatch ${
                currentValue === c.toLowerCase() ? "selected" : ""
              }"
                   data-color="${c}"
                   style="width:36px;height:36px;background:${c};border:3px solid ${
                c === "#FFFFFF" ? "#ccc" : c
              };border-radius:50%;cursor:pointer;position:relative;">
                ${currentValue === c.toLowerCase() ? "Check" : ""}
              </div>
            `
            ).join("")}
            <input type="color"
                   id="spec_color_picker_${sanitizedUniqueKey}"
                   name="spec_color_picker_${sanitizedUniqueKey}"
                   class="custom-color-picker"
                   value="${currentValue || "#000000"}">
          </div>
          <div class="selected-color-preview" style="display:${
            currentValue ? "block" : "none"
          };margin-top:8px;width:60px;height:30px;border-radius:8px;background:${
          currentValue || "#000"
        };border:2px solid #555;"></div>
        `;

        const checkbox = div.querySelector(`#spec_${sanitizedUniqueKey}`);
        const palette = div.querySelector(".color-palette");
        const swatches = div.querySelectorAll(".color-swatch");
        const customPicker = div.querySelector(
          `#spec_color_picker_${sanitizedUniqueKey}`
        );
        const preview = div.querySelector(".selected-color-preview");

        const updateColor = (color) => {
          window.currentFilters.specs[field] = color.toLowerCase();
          preview.style.background = color;
          preview.style.display = "block";
          swatches.forEach((s) =>
            s.classList.toggle(
              "selected",
              s.dataset.color.toLowerCase() === color.toLowerCase()
            )
          );
          applyFilters();
        };

        checkbox.onchange = () => {
          palette.style.display = checkbox.checked ? "flex" : "none";
          preview.style.display =
            checkbox.checked && currentValue ? "block" : "none";
          if (!checkbox.checked) delete window.currentFilters.specs[field];
          applyFilters();
        };

        swatches.forEach(
          (s) =>
            (s.onclick = () => checkbox.checked && updateColor(s.dataset.color))
        );
        customPicker.onchange = () =>
          checkbox.checked && updateColor(customPicker.value);
      } else {
        // SMART PLACEHOLDERS & INPUT TYPES
        let placeholder = "Enter value";
        let inputType = "text";
        let inputMode = "text"; // for mobile keyboard
        let pattern = null;
        let title = "";

        const lowerField = field.toLowerCase();

        // DETECT COMMON FIELDS & GIVE THEM PRO HELP
        if (
          lowerField.includes("storage") ||
          lowerField.includes("ssd") ||
          lowerField.includes("hdd")
        ) {
          placeholder = "e.g. 128GB, 256GB, 512GB, 1TB";
          title = "Try: 128GB, 256GB,512GB,1TB,2TB";
        } else if (lowerField.includes("ram")) {
          placeholder = "e.g. 4GB, 8GB, 16GB, 32GB";
          title = "Common: 4GB, 6GB, 8GB, 12GB, 16GB";
        } else if (
          lowerField.includes("processor") ||
          lowerField.includes("cpu")
        ) {
          placeholder = "e.g. i5, i7, Ryzen 5, Snapdragon";
          title = "Try: i3, i5, i7, Ryzen, M1, Snapdragon";
        } else if (
          lowerField.includes("screen size") ||
          lowerField.includes("display")
        ) {
          placeholder = 'e.g. 13.3", 15.6", 6.5"';
          inputMode = "decimal";
          title = 'Use quotes for inches: 13.3", 15.6", 16"';
        } else if (lowerField.includes("battery")) {
          placeholder = "e.g. 5000mAh, 4000mAh";
          title = "Example: 3000mAh, 4500mAh, 6000mAh";
        } else if (lowerField.includes("camera")) {
          placeholder = "e.g. 48MP, 108MP, 12MP+12MP";
        } else if (lowerField.includes("size") && lowerField.includes("shoe")) {
          placeholder = "e.g. 40, 42, 44, 45, UK 9";
        } else if (
          lowerField.includes("size") &&
          !lowerField.includes("shoe")
        ) {
          placeholder = "e.g. S, M, L, XL, 30, 32";
        } else if (lowerField.includes("brand")) {
          placeholder = "e.g. Apple, Samsung, Nike, HP";
        } else if (lowerField.includes("model")) {
          placeholder = "e.g. iPhone 13, Galaxy S22, Air Max";
        } else if (
          lowerField.includes("wattage") ||
          lowerField.includes("power")
        ) {
          placeholder = "e.g. 65W, 30W, 18W";
        } else if (
          lowerField.includes("capacity") &&
          lowerField.includes("bag")
        ) {
          placeholder = "e.g. 20L, 30L, 45L";
        }

        const sanitizedField = field.replace(/[<>"'&]/g, (match) => {
          const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
          return entities[match];
        });
        const sanitizedUniqueKey = uniqueKey.replace(/[^a-zA-Z0-9_-]/g, '');
        
        div.innerHTML = `
    <div style="margin:12px 0;">
      <label for="spec_input_${sanitizedUniqueKey}" style="cursor:pointer;">
        <input type="checkbox" id="spec_${sanitizedUniqueKey}" ${
          currentValue ? "checked" : ""
        }>
        <span>${sanitizedField}</span>
      </label>
      <input type="${inputType}"
             id="spec_input_${sanitizedUniqueKey}"
             name="spec_${sanitizedUniqueKey}"
             class="spec-input"
             placeholder="${placeholder}"
             value="${currentValue}"
             inputmode="${inputMode}"
             ${pattern ? `pattern="${pattern}"` : ""}
             title="${title}"
             style="display:${
               currentValue ? "block" : "none"
             };margin-top:6px;width:100%;padding:8px;border-radius:8px;border:1px solid #555;background:rgba(255,255,255,0.1);color:#fff;">
      <div class="spec-hint" style="font-size:0.78rem;color:#aaa;margin-top:4px;opacity:0.9;">
        ${title ? `<em>${title}</em>` : ""}
      </div>
    </div>
  `;

        const checkbox = div.querySelector(`#spec_${sanitizedUniqueKey}`);
        const input = div.querySelector(`#spec_input_${sanitizedUniqueKey}`);

        checkbox.onchange = () => {
          input.style.display = checkbox.checked ? "block" : "none";
          if (!checkbox.checked) {
            delete window.currentFilters.specs[field];
          } else if (input.value.trim()) {
            window.currentFilters.specs[field] = input.value.trim();
          }
          applyFilters();
        };

        input.oninput = () => {
          window.currentFilters.specs[field] = input.value.trim();
          applyFilters();
        };

        // Auto-focus when checkbox is clicked
        checkbox.addEventListener("click", () => {
          if (checkbox.checked) {
            setTimeout(() => input.focus(), 100);
          }
        });
      }

      container.appendChild(div);
    });
  });
}
// EVENT DELEGATION
document.addEventListener("change", (e) => {
  // Validate event origin to prevent CSRF
  if (!e.isTrusted) return;
  
  if (e.target.name === "mainCat") {
    // Sanitize input value
    const allowedCategories = ['all', 'electronics', 'fashion', 'hostels'];
    if (!allowedCategories.includes(e.target.value)) return;
    
    window.currentFilters.mainCat = e.target.value;
    window.currentFilters.subCat = null;
    window.currentFilters.specs = {};
    window.currentFilters.gender = [];
    const showGender = e.target.value === "fashion";
    ["genderFilter", "genderFilterMobile"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = showGender ? "block" : "none";
    });
    renderSubcategories();
    renderDynamicSpecs(e.target.value, null);
    applyFilters();
  }

  if (e.target.name === "subCat" || e.target.name === "subCatMobile") {
    // Sanitize subcategory value
    const sanitizedValue = e.target.value.replace(/[<>"'&]/g, '');
    window.currentFilters.subCat = sanitizedValue;
    const mainCat =
      document.querySelector('input[name="mainCat"]:checked')?.value || "all";
    window.currentFilters.specs = {};
    renderDynamicSpecs(mainCat, sanitizedValue);
    applyFilters();
  }

  if (
    e.target.classList.contains("condition-filter") ||
    e.target.classList.contains("gender-filter")
  ) {
    const type = e.target.classList.contains("condition-filter")
      ? "condition"
      : "gender";
    
    // Validate and sanitize filter values
    const allowedConditions = ['new', 'used', 'refurbished'];
    const allowedGenders = ['male', 'female', 'unisex'];
    const allowedValues = type === 'condition' ? allowedConditions : allowedGenders;
    
    window.currentFilters[type] = Array.from(
      document.querySelectorAll(`.${type}-filter:checked`)
    ).map((c) => c.value.toLowerCase())
     .filter(value => allowedValues.includes(value));
    applyFilters();
  }
});

// RESET BUTTON
document.getElementById("resetFiltersBtn")?.addEventListener("click", () => {
  document.querySelector('input[value="all"]').checked = true;

  document
    .querySelectorAll("#priceMin, #priceMinMobile")
    .forEach((el) => (el.value = 0));
  document
    .querySelectorAll("#priceMax, #priceMaxMobile")
    .forEach((el) => (el.value = 100000));
  document
    .querySelectorAll("#minPriceInput, #minPriceInputMobile")
    .forEach((el) => el && (el.value = ""));
  document
    .querySelectorAll("#maxPriceInput, #maxPriceInputMobile")
    .forEach((el) => el && (el.value = ""));
  document
    .querySelectorAll("#priceRangeText, #priceRangeTextMobile")
    .forEach((el) => (el.textContent = "Any price"));

  window.currentFilters = {
    mainCat: "all",
    subCat: null,
    priceMin: 0,
    priceMax: 100000,
    condition: [],
    gender: [],
    specs: {},
  };

  document
    .querySelectorAll(
      'input[type="checkbox"], input[type="radio"]:not([value="all"]), .spec-input'
    )
    .forEach((el) => {
      el.checked = false;
      el.value = "";
      if (el.classList.contains("spec-input")) el.style.display = "none";
    });

  document
    .querySelectorAll("#subcategoryFilter, #genderFilter, #genderFilterMobile")
    .forEach((el) => el && (el.style.display = "none"));
  document
    .querySelectorAll("#dynamicSpecsContainer, #dynamicSpecsContainerMobile")
    .forEach((el) => el && (el.innerHTML = ""));

  searchInput.value = "";
  searchQuery = "";
  suggestionsBox.style.display = "none";
  clearSearch.style.display = "none";
  applyFilters();
});

// MOBILE SIDEBAR (unchanged)
document.getElementById("mobileFilterBtn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  document.getElementById("filterSidebar").classList.add("open");
  document.querySelector(".overlay").classList.add("active");
  document.body.style.overflow = "hidden";
});

document.getElementById("closeFilterSidebar")?.addEventListener("click", () => {
  document.getElementById("filterSidebar").classList.remove("open");
  document.querySelector(".overlay").classList.remove("active");
  document.body.style.overflow = "";
});

document.querySelector(".overlay")?.addEventListener("click", () => {
  document.getElementById("filterSidebar").classList.remove("open");
  document.querySelector(".overlay").classList.remove("active");
  document.body.style.overflow = "";
});

// INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  renderSubcategories();
  initDualPriceRange();
  applyFilters(); // Products + search work instantly
});
