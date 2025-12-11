// assets/js/modules/search.js
import { render } from "./products.js";

const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const suggestions = document.getElementById("suggestions");

let searchTimeout;

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();

  clearSearch.style.display = query ? "flex" : "none";

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => performSearch(query), 300);
});

clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  clearSearch.style.display = "none";
  suggestions.innerHTML = "";
  performSearch("");
});

function performSearch(query) {
  const products = window.__LIVE_PRODUCTS || [];

  if (!query) {
    suggestions.innerHTML = "";
    render(products);
    return;
  }

  const q = query.toLowerCase();
  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.seller?.name?.toLowerCase().includes(q)
  );

  showSuggestions(query, filtered);
  render(filtered);
}

function showSuggestions(query, results) {
  if (!query || results.length === 0) {
    suggestions.innerHTML = "";
    return;
  }

  const unique = [...new Set(results.slice(0, 5).map((p) => p.name))];
  
  const sanitizeText = (text) => {
    return String(text || '').replace(/[<>"'&]/g, (match) => {
      const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
      return entities[match];
    });
  };

  suggestions.innerHTML = unique
    .map(
      (name) => {
        const sanitizedName = sanitizeText(name);
        return `<div class="suggestion-item" data-name="${sanitizedName}">${sanitizedName}</div>`;
      }
    )
    .join("");
}

// Handle suggestion clicks safely with event delegation
suggestions.addEventListener("click", (e) => {
  const suggestionItem = e.target.closest(".suggestion-item");
  if (suggestionItem && suggestionItem.dataset.name) {
    searchInput.value = suggestionItem.dataset.name;
    searchInput.dispatchEvent(new Event('input'));
    suggestions.innerHTML = "";
  }
});

document.addEventListener("click", (e) => {
  if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
    suggestions.innerHTML = "";
  }
});
