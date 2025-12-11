# Product Setup Guide - Category Pages

## How to Add Products for Category Pages

### Important Field Names
The category pages filter products using these exact field names:
- `category` - Main category (case-insensitive)
- `subCategory` - Subcategory (case-insensitive) 
- `roomType` - For hostels only
- `isHostel` - Boolean flag for hostel listings

### Fashion Products

**Required Fields:**
```javascript
{
  "name": "Product Name",
  "category": "fashion",           // Must be "fashion"
  "subCategory": "shirts",         // See options below
  "price": 150.00,
  "stock": 10,
  "description": "Product description",
  "images": ["/uploads/products/image.jpg"],
  "deployed": true
}
```

**Valid subCategory Values:**
- **Men's Fashion**: `shirts`, `pants`, `shoes`, `bags`, `watches`, `accessories`
- **Women's Fashion**: `dresses`, `tops`, `skirts`, `shoes`, `bags`, `jewelry`, `accessories`

**Example:**
```javascript
// Men's Shirt
{
  "name": "Classic White Shirt",
  "category": "fashion",
  "subCategory": "shirts",
  "price": 120.00,
  "stock": 15,
  "deployed": true
}

// Women's Dress
{
  "name": "Summer Floral Dress",
  "category": "fashion",
  "subCategory": "dresses",
  "price": 250.00,
  "stock": 8,
  "deployed": true
}
```

### Electronics Products

**Required Fields:**
```javascript
{
  "name": "Product Name",
  "category": "electronics",       // Must be "electronics"
  "subCategory": "laptops",        // See options below
  "price": 2500.00,
  "stock": 5,
  "description": "Product description",
  "images": ["/uploads/products/image.jpg"],
  "deployed": true
}
```

**Valid subCategory Values:**
- `laptops`, `phones`, `tablets`, `headsets`, `speakers`, `chargers`, `accessories`

**Optional Field:**
- `condition` - "new" or "used" (for condition filter)

**Example:**
```javascript
// Laptop
{
  "name": "Dell Latitude 5420",
  "category": "electronics",
  "subCategory": "laptops",
  "price": 3500.00,
  "stock": 3,
  "condition": "used",
  "deployed": true
}

// Phone
{
  "name": "iPhone 13 Pro",
  "category": "electronics",
  "subCategory": "phones",
  "price": 4200.00,
  "stock": 2,
  "condition": "new",
  "deployed": true
}
```

### Hostel Listings

**Required Fields:**
```javascript
{
  "name": "Hostel Name",
  "category": "Hostels",           // Must be "Hostels" (capital H)
  "isHostel": true,                // Must be true
  "roomType": "single",            // See options below
  "price": 800.00,                 // Monthly rent
  "location": "Near Main Gate",
  "caretakerPhone": "0241234567",
  "amenities": ["WiFi", "Water", "Light", "Security"],
  "availability": "Available Now",
  "images": ["/uploads/products/image.jpg"],
  "deployed": true
}
```

**Valid roomType Values:**
- `single`, `double`, `self-contained`, `apartment`, `studio`

**Optional Fields:**
- `distanceFromCampus` - Float (in km)
- `bookingStatus` - "available", "pending", "confirmed"
- `description` - Additional details

**Example:**
```javascript
// Single Room
{
  "name": "Cozy Single Room - Block A",
  "category": "Hostels",
  "isHostel": true,
  "roomType": "single",
  "price": 600.00,
  "location": "Near Library",
  "caretakerPhone": "0241234567",
  "amenities": ["WiFi", "Water", "Light", "Security"],
  "availability": "Available Now",
  "distanceFromCampus": 0.5,
  "deployed": true
}

// Self-Contained
{
  "name": "Modern Self-Contained Room",
  "category": "Hostels",
  "isHostel": true,
  "roomType": "self-contained",
  "price": 1200.00,
  "location": "Campus View Estate",
  "caretakerPhone": "0241234567",
  "amenities": ["WiFi", "Water", "Light", "Security", "Kitchen"],
  "availability": "Available Now",
  "deployed": true
}
```

## Common Mistakes to Avoid

