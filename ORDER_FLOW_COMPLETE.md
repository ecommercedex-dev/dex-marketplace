# DEX V1 - Complete Order Flow Documentation

## 🎯 Order Flow Overview

### **Trust-First Approach**
DEX v1 focuses on building trust through commitment before contact exchange.

---

## 📱 Product Details Page

### **Before Order:**
✅ **Seller contact visible** (for pre-purchase questions)
- Phone number shown
- Email shown
- WhatsApp available
- **Purpose:** Allow buyers to ask questions about product

### **After Placing Order:**
✅ **Success modal shows:**
- ✅ Order placed confirmation
- ⏳ Status: Pending seller acceptance
- 🔒 "Contact will be available after acceptance"
- 📍 Link to "My Orders" page
- ❌ NO seller contact shown yet

**Why?** Order is still pending - seller hasn't committed yet.

---

## 👤 Buyer Profile - My Orders

### **Pending Orders:**
- 🟠 Status: Pending
- 🔒 Seller contact: **HIDDEN**
- 📝 Shows: Order details, product, price, address
- ⚡ Actions: Cancel order
- 💬 Message: "Contact unlocked after seller accepts"

### **Accepted Orders:**
- 🟢 Status: Accepted
- 🔓 Seller contact: **VISIBLE**
  - Phone number
  - Email
  - WhatsApp link
- ⚡ Actions: Track order, Contact seller
- 💬 Message: "Coordinate delivery with seller"

### **Delivered Orders:**
- 🔵 Status: Delivered
- 🔓 Seller contact: **VISIBLE**
- ⚡ Actions: Leave review
- 💬 Message: "Order completed"

### **Rejected/Cancelled Orders:**
- 🔴 Status: Rejected/Cancelled
- 🔒 Seller contact: **HIDDEN**
- ⚡ Actions: None
- 💬 Message: "Order not fulfilled"

---

## 🏪 Seller Dashboard - Orders

### **New Orders (Pending):**
- 🟠 Status: Pending
- 🔒 Buyer contact: **HIDDEN**
- 📝 Shows: Order details, buyer name, product, price
- ⚡ Actions: Accept, Reject
- 💬 Message: "Review order before accepting"

### **Accepted Orders:**
- 🟢 Status: Accepted
- 🔓 Buyer contact: **VISIBLE**
  - Phone number
  - Email
  - WhatsApp link
- ⚡ Actions: Mark as Delivered
- 💬 Message: "Coordinate delivery with buyer"
- 📦 Stock: Already reduced

### **Delivered Orders:**
- 🔵 Status: Delivered
- 🔓 Buyer contact: **VISIBLE**
- ⚡ Actions: None
- 💬 Message: "Order completed"

### **Rejected/Cancelled Orders:**
- 🔴 Status: Rejected/Cancelled
- 🔒 Buyer contact: **HIDDEN**
- ⚡ Actions: None
- 💬 Shows: "Rejected" or "Cancelled by Buyer"

---

## 🔄 Complete Order Lifecycle

```
1. BUYER BROWSES PRODUCT
   └─> Seller contact visible (for questions)
   
2. BUYER PLACES ORDER
   └─> Status: PENDING
   └─> Success modal: "Contact after acceptance"
   └─> Seller gets notification
   └─> Stock: NOT reduced yet
   
3. SELLER REVIEWS ORDER
   └─> Sees: Order details, buyer name
   └─> Cannot see: Buyer contact
   └─> Decides: Accept or Reject
   
4a. SELLER ACCEPTS
    └─> Status: ACCEPTED
    └─> Both parties: Contact UNLOCKED 🔓
    └─> Stock: REDUCED
    └─> Buyer notified
    └─> Coordination begins
    
4b. SELLER REJECTS
    └─> Status: REJECTED
    └─> Contact: HIDDEN
    └─> Stock: NOT reduced
    └─> Buyer notified
    
5. SELLER MARKS DELIVERED
   └─> Status: DELIVERED
   └─> Contact: Still visible
   └─> Buyer notified
   └─> Buyer can review
   
6. BUYER REVIEWS
   └─> Trust/reputation built
   └─> Seller rating updated
```

---

## 🔒 Contact Protection Rules

| Order Status | Buyer sees Seller Contact | Seller sees Buyer Contact |
|--------------|---------------------------|---------------------------|
| Pending      | ❌ Hidden                 | ❌ Hidden                 |
| Accepted     | ✅ Visible                | ✅ Visible                |
| Delivered    | ✅ Visible                | ✅ Visible                |
| Rejected     | ❌ Hidden                 | ❌ Hidden                 |
| Cancelled    | ❌ Hidden                 | ❌ Hidden                 |

**Exception:** Product page always shows seller contact for pre-purchase inquiries.

---

## 📦 Stock Management

| Event                    | Stock Change              |
|--------------------------|---------------------------|
| Order Created (Pending)  | No change                 |
| Order Accepted           | Reduced by quantity       |
| Order Rejected           | No change                 |
| Order Cancelled (Pending)| No change                 |
| Order Cancelled (Accepted)| Restored (increased back)|
| Order Delivered          | No change (already reduced)|

---

## 🔔 Notifications

| Event                    | Who Gets Notified | Message                                    |
|--------------------------|-------------------|--------------------------------------------|
| Order Created            | Seller            | "🎉 New Order! [Buyer] ordered [Product]" |
| Order Accepted           | Buyer             | "Order accepted"                           |
| Order Rejected           | Buyer             | "Order rejected"                           |
| Order Delivered          | Buyer             | "Order delivered"                          |
| Order Cancelled (Buyer)  | Seller            | "Order cancelled by buyer"                 |

All notifications sent via:
- ✅ WebSocket (real-time)
- ✅ In-app notification center

---

## 💡 Why This Flow Works for V1

### **Trust Building:**
1. Commitment before contact = serious buyers/sellers
2. Acceptance = mutual agreement
3. Delivery confirmation = reputation point
4. Reviews = trust metric

### **Natural WhatsApp Use:**
- Available on product page (not forced)
- Available after acceptance (natural coordination)
- Buyers/sellers choose communication method

### **V2 Ready:**
- Order structure supports payment states
- Status flow maps to payment flow
- Stock management in place
- Notification system ready

---

## 🚀 V2 Migration Path

```javascript
// V1 (Current)
pending → accepted → delivered

// V2 (Future)
pending → payment_pending → paid → accepted → shipped → delivered
```

**V2 Additions:**
- Integrated payment (Mobile Money/Card)
- Cart system (multiple items)
- Shipping tracking
- Escrow system
- Automated refunds

---

## ✅ Current Implementation Status

- ✅ Order creation with validation
- ✅ Stock management
- ✅ Status transitions
- ✅ Contact protection
- ✅ Notifications (WebSocket + In-app)
- ✅ Buyer cancel (pending only)
- ✅ Seller accept/reject/deliver
- ✅ Product page order flow
- ✅ Buyer profile order display
- ✅ Seller dashboard order display
- ✅ Success modal (no premature contact)

---

## 🎯 Key Takeaway

**DEX v1 order system is PERFECT for campus marketplace:**
- Simple enough for students
- Builds trust naturally
- WhatsApp optional, not forced
- Ready for v2 payment integration
- Focuses on reputation building

The flow respects both parties' privacy until mutual commitment (acceptance) is established.
