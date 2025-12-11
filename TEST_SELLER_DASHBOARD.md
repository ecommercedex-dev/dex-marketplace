# 🧪 Test Plan: Seller Dashboard Fix

## Quick Test (5 minutes)

### 1. Clear Browser Data
```
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Run: localStorage.clear(); sessionStorage.clear();
4. Close DevTools
5. Refresh page
```

### 2. Test Seller A
```
1. Go to: http://localhost:3000/DEX_FRONTEND/DEX_HOMEPAGES/REGISTRY_PAGES/seller_sign_in.html
2. Log in as Seller A
3. Open Console (F12)
4. Look for: "✅ Seller logged in: { id: X, name: "...", ... }"
5. Note the ID number
6. Go to Products section
7. Count how many products you see
8. Note the product names
```

### 3. Test Seller B
```
1. Click Logout button
2. Log in as Seller B (different account)
3. Open Console (F12)
4. Look for: "✅ Seller logged in: { id: Y, name: "...", ... }"
5. Verify ID is DIFFERENT from Seller A
6. Go to Products section
7. Count products - should be DIFFERENT from Seller A
8. Product names should be DIFFERENT from Seller A
```

## Expected Results

### ✅ PASS Criteria:
- Seller A ID ≠ Seller B ID
- Seller A products ≠ Seller B products
- Each seller sees only their own products

### ❌ FAIL Criteria:
- Both sellers see same products
- Console shows same ID for different sellers
- Products don't change when switching sellers

## Detailed Test (15 minutes)

### Test Case 1: Fresh Login
```
GIVEN: Browser with cleared storage
WHEN: Seller A logs in
THEN: 
  - Console shows "✅ Seller logged in: { id: 1, ... }"
  - Dashboard shows Seller A's products only
  - Product count matches Seller A's actual products
```

### Test Case 2: Different Seller
```
GIVEN: Seller A is logged out
WHEN: Seller B logs in
THEN:
  - Console shows "✅ Seller logged in: { id: 2, ... }"
  - Dashboard shows Seller B's products only
  - Products are completely different from Seller A
```

### Test Case 3: Remember Me
```
GIVEN: "Keep me signed in" is checked
WHEN: Seller logs in and closes browser
THEN:
  - Reopening browser keeps seller logged in
  - Correct seller's products still show
```

### Test Case 4: Session Only
```
GIVEN: "Keep me signed in" is NOT checked
WHEN: Seller logs in and closes browser
THEN:
  - Reopening browser requires login again
  - After login, correct products show
```

## Debug Checklist

If test fails, check these in order:

### 1. Console Logs
```javascript
// Should see in console:
✅ Seller logged in: { id: 1, name: "John", email: "john@example.com", category: "Electronics" }
```

### 2. Local Storage
```javascript
// In DevTools → Application → Local Storage
// Check "currentUser" value:
{
  "id": 1,
  "name": "John",
  "email": "john@example.com",
  "phone": "0241234567",
  "storeName": "John's Electronics",
  "role": "seller",
  "productCategory": "Electronics",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Network Request
```
DevTools → Network → Filter: "my"
Click on: /api/products/my
→ Headers tab
→ Request Headers
→ Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Copy the token after "Bearer "
Go to: https://jwt.io
Paste token
Check payload:
{
  "id": 1,  // Should match seller ID
  "role": "seller",
  "email": "john@example.com",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 4. Database Query
```sql
-- Run in your database client
SELECT id, name, email, storeName, productCategory FROM Seller;

-- Should return multiple sellers:
-- id | name  | email              | storeName          | productCategory
-- 1  | John  | john@example.com   | John's Electronics | Electronics
-- 2  | Mary  | mary@example.com   | Mary's Fashion     | Fashion
-- 3  | Peter | peter@example.com  | Peter's Hostel     | Hostels
```

```sql
-- Check products for each seller
SELECT id, name, sellerId FROM Product WHERE sellerId = 1;
SELECT id, name, sellerId FROM Product WHERE sellerId = 2;

-- Results should be DIFFERENT for each seller
```

## Common Issues & Solutions

### Issue 1: Both sellers see same products
**Cause**: Old cached data
**Solution**: 
```javascript
localStorage.clear();
sessionStorage.clear();
// Then log in again
```

### Issue 2: Console shows same ID for different sellers
**Cause**: Not actually logging out properly
**Solution**: 
```javascript
// Manually clear and reload
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

### Issue 3: No products showing at all
**Cause**: Token not being sent
**Solution**: Check Network tab → /api/products/my → Headers → Should have Authorization header

### Issue 4: "Access Denied" error
**Cause**: Token expired or invalid
**Solution**: Log out and log in again

## Success Metrics

After fix is verified:
- ✅ 3 different sellers tested
- ✅ Each sees only their own products
- ✅ Console logs show different IDs
- ✅ Network requests show correct tokens
- ✅ Database queries confirm correct filtering

## Regression Test

Test these scenarios to ensure nothing broke:

1. ✅ Add new product → Shows in dashboard
2. ✅ Edit product → Changes reflect immediately
3. ✅ Delete product → Removes from dashboard
4. ✅ Deploy product → Shows in public shop
5. ✅ Undeploy product → Removes from public shop
6. ✅ Logout → Clears session
7. ✅ Login again → Shows correct products

## Performance Test

1. Create seller with 50+ products
2. Log in
3. Check dashboard load time
4. Should load in < 2 seconds

## Security Test

1. Copy Seller A's token
2. Log out
3. Log in as Seller B
4. Try to use Seller A's token in API request
5. Should get "Unauthorized" error

---

## Final Verification

Run this in console after logging in:
```javascript
const user = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
console.log('Current Seller:', {
  id: user.id,
  name: user.name,
  email: user.email,
  category: user.productCategory,
  hasToken: !!user.token
});

// Fetch products
fetch('http://localhost:5000/api/products/my', {
  headers: { 'Authorization': `Bearer ${user.token}` }
})
.then(r => r.json())
.then(products => {
  console.log(`Found ${products.length} products for seller ${user.id}`);
  console.log('Product names:', products.map(p => p.name));
});
```

Expected output:
```
Current Seller: { id: 1, name: "John", email: "john@example.com", category: "Electronics", hasToken: true }
Found 5 products for seller 1
Product names: ["iPhone 14", "MacBook Pro", "AirPods", "iPad", "Apple Watch"]
```

---

## Report Template

After testing, fill this out:

```
TEST REPORT
===========
Date: ___________
Tester: ___________

Seller A:
- ID: ___
- Name: ___________
- Products Count: ___
- Products: ___________

Seller B:
- ID: ___
- Name: ___________
- Products Count: ___
- Products: ___________

Seller C:
- ID: ___
- Name: ___________
- Products Count: ___
- Products: ___________

Results:
[ ] PASS - Each seller sees only their own products
[ ] FAIL - Sellers see same products

Issues Found:
___________________________________________
___________________________________________

Status: ___________
```
