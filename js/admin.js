// =============================================
// ADMIN DASHBOARD MODULE
// =============================================

const Admin = {
  PASS: 'admin123',
  authenticated: false,
  editingId: null,

  open() {
    if (!this.authenticated) {
      this.showLogin();
    } else {
      this.showDashboard();
    }
    Modal.open('adminModal');
  },

  showLogin() {
    const content = document.getElementById('adminContent');
    if (!content) {
      return;
    }

    content.innerHTML = `
      <div class="admin-login">
        <div class="admin-login-icon"><i class="fa-solid fa-shield-halved"></i></div>
        <h3>Admin Access</h3>
        <p>Enter admin password to continue</p>
        <div class="admin-login-input-wrap">
          <input type="password" id="adminPassInput" class="form-control" placeholder="Password (try: admin123)" autocomplete="current-password">
          <button type="button" class="admin-pass-toggle" id="adminPassToggle" onclick="Admin.togglePasswordVisibility()" aria-label="Show password">
            <i class="fa-regular fa-eye"></i>
          </button>
        </div>
        <div class="admin-login-hint" id="adminLoginHint">Press Enter or click login</div>
        <button class="add-to-cart-btn admin-login-btn" id="adminLoginBtn" onclick="Admin.authenticate()" disabled>Login</button>
      </div>
    `;
    this.bindLoginInteractions();
  },

  bindLoginInteractions() {
    const input = document.getElementById('adminPassInput');
    const button = document.getElementById('adminLoginBtn');
    const hint = document.getElementById('adminLoginHint');

    if (!input || !button || !hint) {
      return;
    }

    input.focus();
    this.updateLoginState();

    input.addEventListener('input', () => {
      input.classList.remove('input-error');
      input.parentElement?.classList.remove('admin-login-input-error');
      hint.textContent = input.value.trim() ? 'Ready to verify admin access' : 'Press Enter or click login';
      this.updateLoginState();
    });

    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.authenticate();
      }
    });
  },

  updateLoginState() {
    const input = document.getElementById('adminPassInput');
    const button = document.getElementById('adminLoginBtn');
    if (!input || !button) {
      return;
    }

    const hasValue = input.value.trim().length > 0;
    button.disabled = !hasValue;
    button.classList.toggle('is-ready', hasValue);
  },

  togglePasswordVisibility() {
    const input = document.getElementById('adminPassInput');
    const toggle = document.getElementById('adminPassToggle');
    if (!input || !toggle) {
      return;
    }

    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    toggle.innerHTML = `<i class="fa-regular ${isHidden ? 'fa-eye-slash' : 'fa-eye'}"></i>`;
    toggle.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  },

  authenticate() {
    const input = document.getElementById('adminPassInput');
    const hint = document.getElementById('adminLoginHint');
    const wrap = input?.parentElement;
    const password = input?.value.trim();

    if (!password) {
      input?.focus();
      input?.classList.add('input-error');
      wrap?.classList.add('admin-login-input-error');
      if (hint) {
        hint.textContent = 'Please enter the admin password first';
      }
      this.updateLoginState();
      return;
    }

    if (password === this.PASS) {
      this.authenticated = true;
      this.showDashboard();
    } else {
      input?.classList.add('input-error');
      wrap?.classList.add('admin-login-input-error');
      wrap?.classList.remove('admin-login-shake');
      void wrap?.offsetWidth;
      wrap?.classList.add('admin-login-shake');
      if (hint) {
        hint.textContent = 'Incorrect password. Try again.';
      }
      Toast.show('Wrong password', 'error');
      if (input) {
        input.select();
      }
    }
  },

  showDashboard(tab = 'analytics') {
    const content = document.getElementById('adminContent');
    if (!content) {
      return;
    }

    content.innerHTML = `
      <div class="admin-layout">
        <div class="admin-sidebar">
          <div class="admin-brand"><i class="fa-solid fa-mug-hot"></i> Admin</div>
          <nav class="admin-nav">
            <button class="admin-nav-btn active" onclick="Admin.switchTab('analytics', this)"><i class="fa-solid fa-chart-line"></i> Analytics</button>
            <button class="admin-nav-btn" onclick="Admin.switchTab('products', this)"><i class="fa-solid fa-boxes-stacked"></i> Products</button>
            <button class="admin-nav-btn" onclick="Admin.switchTab('orders', this)"><i class="fa-solid fa-receipt"></i> Orders</button>
            <button class="admin-nav-btn" onclick="Admin.switchTab('inventory', this)"><i class="fa-solid fa-warehouse"></i> Inventory</button>
          </nav>
          <button class="admin-logout-btn" onclick="Admin.authenticated=false; Modal.close('adminModal')"><i class="fa-solid fa-right-from-bracket"></i> Exit</button>
        </div>
        <div class="admin-main" id="adminMain"></div>
      </div>
    `;

    this.switchTab(tab);
  },

  switchTab(tab, button) {
    document.querySelectorAll('.admin-nav-btn').forEach(item => item.classList.remove('active'));
    if (button) {
      button.classList.add('active');
    } else {
      document.querySelector(`.admin-nav-btn[onclick*="'${tab}'"]`)?.classList.add('active');
    }

    const main = document.getElementById('adminMain');
    if (!main) {
      return;
    }

    if (tab === 'analytics') {
      main.innerHTML = this.analyticsHTML();
    } else if (tab === 'products') {
      main.innerHTML = this.productsHTML();
      this.bindProductForm();
    } else if (tab === 'orders') {
      main.innerHTML = this.ordersHTML();
    } else if (tab === 'inventory') {
      main.innerHTML = this.inventoryHTML();
    }
  },

  analyticsHTML() {
    const adminData = App.get(App.KEYS.adminData) || {};
    const orders = App.getOrders();
    const products = App.getProducts();
    const salesMap = {};

    orders.forEach(order => order.items.forEach(item => {
      salesMap[item.name] = (salesMap[item.name] || 0) + item.qty;
    }));

    const topProducts = Object.entries(salesMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const trend = [12, 18, 9, 24, 17, 30, 22];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxTrend = Math.max(...trend);

    return `
      <div class="admin-section">
        <h3 class="admin-section-title">Analytics Overview</h3>
        <div class="analytics-cards">
          <div class="analytics-card">
            <div class="ac-icon revenue"><i class="fa-solid fa-dollar-sign"></i></div>
            <div><h4>$${(adminData.totalSales || 0).toFixed(2)}</h4><p>Total Revenue</p></div>
          </div>
          <div class="analytics-card">
            <div class="ac-icon orders"><i class="fa-solid fa-receipt"></i></div>
            <div><h4>${adminData.totalOrders || 0}</h4><p>Total Orders</p></div>
          </div>
          <div class="analytics-card">
            <div class="ac-icon products"><i class="fa-solid fa-boxes-stacked"></i></div>
            <div><h4>${products.length}</h4><p>Products</p></div>
          </div>
          <div class="analytics-card">
            <div class="ac-icon users"><i class="fa-solid fa-users"></i></div>
            <div><h4>${(App.get(App.KEYS.users) || []).length}</h4><p>Users</p></div>
          </div>
        </div>

        <div class="analytics-charts">
          <div class="chart-box">
            <h5>Weekly Sales Trend</h5>
            <div class="bar-chart">
              ${trend.map((value, index) => `
                <div class="bar-col">
                  <div class="bar-fill" style="height:${(value / maxTrend) * 100}%" title="${value} orders"></div>
                  <span>${days[index]}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="chart-box">
            <h5>Top Selling Products</h5>
            ${topProducts.length === 0 ? '<p class="empty-msg">No sales data yet</p>' :
              topProducts.map(([name, qty]) => `
                <div class="top-product-row">
                  <span>${name}</span>
                  <div class="top-product-bar">
                    <div style="width:${Math.min(100, (qty / Math.max(...topProducts.map(item => item[1]))) * 100)}%"></div>
                  </div>
                  <span>${qty} sold</span>
                </div>
              `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  productsHTML() {
    const products = App.getProducts();
    return `
      <div class="admin-section">
        <div class="admin-section-header">
          <h3 class="admin-section-title">Products</h3>
          <button class="admin-add-btn" onclick="Admin.showProductForm()"><i class="fa-solid fa-plus"></i> Add Product</button>
        </div>
        <div id="adminProductForm" class="admin-form hidden"></div>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
            <tbody>
              ${products.map(product => `
                <tr>
                  <td data-label="Name">
                    <div class="admin-product-cell">
                      ${App.imgTag(product.img, product.name)}
                      <span>${product.name}</span>
                    </div>
                  </td>
                  <td data-label="Category">${product.category}</td>
                  <td data-label="Price">$${product.price.toFixed(2)}</td>
                  <td data-label="Stock"><span class="stock-badge ${product.stock < 10 ? 'low' : 'ok'}">${product.stock}</span></td>
                  <td data-label="Actions">
                    <div class="admin-table-actions">
                      <button class="admin-edit-btn" onclick="Admin.editProduct('${product.id}')"><i class="fa-solid fa-pen"></i></button>
                      <button class="admin-del-btn" onclick="Admin.deleteProduct('${product.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  showProductForm(prefill = null) {
    const form = document.getElementById('adminProductForm');
    if (!form) {
      return;
    }

    this.editingId = prefill ? prefill.id : null;
    form.classList.remove('hidden');
    form.innerHTML = `
      <h4>${prefill ? 'Edit' : 'Add'} Product</h4>
      <div class="form-grid">
        <input id="pName" class="form-control" placeholder="Name" value="${prefill?.name || ''}">
        <select id="pCat" class="form-control">
          <option value="espresso" ${prefill?.category === 'espresso' ? 'selected' : ''}>Espresso</option>
          <option value="latte" ${prefill?.category === 'latte' ? 'selected' : ''}>Latte</option>
          <option value="cold" ${prefill?.category === 'cold' ? 'selected' : ''}>Cold Brew</option>
          <option value="seasonal" ${prefill?.category === 'seasonal' ? 'selected' : ''}>Seasonal</option>
        </select>
        <input id="pPrice" class="form-control" type="number" step="0.01" placeholder="Price" value="${prefill?.price || ''}">
        <input id="pOldPrice" class="form-control" type="number" step="0.01" placeholder="Old Price" value="${prefill?.oldPrice || ''}">
        <input id="pStock" class="form-control" type="number" placeholder="Stock" value="${prefill?.stock ?? ''}">
        <input id="pImg" class="form-control" placeholder="Image path or filename" value="${prefill?.img || ''}">
        <textarea id="pDesc" class="form-control" placeholder="Description" style="grid-column:1/-1">${prefill?.desc || ''}</textarea>
      </div>
      <div class="form-actions">
        <button class="add-to-cart-btn" onclick="Admin.saveProduct()"><i class="fa-solid fa-save"></i> Save</button>
        <button class="admin-cancel-btn" onclick="Admin.cancelForm()">Cancel</button>
      </div>
    `;
  },

  bindProductForm() {},

  saveProduct() {
    const name = document.getElementById('pName')?.value.trim();
    const category = document.getElementById('pCat')?.value || 'espresso';
    const price = Number(document.getElementById('pPrice')?.value);
    const oldPrice = Number(document.getElementById('pOldPrice')?.value);
    const stock = Number(document.getElementById('pStock')?.value);
    const img = document.getElementById('pImg')?.value.trim();
    const desc = document.getElementById('pDesc')?.value.trim();

    if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(stock) || stock < 0) {
      Toast.show('Fill all required fields with valid values', 'error');
      return;
    }

    const products = App.getProducts();
    const nextProduct = {
      id: this.editingId || 'p_' + Date.now(),
      name,
      category,
      price,
      oldPrice: Number.isFinite(oldPrice) && oldPrice > 0 ? oldPrice : price,
      stock,
      img: App.normalizeImagePath(img || App.FALLBACK_IMAGE),
      desc: desc || 'Freshly brewed coffee made with care.',
      rating: this.editingId ? undefined : 4.0,
      reviews: this.editingId ? undefined : 0,
      badge: null,
      available: stock > 0,
      variants: ['Small', 'Medium', 'Large'],
      sizes: { Small: Math.max(0, price - 1), Medium: price, Large: price + 1 }
    };

    if (this.editingId) {
      const index = products.findIndex(product => product.id === this.editingId);
      if (index > -1) {
        products[index] = {
          ...products[index],
          ...nextProduct,
          rating: products[index].rating,
          reviews: products[index].reviews,
          badge: products[index].badge
        };
      }
    } else {
      products.push(nextProduct);
    }

    App.save(App.KEYS.products, products);
    Toast.show(`Product ${this.editingId ? 'updated' : 'added'}!`, 'success');
    this.editingId = null;
    this.switchTab('products');
    Products.renderCatalog();
    Products.updateResultCount();
  },

  editProduct(id) {
    const product = App.getProducts().find(item => item.id === id);
    if (product) {
      this.showProductForm(product);
    }
    document.getElementById('adminProductForm')?.scrollIntoView({ behavior: 'smooth' });
  },

  deleteProduct(id) {
    if (!confirm('Delete this product?')) {
      return;
    }

    const products = App.getProducts().filter(product => product.id !== id);
    App.save(App.KEYS.products, products);
    Toast.show('Product deleted', 'info');
    this.switchTab('products');
    Products.renderCatalog();
    Products.updateResultCount();
  },

  cancelForm() {
    document.getElementById('adminProductForm')?.classList.add('hidden');
    this.editingId = null;
  },

  ordersHTML() {
    const orders = App.getOrders();
    return `
      <div class="admin-section">
        <h3 class="admin-section-title">All Orders (${orders.length})</h3>
        ${orders.length === 0 ? '<p class="empty-msg">No orders yet</p>' :
          orders.map(order => `
            <div class="admin-order-card">
              <div class="admin-order-top">
                <strong>#${order.id}</strong>
                <span class="order-status ${order.status}">${order.status}</span>
                <span>${new Date(order.date).toLocaleDateString()}</span>
                <strong>$${order.total.toFixed(2)}</strong>
              </div>
              <div class="admin-order-meta">
                <span><i class="fa-solid fa-user"></i> ${order.shipping?.name || 'Guest'}</span>
                <span><i class="fa-solid fa-location-dot"></i> ${order.shipping?.city || '-'}</span>
                <span><i class="fa-solid fa-credit-card"></i> ${order.payment?.method || '-'}</span>
              </div>
              <div class="admin-order-items">${order.items.map(item => `<span>${item.name} x${item.qty}</span>`).join(' | ')}</div>
              <select class="status-select" onchange="Admin.updateOrderStatus('${order.id}', this.value)">
                <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
              </select>
            </div>
          `).join('')}
      </div>
    `;
  },

  updateOrderStatus(orderId, status) {
    const orders = App.getOrders();
    const order = orders.find(item => item.id === orderId);
    if (order) {
      order.status = status;
      App.save(App.KEYS.orders, orders);
      Toast.show('Status updated', 'success');
    }
  },

  inventoryHTML() {
    const products = App.getProducts();
    return `
      <div class="admin-section">
        <h3 class="admin-section-title">Inventory Management</h3>
        <div class="inventory-grid">
          ${products.map(product => `
            <div class="inventory-card ${product.stock < 10 ? 'low-inv' : ''}">
              ${App.imgTag(product.img, product.name)}
              <div class="inv-info">
                <h5>${product.name}</h5>
                <div class="inv-stock-row">
                  <button class="qty-btn" onclick="Admin.updateStock('${product.id}', -5)">-5</button>
                  <span class="inv-qty ${product.stock < 10 ? 'low' : ''}">${product.stock}</span>
                  <button class="qty-btn" onclick="Admin.updateStock('${product.id}', 5)">+5</button>
                </div>
                ${product.stock < 10 ? '<span class="inv-warning">Low Stock</span>' : '<span class="inv-ok">In Stock</span>'}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  updateStock(productId, delta) {
    const products = App.getProducts();
    const product = products.find(item => item.id === productId);
    if (!product) {
      return;
    }

    product.stock = Math.max(0, product.stock + delta);
    product.available = product.stock > 0;
    App.save(App.KEYS.products, products);
    this.switchTab('inventory');
    Products.renderCatalog();
    Products.updateResultCount();
  }
};