### ❌ Wrong Field Names
```javascript
// WRONG - uses "subcategory" (lowercase)
{
  "category": "fashion",
  "subcategory": "shirts"  // ❌ Wrong!
}

// CORRECT - uses "subCategory" (camelCase)
{
  "category": "fashion",
  "subCategory": "shirts"  // ✅ Correct!
}
```

### ❌ Wrong Category Names
```javascript
// WRONG - case mismatch
{
  "category": "Fashion"  // ❌ Wrong!
}

// CORRECT - lowercase
{
  "category": "fashion"  // ✅ Correct!
}
```

### ❌ Missing Required Fields for Hostels
```javascript
// WRONG - missing isHostel flag
{
  "category": "Hostels",
  "roomType": "single"  // ❌ Missing isHostel!
}

// CORRECT - includes isHostel
{
  "category": "Hostels",
  "isHostel": true,      // ✅ Required!
  "roomType": "single"
}
```

## Testing Your Products

### 1. Use the Test Page
Open `test-backend.html` in your browser to:
- Check if backend is running
- View all products
- Filter by category
- Test subcategory filtering

### 2. Check Category Pages
- **Fashion**: Navigate to gender → subcategory → products
- **Electronics**: Navigate to subcategory → products
- **Hostels**: Navigate to room type → listings

### 3. Verify Filtering
Products should appear on the correct pages:
- Fashion shirts should appear at: `fashion-products.html?gender=men&sub=shirts`
- Electronics laptops should appear at: `electronics-products.html?sub=laptops`
- Single rooms should appear at: `hostels-listings.html?type=single`

## Quick Reference Table

| Category | Field Name | Valid Values | Example |
|----------|-----------|--------------|---------|
| Fashion | `category` | "fashion" | "fashion" |
| Fashion | `subCategory` | shirts, pants, shoes, bags, watches, accessories, dresses, tops, skirts, jewelry | "shirts" |
| Electronics | `category` | "electronics" | "electronics" |
| Electronics | `subCategory` | laptops, phones, tablets, headsets, speakers, chargers, accessories | "laptops" |
| Electronics | `condition` | new, used | "used" |
| Hostels | `category` | "Hostels" | "Hostels" |
| Hostels | `isHostel` | true | true |
| Hostels | `roomType` | single, double, self-contained, apartment, studio | "single" |

## API Endpoints for Adding Products

### Add Regular Product (Fashion/Electronics)
```
POST /api/products/add
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- name: "Product Name"
- category: "fashion" or "electronics"
- subCategory: "shirts", "laptops", etc.
- price: 150.00
- stock: 10
- description: "Description"
- images: [files]
```

### Add Hostel Listing
```
POST /api/products/hostel/add
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- name: "Hostel Name"
- category: "Hostels"
- isHostel: true
- roomType: "single", "double", etc.
- price: 800.00
- location: "Near Campus"
- caretakerPhone: "0241234567"
- amenities: ["WiFi", "Water", "Light", "Security"]
- images: [files]
```

## Troubleshooting

### Products Not Showing Up?

1. **Check if deployed:**
   - Products must have `deployed: true`

2. **Check field names:**
   - Use `subCategory` (camelCase), not `subcategory`
   - Use `roomType` for hostels, not `subCategory`

3. **Check category spelling:**
   - Fashion: "fashion" (lowercase)
   - Electronics: "electronics" (lowercase)
   - Hostels: "Hostels" (capital H)

4. **Check isHostel flag:**
   - Hostels must have `isHostel: true`

5. **Use test page:**
   - Open `test-backend.html` to debug

### Search Not Working?

- Search looks for matches in `name`, `description`, and `location` fields
- Make sure these fields contain relevant text

### Trust Badges Not Showing?

- Trust badges are generated randomly for demo
- To use real data, modify the `renderProducts()` or `renderHostels()` functions
- Replace random values with actual seller data from backend

## Need Help?

Check these files:
- `CATEGORY_PAGES_COMPLETE.md` - Full implementation details
- `test-backend.html` - Backend testing tool
- Backend: `DEX_BACKEND/controllers/productController.js`
- Frontend: `DEX_FRONTEND/DEX_HOMEPAGES/*.html`
