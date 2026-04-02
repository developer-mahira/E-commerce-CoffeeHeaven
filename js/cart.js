// =============================================
// CART + WISHLIST MODULE
// =============================================

const Cart = {
  items: [],

  init() {
    this.items = this.syncItemsWithProducts(App.getCart());
    this.save();
    this.updateBadge();
  },

  syncItemsWithProducts(items) {
    const products = App.getProducts();

    return (Array.isArray(items) ? items : []).reduce((nextItems, item) => {
      const product = products.find(entry => entry.id === item.id);
      if (!product) {
        return nextItems;
      }

      const variant = item.variant || (product.variants[0] || null);
      const unitPrice = product.sizes && variant && product.sizes[variant]
        ? product.sizes[variant]
        : product.price;
      const quantity = Math.max(1, Number(item.qty) || 1);

      nextItems.push({
        key: item.key || `${product.id}_${variant || 'default'}`,
        id: product.id,
        name: product.name,
        img: product.img,
        variant,
        price: unitPrice,
        qty: quantity
      });

      return nextItems;
    }, []);
  },

  add(productId, variant = null, qty = 1) {
    const product = App.getProducts().find(item => item.id === productId);
    if (!product) {
      return;
    }

    const variantKey = variant || (product.variants[0] || null);
    const price = product.sizes && variantKey && product.sizes[variantKey]
      ? product.sizes[variantKey]
      : product.price;
    const itemKey = `${productId}_${variantKey || 'default'}`;
    const existing = this.items.find(item => item.key === itemKey);

    if (existing) {
      existing.qty += qty;
      existing.price = price;
      existing.name = product.name;
      existing.img = product.img;
      existing.variant = variantKey;
    } else {
      this.items.push({
        key: itemKey,
        id: productId,
        name: product.name,
        img: product.img,
        variant: variantKey,
        price,
        qty
      });
    }

    this.save();
    this.updateBadge();
    Toast.show(product.name + ' added to cart', 'success');
    this.renderSidebar();
  },

  remove(itemKey) {
    this.items = this.items.filter(item => item.key !== itemKey);
    this.save();
    this.updateBadge();
    this.renderSidebar();
  },

  updateQty(itemKey, delta) {
    const item = this.items.find(entry => entry.key === itemKey);
    if (!item) {
      return;
    }

    const nextQty = item.qty + delta;
    if (nextQty <= 0) {
      this.remove(itemKey);
      return;
    }

    item.qty = nextQty;
    this.save();
    this.updateBadge();
    this.renderSidebar();
  },

  clear() {
    this.items = [];
    this.save();
    this.updateBadge();
    this.renderSidebar();
  },

  save() {
    App.save(App.KEYS.cart, this.items);
  },

  total() {
    return this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  },

  count() {
    return this.items.reduce((sum, item) => sum + item.qty, 0);
  },

  updateBadge() {
    const badge = document.getElementById('cartBadge');
    const count = this.count();
    if (badge) {
      badge.textContent = String(count);
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  },

  renderSidebar() {
    const itemsElement = document.getElementById('cartItems');
    const totalElement = document.getElementById('cartTotal');
    if (!itemsElement) {
      return;
    }

    if (this.items.length === 0) {
      itemsElement.innerHTML = '<div class="cart-empty"><i class="fa-solid fa-mug-hot"></i><p>Your cart is empty</p><span>Add some coffee</span></div>';
    } else {
      itemsElement.innerHTML = this.items.map(item => `
        <div class="cart-item" data-key="${item.key}">
          <div class="cart-item-img">
            ${App.imgTag(item.img, item.name)}
          </div>
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <span class="cart-variant">${item.variant || ''}</span>
            <div class="cart-qty-row">
              <button class="qty-btn" onclick="Cart.updateQty('${item.key}', -1)">-</button>
              <span>${item.qty}</span>
              <button class="qty-btn" onclick="Cart.updateQty('${item.key}', 1)">+</button>
            </div>
          </div>
          <div class="cart-item-right">
            <span class="cart-price">$${(item.price * item.qty).toFixed(2)}</span>
            <button class="cart-remove" onclick="Cart.remove('${item.key}')"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
      `).join('');
    }

    if (totalElement) {
      totalElement.textContent = '$' + this.total().toFixed(2);
    }
  },

  openSidebar() {
    this.renderSidebar();
    document.getElementById('cartSidebar')?.classList.add('open');
    document.getElementById('cartOverlay')?.classList.add('show');
  },

  closeSidebar() {
    document.getElementById('cartSidebar')?.classList.remove('open');
    document.getElementById('cartOverlay')?.classList.remove('show');
  },
};

const Wishlist = {
  getIds() {
    return App.getWishlist();
  },

  toggle(productId) {
    let list = this.getIds();
    const exists = list.includes(productId);

    if (exists) {
      list = list.filter(id => id !== productId);
      Toast.show('Removed from wishlist', 'info');
    } else {
      list.push(productId);
      Toast.show('Added to wishlist', 'success');
    }

    App.save(App.KEYS.wishlist, list);
    this.updateHearts();
    return !exists;
  },

  has(productId) {
    return this.getIds().includes(productId);
  },

  updateHearts() {
    document.querySelectorAll('.wishlist-btn').forEach(button => {
      const id = button.dataset.id;
      button.classList.toggle('active', this.has(id));
      const icon = button.querySelector('i');
      if (icon) {
        icon.className = this.has(id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
      }
    });
  }
};
