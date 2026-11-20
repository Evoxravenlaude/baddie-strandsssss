// ============================================================
// BADDIE STRANDS — Sign-in and checkout
// Email code sign-in, delivery details, Paystack card payments,
// bank transfer, and the order record the admin dashboard reads.
// Settings (keys, bank details, contact) live in config.js.
// ============================================================
'use strict';

(function () {
  if (!window.BS) return;
  const { $, $$, esc, money, store, toast, Overlay, Cart, validEmail, reduced } = window.BS;
  const C = BS_CONFIG;
  const fees = typeof DELIVERY_FEES === 'object' ? DELIVERY_FEES : {};
  const feeDefault = typeof DELIVERY_FEE_DEFAULT === 'number' ? DELIVERY_FEE_DEFAULT : 3500;

  // Paystack and EmailJS are only fetched once their keys are set in config.js.
  function loadScript(src) {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    document.head.appendChild(s);
  }
  if (C.ready.paystack() && typeof window.PaystackPop === 'undefined') loadScript('https://js.paystack.co/v1/inline.js');
  if (C.ready.emailjs() && !window.emailjs) loadScript('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js');

  // ── Email (EmailJS) ──────────────────────────────────────
  let mailStarted = false;
  function mail() {
    if (!window.emailjs || !C.ready.emailjs()) return null;
    if (!mailStarted) { try { window.emailjs.init({ publicKey: C.emailjsPublicKey }); mailStarted = true; } catch (e) { return null; } }
    return window.emailjs;
  }

  function status(id, text, kind) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || '';
    el.className = 'status' + (text ? ' is-' + (kind || 'err') : '');
  }

  // ══ SIGN IN ══════════════════════════════════════════════
  const Auth = { user: store.get('bs_user', null), code: null, email: null, expiry: 0, register: false, step: 'email' };
  let resumeCheckout = false;

  function paintAccount() {
    const zone = $('#auth-zone');
    if (!zone) return;
    if (Auth.user && Auth.user.name) {
      const first = String(Auth.user.name).split(' ')[0];
      zone.innerHTML = `<span class="userchip"><i>${esc(first.charAt(0).toUpperCase())}</i>${esc(first)}</span> <button class="linkbtn" type="button" id="sign-out">Sign out</button>`;
    } else {
      zone.innerHTML = '<button class="linkbtn" type="button" data-open-auth>Sign in</button>';
    }
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#sign-out')) return;
    Auth.user = null;
    store.del('bs_user');
    paintAccount();
    toast('Signed out', 'See you soon, queen.');
  });

  function paintAuth() {
    const titles = {
      email: Auth.register ? 'Create your account' : 'Welcome back',
      otp: 'Check your inbox',
      name: 'What should we call you?'
    };
    const subs = {
      email: Auth.register ? 'Create an account to track orders and check out faster.' : 'Sign in to track orders and check out faster.',
      otp: '',
      name: 'This is the name we\'ll put on your orders.'
    };
    $('#auth-tag').textContent = Auth.register ? 'New account' : 'Sign in';
    $('#auth-heading').textContent = titles[Auth.step];
    const sub = $('#auth-sub');
    sub.textContent = subs[Auth.step];
    sub.hidden = !subs[Auth.step];
    ['email', 'otp', 'name'].forEach((s) => { $('#auth-step-' + s).hidden = s !== Auth.step; });
    $('#auth-next').textContent = { email: 'Send my code', otp: 'Verify code', name: 'Create account' }[Auth.step];
    $('#auth-toggle-text').textContent = Auth.register ? 'Already have an account?' : 'New here?';
    $('#auth-toggle').textContent = Auth.register ? 'Sign in' : 'Create an account';
    $('#auth-toggle').parentElement.hidden = Auth.step !== 'email';
  }
  function goStep(step) {
    Auth.step = step;
    paintAuth();
    const target = step === 'email' ? $('#auth-email') : step === 'otp' ? $('#otp input') : $('#auth-name');
    setTimeout(() => target && target.focus({ preventScroll: true }), 90);
  }
  function openAuth(mode) {
    Auth.register = mode === 'register';
    ['auth-email-status', 'auth-otp-status', 'auth-name-status'].forEach((id) => status(id, ''));
    Auth.step = 'email';
    paintAuth();
    Overlay.show('auth', '#auth-email');
  }

  function newCode() {
    try { const a = new Uint32Array(1); window.crypto.getRandomValues(a); return String(100000 + (a[0] % 900000)); }
    catch (e) { return String(Math.floor(100000 + Math.random() * 900000)); }
  }
  async function requestCode() {
    const email = $('#auth-email').value.trim().toLowerCase();
    if (!validEmail(email)) { status('auth-email-status', 'Enter a valid email address.'); $('#auth-email').focus(); return; }
    status('auth-email-status', '');
    const btn = $('#auth-next');
    btn.disabled = true; btn.textContent = 'Sending…';
    Auth.code = newCode();
    Auth.email = email;
    Auth.expiry = Date.now() + 10 * 60 * 1000;

    const m = mail();
    let sent = false;
    if (m) {
      try { await m.send(C.emailjsService, C.emailjsOtpTpl, { to_email: email, otp_code: Auth.code, brand_name: C.storeName }); sent = true; }
      catch (e) { sent = false; }
    }
    btn.disabled = false;
    if (m && !sent) { paintAuth(); status('auth-email-status', 'We couldn\'t send your code. Check the address and try again.'); return; }

    $('#auth-otp-email').textContent = email;
    $$('#otp input').forEach((i) => { i.value = ''; });
    goStep('otp');
    // Until EmailJS is connected in config.js there is no way to email the
    // code, so it is shown here to keep sign-in usable while you set up.
    status('auth-otp-status', sent ? 'Code sent. It expires in 10 minutes.' : `Email isn't connected yet, so here is your code: ${Auth.code}`, sent ? 'ok' : 'inf');
  }
  function verifyCode() {
    const cells = $$('#otp input'), entered = cells.map((c) => c.value).join('');
    if (entered.length < 6) { status('auth-otp-status', 'Enter all 6 digits.'); return; }
    if (Date.now() > Auth.expiry) { status('auth-otp-status', 'That code has expired. Send a new one.'); return; }
    if (entered !== Auth.code) {
      status('auth-otp-status', 'That code doesn\'t match. Try again.');
      cells.forEach((c) => { c.value = ''; });
      cells[0].focus();
      return;
    }
    const users = store.get('bs_users', []) || [];
    const known = users.find((u) => u.email === Auth.email);
    if (known) finishLogin(known); else goStep('name');
  }
  function completeSignup() {
    const name = $('#auth-name').value.trim();
    if (!name) { status('auth-name-status', 'Enter your name.'); $('#auth-name').focus(); return; }
    const user = { id: 'bs_' + Date.now(), name, email: Auth.email, initial: name.charAt(0).toUpperCase(), createdAt: new Date().toISOString() };
    const users = store.get('bs_users', []) || [];
    users.push(user);
    store.set('bs_users', users);
    finishLogin(user);
  }
  function finishLogin(user) {
    Auth.user = user;
    Auth.code = null;
    store.set('bs_user', user);
    paintAccount();
    const resume = resumeCheckout;
    resumeCheckout = false;
    Overlay.hide('auth');
    toast(`Welcome${user.name ? ', ' + String(user.name).split(' ')[0] : ''}`, 'You\'re signed in.');
    if (resume) setTimeout(openCheckout, reduced ? 0 : 480);
  }

  $('#auth-next').addEventListener('click', () => {
    if (Auth.step === 'email') requestCode();
    else if (Auth.step === 'otp') verifyCode();
    else completeSignup();
  });
  $('#auth-toggle').addEventListener('click', () => { Auth.register = !Auth.register; paintAuth(); });
  $('#auth-resend').addEventListener('click', requestCode);
  $('#auth-change').addEventListener('click', () => goStep('email'));
  $('#auth-email').addEventListener('keydown', (e) => { if (e.key === 'Enter') requestCode(); });
  $('#auth-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') completeSignup(); });
  $('#auth').addEventListener('overlay:close', () => { resumeCheckout = false; });

  const otp = $('#otp');
  otp.addEventListener('input', (e) => {
    const cells = $$('input', otp), i = cells.indexOf(e.target);
    if (i < 0) return;
    e.target.value = e.target.value.replace(/\D/g, '').slice(-1);
    if (e.target.value && i < 5) cells[i + 1].focus();
    if (cells.every((c) => c.value)) verifyCode();
  });
  otp.addEventListener('keydown', (e) => {
    const cells = $$('input', otp), i = cells.indexOf(e.target);
    if (e.key === 'Backspace' && !e.target.value && i > 0) cells[i - 1].focus();
    if (e.key === 'Enter') verifyCode();
  });
  otp.addEventListener('paste', (e) => {
    const digits = ((e.clipboardData || window.clipboardData).getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    e.preventDefault();
    const cells = $$('input', otp);
    digits.split('').forEach((d, i) => { cells[i].value = d; });
    if (digits.length === 6) verifyCode(); else cells[digits.length].focus();
  });

  // ══ CHECKOUT ═════════════════════════════════════════════
  const CO = { step: 1, delivery: {}, method: 'card', busy: false, order: null };
  const subtotal = () => Cart.subtotal();
  const fee = () => (CO.delivery.state ? (fees[CO.delivery.state] != null ? fees[CO.delivery.state] : feeDefault) : 0);
  const total = () => subtotal() + fee();
  const cardReady = () => C.ready.paystack() && typeof window.PaystackPop !== 'undefined';
  const bankReady = () => C.ready.bank();

  function summary(withDelivery) {
    let rows = Cart.items.map((i) => `<div><span>${esc(i.name)} (${[i.length, i.color].filter(Boolean).map(esc).join(', ')}) × ${Number(i.qty)}</span><span>${money(i.price * i.qty)}</span></div>`).join('');
    rows += `<hr><div><span>Subtotal</span><span>${money(subtotal())}</span></div>`;
    if (withDelivery && CO.delivery.state) rows += `<div><span>Delivery to ${esc(CO.delivery.state)}</span><span>${money(fee())}</span></div>`;
    rows += `<hr><div class="is-total"><span>${withDelivery ? 'Total' : 'Total before delivery'}</span><span>${money(withDelivery ? total() : subtotal())}</span></div>`;
    return rows;
  }

  function paintPayment() {
    const card = cardReady(), bank = bankReady();
    if (CO.method === 'card' && !card) CO.method = bank ? 'transfer' : 'whatsapp';
    if (CO.method === 'transfer' && !bank) CO.method = card ? 'card' : 'whatsapp';
    if (CO.method === 'whatsapp' && (card || bank)) CO.method = card ? 'card' : 'transfer';

    const set = (id, on, note) => {
      const opt = $('#' + id), input = $('input', opt);
      opt.classList.toggle('is-off', !on);
      input.disabled = !on;
      input.checked = on && CO.method === input.value;
      opt.classList.toggle('is-on', input.checked);
      $('em', opt).textContent = on ? '' : note;
    };
    set('pay-card', card, C.ready.paystack() ? 'Card payments couldn\'t load. Check your connection and reopen checkout.' : 'Card payments aren\'t switched on yet.');
    set('pay-transfer', bank, 'Bank transfer isn\'t set up yet.');

    const box = $('#bank-box');
    box.hidden = CO.method !== 'transfer';
    $('#bank-name').textContent = C.bank.name;
    $('#bank-acct-name').textContent = C.bank.accountName;
    $('#bank-acct-num').textContent = C.bank.accountNumber;

    const next = $('#co-next');
    if (CO.method === 'whatsapp') {
      status('pay-status', 'Online payment isn\'t set up on this site yet. Place your order and send it to us on WhatsApp. We\'ll confirm it and arrange payment with you there.', 'inf');
      next.textContent = 'Place order on WhatsApp';
    } else {
      status('pay-status', '');
      next.textContent = CO.method === 'card' ? `Pay ${money(total())}` : 'Place order and pay by transfer';
    }
  }

  function paintCheckout() {
    const n = CO.step;
    for (let i = 1; i <= 4; i++) $('#co-step-' + i).hidden = i !== n;
    $('#co-tag').textContent = n < 4 ? `Step ${n} of 3` : 'Order placed';
    $('#co-title').textContent = ['Review your order', 'Where is it going?', 'How would you like to pay?', 'Thank you'][n - 1];
    $('#co-back').hidden = !(n === 2 || n === 3);
    const next = $('#co-next');
    next.disabled = false;
    if (n === 1) { $('#co-review').innerHTML = summary(false); next.textContent = 'Add delivery details'; }
    if (n === 2) { next.textContent = 'Continue to payment'; paintFee(); }
    if (n === 3) { $('#co-pay-summary').innerHTML = summary(true); paintPayment(); }
    if (n === 4) next.textContent = 'Continue shopping';
    $('#checkout .card__body').scrollTop = 0;
  }
  function paintFee() {
    const state = $('#del-state').value;
    $('#del-fee').textContent = state ? money(fees[state] != null ? fees[state] : feeDefault) : 'Choose a state';
  }

  function openCheckout() {
    if (!Cart.items.length) { toast('Your bag is empty', 'Add a piece before checking out.'); return; }
    CO.step = 1; CO.busy = false; CO.order = null;
    CO.method = cardReady() ? 'card' : bankReady() ? 'transfer' : 'whatsapp';
    status('del-status', ''); status('pay-status', '');
    if (Auth.user) {
      if (!$('#del-email').value) $('#del-email').value = Auth.user.email || '';
      if (!$('#del-name').value) $('#del-name').value = Auth.user.name || '';
    }
    paintCheckout();
    Overlay.show('checkout', '#co-next');
  }
  function start() {
    if (!Cart.items.length) { toast('Your bag is empty', 'Add a piece before checking out.'); return; }
    Overlay.hide('cart');
    if (!Auth.user) { resumeCheckout = true; setTimeout(() => { openAuth('login'); resumeCheckout = true; }, reduced ? 0 : 200); return; }
    setTimeout(openCheckout, reduced ? 0 : 200);
  }

  function readDelivery() {
    const fields = [['del-name', 'your full name'], ['del-phone', 'a phone number we can reach you on'], ['del-email', 'your email address'], ['del-address', 'your street address'], ['del-city', 'your city or LGA'], ['del-state', 'your state']];
    for (const [id, label] of fields) {
      const el = document.getElementById(id);
      if (!String(el.value || '').trim()) { status('del-status', `Add ${label}.`); el.focus(); return false; }
    }
    if (!validEmail($('#del-email').value.trim())) { status('del-status', 'That email address doesn\'t look right.'); $('#del-email').focus(); return false; }
    if ($('#del-phone').value.replace(/\D/g, '').length < 7) { status('del-status', 'That phone number looks too short.'); $('#del-phone').focus(); return false; }
    status('del-status', '');
    CO.delivery = {
      name: $('#del-name').value.trim(), phone: $('#del-phone').value.trim(), email: $('#del-email').value.trim(),
      address: $('#del-address').value.trim(), city: $('#del-city').value.trim(), state: $('#del-state').value,
      notes: $('#del-notes').value.trim()
    };
    return true;
  }

  function payByCard() {
    const next = $('#co-next');
    CO.busy = true;
    next.disabled = true; next.textContent = 'Opening Paystack…';
    const reset = () => { CO.busy = false; next.disabled = false; next.textContent = `Pay ${money(total())}`; };
    try {
      const handler = window.PaystackPop.setup({
        key: C.paystackPublicKey,
        email: CO.delivery.email,
        amount: Math.round(total() * 100),
        currency: 'NGN',
        ref: 'BS-' + Date.now(),
        metadata: { custom_fields: [
          { display_name: 'Customer', variable_name: 'customer', value: CO.delivery.name },
          { display_name: 'Phone', variable_name: 'phone', value: CO.delivery.phone },
          { display_name: 'State', variable_name: 'state', value: CO.delivery.state },
          { display_name: 'Address', variable_name: 'address', value: CO.delivery.address }
        ] },
        callback: (res) => { reset(); placeOrder(res.reference, 'Paystack Card'); },
        onClose: () => { if (CO.step === 3) { reset(); status('pay-status', 'The payment window was closed before paying. Try again when you\'re ready.'); } }
      });
      handler.openIframe();
    } catch (e) {
      reset();
      status('pay-status', 'We couldn\'t open the card payment window. Try again, or choose bank transfer.');
    }
  }

  function orderText(order) {
    const lines = order.items.map((i) => `• ${i.name} (${[i.length, i.color].filter(Boolean).join(', ')}) ×${i.qty} — ${money(i.total)}`).join('\n');
    const c = order.customer;
    return `Hi Baddie Strands! I've just placed order *${order.id}*.\n\n${lines}\n\nSubtotal: ${money(order.subtotal)}\nDelivery (${c.state}): ${money(order.deliveryFee)}\n*Total: ${money(order.total)}*\nPayment: ${order.method}\n\nDeliver to: ${c.name}, ${c.phone}\n${c.address}, ${c.city}, ${c.state}${c.notes ? '\nNotes: ' + c.notes : ''}`;
  }

  function placeOrder(ref, method) {
    const now = new Date();
    const order = {
      id: 'BS-' + Date.now().toString(36).toUpperCase(),
      ref, method,
      customer: CO.delivery,
      items: Cart.items.map((i) => ({ name: i.name, type: i.type, length: i.length, color: i.color || '', qty: Number(i.qty), price: Number(i.price), total: Number(i.price) * Number(i.qty) })),
      subtotal: subtotal(),
      deliveryFee: fee(),
      total: total(),
      status: 'Pending',
      placedAt: now.toISOString(),
      date: now.toISOString().split('T')[0]
    };
    CO.order = order;

    const orders = store.get('bs_orders', []) || [];
    orders.unshift(order);
    store.set('bs_orders', orders);

    notifyStore(order);
    Cart.clear();

    $('#co-order-id').textContent = order.id;
    const c = order.customer;
    $('#co-done-msg').textContent =
      method.indexOf('Transfer') >= 0
        ? `Your order is waiting for payment. Transfer ${money(order.total)} to ${C.bank.name}, account ${C.bank.accountNumber} (${C.bank.accountName}), and send your receipt to ${C.email} with order ID ${order.id}. We confirm within 24 hours.`
        : method.indexOf('WhatsApp') >= 0
          ? `Your order is saved. Send it to us on WhatsApp now so we can confirm it and arrange payment and delivery to ${c.city}, ${c.state}.`
          : `Payment received. Your order is on its way to ${c.address}, ${c.city}, ${c.state}. Keep your order ID in case you need to reach us.`;
    $('#co-wa').href = C.waLink(orderText(order));
    CO.step = 4;
    paintCheckout();
    if (method.indexOf('WhatsApp') >= 0) window.open(C.waLink(orderText(order)), '_blank', 'noopener');
  }

  function notifyStore(order) {
    const m = mail();
    if (!m) return;
    const c = order.customer;
    m.send(C.emailjsService, C.emailjsOrderTpl, {
      to_email: C.adminEmail,
      order_id: order.id,
      customer_name: c.name,
      customer_email: c.email,
      customer_phone: c.phone,
      delivery_address: `${c.address}, ${c.city}, ${c.state}`,
      delivery_notes: c.notes || 'None',
      items_list: order.items.map((i) => `${i.name} (${[i.length, i.color].filter(Boolean).join(', ')}) ×${i.qty} — ${money(i.total)}`).join('\n'),
      order_subtotal: money(order.subtotal),
      delivery_fee: money(order.deliveryFee),
      order_total: money(order.total),
      payment_method: order.method,
      payment_ref: order.ref,
      order_date: new Date().toLocaleString('en-NG', { timeZone: C.timeZone || 'Africa/Lagos' })
    }).catch(() => { /* the order is saved; the WhatsApp button is the fallback */ });
  }

  $('#co-next').addEventListener('click', () => {
    if (CO.busy) return;
    if (CO.step === 1) { CO.step = 2; paintCheckout(); $('#del-name').focus(); return; }
    if (CO.step === 2) { if (!readDelivery()) return; CO.step = 3; paintCheckout(); return; }
    if (CO.step === 3) {
      if (CO.method === 'card') payByCard();
      else if (CO.method === 'transfer') placeOrder('BS-TRF-' + Date.now(), 'Bank Transfer – ' + C.bank.name);
      else placeOrder('BS-WA-' + Date.now(), 'WhatsApp order');
      return;
    }
    Overlay.hide('checkout');
  });
  $('#co-back').addEventListener('click', () => { if (CO.step > 1 && CO.step < 4 && !CO.busy) { CO.step--; paintCheckout(); } });
  $('#del-state').addEventListener('change', paintFee);
  $$('#checkout input[name="pay"]').forEach((r) => r.addEventListener('change', () => { if (r.checked) { CO.method = r.value; paintPayment(); } }));
  $('#bank-copy').addEventListener('click', () => {
    const num = String(C.bank.accountNumber);
    const done = () => toast('Copied', 'Account number copied.');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(num).then(done).catch(() => toast('Account number', num));
    else toast('Account number', num);
  });
  $('#checkout').addEventListener('overlay:close', () => {
    if (CO.step < 4 && Cart.items.length) setTimeout(() => Overlay.show('cart'), reduced ? 0 : 320);
  });

  // states in the delivery form
  const states = Object.keys(fees).sort((a, b) => a.localeCompare(b));
  $('#del-state').innerHTML = '<option value="">Select state…</option>' + states.map((s) => `<option${s === 'FCT – Abuja' ? ' selected' : ''}>${esc(s)}</option>`).join('');

  paintAccount();
  window.BSCheckout = { start, openAuth };
})();
