// Help & Support Module
import { SellerGuide, initHelpAccordions } from './seller-guide.js';

const initHelp = () => {
  const container = document.getElementById('helpContent');
  if (!container) return;

  const user = window.getUser ? window.getUser() : null;
  const isHostel = user?.productCategory?.toLowerCase().includes('hostel');

  // Use enhanced guide content
  container.innerHTML = SellerGuide.getHelpContent();
  initHelpAccordions();

  // Restart tour button
  const restartBtn = document.getElementById('restartTourBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      localStorage.removeItem('dex_seller_tour_completed');
      if (window.sellerGuide) {
        window.sellerGuide.startTour();
      }
    });
  }

  return;

  // OLD CONTENT BELOW (keeping as fallback)
  const oldContent = isHostel;

  container.innerHTML = isHostel ? `
    <div class="help-sections">
      <div class="help-card">
        <h3><i class="fas fa-question-circle"></i> Frequently Asked Questions</h3>
        <div class="faq-list">
          <div class="faq-item">
            <button class="faq-question">How do I add a new room listing?</button>
            <div class="faq-answer">Go to "Products" section, click "Add Product", fill in room details, upload photos, and save.</div>
          </div>
          <div class="faq-item">
            <button class="faq-question">How do I manage booking requests?</button>
            <div class="faq-answer">Check "Hostel Bookings" section to see all requests. Accept or reject bookings as needed.</div>
          </div>
          <div class="faq-item">
            <button class="faq-question">How do I track tenant payments?</button>
            <div class="faq-answer">Use "Payment Tracking" section to add tenants, mark payments as paid/unpaid, and view monthly revenue.</div>
          </div>
          <div class="faq-item">
            <button class="faq-question">What should I include in room descriptions?</button>
            <div class="faq-answer">Include amenities, distance from campus, room type, utilities included, and house rules.</div>
          </div>
          <div class="faq-item">
            <button class="faq-question">How do I update room availability?</button>
            <div class="faq-answer">Edit the room listing in "Products" and change the availability status or booking status.</div>
          </div>
        </div>
      </div>

      <div class="help-card">
        <h3><i class="fas fa-book"></i> Quick Guides</h3>
        <div class="guides-grid">
          <div class="guide-item">
            <i class="fas fa-home"></i>
            <h4>List Your Rooms</h4>
            <p>Learn how to create attractive room listings with great photos and descriptions.</p>
          </div>
          <div class="guide-item">
            <i class="fas fa-users"></i>
            <h4>Manage Tenants</h4>
            <p>Track payments, communicate with tenants, and maintain good relationships.</p>
          </div>
          <div class="guide-item">
            <i class="fas fa-shield-alt"></i>
            <h4>Safety Tips</h4>
            <p>Screen tenants properly, use written agreements, and protect your property.</p>
          </div>
          <div class="guide-item">
            <i class="fas fa-star"></i>
            <h4>Get Reviews</h4>
            <p>Provide excellent service to get positive reviews from students.</p>
          </div>
        </div>
      </div>

      <div class="help-card">
        <h3><i class="fas fa-headset"></i> Contact Support</h3>
        <form id="supportForm">
          <div class="form-group">
            <label>Subject</label>
            <select id="supportSubject" required>
              <option value="">Select a topic</option>
              <option value="technical">Technical Issue</option>
              <option value="account">Account Problem</option>
              <option value="booking">Booking Question</option>
              <option value="payment">Payment Issue</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Message</label>
            <textarea id="supportMessage" rows="5" placeholder="Describe your issue or question..." required></textarea>
          </div>
          <button type="submit" class="btn-primary">Send Message</button>
        </form>
      </div>

      <div class="help-card">
        <h3><i class="fas fa-info-circle"></i> Platform Info</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Version:</strong> 1.0.0
          </div>
          <div class="info-item">
            <strong>Support Email:</strong> support@dex.com
          </div>
          <div class="info-item">
            <strong>WhatsApp:</strong> +233 XX XXX XXXX
          </div>
          <div class="info-item">
            <strong>Hours:</strong> Mon-Fri, 9AM-6PM
          </div>
        </div>
      </div>
    </div>
  ` : `
    <div class="help-sections">
      <div class="help-card">
        <h3><i class="fas fa-question-circle"></i> Frequently Asked Questions</h3>
        <div class="faq-list">
          <div class="faq-item">
            <button class="faq-question">How do I add a new product?</button>
            <div class="faq-answer">Go to "Add Product" section, fill in product details, upload images, and click "Add Product".</div>
          </div>
          <div class="faq-item">
            <button class="faq-question">How do I edit product prices?</button>
            <div class="faq-answer">Navigate to "My Products", click the edit icon on any product, update the price, and save changes.</div>
          </div>
          <div class="faq-item">
            <button class="faq-question">Why aren't my products showing up?</button>
            <div class="faq-answer">Make sure products are marked as "Active" and have stock available. Check the product status in "My Products".</div>
          </div>
          <div class="faq-item">
            <button class="faq-question">How do I handle low stock alerts?</button>
            <div class="faq-answer">Check the "Analytics" section for low stock warnings. Update stock quantities in "My Products" section.</div>
          </div>
          <div class="faq-item">
            <button class="faq-question">Can I customize my shop appearance?</button>
            <div class="faq-answer">Yes! Go to "Customize Shop" to change colors, add banners, update business hours, and more.</div>
          </div>
          <div class="faq-item">
            <button class="faq-question">How do I export my data?</button>
            <div class="faq-answer">Visit the "Analytics" section and use the "Export Products" or "Export Orders" buttons to download CSV files.</div>
          </div>
        </div>
      </div>

      <div class="help-card">
        <h3><i class="fas fa-book"></i> Quick Guides</h3>
        <div class="guides-grid">
          <div class="guide-item">
            <i class="fas fa-rocket"></i>
            <h4>Getting Started</h4>
            <p>Learn the basics of setting up your shop and adding your first products.</p>
          </div>
          <div class="guide-item">
            <i class="fas fa-chart-line"></i>
            <h4>Boost Sales</h4>
            <p>Tips on pricing, product photos, descriptions, and customer engagement.</p>
          </div>
          <div class="guide-item">
            <i class="fas fa-shield-alt"></i>
            <h4>Safety Tips</h4>
            <p>Best practices for secure transactions and protecting your account.</p>
          </div>
          <div class="guide-item">
            <i class="fas fa-star"></i>
            <h4>Get Reviews</h4>
            <p>Encourage customers to leave reviews and build your reputation.</p>
          </div>
        </div>
      </div>

      <div class="help-card">
        <h3><i class="fas fa-headset"></i> Contact Support</h3>
        <form id="supportForm">
          <div class="form-group">
            <label>Subject</label>
            <select id="supportSubject" required>
              <option value="">Select a topic</option>
              <option value="technical">Technical Issue</option>
              <option value="account">Account Problem</option>
              <option value="payment">Payment Question</option>
              <option value="feature">Feature Request</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Message</label>
            <textarea id="supportMessage" rows="5" placeholder="Describe your issue or question..." required></textarea>
          </div>
          <button type="submit" class="btn-primary">Send Message</button>
        </form>
      </div>

      <div class="help-card">
        <h3><i class="fas fa-info-circle"></i> Platform Info</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Version:</strong> 1.0.0
          </div>
          <div class="info-item">
            <strong>Support Email:</strong> support@dex.com
          </div>
          <div class="info-item">
            <strong>WhatsApp:</strong> +233 XX XXX XXXX
          </div>
          <div class="info-item">
            <strong>Hours:</strong> Mon-Fri, 9AM-6PM
          </div>
        </div>
      </div>
    </div>
  `;

  // setupHelpHandlers(); // Now handled by initHelpAccordions
};

const setupHelpHandlers = () => {
  // FAQ accordion
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const wasActive = item.classList.contains('active');
      
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      
      if (!wasActive) {
        item.classList.add('active');
      }
    });
  });

  // Support form
  document.getElementById('supportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const subject = document.getElementById('supportSubject').value;
    const message = document.getElementById('supportMessage').value;
    const token = window.authToken || localStorage.getItem('authToken');

    try {
      const res = await fetch('http://localhost:5000/api/sellers/support-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subject, message })
      });

      if (res.ok) {
        if (window.showToast) window.showToast('Support ticket submitted', 'success');
        document.getElementById('supportForm').reset();
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      if (window.showToast) window.showToast('Failed to submit ticket', 'error');
    }
  });
};

window.initHelpContent = initHelp;
export { initHelp };
