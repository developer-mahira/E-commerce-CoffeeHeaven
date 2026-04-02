// =============================================
// AUTH MODULE - Login / Register / Profile
// =============================================

const Auth = {
  init() {
    this.updateNavUI();
  },

  register(name, email, password) {
    const users = App.get(App.KEYS.users) || [];
    if (users.find(u => u.email === email)) {
      Toast.show('Email already registered!', 'error');
      return false;
    }
    const user = {
      id: 'u_' + Date.now(),
      name, email,
      password: btoa(password), // basic obfuscation
      createdAt: new Date().toISOString(),
      orders: []
    };
    users.push(user);
    App.save(App.KEYS.users, users);
    App.save(App.KEYS.currentUser, user);
    Toast.show(`Welcome, ${name}! 🎉`, 'success');
    this.updateNavUI();
    return true;
  },

  login(email, password) {
    const users = App.get(App.KEYS.users) || [];
    const user = users.find(u => u.email === email && u.password === btoa(password));
    if (!user) {
      Toast.show('Invalid email or password', 'error');
      return false;
    }
    App.save(App.KEYS.currentUser, user);
    Toast.show(`Welcome back, ${user.name}! ☕`, 'success');
    this.updateNavUI();
    return true;
  },

  logout() {
    localStorage.removeItem(App.KEYS.currentUser);
    Toast.show('Logged out successfully', 'info');
    this.updateNavUI();
    Modal.close('authModal');
    Modal.close('profileModal');
  },

  isLoggedIn() {
    return !!App.getCurrentUser();
  },

  updateNavUI() {
    const user = App.getCurrentUser();
    const authBtn = document.getElementById('authBtn');
    const profileBtn = document.getElementById('profileBtn');
    if (!authBtn) return;
    if (user) {
      authBtn.style.display = 'none';
      if (profileBtn) {
        profileBtn.style.display = 'flex';
        profileBtn.querySelector('.user-initial').textContent = user.name[0].toUpperCase();
      }
    } else {
      authBtn.style.display = 'flex';
      if (profileBtn) profileBtn.style.display = 'none';
    }
  },

  showAuthModal(tab = 'login') {
    Modal.open('authModal');
    Auth.switchTab(tab);
  },

  switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelector(`.auth-tab[data-tab="${tab}"]`)?.classList.add('active');
    const formId = tab === 'login' ? 'loginFormEl' : 'registerFormEl';
    document.getElementById(formId)?.classList.add('active');
  },

  showProfile() {
    const user = App.getCurrentUser();
    if (!user) return;
    const orders = App.getOrders().filter(o => o.userId === user.id);
    const el = document.getElementById('profileContent');
    if (!el) return;
    el.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${user.name[0].toUpperCase()}</div>
        <div class="profile-info">
          <h3>${user.name}</h3>
          <p>${user.email}</p>
          <span class="profile-badge">Member since ${new Date(user.createdAt).toLocaleDateString('en-US', {month:'long', year:'numeric'})}</span>
        </div>
      </div>
      <div class="profile-stats">
        <div class="pstat"><span>${orders.length}</span><label>Orders</label></div>
        <div class="pstat"><span>$${orders.reduce((s,o)=>s+o.total,0).toFixed(2)}</span><label>Spent</label></div>
        <div class="pstat"><span>${App.getWishlist().length}</span><label>Wishlist</label></div>
      </div>
      <div class="order-history">
        <h4>Order History</h4>
        ${orders.length === 0 ? '<p class="empty-msg">No orders yet. Start brewing! ☕</p>' :
          orders.map(o => `
            <div class="order-card">
              <div class="order-top">
                <span class="order-id">#${o.id}</span>
                <span class="order-status ${o.status}">${o.status}</span>
              </div>
              <div class="order-items-summary">${o.items.map(i=>i.name).join(', ')}</div>
              <div class="order-bottom">
                <span>${new Date(o.date).toLocaleDateString()}</span>
                <strong>$${o.total.toFixed(2)}</strong>
              </div>
            </div>
          `).join('')}
      </div>
      <button class="logout-btn" onclick="Auth.logout()">
        <i class="fa-solid fa-right-from-bracket"></i> Logout
      </button>
    `;
    Modal.open('profileModal');
  }
};
