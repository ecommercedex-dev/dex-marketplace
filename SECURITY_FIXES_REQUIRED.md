# Critical Security Fixes Required

## 1. XSS Vulnerability Fixes

### Problem
User input in seller names flows directly into HTML email templates without sanitization, allowing XSS attacks.

### Solution
```javascript
// Add HTML escaping function
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// Use in email templates
const safeName = escapeHtml(seller.name);
```

## 2. Input Validation Enhancement

### Current Issues
- Duplicate password validation
- Type confusion in email validation
- Missing input sanitization

### Required Fixes
```javascript
// Enhanced validation function
const validateSellerInput = (data) => {
  const errors = [];
  
  // Name validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push('Valid name is required');
  }
  
  // Email validation with proper type checking
  if (!data.email || typeof data.email !== 'string' || !isValidEmail(data.email)) {
    errors.push('Valid email is required');
  }
  
  // Phone validation
  if (!data.phone || typeof data.phone !== 'string' || !isValidPhone(data.phone)) {
    errors.push('Valid phone number is required');
  }
  
  // Business validation
  if (!data.storeName || typeof data.storeName !== 'string' || data.storeName.trim().length < 3) {
    errors.push('Store name must be at least 3 characters');
  }
  
  return errors;
};
```

## 3. Logging Security

### Problem
Sensitive verification codes logged to console in production.

### Solution
```javascript
// Conditional logging based on environment
const logVerificationCode = (code, email) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Verification code for ${email}: ${code}`);
  } else {
    console.log(`Verification code sent to ${email.substring(0, 3)}***`);
  }
};
```

## 4. Error Handling Enhancement

### Problem
Missing error handling for email operations can cause registration failures.

### Solution
```javascript
// Robust email sending with fallback
const sendVerificationEmail = async (email, name, code, token) => {
  try {
    await transporter.sendMail({
      from: `"Dex Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Seller Account — Dex",
      html: generateEmailTemplate(escapeHtml(name), code, token)
    });
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error.message);
    // Implement fallback notification system
    await logFailedEmail(email, error);
    return { success: false, error: error.message };
  }
};
```

## 5. Rate Limiting Implementation

### Add to registration endpoint
```javascript
import rateLimit from 'express-rate-limit';

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 registration attempts per windowMs
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to registration route
app.post('/api/seller/register', registrationLimiter, registerSeller);
```