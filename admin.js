// ============================================================
// BADDIE STRANDS — Admin dashboard
// Reads what the shop saves in this browser (localStorage):
//   bs_orders · bs_subscribers · bs_analytics · bs_products_edited
// ============================================================
'use strict';

// ── Admin sign-in ────────────────────────────────────────────
// Change these before going live. This check runs in the browser,
// so it keeps casual visitors out but is not real security.
const ADMIN = {
  username: 'baddie_admin',
  password: 'strands2024',
  sessionKey: 'bs_admin_session',
  sessionHours: 8
};

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '₦' + Math.round(Number(n) || 0).toLocaleString('en-NG');
  const today = () => new Date().toISOString().split('T')[0];
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }
  };
  const C = BS_CONFIG;
  const STATUSES = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];
  const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
  const TITLES = { dashboard: 'Dashboard', analytics: 'Analytics', products: 'Products', orders: 'Orders', subscribers: 'Subscribers', settings: 'Settings' };

  const S = { products: [], edited: false, orders: [], subscribers: [], analytics: {}, editing: null, charts: {} };

  function toast(title, body) {
    const el = $('#admin-toast');
    $('b', el).textContent = title; $('span', el).textContent = body || '';
    el.classList.add('is-on');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('is-on'), 3200);
  }

  // ── Sign in ────────────────────────────────────────────────
  function signedIn() {
    try {
      const s = JSON.parse(sessionStorage.getItem(ADMIN.sessionKey) || 'null');
      return !!s && Date.now() - s.ts < ADMIN.sessionHours * 3600 * 1000;
    } catch (e) { return false; }
  }
  $('#login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const err = $('#login-error');
    if ($('#login-user').value.trim() === ADMIN.username && $('#login-pass').value === ADMIN.password) {
      try { sessionStorage.setItem(ADMIN.sessionKey, JSON.stringify({ user: ADMIN.username, ts: Date.now() })); } catch (x) { /* ignore */ }
      err.hidden = true;
      launch();
    } else {
      err.textContent = 'That username or password is wrong.';
      err.hidden = false;
    }
  });
  $('#admin-logout').addEventListener('click', () => {
    try { sessionStorage.removeItem(ADMIN.sessionKey); } catch (e) { /* ignore */ }
    $('#admin-app').hidden = true;
    $('#login-screen').hidden = false;
    $('#login-pass').value = '';
    $('#login-user').focus();
  });

  // ── Data ───────────────────────────────────────────────────
  function load() {
    const edited = store.get('bs_products_edited', null);
    S.edited = Array.isArray(edited) && edited.length > 0;
    S.products = JSON.parse(JSON.stringify(S.edited ? edited : STORE_DATA.products));
    S.orders = store.get('bs_orders', []) || [];
    S.subscribers = store.get('bs_subscribers', []) || [];
    const a = store.get('bs_analytics', {}) || {};
    S.analytics = { views: a.views || 0, sessions: a.sessions || [], products_viewed: a.products_viewed || {} };
  }
  const saveOrders = () => store.set('bs_orders', S.orders);
  const isDemo = (o) => !!o.demo || (/^BS\d{4}$/.test(String(o.id)) && 'channel' in o);

  // Orders come in two shapes: placed at checkout (customer object + items)
  // or recorded by hand / older demo data (flat fields). Read both the same way.
  function norm(o) {
    const c = o.customer && typeof o.customer === 'object' ? o.customer : null;
    const items = Array.isArray(o.items) ? o.items : null;
    return {
      raw: o,
      id: String(o.id || ''),
      name: c ? (c.name || '—') : (o.customer || '—'),
      email: c ? (c.email || '') : '',
      phone: c ? (c.phone || '') : (o.phone || ''),
      where: c ? [c.address, c.city, c.state].filter(Boolean).join(', ') : [o.city, o.state].filter(Boolean).join(', '),
      city: c ? (c.city || c.state || '') : (o.city || ''),
      itemsText: items ? items.map((i) => `${i.name}${[i.length, i.color].filter(Boolean).length ? ' (' + [i.length, i.color].filter(Boolean).join(', ') + ')' : ''} ×${i.qty}`).join('; ') : `${o.product || '—'}${o.length ? ' (' + o.length + ')' : ''} ×${o.qty || 1}`,
      lines: items ? items.map((i) => ({ name: i.name, qty: Number(i.qty) || 1, total: Number(i.total) || (Number(i.price) || 0) * (Number(i.qty) || 1) })) : [{ name: o.product || '—', qty: Number(o.qty) || 1, total: Number(o.total) || 0 }],
      total: Number(o.total) || 0,
      status: STATUSES.includes(o.status) ? o.status : 'Pending',
      date: String(o.placedAt || o.date || '').split('T')[0],
      method: o.method || o.channel || 'Website',
      demo: isDemo(o)
    };
  }
  const orders = () => S.orders.map(norm);
  const badge = (s) => `<span class="badge badge--${{ Completed: 'ok', Processing: 'info', Shipped: 'info', Pending: 'warn', Cancelled: 'bad' }[s] || 'info'}">${esc(s)}</span>`;

  // ── Navigation ─────────────────────────────────────────────
  function go(page) {
    $$('.page').forEach((p) => { p.hidden = p.id !== 'page-' + page; });
    $$('.side__link').forEach((b) => { if (b.dataset.page === page) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    $('#topbar-title').textContent = TITLES[page] || 'Dashboard';
    $('#scope-note').hidden = !['dashboard', 'orders', 'subscribers', 'analytics'].includes(page);
    ({ dashboard: paintDashboard, analytics: paintAnalytics, products: paintProducts, orders: paintOrders, subscribers: paintSubscribers, settings: paintSettings }[page] || paintDashboard)();
    paintPending();
    window.scrollTo(0, 0);
  }
  function paintPending() {
    const n = orders().filter((o) => o.status === 'Pending').length, pill = $('#side-pending');
    pill.hidden = !n; pill.textContent = n;
  }
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-page],[data-goto]');
    if (link) { e.preventDefault(); go(link.dataset.page || link.dataset.goto); }
    if (e.target.closest('[data-close-modal]')) closeModals();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModals(); });
  function closeModals() { $$('.modal').forEach((m) => { m.hidden = true; }); S.editing = null; }
  $$('.modal').forEach((m) => m.addEventListener('mousedown', (e) => { if (e.target === m) closeModals(); }));

  // ── Charts ─────────────────────────────────────────────────
  function chart(key, canvasId, config, emptyText, isEmpty) {
    const canvas = document.getElementById(canvasId), none = canvas.parentElement.querySelector('.chart__none');
    if (S.charts[key]) { S.charts[key].destroy(); S.charts[key] = null; }
    const off = typeof window.Chart === 'undefined';
    const empty = off || isEmpty;
    canvas.hidden = empty; none.hidden = !empty;
    none.textContent = off ? 'Charts need an internet connection to load.' : emptyText;
    if (!empty) S.charts[key] = new window.Chart(canvas, config);
  }
  const axis = { ticks: { color: '#6b5a52', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(42,18,12,.08)' } };

  // ── Dashboard ──────────────────────────────────────────────
  function setupItems() {
    return [
      ['Card payments', C.ready.paystack(), 'Paystack public key', 'Add your Paystack public key in config.js'],
      ['Bank transfer', C.ready.bank(), `${C.bank.name}, ${C.bank.accountNumber}`, 'Add your account number in config.js'],
      ['Order and sign-in emails', C.ready.emailjs(), 'EmailJS connected', 'Add your EmailJS keys in config.js'],
      ['Products', !S.edited, 'Showing data.js', 'Edits saved in this browser only']
    ].map(([label, ok, yes, no]) => `<li><span>${esc(label)}<small>${esc(ok ? yes : no)}</small></span>${ok ? '<span class="badge badge--ok">Ready</span>' : '<span class="badge badge--warn">To do</span>'}</li>`).join('');
  }
  function paintDashboard() {
    const list = orders(), done = list.filter((o) => o.status === 'Completed');
    const month = today().slice(0, 7);
    $('#stat-revenue').textContent = money(done.reduce((s, o) => s + o.total, 0));
    $('#stat-month').textContent = `${list.filter((o) => o.date.startsWith(month)).length} orders this month`;
    $('#stat-orders').textContent = list.length;
    $('#stat-pending').textContent = `${list.filter((o) => o.status === 'Pending').length} pending`;
    $('#stat-views').textContent = S.analytics.views;
    $('#stat-subs').textContent = S.subscribers.length;

    const labels = [], data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      labels.push(d.toLocaleDateString('en-NG', { weekday: 'short' }));
      data.push(done.filter((o) => o.date === key).reduce((s, o) => s + o.total, 0));
    }
    chart('revenue', 'revenue-chart', {
      type: 'line',
      data: { labels, datasets: [{ label: 'Revenue', data, borderColor: '#6F0A3A', backgroundColor: 'rgba(111,10,58,.1)', borderWidth: 2, pointBackgroundColor: '#DB1039', pointRadius: 3, tension: .35, fill: true }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: axis, y: Object.assign({}, axis, { beginAtZero: true, ticks: Object.assign({}, axis.ticks, { callback: (v) => money(v) }) }) } }
    }, 'No completed orders in the last 7 days.', data.every((v) => !v));

    const units = {};
    list.forEach((o) => o.lines.forEach((l) => { units[l.name] = (units[l.name] || 0) + l.qty; }));
    const top = Object.entries(units).sort((a, b) => b[1] - a[1]).slice(0, 5);
    $('#top-products-list').innerHTML = top.length ? top.map(([name, qty], i) => `<li><i>${ROMAN[i]}</i><span>${esc(name)}</span><small>${qty} unit${qty === 1 ? '' : 's'}</small></li>`).join('') : '<li><span>No orders yet.</span></li>';

    $('#recent-orders-tbody').innerHTML = list.length ? list.slice(0, 6).map((o) => `<tr><td class="id">${esc(o.id)}${o.demo ? '<span class="badge badge--demo">Demo</span>' : ''}</td><td>${esc(o.name)}</td><td>${esc(o.itemsText)}</td><td>${esc(o.city)}</td><td class="num">${money(o.total)}</td><td>${badge(o.status)}</td><td>${esc(o.date)}</td></tr>`).join('') : '<tr><td class="empty" colspan="7">No orders on this device yet.</td></tr>';
    $('#setup-list').innerHTML = setupItems();
  }

  // ── Analytics ──────────────────────────────────────────────
  function paintAnalytics() {
    const list = orders(), done = list.filter((o) => o.status === 'Completed');
    const revenue = done.reduce((s, o) => s + o.total, 0), views = S.analytics.views;
    $('#a-pageviews').textContent = views;
    $('#a-revenue').textContent = money(revenue);
    $('#a-avgorder').textContent = money(done.length ? revenue / done.length : 0);
    $('#a-conv').textContent = views ? (list.length / views * 100).toFixed(1) + '%' : '0%';
    $('#a-subs').textContent = S.subscribers.length;
    $('#a-orders').textContent = list.length;

    const labels = [], counts = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const hit = S.analytics.sessions.find((s) => s.date === d.toISOString().split('T')[0]);
      labels.push(d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }));
      counts.push(hit ? hit.count : 0);
    }
    chart('sessions', 'sessions-chart', {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Visits', data: counts, backgroundColor: '#6F0A3A', borderRadius: 3 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: Object.assign({}, axis, { grid: { display: false } }), y: Object.assign({}, axis, { beginAtZero: true, ticks: Object.assign({}, axis.ticks, { precision: 0 }) }) } }
    }, 'No visits recorded on this device yet.', counts.every((v) => !v));

    const byName = {};
    S.products.concat(STORE_DATA.products).forEach((p) => { byName[p.name] = p.category; });
    const cats = { wigs: 0, bundles: 0, extensions: 0 };
    list.forEach((o) => o.lines.forEach((l) => { const c = byName[l.name]; if (c in cats) cats[c] += l.qty; }));
    chart('category', 'category-chart', {
      type: 'doughnut',
      data: { labels: ['Wigs', 'Bundles', 'Extensions'], datasets: [{ data: [cats.wigs, cats.bundles, cats.extensions], backgroundColor: ['#6F0A3A', '#DDA63A', '#C0D2CC'], borderColor: '#FFFBF6', borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { color: '#2A120C', font: { family: 'Inter', size: 12 }, padding: 14 } } } }
    }, 'No orders to break down yet.', !(cats.wigs + cats.bundles + cats.extensions));

    const viewed = S.analytics.products_viewed;
    const rows = S.products.map((p) => {
      const hits = list.filter((o) => o.lines.some((l) => l.name === p.name));
      return { name: p.name, views: viewed[p.id] || 0, orders: hits.length, revenue: hits.reduce((s, o) => s + o.lines.filter((l) => l.name === p.name).reduce((x, l) => x + l.total, 0), 0) };
    }).sort((a, b) => b.views - a.views || b.orders - a.orders);
    $('#product-views-tbody').innerHTML = rows.map((r) => `<tr><td>${esc(r.name)}</td><td class="num">${r.views}</td><td class="num">${r.orders}</td><td class="num">${money(r.revenue)}</td><td class="num">${r.views && r.orders ? (r.orders / r.views * 100).toFixed(1) + '%' : '—'}</td></tr>`).join('');
  }

  // ── Products ───────────────────────────────────────────────
  function paintProducts() {
    const q = $('#pm-search-input').value.trim().toLowerCase(), cat = $('#pm-category-filter').value;
    const list = S.products.filter((p) => (!cat || p.category === cat) && (!q || (p.name + ' ' + p.type).toLowerCase().includes(q)));
    $('#products-note').hidden = !S.edited;
    $('#reset-products-btn').hidden = !S.edited;
    $('#pm-grid').innerHTML = list.length ? list.map((p) => {
      const low = Number(p.stock) <= 5;
      return `<article class="pm-card">
        <div class="pm-card__img">${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy">` : ''}</div>
        <div class="pm-card__body"><b>${esc(p.name)}</b><span>${esc(p.type)} · ${money(p.price)}${p.oldPrice ? ' (was ' + money(p.oldPrice) + ')' : ''}</span>
          <div>${p.stock == null ? '' : `<span class="badge badge--${low ? 'warn' : 'ok'}">${Number(p.stock)} in stock</span>`} ${p.hot ? '<span class="badge badge--info">Bestseller</span>' : ''} ${p.new ? '<span class="badge badge--info">New in</span>' : ''}</div>
        </div>
        <div class="pm-card__foot"><button type="button" class="btn btn--small" data-edit="${esc(p.id)}">Edit</button><button type="button" class="btn btn--small btn--danger" data-delete="${esc(p.id)}">Delete</button></div>
      </article>`;
    }).join('') : '<p class="pm-none">No products match.</p>';
  }
  function saveProducts(message) {
    store.set('bs_products_edited', S.products);
    S.edited = true;
    paintProducts();
    toast(message, 'Saved in this browser. Copy for data.js to publish.');
  }
  function openProductForm(id) {
    const f = $('#pm-form'), p = id == null ? null : S.products.find((x) => String(x.id) === String(id));
    S.editing = p;
    f.reset();
    $('#pm-error').hidden = true;
    $('#pm-modal-title').textContent = p ? 'Edit product' : 'Add a product';
    if (p) {
      f.elements.name.value = p.name || ''; f.elements.type.value = p.type || ''; f.elements.category.value = p.category || 'wigs';
      f.elements.price.value = p.price || 0; f.elements.oldPrice.value = p.oldPrice || ''; f.elements.stock.value = p.stock == null ? '' : p.stock;
      f.elements.image.value = p.image || ''; f.elements.description.value = p.description || '';
      f.elements.lengths.value = (p.lengths || []).join(', '); f.elements.features.value = (p.features || []).join('\n');
      f.elements.hot.checked = !!p.hot; f.elements.newIn.checked = !!p.new;
    }
    $('#pm-modal').hidden = false;
    f.elements.name.focus();
  }
  $('#pm-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target, err = $('#pm-error');
    const name = f.elements.name.value.trim(), type = f.elements.type.value.trim(), description = f.elements.description.value.trim();
    const price = Number(f.elements.price.value);
    const problem = !name ? 'Give the product a name.' : !type ? 'Add a type, such as Closure Wig.' : !(price > 0) ? 'Enter a price above zero.' : !description ? 'Add a short description.' : '';
    err.hidden = !problem; err.textContent = problem;
    if (problem) return;
    const lengths = f.elements.lengths.value.split(',').map((s) => s.trim()).filter(Boolean);
    const features = f.elements.features.value.split('\n').map((s) => s.trim()).filter(Boolean);
    const image = f.elements.image.value.trim();
    const old = Number(f.elements.oldPrice.value);
    const data = {
      name, type, category: f.elements.category.value, price,
      oldPrice: old > price ? old : null,
      stock: f.elements.stock.value === '' ? null : Math.max(0, Number(f.elements.stock.value)),
      image, description, hot: f.elements.hot.checked, new: f.elements.newIn.checked
    };
    if (S.editing) {
      const i = S.products.findIndex((p) => String(p.id) === String(S.editing.id));
      const merged = Object.assign({}, S.editing, data);
      if (lengths.length) merged.lengths = lengths;
      if (features.length) merged.features = features;
      if (image && image !== S.editing.image) merged.images = [image];
      S.products[i] = merged;
      closeModals();
      saveProducts('Product updated');
    } else {
      S.products.push(Object.assign({
        id: Date.now(), currency: '₦',
        lengths: lengths.length ? lengths : ['12"', '14"', '16"', '18"', '20"'],
        colors: ['#1a1008'], colorNames: ['Natural Black'],
        rating: 0, reviews: 0, images: image ? [image] : [],
        features: features.length ? features : [description.split('.')[0]]
      }, data));
      closeModals();
      saveProducts('Product added');
    }
  });
  $('#pm-grid').addEventListener('click', (e) => {
    const ed = e.target.closest('[data-edit]');
    if (ed) { openProductForm(ed.dataset.edit); return; }
    const del = e.target.closest('[data-delete]');
    if (!del) return;
    if (del.dataset.armed !== '1') { del.dataset.armed = '1'; del.textContent = 'Really delete?'; setTimeout(() => { del.dataset.armed = ''; del.textContent = 'Delete'; }, 3500); return; }
    S.products = S.products.filter((p) => String(p.id) !== String(del.dataset.delete));
    saveProducts('Product deleted');
  });
  $('#pm-search-input').addEventListener('input', paintProducts);
  $('#pm-category-filter').addEventListener('change', paintProducts);
  $('#add-product-btn').addEventListener('click', () => openProductForm(null));
  $('#quick-add-product').addEventListener('click', () => { go('products'); openProductForm(null); });
  $('#copy-products-btn').addEventListener('click', () => {
    const text = '  products: ' + JSON.stringify(S.products, null, 2).replace(/\n/g, '\n  ') + ',';
    const done = () => toast('Copied', 'Paste over the products list in data.js.');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(() => download(text, 'products-for-data-js.txt', 'text/plain'));
    else download(text, 'products-for-data-js.txt', 'text/plain');
  });
  $('#reset-products-btn').addEventListener('click', (e) => {
    const b = e.currentTarget;
    if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = 'Discard my edits?'; setTimeout(() => { b.dataset.armed = ''; b.textContent = 'Go back to data.js'; }, 3500); return; }
    store.del('bs_products_edited');
    b.dataset.armed = ''; b.textContent = 'Go back to data.js';
    load(); paintProducts();
    toast('Edits discarded', 'Products now come from data.js.');
  });

  // ── Orders ─────────────────────────────────────────────────
  function paintOrders() {
    const all = orders();
    ['Pending', 'Processing', 'Shipped', 'Completed'].forEach((s) => { $('#o-' + s.toLowerCase()).textContent = all.filter((o) => o.status === s).length; });
    const status = $('#order-status-filter').value, q = $('#order-search').value.trim().toLowerCase();
    const list = all.filter((o) => (status === 'all' || o.status === status) && (!q || (o.name + ' ' + o.email + ' ' + o.id).toLowerCase().includes(q)));
    $('#demo-orders-btn').textContent = all.some((o) => o.demo) ? 'Remove demo orders' : 'Load demo orders';
    paintPending();
    $('#orders-tbody').innerHTML = list.length ? list.map((o) => `<tr>
      <td class="id">${esc(o.id)}${o.demo ? '<span class="badge badge--demo">Demo</span>' : ''}</td>
      <td>${esc(o.name)}<small>${esc(o.email)}</small><small>${esc(o.phone)}</small></td>
      <td>${esc(o.itemsText)}</td>
      <td>${esc(o.where || '—')}</td>
      <td class="num">${money(o.total)}</td>
      <td>${esc(o.method)}</td>
      <td><select data-status="${esc(o.id)}" aria-label="Status of order ${esc(o.id)}">${STATUSES.map((s) => `<option${s === o.status ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
      <td>${esc(o.date)}</td>
      <td><button type="button" class="x" data-remove-order="${esc(o.id)}" aria-label="Remove order ${esc(o.id)}">×</button></td>
    </tr>`).join('') : '<tr><td class="empty" colspan="9">No orders match. Orders placed on this device, and ones you record by hand, show up here.</td></tr>';
  }
  $('#orders-tbody').addEventListener('change', (e) => {
    const sel = e.target.closest('[data-status]');
    if (!sel) return;
    const o = S.orders.find((x) => String(x.id) === sel.dataset.status);
    if (!o) return;
    o.status = sel.value;
    saveOrders(); paintOrders();
    toast('Order updated', `${o.id} is now ${sel.value}.`);
  });
  $('#orders-tbody').addEventListener('click', (e) => {
    const b = e.target.closest('[data-remove-order]');
    if (!b) return;
    if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = '?'; b.title = 'Click again to remove'; setTimeout(() => { b.dataset.armed = ''; b.textContent = '×'; }, 3000); return; }
    S.orders = S.orders.filter((x) => String(x.id) !== b.dataset.removeOrder);
    saveOrders(); paintOrders();
    toast('Order removed', b.dataset.removeOrder);
  });
  $('#order-status-filter').addEventListener('change', paintOrders);
  $('#order-search').addEventListener('input', paintOrders);

  // Demo orders are clearly marked and only added when asked for.
  $('#demo-orders-btn').addEventListener('click', () => {
    if (S.orders.some(isDemo)) {
      S.orders = S.orders.filter((o) => !isDemo(o));
      saveOrders(); paintOrders();
      toast('Demo orders removed', 'Only real orders are left.');
      return;
    }
    const names = ['Adaeze Okonkwo', 'Fatima Khalid', 'Chidinma Eze', 'Blessing Amadi', 'Toyin Musa', 'Ngozi Obi', 'Amaka Nwosu', 'Sade Bello'];
    const cities = ['Abuja', 'Lagos', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Benin City', 'London'];
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const demo = Array.from({ length: 16 }, (_, i) => {
      const p = pick(S.products), qty = Math.ceil(Math.random() * 2), d = new Date();
      d.setDate(d.getDate() - Math.floor(Math.random() * 30));
      return { id: 'DEMO-' + String(i + 1).padStart(3, '0'), demo: true, customer: pick(names), city: pick(cities), product: p.name, qty, total: p.price * qty, status: pick(['Completed', 'Completed', 'Processing', 'Shipped', 'Pending']), date: d.toISOString().split('T')[0], channel: pick(['WhatsApp', 'Website']) };
    }).sort((a, b) => b.date.localeCompare(a.date));
    S.orders = S.orders.concat(demo);
    saveOrders(); paintOrders();
    toast('Demo orders loaded', 'They are marked Demo and count in the stats until removed.');
  });

  function openOrderForm() {
    const f = $('#order-form');
    f.reset();
    $('#order-error').hidden = true;
    f.elements.product.innerHTML = S.products.map((p) => `<option value="${esc(p.id)}">${esc(p.name)} · ${money(p.price)}</option>`).join('');
    const fill = () => { const p = S.products.find((x) => String(x.id) === f.elements.product.value); if (p) f.elements.total.value = p.price * Math.max(1, Number(f.elements.qty.value) || 1); };
    f.elements.product.onchange = fill; f.elements.qty.oninput = fill;
    fill();
    $('#order-modal').hidden = false;
    f.elements.name.focus();
  }
  $('#add-order-btn').addEventListener('click', openOrderForm);
  $('#quick-add-order').addEventListener('click', () => { go('orders'); openOrderForm(); });
  $('#order-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target, err = $('#order-error');
    const name = f.elements.name.value.trim(), city = f.elements.city.value.trim(), qty = Math.max(1, Number(f.elements.qty.value) || 1), total = Number(f.elements.total.value);
    const p = S.products.find((x) => String(x.id) === f.elements.product.value);
    const problem = !name ? 'Add the customer\'s name.' : !city ? 'Add the city.' : !p ? 'Choose a piece.' : !(total >= 0) || f.elements.total.value === '' ? 'Enter the order total.' : '';
    err.hidden = !problem; err.textContent = problem;
    if (problem) return;
    const now = new Date();
    S.orders.unshift({
      id: 'BS-' + Date.now().toString(36).toUpperCase(),
      customer: name, phone: f.elements.phone.value.trim(), city, state: f.elements.state.value.trim(),
      product: p.name, productId: p.id, length: f.elements.hairLength.value.trim(), qty, total,
      status: f.elements.status.value, date: now.toISOString().split('T')[0], placedAt: now.toISOString(), channel: f.elements.method.value
    });
    saveOrders(); closeModals(); paintOrders();
    toast('Order recorded', `${name}, ${money(total)}`);
  });

  // ── Subscribers ────────────────────────────────────────────
  function paintSubscribers() {
    const subs = S.subscribers;
    $('#subs-count').textContent = subs.length;
    $('#subscribers-list').innerHTML = `<div class="tablewrap"><table><thead><tr><th>#</th><th>Email address</th></tr></thead><tbody>${subs.length ? subs.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s)}</td></tr>`).join('') : '<tr><td class="empty" colspan="2">No sign-ups on this device yet.</td></tr>'}</tbody></table></div>`;
  }

  // ── Settings ───────────────────────────────────────────────
  function paintSettings() {
    const hours = C.hours.map((h) => `${h.label}: ${h.open}:00 to ${h.close}:00`).join('; ');
    $('#store-facts').innerHTML = [['Store', C.storeName], ['WhatsApp', C.whatsappDisplay], ['Email', C.email], ['Order emails go to', C.adminEmail], ['Instagram', '@' + C.instagram], ['Hours (WAT)', hours]].map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
    $('#setup-list-2').innerHTML = setupItems();
    $('#zones-tbody').innerHTML = DELIVERY.local.concat(DELIVERY.international).map((z) => `<tr><td>${esc(z.zone)}</td><td>${esc(z.price)}</td><td>${esc(z.time)}</td></tr>`).join('');
    const groups = {};
    Object.keys(DELIVERY_FEES).forEach((s) => { (groups[DELIVERY_FEES[s]] = groups[DELIVERY_FEES[s]] || []).push(s); });
    $('#fees-tbody').innerHTML = Object.keys(groups).map(Number).sort((a, b) => a - b).map((f) => `<tr><td class="num">${money(f)}</td><td>${groups[f].map(esc).join(', ')}</td></tr>`).join('');
  }

  // ── Exports ────────────────────────────────────────────────
  function download(text, filename, type) {
    const url = URL.createObjectURL(new Blob([text], { type: type || 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }
  // Quote every cell, and neutralise cells a spreadsheet would run as a formula.
  const cell = (v) => { let s = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(s)) s = '\'' + s; return '"' + s.replace(/"/g, '""') + '"'; };
  const csv = (rows) => '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n');
  function exportOrders() {
    const rows = [['Order', 'Date', 'Status', 'Customer', 'Email', 'Phone', 'Deliver to', 'Items', 'Total (NGN)', 'Payment', 'Demo']].concat(orders().map((o) => [o.id, o.date, o.status, o.name, o.email, o.phone, o.where, o.itemsText, o.total, o.method, o.demo ? 'yes' : '']));
    download(csv(rows), 'baddie-strands-orders.csv');
    toast('Exported', 'Orders downloaded as a CSV file.');
  }
  function exportProducts() {
    const rows = [['ID', 'Name', 'Type', 'Category', 'Price (NGN)', 'Was (NGN)', 'Stock', 'Bestseller', 'New in', 'Lengths']].concat(S.products.map((p) => [p.id, p.name, p.type, p.category, p.price, p.oldPrice || '', p.stock == null ? '' : p.stock, p.hot ? 'yes' : '', p.new ? 'yes' : '', (p.lengths || []).join(' ')]));
    download(csv(rows), 'baddie-strands-products.csv');
    toast('Exported', 'Products downloaded as a CSV file.');
  }
  function exportSubs() {
    download(csv([['Email']].concat(S.subscribers.map((s) => [s]))), 'baddie-strands-subscribers.csv');
    toast('Exported', 'Subscribers downloaded as a CSV file.');
  }
  $('#export-orders-btn').addEventListener('click', exportOrders);
  $('#export-orders-btn-2').addEventListener('click', exportOrders);
  $('#export-products-btn').addEventListener('click', exportProducts);
  $('#export-subs-btn').addEventListener('click', exportSubs);
  $('#export-subs-btn-2').addEventListener('click', exportSubs);

  // ── Start ──────────────────────────────────────────────────
  function launch() {
    $('#login-screen').hidden = true;
    $('#admin-app').hidden = false;
    $$('[data-wa-link]').forEach((a) => { a.href = C.waLink(); });
    $$('[data-mail-link]').forEach((a) => { a.href = 'mailto:' + C.email; });
    $$('[data-ig-link]').forEach((a) => { a.href = 'https://www.instagram.com/' + C.instagram; });
    load();
    go('dashboard');
  }
  if (signedIn()) launch(); else $('#login-user').focus();
})();
