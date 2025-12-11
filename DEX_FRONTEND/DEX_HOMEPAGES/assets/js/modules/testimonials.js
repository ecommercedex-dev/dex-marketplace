const API_URL = "http://localhost:5000/api";

export async function loadTestimonials() {
  try {
    const res = await fetch(`${API_URL}/home/testimonials`);
    const data = await res.json();
    
    const sanitizeText = (text) => {
      return String(text || '').replace(/[<>"'&]/g, (match) => {
        const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
        return entities[match];
      });
    };
    
    const container = document.getElementById("testimonials-grid");
    container.innerHTML = data.map(t => {
      const sanitizedName = sanitizeText(t.buyer.name);
      const sanitizedComment = sanitizeText(t.comment);
      const sanitizedStoreName = sanitizeText(t.seller.storeName);
      const sanitizedProfilePic = (t.buyer.profilePic || '/static/default.png').replace(/["'<>]/g, '');
      const safeRating = Math.max(0, Math.min(5, parseInt(t.rating) || 0));
      
      return `
        <div class="testimonial-card fade-in">
          <div class="testimonial-header">
            <img src="${sanitizedProfilePic}" alt="${sanitizedName}">
            <div>
              <h4>${sanitizedName}</h4>
              <div class="stars">${'★'.repeat(safeRating)}${'☆'.repeat(5-safeRating)}</div>
            </div>
          </div>
          <p>"${sanitizedComment}"</p>
          <small>Purchased from ${sanitizedStoreName}</small>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Testimonials load error:", err);
  }
}
