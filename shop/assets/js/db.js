// ============================================================
// BADDIE STRANDS — data layer (shared by the shop and the admin)
//
// With the Supabase keys filled in config.js, everything is read
// from and saved to your Supabase database.
// Without them, the site runs in DEMO MODE: it starts from the
// sample data in seed.js and saves changes in this browser only.
// ============================================================
'use strict';

(function () {
  const cfg = window.BS_CONFIG || {};
  const LIVE = !!(cfg.supabaseUrl && cfg.supabaseKey && !/YOUR-|PASTE/i.test(cfg.supabaseUrl + cfg.supabaseKey));
  const SEED = window.BS_SEED || { products: [], settings: {} };

  // ── helpers ──────────────────────────────────────────────
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const now = () => new Date().toISOString();
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));
  const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const fail = (msg) => { const e = new Error(msg); e.friendly = true; throw e; };
  const slugify = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'piece';
  const naira = (n) => '₦' + Math.round(Number(n) || 0).toLocaleString('en-NG');

  function mergeSettings(data) {
    const base = clone(SEED.settings || {});
    const d = data || {};
    const out = Object.assign({}, base, d);
    ['store', 'payments', 'delivery'].forEach((k) => { out[k] = Object.assign({}, base[k] || {}, d[k] || {}); });
    if (!Array.isArray(out.faq)) out.faq = base.faq || [];
    if (!Array.isArray(out.reviews)) out.reviews = base.reviews || [];
    out.delivery.fees = Object.assign({}, (d.delivery && d.delivery.fees) || base.delivery.fees || {});
    out.delivery.days = Object.assign({}, (d.delivery && d.delivery.days) || base.delivery.days || {});
    return out;
  }

  function normProduct(p) {
    return Object.assign({
      id: '', slug: '', name: '', category: 'wigs', texture: 'straight', description: '', details: [],
      price: 0, compare_at: null, lengths: [], shades: [], images: [], stock: null,
      featured: false, is_new: false, active: true, sort: 0, created_at: now(), updated_at: now()
    }, p, {
      price: Number(p.price) || 0,
      compare_at: p.compare_at ? Number(p.compare_at) : null,
      stock: p.stock === null || p.stock === undefined || p.stock === '' ? null : Number(p.stock),
      lengths: Array.isArray(p.lengths) ? p.lengths : [],
      shades: Array.isArray(p.shades) ? p.shades : [],
      images: Array.isArray(p.images) ? p.images.filter(Boolean) : [],
      details: Array.isArray(p.details) ? p.details.filter(Boolean) : []
    });
  }

  // Price for one length of a product (a length can have its own price).
  function priceFor(p, length) {
    const l = (p.lengths || []).find((x) => x.length === length);
    return l && l.price !== null && l.price !== undefined && l.price !== '' ? Number(l.price) : Number(p.price);
  }
  function priceRange(p) {
    const ps = (p.lengths || []).length ? p.lengths.map((l) => priceFor(p, l.length)) : [Number(p.price)];
    return [Math.min.apply(null, ps), Math.max.apply(null, ps)];
  }

  function deliveryFee(settings, state, afterDiscount) {
    const d = (settings && settings.delivery) || {};
    const free = Number(d.free_over) || 0;
    if (free > 0 && afterDiscount >= free) return 0;
    const fee = d.fees && d.fees[state];
    return fee !== undefined && fee !== null && fee !== '' ? Number(fee) : Number(d.default_fee || 3500);
  }
  function deliveryDays(settings, state) {
    const d = (settings && settings.delivery) || {};
    return (d.days && d.days[state]) || d.default_days || '2 to 4 days';
  }

  // ════════════════════════════════════════════════════════
  // DEMO backend (this browser only)
  // ════════════════════════════════════════════════════════
  const KEY = 'bs_demo_v4';
  function demoSampleOrders(products) {
    // a believable month of orders so the dashboard has something to show
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const people = [
      ['Adaeze Okafor', 'Lagos', 'Lekki Phase 1'], ['Chioma Eze', 'FCT – Abuja', 'Wuse 2'], ['Fatima Bello', 'Kano', 'Nassarawa GRA'],
      ['Temi Adeyemi', 'Lagos', 'Yaba'], ['Blessing Uche', 'Rivers', 'GRA Phase 2'], ['Zainab Musa', 'FCT – Abuja', 'Gwarinpa'],
      ['Ifeoma Nwosu', 'Enugu', 'Independence Layout'], ['Kemi Balogun', 'Oyo', 'Bodija'], ['Halima Sani', 'Kaduna', 'Barnawa'],
      ['Ngozi Obi', 'Anambra', 'Awka'], ['Funke Ajayi', 'Ogun', 'Abeokuta'], ['Amina Yusuf', 'FCT – Abuja', 'Maitama'],
      ['Precious Etim', 'Akwa Ibom', 'Uyo'], ['Ruth Danjuma', 'Plateau', 'Jos'], ['Ese Omoregie', 'Edo', 'GRA Benin']
    ];
    const orders = [];
    const t0 = Date.now();
    let n = 1001;
    for (let d = 44; d >= 0; d--) {
      const count = d < 3 ? 2 : rnd() < 0.35 ? 0 : rnd() < 0.7 ? 1 : 2;
      for (let k = 0; k < count; k++) {
        const who = pick(people);
        const at = new Date(t0 - d * 864e5 - Math.floor(rnd() * 10 * 36e5));
        const lines = [];
        const many = rnd() < 0.25 ? 2 : 1;
        for (let j = 0; j < many; j++) {
          const p = pick(products);
          const len = p.lengths.length ? p.lengths[Math.floor(rnd() * p.lengths.length)].length : null;
          const shade = p.shades.length ? p.shades[Math.floor(rnd() * Math.min(2, p.shades.length))].name : null;
          lines.push({ product_id: p.id, name: p.name, length: len, shade, price: priceFor(p, len), qty: rnd() < 0.15 ? 2 : 1, image: p.images[0] || '' });
        }
        const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
        const fee = deliveryFee(SEED.settings, who[1], subtotal);
        const method = pick(['card', 'card', 'transfer', 'transfer', 'whatsapp']);
        let status = d > 6 ? 'delivered' : d > 3 ? pick(['shipped', 'delivered']) : d > 1 ? pick(['confirmed', 'packing', 'shipped']) : 'new';
        if (d === 19 && k === 0) status = 'cancelled';
        let pay = status === 'new' ? (method === 'card' ? 'to_check' : 'unpaid') : status === 'cancelled' ? 'unpaid' : 'paid';
        const first = who[0].split(' ')[0].toLowerCase();
        const history = [{ at: at.toISOString(), text: 'Order placed' }];
        if (pay === 'paid') history.push({ at: new Date(+at + 2 * 36e5).toISOString(), text: 'Payment confirmed' });
        if (['packing', 'shipped', 'delivered'].includes(status)) history.push({ at: new Date(+at + 5 * 36e5).toISOString(), text: 'Being packed' });
        if (['shipped', 'delivered'].includes(status)) history.push({ at: new Date(+at + 20 * 36e5).toISOString(), text: 'On its way' });
        if (status === 'delivered') history.push({ at: new Date(+at + 50 * 36e5).toISOString(), text: 'Delivered' });
        if (status === 'cancelled') history.push({ at: new Date(+at + 6 * 36e5).toISOString(), text: 'Cancelled' });
        orders.push({
          id: uid(), number: 'BS-' + (n++), status, payment_method: method, payment_status: pay,
          payment_ref: method === 'card' ? 'T' + Math.floor(rnd() * 1e9) : null,
          customer_name: who[0], email: first + '.' + who[0].split(' ')[1].toLowerCase() + '@example.com',
          phone: '+234 80' + Math.floor(10000000 + rnd() * 89999999), address: Math.ceil(rnd() * 40) + ' ' + pick(['Adeola Odeku Street', 'Aminu Kano Crescent', 'Herbert Macaulay Way', 'Ahmadu Bello Way', 'Ikwerre Road', 'Ogui Road']),
          city: who[2], state: who[1], country: 'Nigeria', note: rnd() < 0.15 ? 'Please call before delivery.' : '',
          items: lines, subtotal, discount_code: null, discount: 0, delivery_fee: fee, total: subtotal + fee,
          source: rnd() < 0.15 ? 'instagram' : 'website', tracking: ['shipped', 'delivered'].includes(status) ? 'GIG Logistics' : '', admin_note: '',
          history, created_at: at.toISOString(), updated_at: at.toISOString()
        });
      }
    }
    return { orders: orders.reverse(), next: n };
  }
  function demoFresh() {
    const products = (SEED.products || []).map(normProduct);
    const s = demoSampleOrders(products);
    const at = (h) => new Date(Date.now() - h * 36e5).toISOString();
    return {
      v: 1, products, orders: s.orders, seq: s.next,
      settings: mergeSettings(SEED.settings),
      discounts: [{ code: 'QUEEN10', kind: 'percent', value: 10, min_spend: 100000, max_uses: null, uses: 3, expires_on: null, active: true, created_at: at(400) }],
      messages: [
        { id: uid(), name: 'Tolu A.', email: 'tolu@example.com', phone: '', body: 'Hi! Do you have the bone straight in 32 inches? I need it before the 15th.', done: false, created_at: at(5) },
        { id: uid(), name: 'Grace', email: '', phone: '+234 803 000 1111', body: 'Can I pick up from your Abuja location instead of delivery?', done: false, created_at: at(30) },
        { id: uid(), name: 'Mary J.', email: 'mary@example.com', phone: '', body: 'Thank you, the wig arrived and it is perfect.', done: true, created_at: at(120) }
      ],
      subscribers: ['ada@example.com', 'bisi@example.com', 'chi@example.com', 'dami@example.com'].map((e, i) => ({ email: e, created_at: at(24 * (i * 5 + 2)) })),
      admins: [{ email: (SEED.settings && SEED.settings.store && SEED.settings.store.email) || 'admin@example.com', added_at: at(900) }]
    };
  }
  let demoCache = null;
  function demo() {
    if (demoCache) return demoCache;
    try { demoCache = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { demoCache = null; }
    if (!demoCache || demoCache.v !== 1) { demoCache = demoFresh(); demoSave(); }
    return demoCache;
  }
  function demoSave() {
    try { localStorage.setItem(KEY, JSON.stringify(demoCache)); }
    catch (e) { fail('This browser is out of storage space for demo data. Remove a few demo photos, or connect Supabase.'); }
  }
  const wait = (v) => new Promise((r) => setTimeout(() => r(clone(v)), 120));

  function demoDiscount(code, subtotal) {
    const d = demo().discounts.find((x) => x.code === String(code || '').trim().toUpperCase());
    if (!d || !d.active) return { ok: false, message: "That code isn't valid." };
    if (d.expires_on && d.expires_on < new Date().toISOString().slice(0, 10)) return { ok: false, message: 'That code has expired.' };
    if (d.max_uses && d.uses >= d.max_uses) return { ok: false, message: 'That code has been fully used.' };
    if (subtotal < d.min_spend) return { ok: false, message: `Spend ${naira(d.min_spend)} or more to use this code.` };
    const amount = Math.min(subtotal, d.kind === 'percent' ? Math.round(subtotal * Math.min(d.value, 100) / 100) : d.value);
    return { ok: true, code: d.code, amount, message: d.kind === 'percent' ? d.value + '% off' : naira(d.value) + ' off' };
  }

  const Demo = {
    async products(opts) { const all = demo().products.slice().sort((a, b) => a.sort - b.sort || (a.created_at < b.created_at ? 1 : -1)); return wait(opts && opts.all ? all : all.filter((p) => p.active)); },
    async product(slugOrId) { const p = demo().products.find((x) => (x.slug === slugOrId || x.id === slugOrId)); return wait(p && p.active ? p : null); },
    async settings() { return wait(mergeSettings(demo().settings)); },
    async checkDiscount(code, subtotal) { return wait(demoDiscount(code, subtotal)); },
    async placeOrder(payload) {
      const db = demo(), pl = payload || {};
      if (String(pl.name || '').trim().length < 2) fail('Please add your name.');
      if (!EMAIL.test(pl.email || '')) fail('Please check your email address.');
      if (String(pl.phone || '').replace(/\D/g, '').length < 7) fail('Please add a phone number we can reach you on.');
      if (String(pl.address || '').trim().length < 4) fail('Please add your delivery address.');
      if (!String(pl.state || '').trim()) fail('Please choose your state.');
      if (!['card', 'transfer', 'whatsapp'].includes(pl.payment_method)) fail("Please choose how you'll pay.");
      if (!Array.isArray(pl.items) || !pl.items.length) fail('Your bag is empty.');
      const lines = []; let subtotal = 0;
      const stockTake = [];
      pl.items.forEach((it) => {
        const p = db.products.find((x) => x.id === it.product_id && x.active);
        if (!p) fail('One of the pieces in your bag is no longer available.');
        const qty = Number(it.qty) || 1;
        if (qty < 1 || qty > 20) fail('Please choose between 1 and 20 of each piece.');
        if (p.lengths.length && !p.lengths.some((l) => l.length === it.length)) fail(`Please choose a length for ${p.name}.`);
        if (p.shades.length && !p.shades.some((s) => s.name === it.shade)) fail(`Please choose a shade for ${p.name}.`);
        const taken = stockTake.filter((s) => s.p === p).reduce((a, s) => a + s.qty, 0);
        if (p.stock !== null && p.stock < qty + taken) fail(`Only ${p.stock} of ${p.name} left. Please lower the quantity.`);
        stockTake.push({ p, qty });
        const price = priceFor(p, it.length || null);
        subtotal += price * qty;
        lines.push({ product_id: p.id, name: p.name, length: it.length || null, shade: it.shade || null, price, qty, image: p.images[0] || '' });
      });
      let disc = { amount: 0, code: null };
      if (String(pl.discount_code || '').trim()) {
        const r = demoDiscount(pl.discount_code, subtotal);
        if (!r.ok) fail(r.message);
        disc = r;
        db.discounts.find((x) => x.code === r.code).uses++;
      }
      stockTake.forEach((s) => { if (s.p.stock !== null) s.p.stock -= s.qty; });
      const fee = deliveryFee(db.settings, pl.state, subtotal - disc.amount);
      const o = {
        id: uid(), number: 'BS-' + db.seq++, status: 'new', payment_method: pl.payment_method, payment_status: 'unpaid', payment_ref: null,
        customer_name: pl.name.trim(), email: pl.email.trim().toLowerCase(), phone: String(pl.phone).trim(), address: pl.address.trim(),
        city: String(pl.city || '').trim(), state: pl.state, country: 'Nigeria', note: String(pl.note || '').slice(0, 1000),
        items: lines, subtotal, discount_code: disc.code, discount: disc.amount, delivery_fee: fee, total: subtotal - disc.amount + fee,
        source: 'website', tracking: '', admin_note: '', history: [{ at: now(), text: 'Order placed' }], created_at: now(), updated_at: now()
      };
      db.orders.unshift(o); demoSave();
      return wait({ id: o.id, number: o.number, subtotal, discount: o.discount, delivery_fee: fee, total: o.total, email: o.email });
    },
    async reportPayment(number, email, ref) {
      const o = demo().orders.find((x) => x.number === String(number).trim().toUpperCase() && x.email === String(email).trim().toLowerCase());
      if (!o || o.payment_status !== 'unpaid') return wait(false);
      o.payment_status = 'to_check'; o.payment_ref = ref; o.history.push({ at: now(), text: 'Card payment sent' }); demoSave();
      return wait(true);
    },
    async trackOrder(number, email) {
      const o = demo().orders.find((x) => x.number === String(number).trim().toUpperCase() && x.email === String(email).trim().toLowerCase());
      if (!o) return wait(null);
      const { admin_note, customer_name, phone, address, ...pub } = o; // eslint-disable-line no-unused-vars
      return wait(pub);
    },
    async subscribe(email) {
      const e = String(email || '').trim().toLowerCase();
      if (!EMAIL.test(e)) return 'bad';
      const db = demo();
      if (db.subscribers.some((s) => s.email === e)) return wait('dup');
      db.subscribers.unshift({ email: e, created_at: now() }); demoSave(); return wait('ok');
    },
    async sendMessage(m) {
      if (String(m.name || '').trim().length < 2) fail('Please add your name.');
      if (String(m.body || '').trim().length < 2) fail('Please write your message.');
      if (!String(m.email || '').trim() && !String(m.phone || '').trim()) fail('Please add an email or phone number so we can reply.');
      demo().messages.unshift({ id: uid(), name: m.name.trim(), email: String(m.email || '').trim().toLowerCase(), phone: String(m.phone || '').trim(), body: m.body.trim(), done: false, created_at: now() });
      demoSave(); return wait(true);
    },

    // ── admin ──
    async signIn(email) { if (!EMAIL.test(email || '')) fail('Please check the email address.'); localStorage.setItem('bs_demo_user', email.trim().toLowerCase()); return wait({ email: email.trim().toLowerCase() }); },
    async signOut() { localStorage.removeItem('bs_demo_user'); },
    async user() { const e = localStorage.getItem('bs_demo_user'); return e ? { email: e } : null; },
    async isAdmin() { return true; },
    async resetPassword() { return wait(true); },
    async updatePassword() { return wait(true); },
    onAuth() { /* no auth events in demo */ },
    async orders() { return wait(demo().orders); },
    async updateOrder(id, patch) {
      const o = demo().orders.find((x) => x.id === id);
      if (!o) fail('That order no longer exists.');
      const was = o.status;
      Object.assign(o, patch, { updated_at: now() });
      if (patch.status && was !== patch.status && (was === 'cancelled' || patch.status === 'cancelled')) {
        const dir = patch.status === 'cancelled' ? 1 : -1;
        o.items.forEach((it) => { const p = demo().products.find((x) => x.id === it.product_id); if (p && p.stock !== null) p.stock = Math.max(0, p.stock + dir * it.qty); });
      }
      demoSave(); return wait(o);
    },
    async addOrder(row) {
      const db = demo();
      const o = Object.assign({ id: uid(), number: 'BS-' + db.seq++, status: 'confirmed', payment_status: 'paid', payment_method: 'cash', payment_ref: null, phone: '', address: '', city: '', state: '', country: 'Nigeria', note: '', items: [], subtotal: 0, discount_code: null, discount: 0, delivery_fee: 0, total: 0, source: 'whatsapp', tracking: '', admin_note: '', history: [{ at: now(), text: 'Order recorded' }], created_at: now(), updated_at: now() }, row);
      o.items.forEach((it) => { const p = db.products.find((x) => x.id === it.product_id); if (p && p.stock !== null) p.stock = Math.max(0, p.stock - it.qty); });
      db.orders.unshift(o); demoSave(); return wait(o);
    },
    async deleteOrder(id) { const db = demo(); db.orders = db.orders.filter((o) => o.id !== id); demoSave(); return true; },
    async saveProduct(row) {
      const db = demo();
      const p = normProduct(row);
      if (!p.name.trim()) fail('Give the product a name.');
      p.slug = p.slug || slugify(p.name);
      if (db.products.some((x) => x.slug === p.slug && x.id !== p.id)) p.slug = p.slug + '-' + Math.random().toString(36).slice(2, 6);
      if (!p.id) { p.id = uid(); p.created_at = now(); db.products.push(p); }
      else { const i = db.products.findIndex((x) => x.id === p.id); p.updated_at = now(); if (i < 0) db.products.push(p); else db.products[i] = p; }
      demoSave(); return wait(p);
    },
    async deleteProduct(id) { const db = demo(); db.products = db.products.filter((p) => p.id !== id); demoSave(); return true; },
    async uploadPhoto(file) { return shrink(file, 1000, 0.8); },
    async messages() { return wait(demo().messages); },
    async updateMessage(id, patch) { const m = demo().messages.find((x) => x.id === id); if (m) Object.assign(m, patch); demoSave(); return wait(m); },
    async deleteMessage(id) { const db = demo(); db.messages = db.messages.filter((m) => m.id !== id); demoSave(); return true; },
    async subscribers() { return wait(demo().subscribers); },
    async deleteSubscriber(email) { const db = demo(); db.subscribers = db.subscribers.filter((s) => s.email !== email); demoSave(); return true; },
    async discounts() { return wait(demo().discounts); },
    async saveDiscount(row, isNew) {
      const db = demo(), code = String(row.code || '').trim().toUpperCase();
      if (!/^[A-Z0-9_-]{3,30}$/.test(code)) fail('Codes are 3 to 30 letters or numbers, no spaces.');
      const i = db.discounts.findIndex((d) => d.code === code);
      if (isNew && i >= 0) fail('That code already exists.');
      const d = Object.assign({ uses: 0, created_at: now(), active: true }, i >= 0 ? db.discounts[i] : {}, row, { code });
      if (i >= 0) db.discounts[i] = d; else db.discounts.unshift(d);
      demoSave(); return wait(d);
    },
    async deleteDiscount(code) { const db = demo(); db.discounts = db.discounts.filter((d) => d.code !== code); demoSave(); return true; },
    async saveSettings(data) { demo().settings = mergeSettings(data); demoSave(); return wait(demo().settings); },
    async admins() { return wait(demo().admins); },
    async addAdmin(email) { const e = String(email || '').trim().toLowerCase(); if (!EMAIL.test(e)) fail('Please check the email address.'); const db = demo(); if (!db.admins.some((a) => a.email === e)) db.admins.push({ email: e, added_at: now() }); demoSave(); return true; },
    async removeAdmin(email) { const db = demo(); if (db.admins.length < 2) fail('There must always be at least one admin.'); db.admins = db.admins.filter((a) => a.email !== email); demoSave(); return true; },
    resetDemo() { localStorage.removeItem(KEY); demoCache = null; demo(); }
  };

  // Resize a photo before saving so it loads fast on phones.
  function shrink(file, max, quality) {
    return new Promise((resolve, reject) => {
      if (!/^image\//.test(file.type)) { reject(new Error('That file isn’t a photo. Use a JPG, PNG or WebP.')); return; }
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        if (LIVE) c.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read that photo.'))), 'image/jpeg', quality);
        else resolve(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that photo. Try a JPG or PNG.')); };
      img.src = url;
    });
  }

  // ════════════════════════════════════════════════════════
  // LIVE backend (Supabase)
  // ════════════════════════════════════════════════════════
  let clientP = null;
  function client() {
    if (clientP) return clientP;
    clientP = new Promise((resolve, reject) => {
      const make = () => resolve(window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: !!cfg.isAdmin, autoRefreshToken: !!cfg.isAdmin, detectSessionInUrl: !!cfg.isAdmin } }));
      if (window.supabase && window.supabase.createClient) return make();
      const s = document.createElement('script');
      s.src = cfg.supabaseScript || 'assets/vendor/supabase.js';
      s.onload = make;
      s.onerror = () => reject(new Error('Could not load the database library.'));
      document.head.appendChild(s);
    });
    return clientP;
  }
  // Turn database errors into sentences a person can act on.
  function friendly(error) {
    const m = (error && (error.message || error.error_description)) || 'Something went wrong.';
    if (/Failed to fetch|NetworkError|network/i.test(m)) return new Error('Can’t reach the database. Check your internet connection and try again.');
    if (/Invalid login credentials/i.test(m)) return new Error('That email and password don’t match. Check them, or reset your password.');
    if (/Email not confirmed/i.test(m)) return new Error('Confirm your email first: open the link Supabase sent you.');
    if (/row-level security|permission denied/i.test(m)) return new Error('This account isn’t allowed to do that. Ask the shop owner to add your email under Settings, Team.');
    if (/duplicate key.*discounts/i.test(m)) return new Error('That code already exists.');
    if (/duplicate key.*slug/i.test(m)) return new Error('Another product already uses that web address. Change the name slightly.');
    if (/JWT|token/i.test(m)) return new Error('Your sign-in has expired. Please sign in again.');
    return new Error(m.replace(/^P0001:\s*/, ''));
  }
  async function run(q) {
    const { data, error } = await q;
    if (error) throw friendly(error);
    return data;
  }
  async function rpc(name, args) { const c = await client(); return run(c.rpc(name, args)); }

  const Live = {
    async products(opts) {
      const c = await client();
      let q = c.from('products').select('*').order('sort', { ascending: true }).order('created_at', { ascending: false });
      if (!(opts && opts.all)) q = q.eq('active', true);
      return (await run(q)).map(normProduct);
    },
    async product(slugOrId) {
      const c = await client();
      const col = /^[0-9a-f-]{36}$/i.test(slugOrId) ? 'id' : 'slug';
      const rows = await run(c.from('products').select('*').eq(col, slugOrId).eq('active', true).limit(1));
      return rows[0] ? normProduct(rows[0]) : null;
    },
    async settings() { const c = await client(); const rows = await run(c.from('settings').select('data').eq('id', 1).limit(1)); return mergeSettings(rows[0] && rows[0].data); },
    async checkDiscount(code, subtotal) { return rpc('check_discount', { p_code: code, p_subtotal: Math.round(subtotal) }); },
    async placeOrder(payload) { return rpc('place_order', { payload }); },
    async reportPayment(number, email, ref) { return rpc('report_payment', { p_number: number, p_email: email, p_ref: ref }); },
    async trackOrder(number, email) { return rpc('track_order', { p_number: number, p_email: email }); },
    async subscribe(email) { return rpc('subscribe', { p_email: email }); },
    async sendMessage(m) { return rpc('send_message', { p_name: m.name, p_email: m.email || '', p_phone: m.phone || '', p_body: m.body }); },

    // ── admin ──
    async signIn(email, password) { const c = await client(); const d = await run(c.auth.signInWithPassword({ email: email.trim(), password })); return d.user; },
    async signOut() { const c = await client(); await c.auth.signOut(); },
    async user() { const c = await client(); const { data } = await c.auth.getSession(); return data && data.session ? data.session.user : null; },
    async isAdmin() { return rpc('is_admin', {}); },
    async resetPassword(email) { const c = await client(); await run(c.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + location.pathname })); return true; },
    async updatePassword(pw) { const c = await client(); await run(c.auth.updateUser({ password: pw })); return true; },
    async onAuth(fn) { const c = await client(); c.auth.onAuthStateChange((event, session) => fn(event, session)); },
    async orders() { const c = await client(); return run(c.from('orders').select('*').order('created_at', { ascending: false }).limit(2000)); },
    async updateOrder(id, patch) { const c = await client(); const rows = await run(c.from('orders').update(patch).eq('id', id).select()); return rows[0]; },
    async addOrder(row) {
      const c = await client();
      const rows = await run(c.from('orders').insert(Object.assign({ history: [{ at: now(), text: 'Order recorded' }] }, row)).select());
      // take recorded pieces out of stock
      for (const it of row.items || []) {
        if (!it.product_id) continue;
        const p = (await run(c.from('products').select('id,stock').eq('id', it.product_id).limit(1)))[0];
        if (p && p.stock !== null) await run(c.from('products').update({ stock: Math.max(0, p.stock - it.qty) }).eq('id', p.id));
      }
      return rows[0];
    },
    async deleteOrder(id) { const c = await client(); await run(c.from('orders').delete().eq('id', id)); return true; },
    async saveProduct(row) {
      const c = await client();
      const p = normProduct(row);
      if (!p.name.trim()) throw new Error('Give the product a name.');
      p.slug = p.slug || slugify(p.name);
      const body = { slug: p.slug, name: p.name, category: p.category, texture: p.texture, description: p.description, details: p.details, price: p.price, compare_at: p.compare_at, lengths: p.lengths, shades: p.shades, images: p.images, stock: p.stock, featured: p.featured, is_new: p.is_new, active: p.active, sort: p.sort };
      const rows = row.id ? await run(c.from('products').update(body).eq('id', row.id).select()) : await run(c.from('products').insert(body).select());
      return normProduct(rows[0]);
    },
    async deleteProduct(id) { const c = await client(); await run(c.from('products').delete().eq('id', id)); return true; },
    async uploadPhoto(file) {
      const c = await client();
      const blob = await shrink(file, 1600, 0.85);
      const path = `${new Date().toISOString().slice(0, 7)}/${uid()}.jpg`;
      await run(c.storage.from('product-photos').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false }));
      return c.storage.from('product-photos').getPublicUrl(path).data.publicUrl;
    },
    async messages() { const c = await client(); return run(c.from('messages').select('*').order('created_at', { ascending: false }).limit(1000)); },
    async updateMessage(id, patch) { const c = await client(); return (await run(c.from('messages').update(patch).eq('id', id).select()))[0]; },
    async deleteMessage(id) { const c = await client(); await run(c.from('messages').delete().eq('id', id)); return true; },
    async subscribers() { const c = await client(); return run(c.from('subscribers').select('*').order('created_at', { ascending: false })); },
    async deleteSubscriber(email) { const c = await client(); await run(c.from('subscribers').delete().eq('email', email)); return true; },
    async discounts() { const c = await client(); return run(c.from('discounts').select('*').order('created_at', { ascending: false })); },
    async saveDiscount(row, isNew) {
      const c = await client();
      const code = String(row.code || '').trim().toUpperCase();
      if (!/^[A-Z0-9_-]{3,30}$/.test(code)) throw new Error('Codes are 3 to 30 letters or numbers, no spaces.');
      const body = Object.assign({}, row, { code });
      delete body.created_at;
      if (isNew) delete body.uses;
      const rows = isNew ? await run(c.from('discounts').insert(body).select()) : await run(c.from('discounts').update(body).eq('code', code).select());
      return rows[0];
    },
    async deleteDiscount(code) { const c = await client(); await run(c.from('discounts').delete().eq('code', code)); return true; },
    async saveSettings(data) { const c = await client(); const rows = await run(c.from('settings').upsert({ id: 1, data }).select()); return mergeSettings(rows[0].data); },
    async admins() { const c = await client(); return run(c.from('admins').select('*').order('added_at')); },
    async addAdmin(email) { const c = await client(); const e = String(email || '').trim().toLowerCase(); if (!EMAIL.test(e)) throw new Error('Please check the email address.'); await run(c.from('admins').upsert({ email: e })); return true; },
    async removeAdmin(email) { const c = await client(); const all = await run(c.from('admins').select('email')); if (all.length < 2) throw new Error('There must always be at least one admin.'); await run(c.from('admins').delete().eq('email', email)); return true; }
  };

  // Every call: demo or live, errors always come back as plain sentences.
  const backend = LIVE ? Live : Demo;
  const api = {};
  Object.keys(Demo).forEach((k) => {
    const fn = backend[k];
    api[k] = typeof fn !== 'function' ? () => {} : async function () {
      try { return await fn.apply(backend, arguments); }
      catch (e) { throw (e && (e.friendly || !LIVE)) ? e : friendly(e); }
    };
  });
  api.mode = LIVE ? 'live' : 'demo';
  api.priceFor = priceFor;
  api.priceRange = priceRange;
  api.deliveryFee = deliveryFee;
  api.deliveryDays = deliveryDays;
  api.slugify = slugify;
  api.naira = naira;
  api.validEmail = (e) => EMAIL.test(String(e || '').trim());
  window.BSDB = api;
})();
