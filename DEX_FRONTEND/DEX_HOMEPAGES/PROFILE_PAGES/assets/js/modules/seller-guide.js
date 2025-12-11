// Seller Dashboard Guide System
// Combines: Welcome Tour + Contextual Hints + Help Section

export class SellerGuide {
  constructor() {
    this.currentStep = 0;
    this.tourSteps = [
      {
        target: '.sidebar a[data-section="profile"]',
        title: '👤 Your Profile',
        content: 'Manage your shop info, upload photos, and edit your gallery here.',
        position: 'right'
      },
      {
        target: '.sidebar a[data-section="products"]',
        title: '📦 Products',
        content: 'Add, edit, and manage all your products. Click "Add Product" to list your first item!',
        position: 'right'
      },
      {
        target: '.sidebar a[data-section="orders"]',
        title: '🛒 Orders',
        content: 'View and manage customer orders. Track active, delivered, and rejected orders.',
        position: 'right'
      },
      {
        target: '.share-card-collapsible',
        title: '🔗 Share Your Shop',
        content: 'Get your unique shop link and QR code to share with customers on WhatsApp and social media.',
        position: 'bottom'
      },
      {
        target: '.sidebar a[data-section="analytics"]',
        title: '📊 Analytics',
        content: 'Track your shop performance, views, and sales insights.',
        position: 'right'
      },
      {
        target: '.sidebar a[data-section="help"]',
        title: '❓ Need Help?',
        content: 'Visit the Help section anytime for guides, FAQs, and support. You can restart this tour from there!',
        position: 'right'
      }
    ];
    this.init();
  }

  init() {
    this.createTourElements();
    this.addContextualHints();
    
    // Check if user has seen tour
    const hasSeenTour = localStorage.getItem('dex_seller_tour_completed');
    if (!hasSeenTour) {
      setTimeout(() => this.startTour(), 1500);
    }
  }

  createTourElements() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'tour-overlay';
    overlay.id = 'tourOverlay';
    document.body.appendChild(overlay);

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tour-tooltip';
    tooltip.id = 'tourTooltip';
    tooltip.innerHTML = `
      <h4 id="tourTitle"></h4>
      <p id="tourContent"></p>
      <div class="tour-tooltip-actions">
        <span class="tour-progress" id="tourProgress"></span>
        <div class="tour-buttons">
          <button class="tour-btn tour-btn-skip" id="tourSkip">Skip Tour</button>
          <button class="tour-btn tour-btn-next" id="tourNext">Next</button>
        </div>
      </div>
    `;
    document.body.appendChild(tooltip);

