// =============================================
// PRODUCTS MODULE - Catalog, Search, Filter
// =============================================

const Products = {
  currentFilter: { category: 'all', sort: 'default', rating: 0, search: '' },
  searchTimeout: null,

  getFiltered() {
    let list = [...App.getProducts()];
    const filter = this.currentFilter;

    if (filter.search) {
      const query = filter.search.toLowerCase();
      list = list.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.desc.toLowerCase().includes(query)
      );
    }

    if (filter.category !== 'all') {
      list = list.filter(product => product.category === filter.category);
    }

    if (filter.rating > 0) {
      list = list.filter(product => product.rating >= filter.rating);
    }

    if (filter.sort === 'low') {
      list.sort((a, b) => a.price - b.price);
    } else if (filter.sort === 'high') {
      list.sort((a, b) => b.price - a.price);
    } else if (filter.sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (filter.sort === 'popular') {
      list.sort((a, b) => b.reviews - a.reviews);
    }

    return list;
  },

  renderCatalog() {
    const grid = document.getElementById('productGrid');
    if (!grid) {
      return;
    }

    const filtered = this.getFiltered();
    if (filtered.length === 0) {
      grid.innerHTML = '<div class="no-results"><i class="fa-solid fa-magnifying-glass"></i><p>No products found</p></div>';
      return;
    }

    grid.innerHTML = filtered.map(product => this.cardHTML(product)).join('');
    Wishlist.updateHearts();
  },

  cardHTML(product) {
    const stars = this.starsHTML(product.rating);
    const badge = product.badge ? '<span class="product-badge">' + product.badge + '</span>' : '';
    const stockLabel = product.stock < 10 ? '<span class="low-stock">Only ' + product.stock + ' left!</span>' : '';
    const wishlisted = Wishlist.has(product.id);

    return `
      <div class="product-card" data-id="${product.id}">
        ${badge}
        <div class="product-img-wrap" onclick="Products.openDetail('${product.id}')">
          ${App.imgTag(product.img, product.name)}
          <div class="img-overlay"><span>View Details</span></div>
        </div>
        <button class="wishlist-btn ${wishlisted ? 'active' : ''}" data-id="${product.id}" onclick="Wishlist.toggle('${product.id}'); Products.renderCatalog()">
          <i class="${wishlisted ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
        </button>
        <div class="product-info">
          <div class="product-stars">${stars} <span class="review-count">(${product.reviews})</span></div>
          <h3 class="product-name" onclick="Products.openDetail('${product.id}')">${product.name}</h3>
          ${stockLabel}
          <div class="product-price-row">
            <span class="product-price">$${product.price.toFixed(2)}</span>
            <span class="product-old-price">$${product.oldPrice.toFixed(2)}</span>
            <span class="product-discount">${Math.round((1 - product.price / product.oldPrice) * 100)}% OFF</span>
          </div>
          <button class="add-to-cart-btn" onclick="Cart.add('${product.id}')">
            <i class="fa-solid fa-cart-plus"></i> Add to Cart
          </button>
        </div>
      </div>
    `;
  },

  starsHTML(rating) {
    let html = '';
    for (let index = 1; index <= 5; index++) {
      if (index <= Math.floor(rating)) {
        html += '<i class="fa-solid fa-star"></i>';
      } else if (index - rating < 1) {
        html += '<i class="fa-solid fa-star-half-stroke"></i>';
      } else {
        html += '<i class="fa-regular fa-star"></i>';
      }
    }
    return html;
  },

  openDetail(productId) {
    const product = App.getProducts().find(item => item.id === productId);
    if (!product) {
      return;
    }

    const content = document.getElementById('productDetailContent');
    if (!content) {
      return;
    }

    const variantOptions = product.variants.length
      ? product.variants.map(variant =>
          `<button class="variant-btn" data-v="${variant}" onclick="Products.selectVariant('${product.id}', '${variant}', this)">${variant}</button>`
        ).join('')
      : '';

    content.innerHTML = `
      <div class="detail-img-wrap">
        ${App.imgTag(product.img, product.name, '',)}
        <div class="detail-zoom-hint"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
      </div>
      <div class="detail-info">
        <div class="detail-badges">
          ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
          ${product.stock < 10 ? '<span class="low-stock-badge">Low Stock</span>' : '<span class="in-stock-badge">In Stock</span>'}
        </div>
        <h2>${product.name}</h2>
        <div class="detail-stars">${this.starsHTML(product.rating)} <span>${product.rating} (${product.reviews} reviews)</span></div>
        <p class="detail-desc">${product.desc}</p>
        <div class="detail-price-row">
          <span class="detail-price" id="detailPrice">$${product.price.toFixed(2)}</span>
          <span class="detail-old">$${product.oldPrice.toFixed(2)}</span>
          <span class="detail-save">Save ${Math.round((1 - product.price / product.oldPrice) * 100)}%</span>
        </div>
        ${product.variants.length ? `<div class="variant-section"><label>Size:</label><div class="variants" id="variantGroup">${variantOptions}</div></div>` : ''}
        <div class="detail-qty-row">
          <label>Qty:</label>
          <button class="qty-btn" onclick="Products.changeDetailQty(-1)">-</button>
          <span id="detailQty">1</span>
          <button class="qty-btn" onclick="Products.changeDetailQty(1)">+</button>
        </div>
        <div class="detail-actions">
          <button class="add-to-cart-btn full-width" onclick="Products.addDetailToCart('${product.id}')">
            <i class="fa-solid fa-cart-plus"></i> Add to Cart
          </button>
          <button class="wishlist-btn-lg ${Wishlist.has(product.id) ? 'active' : ''}" onclick="Wishlist.toggle('${product.id}'); this.classList.toggle('active')">
            <i class="${Wishlist.has(product.id) ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
        </div>
      </div>
    `;

    const detailImageWrap = content.querySelector('.detail-img-wrap img');
    if (detailImageWrap) {
      detailImageWrap.id = 'detailImg';
      detailImageWrap.addEventListener('click', function () {
        this.classList.toggle('zoomed');
      });
    }

    if (product.variants.length) {
      const firstButton = content.querySelector('.variant-btn');
      if (firstButton) {
        firstButton.classList.add('selected');
      }
    }

    Modal.open('productDetailModal');
  },

  selectVariant(productId, variant, button) {
    const product = App.getProducts().find(item => item.id === productId);
    if (!product || !product.sizes) {
      return;
    }

    document.querySelectorAll('#variantGroup .variant-btn').forEach(item => item.classList.remove('selected'));
    button.classList.add('selected');

    const price = product.sizes[variant] || product.price;
    const detailPrice = document.getElementById('detailPrice');
    if (detailPrice) {
      detailPrice.textContent = '$' + price.toFixed(2);
    }
    button.dataset.price = String(price);
  },

  changeDetailQty(delta) {
    const quantity = document.getElementById('detailQty');
    if (!quantity) {
      return;
    }
    const current = parseInt(quantity.textContent, 10) || 1;
    quantity.textContent = String(Math.max(1, current + delta));
  },

  addDetailToCart(productId) {
    const selectedVariant = document.querySelector('#variantGroup .variant-btn.selected');
    const variant = selectedVariant ? selectedVariant.dataset.v : null;
    const quantity = parseInt(document.getElementById('detailQty')?.textContent || '1', 10) || 1;

    for (let index = 0; index < quantity; index++) {
      Cart.add(productId, variant, 1);
    }

    Modal.close('productDetailModal');
    Cart.openSidebar();
  },

  handleSearch(query) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentFilter.search = query;
      this.renderCatalog();
      this.updateResultCount();
    }, 250);
  },

  setCategory(category) {
    this.currentFilter.category = category;
    document.querySelectorAll('.filter-cat-btn').forEach(button => button.classList.remove('active'));
    document.querySelector(`.filter-cat-btn[data-cat="${category}"]`)?.classList.add('active');
    this.renderCatalog();
    this.updateResultCount();
  },

  setSort(value) {
    this.currentFilter.sort = value;
    this.renderCatalog();
    this.updateResultCount();
  },

  setRating(value) {
    this.currentFilter.rating = parseFloat(value);
    this.renderCatalog();
    this.updateResultCount();
  },

  updateResultCount() {
    const count = document.getElementById('resultCount');
    if (count) {
      count.textContent = this.getFiltered().length + ' products';
    }
  }
};
