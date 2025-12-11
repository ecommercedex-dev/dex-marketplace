// Verification banner for seller dashboard
function createVerificationBanner() {
  const user = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
  if (!user || user.role !== 'seller') return;

  // Check verification status
  const needsVerification = !user.phoneVerified || !user.emergencyContactVerified;
  if (!needsVerification) return;

  // Create banner
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #FF9800, #F57C00);
    color: white;
    padding: 12px 20px;
    text-align: center;
    z-index: 1300;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  
  const verificationCount = (user.phoneVerified ? 1 : 0) + (user.emergencyContactVerified ? 1 : 0);
  const totalVerifications = 2;
  
  banner.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 15px; flex-wrap: wrap;">
      <span>🛡️ <strong>Complete your verification (${verificationCount}/${totalVerifications})</strong> to unlock all seller features</span>
      <button onclick="goToVerification()" style="background: white; color: #FF9800; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
        Complete Now
      </button>
      <button onclick="dismissBanner()" style="background: transparent; color: white; border: 1px solid white; padding: 8px 12px; border-radius: 6px; cursor: pointer;">
        Later
      </button>
    </div>
  `;
  
  document.body.insertBefore(banner, document.body.firstChild);
  
  // Adjust main content margin
  const mainContent = document.querySelector('main') || document.querySelector('.container');
  if (mainContent) {
    mainContent.style.marginTop = '60px';
  }
}

function goToVerification() {
  window.location.href = 'seller_verification.html';
}

function dismissBanner() {
  const banner = document.querySelector('div[style*="linear-gradient(135deg, #FF9800, #F57C00)"]');
  if (banner) {
    banner.remove();
    const mainContent = document.querySelector('main') || document.querySelector('.container');
    if (mainContent) {
      mainContent.style.marginTop = '0';
    }
  }
}

// Auto-create banner when page loads
document.addEventListener('DOMContentLoaded', createVerificationBanner);