    // Event listeners
    document.getElementById('tourSkip').addEventListener('click', () => this.endTour());
    document.getElementById('tourNext').addEventListener('click', () => this.nextStep());
    overlay.addEventListener('click', () => this.endTour());
  }

  startTour() {
    this.currentStep = 0;
    document.getElementById('tourOverlay').classList.add('active');
    this.showStep(0);
  }

  showStep(index) {
    if (index >= this.tourSteps.length) {
      this.endTour();
      return;
    }

    const step = this.tourSteps[index];
    const target = document.querySelector(step.target);
    
    if (!target) {
      this.nextStep();
      return;
    }

    // Update tooltip content
    document.getElementById('tourTitle').textContent = step.title;
    document.getElementById('tourContent').textContent = step.content;
    document.getElementById('tourProgress').textContent = `${index + 1} of ${this.tourSteps.length}`;
    
    // Update button text
    const nextBtn = document.getElementById('tourNext');
    nextBtn.textContent = index === this.tourSteps.length - 1 ? 'Finish' : 'Next';

    // Highlight target
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    target.classList.add('tour-highlight');

    // Position tooltip
    this.positionTooltip(target, step.position);

    // Show tooltip
    const tooltip = document.getElementById('tourTooltip');
    tooltip.classList.add('active');
  }

  positionTooltip(target, position) {
    const tooltip = document.getElementById('tourTooltip');
    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top, left;

    switch (position) {
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.right + 20;
        break;
      case 'bottom':
        top = rect.bottom + 20;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.left - tooltipRect.width - 20;
        break;
      default:
        top = rect.top - tooltipRect.height - 20;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    }

    // Keep tooltip on screen
    top = Math.max(20, Math.min(top, window.innerHeight - tooltipRect.height - 20));
    left = Math.max(20, Math.min(left, window.innerWidth - tooltipRect.width - 20));

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  nextStep() {
    this.currentStep++;
    this.showStep(this.currentStep);
  }

  endTour() {
    document.getElementById('tourOverlay').classList.remove('active');
    document.getElementById('tourTooltip').classList.remove('active');
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    localStorage.setItem('dex_seller_tour_completed', 'true');
  }

  addContextualHints() {
    const hints = [
      { selector: '#editProfileBtn', text: 'Update your shop name, contact info, and profile picture' },
      { selector: '#addProductBtn', text: 'Click here to list a new product with photos, price, and description' },
      { selector: '#toggleShareBtn', text: 'Share your shop link on WhatsApp, Facebook, or Instagram to get more customers' },
      { selector: '.sidebar a[data-section="bulk-actions"]', text: 'Activate, deactivate, or delete multiple products at once' },
      { selector: '.sidebar a[data-section="customize-shop"]', text: 'Personalize your shop with custom colors and banners' }
    ];

    hints.forEach(hint => {
      const element = document.querySelector(hint.selector);
      if (element && !element.querySelector('.help-icon')) {
        const icon = document.createElement('span');
        icon.className = 'help-icon';
        icon.innerHTML = '?';
        icon.title = hint.text;
        
        // Position relative to element
        if (element.tagName === 'BUTTON') {
          element.style.position = 'relative';
          element.appendChild(icon);
          icon.style.position = 'absolute';
          icon.style.top = '-8px';
          icon.style.right = '-8px';
        } else {
          element.style.position = 'relative';
          element.appendChild(icon);
        }

        // Tooltip on hover
        icon.addEventListener('mouseenter', (e) => this.showHelpTooltip(e, hint.text));
        icon.addEventListener('mouseleave', () => this.hideHelpTooltip());
      }
    });
  }

  showHelpTooltip(event, text) {
    let tooltip = document.getElementById('helpTooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'helpTooltip';
      tooltip.className = 'help-tooltip';
      document.body.appendChild(tooltip);
    }

    tooltip.textContent = text;
    tooltip.classList.add('show');

    const rect = event.target.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + 10}px`;
    tooltip.style.left = `${rect.left}px`;
  }

  hideHelpTooltip() {
    const tooltip = document.getElementById('helpTooltip');
    if (tooltip) {
      tooltip.classList.remove('show');
    }
  }

  // Enhanced Help Content
  static getHelpContent() {
    return `
      <div class="help-section">
        <button class="restart-tour-btn" id="restartTourBtn">
          <i class="fas fa-play-circle"></i> Restart Welcome Tour
        </button>
      </div>

      <div class="help-section">
        <h3><i class="fas fa-rocket"></i> Quick Start Guide</h3>
        
        <div class="help-accordion">
          <div class="help-accordion-header">
            <span>1. Set Up Your Profile</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="help-accordion-content">
            <p>Complete your seller profile to build trust with customers:</p>
            <ul>
              <li>Upload a clear profile picture or shop logo</li>
              <li>Add your shop name and contact information</li>
              <li>Fill in your email and phone number</li>
              <li>Add photos to your gallery to showcase your shop</li>
            </ul>
          </div>
        </div>

        <div class="help-accordion">
          <div class="help-accordion-header">
            <span>2. Add Your First Product</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="help-accordion-content">
            <p>List products in 3 easy steps:</p>
            <ul>
              <li><strong>Photos:</strong> Upload 1-5 clear product images</li>
              <li><strong>Details:</strong> Add name, price, category, and description</li>
              <li><strong>Stock:</strong> Set quantity and mark as active</li>
            </ul>
            <p>💡 Tip: Products with multiple photos get 3x more views!</p>
          </div>
        </div>

        <div class="help-accordion">
          <div class="help-accordion-header">
            <span>3. Share Your Shop</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="help-accordion-content">
            <p>Get customers by sharing your unique shop link:</p>
            <ul>
              <li>Click "Share Your Shop" to get your link</li>
              <li>Copy the link or scan the QR code</li>
              <li>Share on WhatsApp, Facebook, Instagram</li>
              <li>Add to your WhatsApp status or bio</li>
            </ul>
          </div>
        </div>

        <div class="help-accordion">
          <div class="help-accordion-header">
            <span>4. Manage Orders</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="help-accordion-content">
            <p>When customers place orders:</p>
            <ul>
              <li>You'll get a notification instantly</li>
              <li>View order details and customer info</li>
              <li>Accept or reject the order</li>
              <li>Mark as delivered when complete</li>
              <li>Chat with customers directly</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3><i class="fas fa-question-circle"></i> Frequently Asked Questions</h3>
        
        <div class="help-accordion">
          <div class="help-accordion-header">
            <span>How do I get paid?</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="help-accordion-content">
            <p>Customers pay you directly via Mobile Money or cash on delivery. Dex doesn't handle payments - you keep 100% of your sales!</p>
          </div>
        </div>

        <div class="help-accordion">
          <div class="help-accordion-header">
            <span>How do I edit or delete a product?</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="help-accordion-content">
            <p>Go to Products section, click the "Edit" button on any product card. You can also use Bulk Actions to manage multiple products at once.</p>
          </div>
        </div>

        <div class="help-accordion">
          <div class="help-accordion-header">
            <span>Can I customize my shop appearance?</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="help-accordion-content">
            <p>Yes! Go to "Customize Shop" to change colors, add banners, and personalize your shop's look.</p>
          </div>
        </div>

        <div class="help-accordion">
          <div class="help-accordion-header">
            <span>What are the image requirements?</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="help-accordion-content">
            <p>Upload clear, well-lit photos. Supported formats: JPG, PNG. Max size: 5MB per image. Use multiple angles for best results.</p>
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3><i class="fas fa-lightbulb"></i> Pro Tips</h3>
        <div class="help-accordion">
          <div class="help-accordion-header">
            <span>Boost Your Sales</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="help-accordion-content">
            <ul>
              <li>✅ Use high-quality product photos</li>
              <li>✅ Write detailed descriptions</li>
              <li>✅ Price competitively</li>
              <li>✅ Respond to orders quickly</li>
              <li>✅ Share your shop link regularly</li>
              <li>✅ Keep stock quantities updated</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="help-section">
        <h3><i class="fas fa-headset"></i> Need More Help?</h3>
        <p style="color: #bdc3c7; line-height: 1.6;">
          Contact our support team:<br>
          📧 Email: support@dex.com<br>
          📱 WhatsApp: +233 XX XXX XXXX<br>
          ⏰ Available: Mon-Sat, 8am-6pm
        </p>
      </div>
    `;
  }
}

// Initialize accordions
export function initHelpAccordions() {
  document.querySelectorAll('.help-accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const isActive = header.classList.contains('active');
      
      // Close all
      document.querySelectorAll('.help-accordion-header').forEach(h => {
        h.classList.remove('active');
        h.nextElementSibling.classList.remove('active');
      });
      
      // Open clicked if it wasn't active
      if (!isActive) {
        header.classList.add('active');
        content.classList.add('active');
      }
    });
  });
}
