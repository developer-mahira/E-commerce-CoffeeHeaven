// =============================================
// CHECKOUT MODULE - Multi-step flow + Orders
// =============================================

const Checkout = {
  step: 1,
  data: { shipping: {}, payment: {} },
  currentOrder: null,

  open() {
    if (Cart.items.length === 0) {
      Toast.show('Your cart is empty!', 'error');
      return;
    }

    this.step = 1;
    this.currentOrder = null;
    this.renderStep();
    Modal.open('checkoutModal');
  },

  renderStep() {
    document.querySelectorAll('.checkout-step-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.checkout-step-indicator').forEach((element, index) => {
      element.classList.toggle('active', index + 1 === this.step);
      element.classList.toggle('done', index + 1 < this.step);
    });
    document.getElementById(`checkoutStep${this.step}`)?.classList.add('active');

    if (this.step === 3) {
      this.renderOrderSummary();
    }
    if (this.step === 4) {
      this.renderConfirmation();
    }
  },

  next() {
    if (this.step === 1 && !this.validateShipping()) {
      return;
    }
    if (this.step === 2 && !this.validatePayment()) {
      return;
    }
    if (this.step < 4) {
      this.step += 1;
      this.renderStep();
    }
  },

  prev() {
    if (this.step > 1) {
      this.step -= 1;
      this.renderStep();
    }
  },

  validateShipping() {
    const fields = ['shippingName', 'shippingEmail', 'shippingAddress', 'shippingCity', 'shippingPhone'];
    for (const id of fields) {
      const element = document.getElementById(id);
      if (!element || !element.value.trim()) {
        element?.classList.add('input-error');
        Toast.show('Please fill all shipping fields', 'error');
        return false;
      }
      element.classList.remove('input-error');
    }

    this.data.shipping = {
      name: document.getElementById('shippingName').value,
      email: document.getElementById('shippingEmail').value,
      address: document.getElementById('shippingAddress').value,
      city: document.getElementById('shippingCity').value,
      phone: document.getElementById('shippingPhone').value,
    };
    return true;
  },

  validatePayment() {
    const method = document.querySelector('input[name="payMethod"]:checked');
    if (!method) {
      Toast.show('Please select a payment method', 'error');
      return false;
    }

    this.data.payment = { method: method.value };
    if (method.value === 'card') {
      const cardNumber = document.getElementById('cardNumber')?.value.replace(/\s/g, '');
      const expiry = document.getElementById('cardExpiry')?.value;
      const cvv = document.getElementById('cardCvv')?.value;
      if (!cardNumber || cardNumber.length < 16 || !expiry || !cvv) {
        Toast.show('Please fill valid card details', 'error');
        return false;
      }
      this.data.payment.last4 = cardNumber.slice(-4);
    }

    return true;
  },

  renderOrderSummary() {
    const summary = document.getElementById('orderSummaryItems');
    if (!summary) {
      return;
    }

    const subtotal = Cart.total();
    const delivery = 2.99;
    const tax = subtotal * 0.08;
    const total = subtotal + delivery + tax;

    summary.innerHTML = `
      <div class="summary-items">
        ${Cart.items.map(item => `
          <div class="summary-item">
            ${App.imgTag(item.img, item.name)}
            <div>
              <span>${item.name}</span>
              <small>${item.variant || ''} x ${item.qty}</small>
            </div>
            <strong>$${(item.price * item.qty).toFixed(2)}</strong>
          </div>
        `).join('')}
      </div>
      <div class="summary-totals">
        <div class="summary-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
        <div class="summary-row"><span>Delivery</span><span>$${delivery.toFixed(2)}</span></div>
        <div class="summary-row"><span>Tax (8%)</span><span>$${tax.toFixed(2)}</span></div>
        <div class="summary-row total-row"><strong>Total</strong><strong>$${total.toFixed(2)}</strong></div>
      </div>
      <div class="summary-shipping">
        <i class="fa-solid fa-location-dot"></i>
        ${this.data.shipping.address}, ${this.data.shipping.city}
      </div>
    `;

    document.getElementById('confirmTotal').textContent = '$' + total.toFixed(2);
  },

  placeOrder() {
    const subtotal = Cart.total();
    const delivery = 2.99;
    const tax = subtotal * 0.08;
    const total = subtotal + delivery + tax;
    const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
    const user = App.getCurrentUser();

    const order = {
      id: orderId,
      userId: user ? user.id : 'guest',
      items: [...Cart.items],
      shipping: this.data.shipping,
      payment: this.data.payment,
      total,
      status: 'confirmed',
      date: new Date().toISOString(),
    };

    const orders = App.getOrders();
    orders.unshift(order);
    App.save(App.KEYS.orders, orders);

    const adminData = App.get(App.KEYS.adminData) || {};
    adminData.totalSales = (adminData.totalSales || 0) + total;
    adminData.totalOrders = (adminData.totalOrders || 0) + 1;
    App.save(App.KEYS.adminData, adminData);

    Cart.clear();
    this.currentOrder = order;
    this.step = 4;
    this.renderStep();
  },

  renderConfirmation() {
    if (!this.currentOrder) {
      return;
    }

    const content = document.getElementById('confirmationContent');
    if (!content) {
      return;
    }

    content.innerHTML = `
      <div class="confirmation-icon"><i class="fa-solid fa-circle-check"></i></div>
      <h2>Order Placed!</h2>
      <p>Your coffee is on its way. Order ID:</p>
      <div class="order-id-badge">${this.currentOrder.id}</div>
      <div class="confirmation-details">
        <p>Delivering to: <strong>${this.currentOrder.shipping.name}</strong></p>
        <p>${this.currentOrder.shipping.address}, ${this.currentOrder.shipping.city}</p>
        <p>Total charged: <strong>$${this.currentOrder.total.toFixed(2)}</strong></p>
      </div>
      <p class="confirmation-note">You'll receive a confirmation email at <strong>${this.currentOrder.shipping.email}</strong></p>
      <button class="add-to-cart-btn" onclick="Modal.close('checkoutModal')">Continue Shopping</button>
    `;
  }
};
