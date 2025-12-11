// Purchase Verification System
window.PurchaseVerification = {
  checkEligibility: function(price, user) {
    if (!user) {
      return {
        allowed: false,
        message: "Please log in to make purchases"
      };
    }

    const trustLevel = this.getTrustLevel(user);
    const dailyLimit = this.getPurchaseLimit(trustLevel);
    
    if (trustLevel === 0) {
      return {
        allowed: false,
        message: "Please verify your email address to start purchasing. Check your inbox for verification link."
      };
    }
    
    if (price > dailyLimit) {
      return {
        allowed: false,
        message: `Purchase limit exceeded. Your current daily limit is ₵${dailyLimit}. ${this.getUpgradeMessage(trustLevel)}`
      };
    }
    
    return {
      allowed: true,
      message: "Purchase approved",
      trustLevel,
      dailyLimit
    };
  },

  getTrustLevel: function(user) {
    if (!user.isVerified) return 0; // No email verification
    if (!user.phoneVerified && !user.studentVerified) return 1; // Email only
    if ((user.phoneVerified && user.studentVerified) || (user.phoneVerified && user.isVerified)) return 3; // 2+ verifications
    return 2; // 1 additional verification
  },

  getPurchaseLimit: function(trustLevel) {
    const limits = {
      0: 0,      // No purchases
      1: 100,    // Email only: ₵100/day
      2: 500,    // 1 verification: ₵500/day  
      3: Infinity // 2+ verifications: Unlimited
    };
    return limits[trustLevel] || 0;
  },

  getUpgradeMessage: function(trustLevel) {
    const messages = {
      1: "Verify your phone number or student ID to increase your limit to ₵500/day.",
      2: "Complete both phone and student verification for unlimited purchases."
    };
    return messages[trustLevel] || "";
  }
};