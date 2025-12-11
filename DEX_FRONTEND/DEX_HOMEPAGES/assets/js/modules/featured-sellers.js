const API_URL = "http://localhost:5000/api";

export async function loadFeaturedSellers() {
  try {
    // Fetch only products data (sellers endpoint doesn't exist)
    const productsRes = await fetch(`${API_URL}/products`);
    
    let products = [];
    
    // Get products data
    if (productsRes.ok) {
      const productsData = await productsRes.json();
      products = Array.isArray(productsData) ? productsData : (productsData.products || []);
    }
    
    // Filter for electronics and fashion categories only
    const allowedCategories = ['electronics', 'fashion'];
    const filteredProducts = products.filter(product => {
      const category = (product.category || '').toLowerCase();
      return allowedCategories.some(allowed => category.includes(allowed));
    });
    
    if (filteredProducts.length === 0) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isBuyer = user && user.role === 'buyer';
      const container = document.getElementById("featured-sellers-carousel");
      container.innerHTML = `
        <a href="DEX_HOMEPAGES/sellerShop.html?sellerId=demo1" class="shop-card-link" style="text-decoration:none;color:inherit;">
          <div class="shop-card fade-in" style="cursor:pointer;transition:all 0.3s ease;" onmouseover="this.style.transform='translateY(-8px)';" onmouseout="this.style.transform='translateY(0)';">
            <div class="shop-banner" style="position:relative;height:120px;background:linear-gradient(135deg,#2196F3,#64B5F6);">
              <span style="position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.9);color:#333;padding:4px 8px;border-radius:12px;font-size:0.7rem;font-weight:600;">Electronics</span>
            </div>
            <div style="position:relative;padding-top:40px;">
              <div style="position:absolute;top:-30px;left:50%;transform:translateX(-50%);width:60px;height:60px;border-radius:50%;background:#2196F3;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:1.8rem;box-shadow:0 4px 12px rgba(0,0,0,0.15);">📱</div>
              <div class="shop-info">
                <div style="text-align:center;font-size:1.1rem;font-weight:700;margin-bottom:4px;">Tech Shop <span style="display:inline-block;background:#4CAF50;color:#fff;border-radius:50%;width:18px;height:18px;text-align:center;line-height:18px;font-size:0.7rem;margin-left:4px;">✓</span></div>
                <div style="text-align:center;color:#888;font-size:0.85rem;margin-bottom:16px;">Quality electronics for students</div>
                <div style="display:flex;justify-content:space-around;margin-bottom:16px;padding:12px 0;border-top:1px solid rgba(0,0,0,0.1);border-bottom:1px solid rgba(0,0,0,0.1);">
                  <div style="text-align:center;"><span style="display:block;font-weight:700;color:#2196F3;font-size:1rem;">⭐ 4.8</span><div style="font-size:0.7rem;color:#999;margin-top:2px;">Rating</div></div>
                  <div style="text-align:center;"><span style="display:block;font-weight:700;color:#2196F3;font-size:1rem;">15</span><div style="font-size:0.7rem;color:#999;margin-top:2px;">Products</div></div>
                  <div style="text-align:center;"><span style="display:block;font-weight:700;color:#2196F3;font-size:1rem;">45</span><div style="font-size:0.7rem;color:#999;margin-top:2px;">Followers</div></div>
                </div>
                <div style="display:flex;gap:8px;margin-bottom:12px;">
                  <button style="flex:${isBuyer ? '1' : '2'};padding:10px;background:#2196F3;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Visit Shop</button>
                  ${isBuyer ? '<button style="flex:1;padding:10px;background:transparent;color:#2196F3;border:2px solid #2196F3;border-radius:8px;font-weight:600;cursor:pointer;" onclick="event.preventDefault();event.stopPropagation();">Follow</button>' : ''}
                </div>
                <div style="text-align:center;font-size:0.75rem;color:#aaa;">Member since 2024</div>
              </div>
            </div>
          </div>
        </a>
        <a href="DEX_HOMEPAGES/sellerShop.html?sellerId=demo2" class="shop-card-link" style="text-decoration:none;color:inherit;">
          <div class="shop-card fade-in" style="cursor:pointer;transition:all 0.3s ease;" onmouseover="this.style.transform='translateY(-8px)';" onmouseout="this.style.transform='translateY(0)';">
            <div class="shop-banner" style="position:relative;height:120px;background:linear-gradient(135deg,#E91E63,#F48FB1);">
              <span style="position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.9);color:#333;padding:4px 8px;border-radius:12px;font-size:0.7rem;font-weight:600;">Fashion</span>
            </div>
            <div style="position:relative;padding-top:40px;">
              <div style="position:absolute;top:-30px;left:50%;transform:translateX(-50%);width:60px;height:60px;border-radius:50%;background:#E91E63;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:1.8rem;box-shadow:0 4px 12px rgba(0,0,0,0.15);">👗</div>
              <div class="shop-info">
                <div style="text-align:center;font-size:1.1rem;font-weight:700;margin-bottom:4px;">Style Hub <span style="display:inline-block;background:#4CAF50;color:#fff;border-radius:50%;width:18px;height:18px;text-align:center;line-height:18px;font-size:0.7rem;margin-left:4px;">✓</span></div>
                <div style="text-align:center;color:#888;font-size:0.85rem;margin-bottom:16px;">Trendy fashion for campus life</div>
                <div style="display:flex;justify-content:space-around;margin-bottom:16px;padding:12px 0;border-top:1px solid rgba(0,0,0,0.1);border-bottom:1px solid rgba(0,0,0,0.1);">
                  <div style="text-align:center;"><span style="display:block;font-weight:700;color:#E91E63;font-size:1rem;">⭐ 4.6</span><div style="font-size:0.7rem;color:#999;margin-top:2px;">Rating</div></div>
                  <div style="text-align:center;"><span style="display:block;font-weight:700;color:#E91E63;font-size:1rem;">22</span><div style="font-size:0.7rem;color:#999;margin-top:2px;">Products</div></div>
                  <div style="text-align:center;"><span style="display:block;font-weight:700;color:#E91E63;font-size:1rem;">38</span><div style="font-size:0.7rem;color:#999;margin-top:2px;">Followers</div></div>
                </div>
                <div style="display:flex;gap:8px;margin-bottom:12px;">
                  <button style="flex:${isBuyer ? '1' : '2'};padding:10px;background:#E91E63;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Visit Shop</button>
                  ${isBuyer ? '<button style="flex:1;padding:10px;background:transparent;color:#E91E63;border:2px solid #E91E63;border-radius:8px;font-weight:600;cursor:pointer;" onclick="event.preventDefault();event.stopPropagation();">Follow</button>' : ''}
                </div>
                <div style="text-align:center;font-size:0.75rem;color:#aaa;">Member since 2024</div>
              </div>
            </div>
          </div>
        </a>
      `;
      return;
    }
    
    // Group products by seller and fetch shop settings
    const shopMap = new Map();
    
    for (const product of filteredProducts) {
      const sellerId = product.sellerId || product.seller || 'unknown';
      if (!shopMap.has(sellerId)) {
        // Fetch shop settings using correct endpoint
        let shopSettings = null;
        try {
          const settingsRes = await fetch(`${API_URL}/shop/settings/public/${sellerId}`);
          if (settingsRes.ok) {
            shopSettings = await settingsRes.json();
          }
        } catch (e) {
          // Use default template based on category
        }
        
        // Default templates based on category
        const getDefaultTemplate = (category) => {
          const cat = (category || '').toLowerCase();
          if (cat.includes('electronics')) {
            return {
              colors: { primary: '#2196F3', accent: '#64B5F6' },
              bannerConfig: { type: 'gradient', startColor: '#2196F3', endColor: '#64B5F6', direction: '135deg' },
              logoType: 'icon',
              logoIcon: '📱',
              tagline: 'Quality electronics for students'
            };
          } else if (cat.includes('fashion')) {
            return {
              colors: { primary: '#E91E63', accent: '#F48FB1' },
              bannerConfig: { type: 'gradient', startColor: '#E91E63', endColor: '#F48FB1', direction: '135deg' },
              logoType: 'icon',
              logoIcon: '👗',
              tagline: 'Trendy fashion for campus life'
            };
          }
          return {
            colors: { primary: '#4CAF50', accent: '#81C784' },
            bannerConfig: { type: 'gradient', startColor: '#4CAF50', endColor: '#81C784', direction: '135deg' },
            logoType: 'icon',
            logoIcon: '🏪',
            tagline: 'Quality products for students'
          };
        };
        
        const defaultTemplate = getDefaultTemplate(product.category);
        const finalSettings = shopSettings || defaultTemplate;
        
        // Fetch actual follower count
        let followerCount = 0;
        try {
          const followRes = await fetch(`${API_URL}/seller/followers/${sellerId}`);
          if (followRes.ok) {
            const data = await followRes.json();
            followerCount = data.count || 0;
          }
        } catch (e) {
          followerCount = 0;
        }
        
        shopMap.set(sellerId, {
          id: sellerId,
          name: product.sellerName || 'Shop Owner',
          shopName: finalSettings.shopName || product.sellerName || 'My Shop',
          tagline: finalSettings.tagline || defaultTemplate.tagline,
          profilePic: product.sellerProfilePic,
          bannerImage: finalSettings.bannerImage,
          bannerConfig: finalSettings.bannerConfig || defaultTemplate.bannerConfig,
          shopLogo: finalSettings.shopLogo,
          logoType: finalSettings.logoType || defaultTemplate.logoType,
          logoText: finalSettings.logoText,
          logoIcon: finalSettings.logoIcon || defaultTemplate.logoIcon,
          colors: finalSettings.colors || defaultTemplate.colors,
          rating: 4.5,
          verified: product.sellerVerified || false,
          memberSince: new Date().getFullYear(),
          followers: followerCount,
          category: product.category,
          products: [],
          productCount: 0
        });
      }
      shopMap.get(sellerId).products.push(product);
      shopMap.get(sellerId).productCount++;
    }
    
    // Convert to array and sort by product count, then by rating
    const shops = Array.from(shopMap.values())
      .filter(shop => shop.productCount > 0) // Only shops with products
      .sort((a, b) => {
        // First sort by product count, then by rating
        if (b.productCount !== a.productCount) {
          return b.productCount - a.productCount;
        }
        return b.rating - a.rating;
      })
      .slice(0, 6); // Show top 6 shops
    
    // Check if user is logged in and is a buyer
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isBuyer = user && user.role === 'buyer';
    
    const container = document.getElementById("featured-sellers-carousel");
    container.innerHTML = shops.map(shop => {
      // Handle shop logo
      let shopLogo;
      if (shop.logoType === 'upload' && shop.shopLogo) {
        shopLogo = shop.shopLogo.startsWith('http') ? shop.shopLogo : `${API_URL.replace('/api', '')}${shop.shopLogo}`;
      } else if (shop.logoType === 'text' && shop.logoText) {
        shopLogo = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 60'%3E%3Ctext x='60' y='35' text-anchor='middle' font-family='Arial,sans-serif' font-size='16' font-weight='bold' fill='%23333'%3E${encodeURIComponent(shop.logoText)}%3C/text%3E%3C/svg%3E`;
      } else if (shop.logoType === 'icon' && shop.logoIcon) {
        shopLogo = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Ctext x='30' y='38' text-anchor='middle' font-size='28'%3E${shop.logoIcon}%3C/text%3E%3C/svg%3E`;
      } else if (shop.profilePic) {
        shopLogo = shop.profilePic.startsWith('http') ? shop.profilePic : `${API_URL.replace('/api', '')}${shop.profilePic}`;
      } else {
        shopLogo = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Ctext x='30' y='38' text-anchor='middle' font-size='28'%3E🏪%3C/text%3E%3C/svg%3E`;
      }
      
      // Category badge
      const categoryBadge = shop.category ? `<span style="position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.9);color:#333;padding:4px 8px;border-radius:12px;font-size:0.7rem;font-weight:600;">${shop.category}</span>` : '';
      
      // Handle banner with text support
      let bannerHTML = '';
      let bannerText = '';
      
      if (shop.bannerImage) {
        const bannerUrl = shop.bannerImage.startsWith('http') ? shop.bannerImage : `${API_URL.replace('/api', '')}${shop.bannerImage}`;
        bannerHTML = `<div class="shop-banner" style="position:relative;height:120px;background-image:url('${bannerUrl}');background-size:cover;background-position:center;">${categoryBadge}</div>`;
      } else if (shop.bannerConfig) {
        const config = typeof shop.bannerConfig === 'string' ? JSON.parse(shop.bannerConfig) : shop.bannerConfig;
        let bgStyle = '';
        
        if (config.type === 'color') {
          bgStyle = `background: ${config.color || config.bgColor};`;
        } else if (config.type === 'gradient') {
          bgStyle = `background: linear-gradient(${config.direction || config.gradientDirection || '135deg'}, ${config.startColor || config.color1}, ${config.endColor || config.color2});`;
        } else if (config.type === 'pattern') {
          const baseColor = config.patternBaseColor || shop.colors.primary;
          bgStyle = `background: ${baseColor}; background-image: radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px); background-size: 20px 20px;`;
        } else if (config.type === 'image' && config.image) {
          bgStyle = `background-image: url('${config.image}'); background-size: cover; background-position: ${config.imagePosition || 'center'};`;
        } else {
          bgStyle = `background: linear-gradient(135deg, ${shop.colors.primary}, ${shop.colors.accent});`;
        }
        
        // Add banner text if configured
        if (config.text) {
          const textSize = config.textSize === 'small' ? '0.8rem' : config.textSize === 'large' ? '1.1rem' : '0.95rem';
          const textStyle = config.textStyle === 'bold' ? 'font-weight: 700;' : config.textStyle === 'shadow' ? 'text-shadow: 2px 2px 4px rgba(0,0,0,0.5);' : '';
          const position = config.textPosition || 'center';
          const alignMap = {
            'top-left': 'top:12px;left:12px;', 'top-center': 'top:12px;left:50%;transform:translateX(-50%);', 'top-right': 'top:12px;right:12px;',
            'center-left': 'top:50%;left:12px;transform:translateY(-50%);', 'center': 'top:50%;left:50%;transform:translate(-50%,-50%);', 'center-right': 'top:50%;right:12px;transform:translateY(-50%);',
            'bottom-left': 'bottom:12px;left:12px;', 'bottom-center': 'bottom:12px;left:50%;transform:translateX(-50%);', 'bottom-right': 'bottom:12px;right:12px;'
          };
          bannerText = `<div style="position:absolute;${alignMap[position] || alignMap['center']}color:${config.textColor || '#fff'};font-size:${textSize};${textStyle}z-index:1;">${config.text}</div>`;
        }
        
        bannerHTML = `<div class="shop-banner" style="position:relative;height:120px;${bgStyle}">${bannerText}${categoryBadge}</div>`;
      } else {
        bannerHTML = `<div class="shop-banner" style="position:relative;height:120px;background:linear-gradient(135deg, ${shop.colors.primary}, ${shop.colors.accent});">${categoryBadge}</div>`;
      }
      
      return `
        <a href="DEX_HOMEPAGES/sellerShop.html?sellerId=${shop.id}" class="shop-card-link" style="text-decoration:none;color:inherit;">
          <div class="shop-card fade-in" style="cursor:pointer;transition:all 0.3s ease;" onmouseover="this.style.transform='translateY(-8px)';this.style.boxShadow='0 12px 40px rgba(0,0,0,0.2)';" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='';">
            ${bannerHTML}
            <div style="position:relative;padding-top:40px;">
              <img src="${shopLogo}" alt="${shop.shopName}" class="shop-logo" style="position:absolute;top:-30px;left:50%;transform:translateX(-50%);width:60px;height:60px;border-radius:50%;border:3px solid white;object-fit:cover;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
              <div class="shop-info">
                <div class="shop-name" style="text-align:center;font-size:1.1rem;font-weight:700;margin-bottom:4px;">
                  ${shop.shopName}
                  ${shop.verified ? '<span class="verified-badge" style="display:inline-block;background:#4CAF50;color:#fff;border-radius:50%;width:18px;height:18px;text-align:center;line-height:18px;font-size:0.7rem;margin-left:4px;">✓</span>' : ''}
                </div>
                <div class="shop-tagline" style="text-align:center;color:#888;font-size:0.85rem;margin-bottom:16px;min-height:20px;">${shop.tagline || ''}</div>
                <div class="shop-stats" style="display:flex;justify-content:space-around;margin-bottom:16px;padding:12px 0;border-top:1px solid rgba(0,0,0,0.1);border-bottom:1px solid rgba(0,0,0,0.1);">
                  <div class="shop-stat" style="text-align:center;">
                    <span class="shop-stat-value" style="display:block;font-weight:700;color:${shop.colors.primary};font-size:1rem;">⭐ ${shop.rating.toFixed(1)}</span>
                    <div class="shop-stat-label" style="font-size:0.7rem;color:#999;margin-top:2px;">Rating</div>
                  </div>
                  <div class="shop-stat" style="text-align:center;">
                    <span class="shop-stat-value" style="display:block;font-weight:700;color:${shop.colors.primary};font-size:1rem;">${shop.productCount}</span>
                    <div class="shop-stat-label" style="font-size:0.7rem;color:#999;margin-top:2px;">Products</div>
                  </div>
                  <div class="shop-stat" style="text-align:center;">
                    <span class="shop-stat-value" style="display:block;font-weight:700;color:${shop.colors.primary};font-size:1rem;">${shop.followers}</span>
                    <div class="shop-stat-label" style="font-size:0.7rem;color:#999;margin-top:2px;">Followers</div>
                  </div>
                </div>
                <div class="shop-actions" style="display:flex;gap:8px;margin-bottom:12px;">
                  <button class="btn-visit" style="flex:${isBuyer ? '1' : '2'};padding:10px;background:${shop.colors.primary};color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='${shop.colors.accent}';" onmouseout="this.style.background='${shop.colors.primary}';">Visit Shop</button>
                  ${isBuyer ? `<button class="btn-follow" style="flex:1;padding:10px;background:transparent;color:${shop.colors.primary};border:2px solid ${shop.colors.primary};border-radius:8px;font-weight:600;cursor:pointer;transition:all 0.2s;" onclick="event.preventDefault();event.stopPropagation();this.textContent=this.textContent==='Follow'?'Following':'Follow';this.style.background=this.textContent==='Following'?'${shop.colors.primary}':'transparent';this.style.color=this.textContent==='Following'?'#fff':'${shop.colors.primary}';" onmouseover="if(this.textContent==='Follow'){this.style.background='${shop.colors.primary}';this.style.color='#fff';}" onmouseout="if(this.textContent==='Follow'){this.style.background='transparent';this.style.color='${shop.colors.primary}';}">Follow</button>` : ''}
                </div>
                <div class="member-since" style="text-align:center;font-size:0.75rem;color:#aaa;">Member since ${shop.memberSince}</div>
              </div>
            </div>
          </div>
        </a>
      `;
    }).join('');
  } catch (err) {
    console.error("Featured shops load error:", err);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isBuyer = user && user.role === 'buyer';
    const container = document.getElementById("featured-sellers-carousel");
    container.innerHTML = `
      <a href="DEX_HOMEPAGES/sellerShop.html?sellerId=demo1" class="shop-card-link" style="text-decoration:none;color:inherit;">
        <div class="shop-card fade-in" style="cursor:pointer;transition:all 0.3s ease;" onmouseover="this.style.transform='translateY(-8px)';" onmouseout="this.style.transform='translateY(0)';">
          <div class="shop-banner" style="position:relative;height:120px;background:linear-gradient(135deg,#2196F3,#64B5F6);">
            <span style="position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.9);color:#333;padding:4px 8px;border-radius:12px;font-size:0.7rem;font-weight:600;">Electronics</span>
          </div>
          <div style="position:relative;padding-top:40px;">
            <div style="position:absolute;top:-30px;left:50%;transform:translateX(-50%);width:60px;height:60px;border-radius:50%;background:#2196F3;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:1.8rem;box-shadow:0 4px 12px rgba(0,0,0,0.15);">📱</div>
            <div class="shop-info">
              <div style="text-align:center;font-size:1.1rem;font-weight:700;margin-bottom:4px;">Tech Shop <span style="display:inline-block;background:#4CAF50;color:#fff;border-radius:50%;width:18px;height:18px;text-align:center;line-height:18px;font-size:0.7rem;margin-left:4px;">✓</span></div>
              <div style="text-align:center;color:#888;font-size:0.85rem;margin-bottom:16px;">Quality electronics for students</div>
              <div style="display:flex;justify-content:space-around;margin-bottom:16px;padding:12px 0;border-top:1px solid rgba(0,0,0,0.1);border-bottom:1px solid rgba(0,0,0,0.1);">
                <div style="text-align:center;"><span style="display:block;font-weight:700;color:#2196F3;font-size:1rem;">⭐ 4.8</span><div style="font-size:0.7rem;color:#999;margin-top:2px;">Rating</div></div>
                <div style="text-align:center;"><span style="display:block;font-weight:700;color:#2196F3;font-size:1rem;">15</span><div style="font-size:0.7rem;color:#999;margin-top:2px;">Products</div></div>
                <div style="text-align:center;"><span style="display:block;font-weight:700;color:#2196F3;font-size:1rem;">45</span><div style="font-size:0.7rem;color:#999;margin-top:2px;">Followers</div></div>
              </div>
              <div style="display:flex;gap:8px;margin-bottom:12px;">
                <button style="flex:${isBuyer ? '1' : '2'};padding:10px;background:#2196F3;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Visit Shop</button>
                ${isBuyer ? '<button style="flex:1;padding:10px;background:transparent;color:#2196F3;border:2px solid #2196F3;border-radius:8px;font-weight:600;cursor:pointer;" onclick="event.preventDefault();event.stopPropagation();">Follow</button>' : ''}
              </div>
              <div style="text-align:center;font-size:0.75rem;color:#aaa;">Member since 2024</div>
            </div>
          </div>
        </div>
      </a>
      <a href="DEX_HOMEPAGES/sellerShop.html?sellerId=demo2" class="shop-card-link" style="text-decoration:none;color:inherit;">
        <div class="shop-card fade-in" style="cursor:pointer;transition:all 0.3s ease;" onmouseover="this.style.transform='translateY(-8px)';" onmouseout="this.style.transform='translateY(0)';">
          <div class="shop-banner" style="position:relative;height:120px;background:linear-gradient(135deg,#E91E63,#F48FB1);">
            <span style="position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.9);color:#333;padding:4px 8px;border-radius:12px;font-size:0.7rem;font-weight:600;">Fashion</span>
          </div>
          <div style="position:relative;padding-top:40px;">
            <div style="position:absolute;top:-30px;left:50%;transform:translateX(-50%);width:60px;height:60px;border-radius:50%;background:#E91E63;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:1.8rem;box-shadow:0 4px 12px rgba(0,0,0,0.15);">👗</div>
            <div class="shop-info">
              <div style="text-align:center;font-size:1.1rem;font-weight:700;margin-bottom:4px;">Style Hub <span style="display:inline-block;background:#4CAF50;color:#fff;border-radius:50%;width:18px;height:18px;text-align:center;line-height:18px;font-size:0.7rem;margin-left:4px;">✓</span></div>
              <div style="text-align:center;color:#888;font-size:0.85rem;margin-bottom:16px;">Trendy fashion for campus life</div>
              <div style="display:flex;justify-content:space-around;margin-bottom:16px;padding:12px 0;border-top:1px solid rgba(0,0,0,0.1);border-bottom:1px solid rgba(0,0,0,0.1);">
                <div style="text-align:center;"><span style="display:block;font-weight:700;color:#E91E63;font-size:1rem;">⭐ 4.6</span><div style="font-size:0.7rem;color:#999;margin-top:2px;">Rating</div></div>
                <div style="text-align:center;"><span style="display:block;font-weight:700;color:#E91E63;font-size:1rem;">22</span><div style="font-size:0.7rem;color:#999;margin-top:2px;">Products</div></div>
                <div style="text-align:center;"><span style="display:block;font-weight:700;color:#E91E63;font-size:1rem;">38</span><div style="font-size:0.7rem;color:#999;margin-top:2px;">Followers</div></div>
              </div>
              <div style="display:flex;gap:8px;margin-bottom:12px;">
                <button style="flex:${isBuyer ? '1' : '2'};padding:10px;background:#E91E63;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Visit Shop</button>
                ${isBuyer ? '<button style="flex:1;padding:10px;background:transparent;color:#E91E63;border:2px solid #E91E63;border-radius:8px;font-weight:600;cursor:pointer;" onclick="event.preventDefault();event.stopPropagation();">Follow</button>' : ''}
              </div>
              <div style="text-align:center;font-size:0.75rem;color:#aaa;">Member since 2024</div>
            </div>
          </div>
        </div>
      </a>
    `;
  }
}
