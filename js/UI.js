// =============================================
// UI MODULE - Modals, Toasts, Router, Utils
// =============================================

const Modal = {
  open(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    document.body.classList.add('modal-open');
  },
  close(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('open');
    // Close body lock only if no other modals are open
    if (!document.querySelector('.modal.open')) {
      document.body.classList.remove('modal-open');
    }
  },
  closeAll() {
    document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
    document.body.classList.remove('modal-open');
  }
};

const Toast = {
  queue: [],
  show(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
    toast.innerHTML = `<i class="fa-solid ${icons[type]||icons.success}"></i><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }
};

const Router = {
  init() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
      });
    });

    // Sticky navbar + scroll effects
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    this.handleScroll();
  },

  handleScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    if (window.scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
};

// ── Loading Skeleton ─────────────────────────

function showSkeletons(count = 6) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  grid.innerHTML = Array(count).fill(`
    <div class="product-card skeleton">
      <div class="sk-img"></div>
      <div class="sk-line sk-title"></div>
      <div class="sk-line sk-sub"></div>
      <div class="sk-line sk-btn"></div>
    </div>
  `).join('');
}

// ── Card number formatting ────────────────────

function formatCardNumber(input) {
  let val = input.value.replace(/\D/g, '').slice(0, 16);
  input.value = val.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(input) {
  let val = input.value.replace(/\D/g, '').slice(0, 4);
  if (val.length > 2) val = val.slice(0,2) + '/' + val.slice(2);
  input.value = val;
}

// ── Payment method toggle ─────────────────────

function togglePaymentFields() {
  const method = document.querySelector('input[name="payMethod"]:checked')?.value;
  const cardFields = document.getElementById('cardFields');
  if (cardFields) cardFields.style.display = method === 'card' ? 'block' : 'none';
}

// ── Global event delegation ──────────────────

document.addEventListener('DOMContentLoaded', () => {
  App.init();
  Products.renderCatalog();

  // Close modals on backdrop click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) Modal.close(modal.id);
    });
  });

  // Close cart on overlay click
  document.getElementById('cartOverlay')?.addEventListener('click', () => Cart.closeSidebar());

  // Bind search
  const searchInput = document.getElementById('catalogSearch');
  if (searchInput) {
    searchInput.addEventListener('input', e => Products.handleSearch(e.target.value));
  }

  // Bind navbar search
  const navSearch = document.getElementById('navSearchInput');
  if (navSearch) {
    navSearch.addEventListener('input', e => {
      const q = e.target.value.trim();
      if (q.length > 0) {
        document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' });
        Products.currentFilter.search = q;
        Products.renderCatalog();
      }
    });
  }

  // Keyboard: ESC closes modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      Modal.closeAll();
      Cart.closeSidebar();
    }
  });

  // Auth form submit
  document.getElementById('loginFormEl')?.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    if (Auth.login(email, pass)) Modal.close('authModal');
  });

  document.getElementById('registerFormEl')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;
    if (Auth.register(name, email, pass)) Modal.close('authModal');
  });

  // Initial wishlist heart sync
  Wishlist.updateHearts();
  Products.updateResultCount();
});