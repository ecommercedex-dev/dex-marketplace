const API_URL = "http://localhost:5000/api";

export async function loadTrending() {
  try {
    const res = await fetch(`${API_URL}/home/trending-products`);
    const data = await res.json();
    
    const sanitizeText = (text) => {
      return String(text || '').replace(/[<>"'&]/g, (match) => {
        const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
        return entities[match];
      });
    };
    
    const container = document.getElementById("trending-grid");
    container.innerHTML = data.slice(0, 8).map(p => {
      const sanitizedName = sanitizeText(p.name);
      const sanitizedStoreName = sanitizeText(p.seller.storeName);
      const sanitizedImage = (p.images[0] || '').replace(/["'<>]/g, '');
      const safeRating = Math.max(0, Math.min(5, Math.round(p.sellerRating || 0)));
      const safeReviewCount = parseInt(p.reviewCount) || 0;
      const safePrice = parseFloat(p.price) || 0;
      const safeId = parseInt(p.id) || 0;
      
      return `
        <div class="product-card fade-in">
          <div class="product-image" style="background-image: url('${API_URL.replace('/api', '')}${sanitizedImage}')">
            ${p.featured ? '<span class="badge trending">🔥 Trending</span>' : ''}
          </div>
          <div class="product-info">
            <h3>${sanitizedName}</h3>
            <p class="seller-name">
              ${sanitizedStoreName}
              ${p.sellerVerified ? '<span class="verified-badge">✓</span>' : ''}
            </p>
            <div class="rating">
              <span class="stars">${'★'.repeat(safeRating)}${'☆'.repeat(5-safeRating)}</span>
              <span>(${safeReviewCount})</span>
            </div>
            <p class="price">GH₵ ${safePrice.toFixed(2)}</p>
            <a href="Dex-shop.html?product=${safeId}" class="btn-small">View Details</a>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Trending load error:", err);
  }
}
