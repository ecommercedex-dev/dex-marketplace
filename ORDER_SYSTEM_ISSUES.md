# Order System Issues & Fixes

## Critical Issues

### 1. ❌ Cancelled Orders Not Displayed (Seller View)
**File:** `seller-orders.js` line 257
**Problem:** Orders cancelled by buyers don't appear anywhere in seller dashboard

**Fix:**
```javascript
// Add cancelled to trashContainer
} else if (["rejected", "cancelled"].includes(order.status)) {
  elements.trashContainer.appendChild(card);
}
```

### 2. ❌ Missing WebSocket Notification on Delivery
**File:** `orderController.js` line 113
**Problem:** Buyer doesn't get real-time notification when order is delivered

**Fix:** Add after notification creation:
```javascript
import { pushNotification } from "../server.js";

// After creating notification
pushNotification(updatedOrder.buyerId.toString(), notification);
```

### 3. ⚠️ Contact Info Shows for Rejected Orders
**File:** `seller-orders.js` line 20
**Problem:** Contact info shows for rejected/cancelled orders

**Fix:**
```javascript
const showContact = ["accepted", "delivered"].includes(order.status);
```

### 4. ⚠️ Restore Button Allows Invalid State Changes
**File:** `seller-orders.js` line 85
**Problem:** Sellers can restore rejected orders to pending

**Options:**
- Remove restore button entirely
- Only allow restore within 24 hours
- Require buyer approval for restore

**Recommended:** Remove it
```javascript
// Remove this from line 85-90
${
  order.status === "rejected"
    ? `<button class="restore-btn" title="Restore Order">Restore</button>`
    : ""
}
```

## Minor Issues

### 5. 📝 Buyer Contact Not Updated After Accept
**File:** `seller-orders.js` line 161
**Problem:** After accepting, buyer contact doesn't show until page refresh

**Fix:** Refetch orders after status update OR update backend to return full buyer object

### 6. 📝 Cancelled vs Rejected Not Distinguished
**File:** `Buyer_profile.html`
**Problem:** Both show in "Cancelled Orders" section

**Fix:** Separate sections or add visual indicator

## Status Flow Summary

### Current Valid Transitions:
```
pending → accepted → delivered ✅
pending → rejected ✅
pending → cancelled (by buyer) ✅
accepted → cancelled (by seller) ✅
accepted → delivered ✅
```

### Invalid Transitions (Blocked):
```
rejected → anything ❌
delivered → anything ❌
cancelled → anything ❌
```

## Stock Management Summary

✅ **Working Correctly:**
- Stock NOT reduced when order created (pending)
- Stock reduced when seller accepts
- Stock restored if seller rejects
- Stock restored if buyer cancels after acceptance
- No stock change if buyer cancels while pending

## Contact Info Protection

✅ **Working Correctly:**
- Hidden for pending orders
- Shown for accepted orders
- Shown for delivered orders
- Hidden for rejected/cancelled orders

## Recommendations

1. **Remove "Restore" button** - Causes confusion and invalid states
2. **Add cancelled to trash container** - So sellers see buyer cancellations
3. **Fix contact display logic** - Only show for accepted/delivered
4. **Add WebSocket push for delivery** - Real-time buyer notification
5. **Consider adding order history log** - Track all status changes with timestamps
6. **Add order cancellation reason** - Optional field for buyers to explain why
