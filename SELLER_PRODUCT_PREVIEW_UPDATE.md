# Seller Dashboard Product Preview - Improvements

## Changes to Implement

### 1. Add Deployment Status Badge
Show clear visual indicator if product is deployed or not deployed.

### 2. Add Preview Button
Add "Preview on Site" button that opens the actual category page where the product appears.

## Implementation

Add to `seller-products.js` in the `createProductCard` function:

```javascript
// Add deployment status badge
const deployBadge = document.createElement('div');
deployBadge.className = 'deploy-status-badge';
deployBadge.style.cssText = `
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 12px;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  z-index: 2;
  ${p.deployed 
    ? 'background: #27ae60; color: #fff;' 
    : 'background: #95a5a6; color: #fff;'}
`;
deployBadge.textContent = p.deployed ? '✓ Live' : 'Draft';

// Add preview button (only for deployed products)
if (p.deployed) {
  const previewBtn = document.createElement('button');
  previewBtn.className = 'preview-btn';
  previewBtn.innerHTML = '<i class="fas fa-eye"></i> Preview';
  previewBtn.style.cssText = `
    background: #3498db;
    color: white;
    border: none;
    padding: 10px;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.25s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  `;
  previewBtn.onclick = (e) => {
    e.stopPropagation();
    // Build preview URL based on category
    let previewUrl = '';
    if (p.isHostel) {
      previewUrl = `../hostels-listings.html?type=${p.roomType?.toLowerCase().replace(' ', '-')}`;
    } else if (p.category === 'fashion') {
      const details = typeof p.details === 'string' ? JSON.parse(p.details) : p.details;
      const gender = details?.Gender?.toLowerCase() === 'male' ? 'men' : 'women';
      previewUrl = `../fashion-products.html?gender=${gender}&sub=${p.subCategory}`;
    } else if (p.category === 'electronics') {
      previewUrl = `../electronics-products.html?sub=${p.subCategory}`;
    }
    if (previewUrl) window.open(previewUrl, '_blank');
  };
}
```

## CSS to Add

```css
.deploy-status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 12px;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.preview-btn:hover {
  background: #2980b9 !important;
  transform: scale(1.05);
}
```

## Result

- Products show "✓ Live" (green) or "Draft" (gray) badge
- Deployed products have "Preview" button that opens category page in new tab
- Clean, minimal implementation
