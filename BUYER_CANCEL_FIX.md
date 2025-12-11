# Buyer Order Cancel Fix

## Issue
Buyers are getting 403 Forbidden when trying to cancel orders because they're using the seller's status update endpoint.

## Solution
Change the buyer cancel order endpoint from `/orders/${id}/status` to `/orders/${id}/cancel`

## File to Update
`DEX_FRONTEND/DEX_HOMEPAGES/PROFILE_PAGES/Buyer_profile.html`

## Line to Change (around line 1795)

### BEFORE:
```javascript
await fetchWithRetry(`${API}/orders/${id}/status`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ status: "rejected" }),
});
```

### AFTER:
```javascript
await fetchWithRetry(`${API}/orders/${id}/cancel`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});
```

## Changes Made to Backend:
1. ✅ Added `cancelOrderController` in `services/orderService.js`
2. ✅ Added controller wrapper in `controllers/orderController.js`
3. ✅ Added route `/orders/:orderId/cancel` for buyers in `routes/orderRoutes.js`

## How It Works Now:
- Buyers can only cancel **pending** orders
- Uses dedicated `/cancel` endpoint
- Notifies seller when buyer cancels
- No stock adjustment needed (stock wasn't reduced yet for pending orders)
