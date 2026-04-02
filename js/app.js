// =============================================
// COFFEE HAVEN - SAAS ECOMMERCE CORE ENGINE
// =============================================

const App = {
  BUILD_ID: String(Date.now()),
  FALLBACK_IMAGE: 'assets/coffee%20png.png',

  KEYS: {
    catalogHash: 'ch_catalogHash',
    users: 'ch_users',
    currentUser: 'ch_currentUser',
    products: 'ch_products',
    cart: 'ch_cart',
    wishlist: 'ch_wishlist',
    orders: 'ch_orders',
    adminData: 'ch_adminData',
  },

  DEFAULT_PRODUCTS: [
    {
      id: 'p001',
      name: 'Americano',
      category: 'espresso',
      price: 4.99,
      oldPrice: 6.99,
      rating: 4.5,
      reviews: 128,
      stock: 50,
      available: true,
      img: 'assets/americano.jpg',
      badge: 'Bestseller',
      desc: 'A bold, rich espresso shot diluted with hot water. Clean and strong with subtle nutty undertones.',
      variants: ['Small', 'Medium', 'Large'],
      sizes: { Small: 3.99, Medium: 4.99, Large: 5.99 }
    },
    {
      id: 'p002',
      name: 'Cafe Latte',
      category: 'latte',
      price: 5.49,
      oldPrice: 7.49,
      rating: 4.8,
      reviews: 214,
      stock: 40,
      available: true,
      img: 'assets/cafe-latte.png',
      badge: 'Popular',
      desc: 'Smooth espresso with velvety steamed milk. A classic comfort in every sip.',
      variants: ['Small', 'Medium', 'Large'],
      sizes: { Small: 4.49, Medium: 5.49, Large: 6.49 }
    },
    {
      id: 'p003',
      name: 'Cappuccino',
      category: 'espresso',
      price: 5.29,
      oldPrice: 7.0,
      rating: 4.6,
      reviews: 189,
      stock: 45,
      available: true,
      img: 'assets/cappuccino.png',
      badge: 'Classic',
      desc: 'Equal parts espresso, steamed milk, and silky foam. The Italian icon of coffee culture.',
      variants: ['Small', 'Medium', 'Large'],
      sizes: { Small: 4.29, Medium: 5.29, Large: 6.29 }
    },
    {
      id: 'p004',
      name: 'Cortado',
      category: 'espresso',
      price: 4.79,
      oldPrice: 6.5,
      rating: 4.3,
      reviews: 97,
      stock: 30,
      available: true,
      img: 'assets/cortado.png',
      badge: null,
      desc: 'Espresso cut with a small amount of warm milk. Balanced strength and smoothness.',
      variants: ['Small', 'Regular'],
      sizes: { Small: 3.79, Regular: 4.79 }
    },
    {
      id: 'p005',
      name: 'Espresso',
      category: 'espresso',
      price: 3.49,
      oldPrice: 4.99,
      rating: 4.7,
      reviews: 302,
      stock: 60,
      available: true,
      img: 'assets/espresso.png',
      badge: 'Strong',
      desc: 'Pure, concentrated coffee shot. Intense flavor, dark roast, the heart of all coffee.',
      variants: ['Single', 'Double'],
      sizes: { Single: 3.49, Double: 4.49 }
    },
    {
      id: 'p006',
      name: 'Flat White',
      category: 'latte',
      price: 5.19,
      oldPrice: 6.99,
      rating: 4.4,
      reviews: 145,
      stock: 35,
      available: true,
      img: 'assets/flat-white.png',
      badge: 'Smooth',
      desc: 'Ristretto shots with microfoam milk. Velvety, smooth, and stronger than a latte.',
      variants: ['Small', 'Medium', 'Large'],
      sizes: { Small: 4.19, Medium: 5.19, Large: 6.19 }
    },
    {
      id: 'p007',
      name: 'Cold Brew',
      category: 'Cold Brew',
      price: 4.99,
      oldPrice: 6.99,
      rating: 4.5,
      reviews: 128,
      stock: 50,
      available: true,
      img: 'assets/Untitleddesign.png',
      badge: 'Bestseller',
      desc: 'A bold, rich espresso shot diluted with hot water. Clean and strong with subtle nutty undertones.',
      variants: ['Small', 'Medium', 'Large'],
      sizes: { Small: 3.99, Medium: 4.99, Large: 5.99 }
    },
    {
      id: 'p008',
      name: 'espresso',
      category: 'espresso',
      price: 4.99,
      oldPrice: 6.99,
      rating: 4.5,
      reviews: 128,
      stock: 50,
      available: true,
      img: 'assets/Free-Coffee-HD-image-Ai-Generated-Graphics-94843572-1.jpg',
      badge: 'Bestseller',
      desc: 'A bold, rich espresso shot diluted with hot water. Clean and strong with subtle nutty undertones.',
      variants: ['Small', 'Medium', 'Large'],
      sizes: { Small: 3.99, Medium: 4.99, Large: 5.99 }
    },
  ],

  init() {
    this.seedData();
    Cart.init();
    Auth.init();
    Router.init();
  },

  seedData() {
    this.syncProductsWithDefaults();

    if (!localStorage.getItem(this.KEYS.users)) {
      this.save(this.KEYS.users, []);
    }
    if (!localStorage.getItem(this.KEYS.orders)) {
      this.save(this.KEYS.orders, []);
    }
    if (!localStorage.getItem(this.KEYS.wishlist)) {
      this.save(this.KEYS.wishlist, []);
    }
    if (!localStorage.getItem(this.KEYS.adminData)) {
      this.save(this.KEYS.adminData, { totalSales: 0, totalOrders: 0 });
    }
  },

  syncProductsWithDefaults() {
    const defaults = this.normalizeProducts(this.DEFAULT_PRODUCTS);
    const storedProducts = this.normalizeProducts(this.get(this.KEYS.products) || []);
    const storedHash = this.get(this.KEYS.catalogHash);
    const nextHash = this.computeProductHash(defaults);
    const defaultMap = new Map(defaults.map(product => [product.id, product]));

    const mergedDefaults = defaults.map(product => {
      const storedProduct = storedProducts.find(item => item.id === product.id);
      return storedProduct ? { ...storedProduct, ...product, id: product.id } : product;
    });
    const customProducts = storedProducts.filter(product => !defaultMap.has(product.id));
    const finalProducts = [...mergedDefaults, ...customProducts];

    const shouldSave =
      !Array.isArray(this.get(this.KEYS.products)) ||
      storedHash !== nextHash ||
      storedProducts.length !== finalProducts.length ||
      JSON.stringify(storedProducts) !== JSON.stringify(finalProducts);

    if (shouldSave) {
      this.save(this.KEYS.products, finalProducts);
      this.save(this.KEYS.catalogHash, nextHash);
      console.info('[Coffee Haven] Product catalog synchronized with current code.');
    }
  },

  normalizeProducts(products) {
    return (Array.isArray(products) ? products : [])
      .filter(product => product && product.id)
      .map(product => this.normalizeProduct(product));
  },

  normalizeProduct(product) {
    const price = Number(product.price);
    const oldPrice = Number(product.oldPrice);
    const stock = Number(product.stock);
    const rating = Number(product.rating);
    const reviews = Number(product.reviews);
    const variants = Array.isArray(product.variants) ? product.variants.filter(Boolean) : [];
    const sizes = product && typeof product.sizes === 'object' && product.sizes ? product.sizes : {};

    return {
      ...product,
      name: String(product.name || '').trim(),
      category: String(product.category || 'espresso').trim().toLowerCase(),
      price: Number.isFinite(price) ? price : 0,
      oldPrice: Number.isFinite(oldPrice) && oldPrice > 0 ? oldPrice : (Number.isFinite(price) ? price : 0),
      rating: Number.isFinite(rating) ? rating : 0,
      reviews: Number.isFinite(reviews) ? reviews : 0,
      stock: Number.isFinite(stock) ? Math.max(0, stock) : 0,
      available: product.available !== false && (Number.isFinite(stock) ? stock > 0 : true),
      img: this.normalizeImagePath(product.img),
      desc: String(product.desc || '').trim(),
      badge: product.badge || null,
      variants,
      sizes: Object.fromEntries(
        Object.entries(sizes).map(([key, value]) => [key, Number.isFinite(Number(value)) ? Number(value) : 0])
      ),
    };
  },

  normalizeImagePath(src) {
    const raw = String(src || '').trim().replace(/\\/g, '/');
    if (!raw) {
      return this.FALLBACK_IMAGE;
    }
    if (/^(https?:|data:|blob:)/i.test(raw)) {
      return raw;
    }

    let cleaned = raw.replace(/^\.\//, '');
    if (!cleaned.startsWith('assets/')) {
      cleaned = 'assets/' + cleaned.replace(/^assets\//, '');
    }
    return encodeURI(cleaned);
  },

  getAssetUrl(src) {
    const normalized = this.normalizeImagePath(src);
    if (/^(https?:|data:|blob:)/i.test(normalized)) {
      return normalized;
    }
    const joiner = normalized.includes('?') ? '&' : '?';
    return normalized + joiner + 'v=' + this.BUILD_ID;
  },

  computeProductHash(products) {
    const serialized = JSON.stringify(products);
    let hash = 0;
    for (let index = 0; index < serialized.length; index++) {
      hash = ((hash << 5) - hash + serialized.charCodeAt(index)) | 0;
    }
    return 'catalog_' + Math.abs(hash);
  },

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('[Coffee Haven] Save failed:', key, error);
    }
  },

  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  getProducts() {
    return this.normalizeProducts(this.get(this.KEYS.products) || []);
  },

  getCart() {
    return this.get(this.KEYS.cart) || [];
  },

  getWishlist() {
    return this.get(this.KEYS.wishlist) || [];
  },

  getOrders() {
    return this.get(this.KEYS.orders) || [];
  },

  getCurrentUser() {
    return this.get(this.KEYS.currentUser);
  },

  imgTag(src, alt = 'Product image', cssClass = '') {
    const safeSrc = this.getAssetUrl(src).replace(/"/g, '&quot;');
    const safeAlt = String(alt || 'Product image').replace(/"/g, '&quot;');
    return '<img src="' + safeSrc + '" alt="' + safeAlt + '" class="' + cssClass + '" loading="lazy" onerror="this.onerror=null;this.src=\'' + this.FALLBACK_IMAGE + '\';">';
  },

  resetProducts() {
    const defaults = this.normalizeProducts(this.DEFAULT_PRODUCTS);
    this.save(this.KEYS.products, defaults);
    this.save(this.KEYS.catalogHash, this.computeProductHash(defaults));
    console.info('[Coffee Haven] Products reset. Reload the page.');
  },

  hardReset() {
    Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
    console.info('[Coffee Haven] Hard reset done. Reload the page.');
  },
};
