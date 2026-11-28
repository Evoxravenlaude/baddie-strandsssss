/* ============================================================
   BADDIE STRANDS — admin dashboard
   Separate from the shop. Reads/writes the same Supabase
   database. Without Supabase details it runs on sample data.
   ============================================================ */
'use strict';

const C = ADMIN_CONFIG;
const LIVE = /^https:\/\//.test(C.supabaseUrl) && !String(C.supabaseAnonKey).startsWith('YOUR_');
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shortId = id => '#' + String(id).split('-')[0].toUpperCase().slice(0, 8);
const day = d => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
const dayTime = d => new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const addr = o => { if (typeof o.delivery_address === 'string') { try { return JSON.parse(o.delivery_address); } catch { return {}; } } return o.delivery_address || {}; };
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2800); }
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }

const STATUS = {
  Pending:    { label: 'Waiting for payment', hint: 'Bank transfer not confirmed yet' },
  Processing: { label: 'Paid · preparing',    hint: 'Money received, packing it' },
  Shipped:    { label: 'Out for delivery',    hint: 'With the rider or courier' },
  Delivered:  { label: 'Delivered',           hint: 'Customer has it' },
  Cancelled:  { label: 'Cancelled',           hint: '' },
};
const pill = s => `<span class="st st-${esc(s)}">${esc(STATUS[s]?.label || s || 'Unknown')}</span>`;

/* ── data layer: Supabase, or sample data in demo ───────── */
let sb = null, DEMO = false;
const D = { orders: [], products: [], subs: [] };

const api = {
  async orders() {
    if (DEMO) return D.orders;
    const { data, error } = await sb.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(500);
    if (error) throw error; return data;
  },
  async setStatus(id, status) {
    if (DEMO) { const o = D.orders.find(o => o.id === id); o.status = status; return; }
    const { error } = await sb.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
  async products() {
    if (DEMO) return D.products;
    const { data, error } = await sb.from('products').select('*').order('sort').order('id');
    if (error) throw error; return data;
  },
  async saveProduct(p) {
    if (DEMO) {
      if (p.id) Object.assign(D.products.find(x => x.id === p.id), p);
      else D.products.unshift({ ...p, id: Math.max(0, ...D.products.map(x => x.id)) + 1 });
      return;
    }
    const { id, ...row } = p;
    const q = id ? sb.from('products').update(row).eq('id', id) : sb.from('products').insert(row);
    const { error } = await q; if (error) throw error;
  },
  async deleteProduct(id) {
    if (DEMO) { D.products = D.products.filter(p => p.id !== id); return; }
    const { error } = await sb.from('products').delete().eq('id', id); if (error) throw error;
  },
  async uploadPhoto(blob) {
    if (DEMO) return URL.createObjectURL(blob);
    const path = `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
    const { error } = await sb.storage.from('product-images').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    return sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  },
  async subscribers() {
    if (DEMO) return D.subs;
    const { data, error } = await sb.from('subscribers').select('*').order('created_at', { ascending: false });
    if (error) throw error; return data;
  },
  async hairCare() {
    if (DEMO) return D.hairCare;
    const { data, error } = await sb.from('site_content').select('value').eq('key', 'hair_care').maybeSingle();
    if (error) throw error; return data?.value || null;
  },
  async saveHairCare(value) {
    if (DEMO) { D.hairCare = value; return; }
    const { error } = await sb.from('site_content').upsert({ key: 'hair_care', value, updated_at: new Date().toISOString() });
    if (error) throw error;
  },
  notify(order_id, event) {
    if (DEMO) return;
    sb.functions.invoke('order-notify', { body: { order_id, event } }).catch(() => {});
  },
  async importStarter() {
    const rows = STORE_DATA.products.map((p, i) => ({ ...toRow(p), sort: i }));
    if (DEMO) { D.products = rows.map((r, i) => ({ ...r, id: i + 1 })); return; }
    const { error } = await sb.from('products').insert(rows); if (error) throw error;
  },
};
const toRow = p => ({
  name: p.name, type: p.type, category: p.category, price: p.price, old_price: p.oldPrice || null,
  lengths: p.lengths, colors: p.colors, color_names: p.colorNames, description: p.description, features: p.features,
  image_url: /^https?:/.test(p.image) ? p.image : null, stock: p.stock ?? 0, badge: p.hot ? 'hot' : p.new ? 'new' : null, visible: true,
});

function sampleData() {
  const now = Date.now(), h = 36e5;
  const P = STORE_DATA.products;
  const mk = (n, hoursAgo, status, name, phone, state, city, items, method) => {
    const order_items = items.map(([pid, len, qty]) => { const p = P.find(x => x.id === pid); return { product_id: pid, product_name: p.name, length: len, color: p.colorNames[0], quantity: qty, unit_price: p.price }; });
    const fee = DELIVERY_FEES[state] ?? 3500;
    return {
      id: `${n}a7c${n}e2-0000-4000-8000-00000000000${n}`, created_at: new Date(now - hoursAgo * h).toISOString(), status,
      total_amount: order_items.reduce((s, i) => s + i.unit_price * i.quantity, 0) + fee,
      payment_method: method, payment_ref: method.includes('Transfer') ? `BS-TRF-${n}` : `BS-${n}9921`,
      delivery_state: state, delivery_fee: fee, order_items,
      delivery_address: { name, phone, email: name.split(' ')[0].toLowerCase() + '@example.com', address: `${n * 7} Sample Street`, city, state, notes: n === 2 ? 'Call on arrival' : '' },
    };
  };
  D.orders = [
    mk(8, 1, 'Pending', 'Ruth Danjuma', '08051112223', 'Kaduna', 'Barnawa', [[10, '24"', 1]], 'Paystack Card'),
    mk(1, 2, 'Pending', 'Adaeze Okafor', '08031234567', 'Lagos', 'Lekki', [[5, '20"', 1]], 'Bank Transfer – Access Bank'),
    mk(2, 5, 'Processing', 'Fatima Bello', '08029876543', 'FCT – Abuja', 'Wuse 2', [[1, '18"', 1], [8, '22"', 1]], 'Paystack Card'),
    mk(3, 20, 'Pending', 'Chidinma Eze', '07065554433', 'Enugu', 'Independence Layout', [[4, '12"', 1]], 'Bank Transfer – Access Bank'),
    mk(4, 30, 'Shipped', 'Blessing Ade', '09011122233', 'Rivers', 'GRA Phase 2', [[3, '20"', 1]], 'Paystack Card'),
    mk(5, 70, 'Delivered', 'Precious Nwosu', '08187776655', 'Oyo', 'Bodija', [[2, '16"', 3]], 'Paystack Card'),
    mk(6, 120, 'Delivered', 'Zainab Musa', '08099990000', 'Kano', 'Nassarawa GRA', [[6, '18"', 1]], 'Paystack Card'),
    mk(7, 160, 'Cancelled', 'Tola Ajayi', '08120000001', 'Ogun', 'Abeokuta', [[9, '16"', 2]], 'Bank Transfer – Access Bank'),
  ];
  D.products = P.map((p, i) => ({ ...toRow(p), id: p.id, sort: i }));
  D.hairCare = null;
  D.subs = ['amaka@example.com', 'ruky@example.com', 'hauwa@example.com', 'temi@example.com'].map((email, i) => ({ email, created_at: new Date(now - (i + 1) * 30 * h).toISOString() }));
}

/* ── state ──────────────────────────────────────────────── */
const S = { hc: null, hcTab: 0, view: 'overview', orders: [], products: [], subs: [], oFilter: 'all', oSearch: '', pFilter: 'all', pSearch: '' };

/* ═════════ SIGN IN ═════════ */
document.addEventListener('DOMContentLoaded', async () => {
  $('#shop-link').href = C.shopUrl;
  initShell();
  if (!LIVE) { $('#login-live').hidden = true; $('#login-demo').hidden = false; $('#l-demo').addEventListener('click', startDemo); return; }
  try {
    await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey);
  } catch { lStatus('Couldn’t reach the database. Check your connection and refresh.'); return; }
  initLogin();
  const { data: { session } } = await sb.auth.getSession();
  if (session && isAdmin(session.user)) enter();
});
const isAdmin = u => (u?.email || '').toLowerCase() === C.adminEmail.toLowerCase();
const lStatus = (m, ok) => { $('#l-status').textContent = m; $('#l-status').className = 'status' + (ok ? ' ok' : ''); };

function initLogin() {
  $('#l-email').value = C.adminEmail;
  const otp = $('#l-otp');
  otp.innerHTML = Array.from({ length: 6 }, (_, i) => `<input inputmode="numeric" maxlength="1" aria-label="Digit ${i + 1}">`).join('');
  const cells = $$('input', otp);
  cells.forEach((c, i) => {
    c.addEventListener('input', () => { c.value = c.value.replace(/\D/g, ''); if (c.value && cells[i + 1]) cells[i + 1].focus(); });
    c.addEventListener('keydown', e => { if (e.key === 'Backspace' && !c.value && cells[i - 1]) cells[i - 1].focus(); if (e.key === 'Enter') verify(); });
    c.addEventListener('paste', e => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (t.length > 1) { e.preventDefault(); t.split('').forEach((d, j) => cells[j] && (cells[j].value = d)); } });
  });
  const send = async () => {
    const email = $('#l-email').value.trim().toLowerCase();
    if (email !== C.adminEmail.toLowerCase()) { lStatus('This dashboard only opens for the shop email.'); return; }
    $('#l-send').disabled = true; $('#l-send').textContent = 'Sending…';
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    $('#l-send').disabled = false; $('#l-send').textContent = 'Send code';
    if (error) { lStatus(error.message); return; }
    $('#ls-email').hidden = true; $('#ls-code').hidden = false; lStatus('Code sent — check the inbox.', true); cells[0].focus();
  };
  const verify = async () => {
    const token = cells.map(c => c.value).join('');
    if (token.length < 6) { lStatus('Enter all 6 digits.'); return; }
    const { data, error } = await sb.auth.verifyOtp({ email: $('#l-email').value.trim(), token, type: 'email' });
    if (error) { lStatus('That code didn’t work. Try again.'); return; }
    if (!isAdmin(data.user)) { await sb.auth.signOut(); lStatus('Access denied.'); return; }
    enter();
  };
  $('#l-send').addEventListener('click', send);
  $('#l-email').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  $('#l-verify').addEventListener('click', verify);
  $('#l-back').addEventListener('click', () => { $('#ls-email').hidden = false; $('#ls-code').hidden = true; lStatus(''); });
}
function startDemo() { DEMO = true; sampleData(); $('#demo-note').hidden = false; enter(); }

async function enter() {
  $('#login').hidden = true; $('#app').hidden = false;
  $('#sign-out').textContent = DEMO ? 'Leave sample mode' : 'Sign out';
  await refresh();
  go(location.hash.slice(1) || 'overview');
}
async function refresh() {
  try {
    [S.orders, S.products, S.subs] = await Promise.all([api.orders(), api.products(), api.subscribers()]);
    loadHairCare(await api.hairCare().catch(() => null));
  } catch (e) {
    console.error(e);
    toast('Couldn’t load everything — check the database setup (see README).');
  }
  renderAll();
}

/* ═════════ SHELL ═════════ */
function initShell() {
  $('#side-nav').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (b) go(b.dataset.view); });
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-goto]'); if (g) go(g.dataset.goto);
    if (e.target.closest('[data-close]') || e.target.id === 'scrim') closeDrawer();
    const o = e.target.closest('[data-order]'); if (o) openOrder(o.dataset.order);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  $('#sign-out').addEventListener('click', async () => { if (!DEMO) await sb.auth.signOut(); location.hash = ''; location.reload(); });

  $('#order-search').addEventListener('input', e => { S.oSearch = e.target.value.trim().toLowerCase(); renderOrders(); });
  $('#order-filters').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { S.oFilter = b.dataset.f; renderOrders(); } });
  $('#export-orders').addEventListener('click', exportOrders);

  $('#product-search').addEventListener('input', e => { S.pSearch = e.target.value.trim().toLowerCase(); renderProducts(); });
  $('#product-filters').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { S.pFilter = b.dataset.f; renderProducts(); } });
  $('#add-product').addEventListener('click', () => openProduct(null));
  $('#import-starter')?.addEventListener('click', async e => {
    e.target.disabled = true; e.target.textContent = 'Loading…';
    try { await api.importStarter(); S.products = await api.products(); renderProducts(); toast('Starter products loaded.'); }
    catch (err) { console.error(err); toast('Couldn’t load them — has the database setup been run?'); }
    e.target.disabled = false; e.target.textContent = 'Load starter products';
  });
  $('#products-grid').addEventListener('click', e => { const c = e.target.closest('[data-edit]'); if (c) openProduct(+c.dataset.edit); });
  $('#products-grid').addEventListener('change', async e => {
    const t = e.target.closest('[data-vis]'); if (!t) return;
    const p = S.products.find(x => x.id === +t.dataset.vis);
    try { await api.saveProduct({ id: p.id, visible: t.checked }); p.visible = t.checked; renderProducts(); toast(t.checked ? 'Now showing on the shop.' : 'Hidden from the shop.'); }
    catch { t.checked = !t.checked; toast('Couldn’t update — try again.'); }
  });

  $('#copy-emails').addEventListener('click', () => {
    const list = S.subs.map(s => s.email).join(', ');
    navigator.clipboard?.writeText(list).then(() => toast(`${S.subs.length} emails copied.`)).catch(() => toast('Copy not available here.'));
  });
  $('#export-subs').addEventListener('click', () => download('subscribers.csv', [['Email', 'Joined'], ...S.subs.map(s => [s.email, day(s.created_at)])]));
  initProductForm();
  window.addEventListener('hashchange', () => go(location.hash.slice(1)));
}
function go(view) {
  if (!['overview', 'orders', 'products', 'haircare', 'subscribers', 'help'].includes(view)) view = 'overview';
  S.view = view;
  $$('.view').forEach(v => v.hidden = v.id !== 'v-' + view);
  $$('#side-nav [data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === view));
  if (location.hash.slice(1) !== view) history.replaceState(null, '', '#' + view);
  window.scrollTo(0, 0);
}
function renderAll() { renderOverview(); renderOrders(); renderProducts(); renderSubs(); }

/* ═════════ OVERVIEW ═════════ */
function renderOverview() {
  const now = new Date(), hr = now.getHours();
  $('#greet').textContent = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  $('#today').textContent = now.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' });
  const O = S.orders, today = now.toDateString();
  const month = O.filter(o => new Date(o.created_at).getMonth() === now.getMonth() && new Date(o.created_at).getFullYear() === now.getFullYear() && !['Cancelled', 'Pending'].includes(o.status));
  const pending = O.filter(o => o.status === 'Pending');
  const toSend = O.filter(o => o.status === 'Processing');
  $('#stats').innerHTML = [
    [O.filter(o => new Date(o.created_at).toDateString() === today).length, 'New orders today'],
    [pending.length, 'Waiting for payment'],
    [toSend.length, 'Paid, ready to send'],
    [fmt(month.reduce((s, o) => s + Number(o.total_amount || 0), 0)), 'Sales this month'],
  ].map(([v, l]) => `<div class="stat"><span>${l}</span><b>${v}</b></div>`).join('');
  const np = $('#nav-pending'); np.hidden = !pending.length; np.textContent = pending.length;

  const att = [
    ...pending.map(o => /card/i.test(o.payment_method || '')
      ? `<div class="att"><p>Card payment not finished — ${esc(addr(o).name || 'a customer')}, ${fmt(o.total_amount)}<span>Order ${shortId(o.id)} · ${day(o.created_at)} · follow up or cancel</span></p><button class="btn oval small" data-order="${o.id}">Open</button></div>`
      : `<div class="att"><p>Check your bank for <b>${fmt(o.total_amount)}</b> from ${esc(addr(o).name || 'a customer')}<span>Bank transfer · order ${shortId(o.id)} · ${day(o.created_at)}</span></p><button class="btn oval small" data-order="${o.id}">Open</button></div>`),
    ...toSend.map(o => `<div class="att"><p>Send ${shortId(o.id)} to ${esc(addr(o).city || '')}, ${esc(o.delivery_state || '')}<span>Paid · ${esc(addr(o).name || '')}</span></p><button class="btn oval small" data-order="${o.id}">Open</button></div>`),
  ];
  $('#attention').innerHTML = att.length ? att.slice(0, 6).join('') : '<p class="empty">All caught up. Nothing waiting on you.</p>';
  $('#recent').innerHTML = O.length ? O.slice(0, 5).map(o => `<div class="att"><p>${esc(addr(o).name || 'Customer')} · ${fmt(o.total_amount)}<span>${shortId(o.id)} · ${dayTime(o.created_at)}</span></p><button data-order="${o.id}" aria-label="Open order">${pill(o.status)}</button></div>`).join('') : '<p class="empty">No orders yet. They’ll appear here as soon as someone checks out.</p>';
}

/* ═════════ ORDERS ═════════ */
function renderOrders() {
  const counts = { all: S.orders.length };
  Object.keys(STATUS).forEach(k => counts[k] = S.orders.filter(o => o.status === k).length);
  $('#order-filters').innerHTML = [['all', 'All'], ...Object.entries(STATUS).map(([k, v]) => [k, v.label])]
    .map(([k, l]) => `<button class="chip${S.oFilter === k ? ' active' : ''}" data-f="${k}">${l}<b>${counts[k] || 0}</b></button>`).join('');
  let list = S.oFilter === 'all' ? S.orders : S.orders.filter(o => o.status === S.oFilter);
  if (S.oSearch) list = list.filter(o => { const a = addr(o); return [o.id, a.name, a.phone, a.email, o.delivery_state].join(' ').toLowerCase().includes(S.oSearch.replace('#', '')); });
  $('#orders-list').innerHTML = list.length ? list.map(o => {
    const a = addr(o);
    return `<button class="o-row" data-order="${o.id}">
      <span><span class="id">${shortId(o.id)}</span><br><span class="when">${dayTime(o.created_at)}</span></span>
      <span class="who"><b>${esc(a.name || 'Customer')}</b><span>${esc(a.phone || '')}</span></span>
      <span class="state muted">${esc(o.delivery_state || '')}</span>
      <span class="amt">${fmt(o.total_amount)}</span>
      <span>${pill(o.status)}</span></button>`;
  }).join('') : '<p class="empty">No orders here.</p>';
}
function openOrder(id) {
  const o = S.orders.find(x => String(x.id) === String(id)); if (!o) return;
  const a = addr(o);
  const phone = String(a.phone || '').replace(/\D/g, '');
  const intl = phone.startsWith('0') ? '234' + phone.slice(1) : phone;
  const items = (o.order_items || []).map(i => {
    const name = i.product_name || S.products.find(p => p.id === i.product_id)?.name || `Product ${i.product_id}`;
    return `<div class="it"><div>${esc(name)} × ${i.quantity}<span>${[i.length, i.color].filter(Boolean).map(esc).join(' · ')}</span></div><div>${fmt(i.unit_price * i.quantity)}</div></div>`;
  }).join('');
  $('#od-title').textContent = 'Order ' + shortId(o.id);
  $('#od-date').textContent = dayTime(o.created_at);
  const wa = `https://wa.me/${intl}?text=${encodeURIComponent(`Hi ${(a.name || '').split(' ')[0]}, this is Baddie Strands about your order ${shortId(o.id)}.`)}`;
  $('#od-body').innerHTML = `
    <div class="od-sec"><h3>Where is this order?</h3>
      <div class="steps">${['Pending', 'Processing', 'Shipped', 'Delivered'].map(k => `<button class="step-btn${o.status === k ? ' on' : ''}" data-set="${k}">${STATUS[k].label}<small>${STATUS[k].hint}</small></button>`).join('')}
        <button class="step-btn cancel${o.status === 'Cancelled' ? ' on' : ''}" data-set="Cancelled">${o.status === 'Cancelled' ? 'Cancelled' : 'Cancel order'}</button></div></div>
    <div class="od-sec"><h3>Customer</h3>
      <div class="kv">${esc(a.name || '')}<br><span>${esc(a.phone || '')} · ${esc(a.email || '')}</span></div>
      <div class="contact-btns">${phone ? `<a class="btn pink small" href="${wa}" target="_blank" rel="noopener">WhatsApp</a><a class="btn oval small" href="tel:${esc(a.phone)}">Call</a>` : ''}${a.email ? `<a class="btn oval small" href="mailto:${esc(a.email)}">Email</a>` : ''}</div></div>
    <div class="od-sec"><h3>Deliver to</h3><div class="kv">${esc(a.address || '')}<br>${esc(a.city || '')}, ${esc(a.state || o.delivery_state || '')}${a.notes ? `<br><span>Note: ${esc(a.notes)}</span>` : ''}</div></div>
    <div class="od-sec items"><h3>Items</h3>${items || '<p class="muted">No items recorded.</p>'}${o.delivery_fee ? `<div class="it"><div>Delivery — ${esc(o.delivery_state || '')}</div><div>${fmt(o.delivery_fee)}</div></div>` : ''}<div class="tot"><span>${o.status === 'Pending' ? 'Total due' : 'Total paid'}</span><b>${fmt(o.total_amount)}</b></div></div>
    <div class="od-sec"><h3>Payment</h3><div class="kv">${esc(o.payment_method || '—')}<br><span>Reference: ${esc(o.payment_ref || '—')}</span></div></div>`;
  $$('#od-body [data-set]').forEach(b => b.addEventListener('click', async () => {
    const st = b.dataset.set; if (st === o.status) return;
    const was = o.status;
    try {
      await api.setStatus(o.id, st); o.status = st; renderAll(); openOrder(o.id);
      const ev = st === 'Processing' && was === 'Pending' ? 'paid' : st === 'Shipped' ? 'shipped' : st === 'Delivered' ? 'delivered' : null;
      if (ev) api.notify(o.id, ev);
      toast(`Marked as “${STATUS[st].label}”.${ev && !DEMO ? ' Customer emailed.' : ''}`);
    }
    catch { toast('Couldn’t update — try again.'); }
  }));
  openDrawer('#order-drawer');
}
function exportOrders() {
  const rows = [['Order', 'Date', 'Customer', 'Phone', 'Email', 'Address', 'City', 'State', 'Items', 'Total', 'Payment', 'Status']];
  S.orders.forEach(o => { const a = addr(o); rows.push([shortId(o.id), dayTime(o.created_at), a.name, a.phone, a.email, a.address, a.city, o.delivery_state, (o.order_items || []).map(i => `${i.product_name || i.product_id} ${i.length || ''} x${i.quantity}`).join('; '), o.total_amount, o.payment_method, STATUS[o.status]?.label || o.status]); });
  download('orders.csv', rows);
}
function download(name, rows) {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  toast('Download started.');
}

/* ═════════ PRODUCTS ═════════ */
function renderProducts() {
  $('#import-box').hidden = S.products.length > 0;
  const cats = [['all', 'All'], ['wigs', 'Wigs'], ['bundles', 'Bundles'], ['extensions', 'Extensions'], ['hidden', 'Hidden']];
  $('#product-filters').innerHTML = cats.map(([k, l]) => {
    const n = k === 'all' ? S.products.length : k === 'hidden' ? S.products.filter(p => !p.visible).length : S.products.filter(p => p.category === k).length;
    return `<button class="chip${S.pFilter === k ? ' active' : ''}" data-f="${k}">${l}<b>${n}</b></button>`;
  }).join('');
  let list = S.pFilter === 'all' ? S.products : S.pFilter === 'hidden' ? S.products.filter(p => !p.visible) : S.products.filter(p => p.category === S.pFilter);
  if (S.pSearch) list = list.filter(p => `${p.name} ${p.type}`.toLowerCase().includes(S.pSearch));
  $('#products-grid').innerHTML = list.map(p => `
    <div class="p-card${p.visible ? '' : ' off'}">
      <div class="p-img" data-edit="${p.id}">${p.badge ? `<span class="p-badge">${p.badge === 'hot' ? 'Bestseller' : 'New in'}</span>` : ''}${p.image_url ? `<img src="${esc(p.image_url)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('img'),{src:'logo-pink.png',className:'ph',alt:''}))">` : '<img src="logo-pink.png" class="ph" alt="">'}</div>
      <div class="p-info" data-edit="${p.id}"><b>${esc(p.name)}</b><span>${listPrice(p)}</span><span>${stockLine(p)}</span></div>
      <div class="p-foot"><label class="mini-toggle"><input type="checkbox" data-vis="${p.id}" ${p.visible ? 'checked' : ''}><span class="switch"></span>On shop</label><button class="link" data-edit="${p.id}">Edit</button></div>
    </div>`).join('') || (S.products.length ? '<p class="empty">No products match.</p>' : '');
}

function listPrice(p) {
  const o = Array.isArray(p.length_options) ? p.length_options : [];
  const prices = o.map(x => +x.price).filter(Boolean);
  if (prices.length > 1 && new Set(prices).size > 1) return `${fmt(Math.min(...prices))} – ${fmt(Math.max(...prices))}`;
  return fmt(p.price) + (p.old_price ? ` · was ${fmt(p.old_price)}` : '');
}
function stockLine(p) {
  const o = Array.isArray(p.length_options) ? p.length_options : [];
  if ((p.stock ?? 0) <= 0) return 'Sold out';
  const out = o.filter(x => (+x.stock || 0) <= 0).map(x => x.length);
  return `${p.stock} in stock` + (out.length ? ` · ${out.join(', ')} sold out` : '');
}
let EDIT = null, PHOTO = null;
/* one row per length: its own price, optional "was" price and stock */
function sizeRow(o = {}) {
  const v = x => (x === null || x === undefined || x === '') ? '' : esc(String(x));
  return `<div class="s-row">
    <label class="s-f"><small>Length</small><input class="input s-len" value="${v(o.length)}" placeholder='e.g. 14"' aria-label="Length"></label>
    <label class="s-f"><small>Price ₦</small><input class="input s-price" value="${v(o.price)}" inputmode="numeric" placeholder="85000" aria-label="Price in naira"></label>
    <label class="s-f"><small>Was ₦</small><input class="input s-old" value="${v(o.old_price)}" inputmode="numeric" placeholder="Optional" aria-label="Was price (optional)"></label>
    <label class="s-f"><small>In stock</small><input class="input s-stock" value="${v(o.stock)}" inputmode="numeric" placeholder="0" aria-label="How many in stock"></label>
    <button type="button" class="x" aria-label="Remove this length">×</button>
  </div>`;
}
function readSizes() {
  const n0 = v => { const t = String(v).replace(/[^\d]/g, ''); return t === '' ? null : parseInt(t, 10); };
  return $$('#pd-sizes .s-row').map(r => ({
    length: r.querySelector('.s-len').value.trim(),
    price: num(r.querySelector('.s-price').value),
    old_price: num(r.querySelector('.s-old').value),
    stock: n0(r.querySelector('.s-stock').value),
    el: r,
  })).filter(o => o.length || o.price || o.stock !== null);
}
function sizeSummary() {
  const rows = readSizes();
  $$('#pd-sizes .s-row').forEach(r => r.classList.toggle('zero', r.querySelector('.s-stock').value.trim() === '0'));
  const total = rows.reduce((n, o) => n + (o.stock || 0), 0);
  const prices = rows.map(o => o.price).filter(Boolean);
  $('#pd-size-sum').textContent = rows.length
    ? `${total} in stock in total${prices.length ? ` · from ${fmt(Math.min(...prices))}` : ''}. Lengths at 0 show as sold out.`
    : '';
}
function colourRow(hex = '#1a1008', name = '') {
  return `<div class="c-row"><input type="color" value="${esc(hex)}" aria-label="Colour"><input class="input" value="${esc(name)}" placeholder="Colour name, e.g. Jet Black" aria-label="Colour name"><button type="button" class="x" aria-label="Remove colour">×</button></div>`;
}
function initProductForm() {
  $('#pd-add-color').addEventListener('click', () => $('#pd-colors').insertAdjacentHTML('beforeend', colourRow()));
  $('#pd-add-size').addEventListener('click', () => {
    const last = readSizes().pop();
    $('#pd-sizes').insertAdjacentHTML('beforeend', sizeRow({ price: last?.price ?? '' }));
    $('#pd-sizes .s-row:last-child .s-len').focus(); sizeSummary();
  });
  $('#pd-sizes').addEventListener('click', e => { if (e.target.closest('.x')) { e.target.closest('.s-row').remove(); sizeSummary(); } });
  $('#pd-sizes').addEventListener('input', sizeSummary);
  $('#pd-colors').addEventListener('click', e => { if (e.target.closest('.x')) e.target.closest('.c-row').remove(); });
  $('#pd-file').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      PHOTO = await shrink(f);
      $('#pd-photo').innerHTML = `<img src="${URL.createObjectURL(PHOTO)}" alt="">`;
    } catch { toast('That file couldn’t be read as a photo.'); }
  });
  $('#pd-delete').addEventListener('click', () => { $('#pd-confirm').hidden = false; $('#pd-delete').hidden = true; });
  $('#pd-no').addEventListener('click', () => { $('#pd-confirm').hidden = true; $('#pd-delete').hidden = false; });
  $('#pd-yes').addEventListener('click', async () => {
    try { await api.deleteProduct(EDIT.id); S.products = await api.products(); renderProducts(); closeDrawer(); toast('Product deleted.'); }
    catch { toast('Couldn’t delete — try again.'); }
  });
  $('#pd-form').addEventListener('submit', saveProduct);
}
function openProduct(id) {
  EDIT = id ? S.products.find(p => p.id === id) : null; PHOTO = null;
  const p = EDIT || { name: '', type: '', category: 'wigs', price: '', old_price: '', stock: '', badge: '', lengths: [], colors: ['#1a1008'], color_names: ['Natural Black'], description: '', features: [], visible: true, image_url: '' };
  $('#pd-title').textContent = EDIT ? 'Edit product' : 'Add product';
  $('#pd-photo').innerHTML = p.image_url ? `<img src="${esc(p.image_url)}" alt="" onerror="this.parentNode.innerHTML='<span>Photo not loading</span>'">` : '<span>No photo</span>';
  $('#pd-name').value = p.name; $('#pd-type').value = p.type || ''; $('#pd-category').value = p.category || 'wigs';
  $('#pd-badge').value = p.badge || '';
  let sizes = Array.isArray(p.length_options) && p.length_options.length ? p.length_options : null;
  if (!sizes) {   // older product: one price for every length
    const ls = p.lengths?.length ? p.lengths : (EDIT ? ['Standard'] : ['']);
    sizes = ls.map(l => ({ length: l, price: p.price || '', old_price: p.old_price || '', stock: ls.length === 1 ? (p.stock ?? '') : '' }));
  }
  $('#pd-sizes').innerHTML = sizes.map(sizeRow).join('');
  sizeSummary();
  $('#pd-colors').innerHTML = (p.colors || []).map((c, i) => colourRow(c, (p.color_names || [])[i] || '')).join('');
  $('#pd-desc').value = p.description || ''; $('#pd-features').value = (p.features || []).join('\n');
  $('#pd-visible').checked = p.visible !== false;
  $('#pd-delete').hidden = !EDIT; $('#pd-confirm').hidden = true; $('#pd-status').textContent = '';
  $('#pd-file').value = '';
  openDrawer('#product-drawer');
}
const num = v => { const n = Number(String(v).replace(/[^\d.]/g, '')); return Number.isFinite(n) && n > 0 ? Math.round(n) : null; };
async function saveProduct(e) {
  e.preventDefault();
  const st = $('#pd-status');
  const name = $('#pd-name').value.trim();
  if (!name) { st.textContent = 'Give the product a name.'; $('#pd-name').focus(); return; }
  const sizes = readSizes();
  if (!sizes.length) { st.textContent = 'Add at least one length with its price and stock (use “One size” if it has no lengths).'; $('#pd-add-size').focus(); return; }
  const seen = new Set();
  for (const o of sizes) {
    if (!o.length) { st.textContent = 'Every row needs a length, e.g. 14" (or “One size”).'; o.el.querySelector('.s-len').focus(); return; }
    const k = o.length.toLowerCase();
    if (seen.has(k)) { st.textContent = `${o.length} is listed twice.`; o.el.querySelector('.s-len').focus(); return; }
    seen.add(k);
    if (!o.price) { st.textContent = `Add a price for ${o.length}, e.g. 85000.`; o.el.querySelector('.s-price').focus(); return; }
    if (o.stock === null) { st.textContent = `How many ${o.length} are in stock? Put 0 if sold out.`; o.el.querySelector('.s-stock').focus(); return; }
  }
  const opts = sizes.map(({ length, price, old_price, stock }) => ({ length, price, old_price: old_price && old_price > price ? old_price : null, stock }));
  const cheapest = opts.reduce((a, b) => (b.price < a.price ? b : a));
  const price = cheapest.price;
  const rows = $$('#pd-colors .c-row');
  const row = {
    name, type: $('#pd-type').value.trim(), category: $('#pd-category').value, price, old_price: cheapest.old_price,
    stock: opts.reduce((n, o) => n + o.stock, 0), badge: $('#pd-badge').value || null,
    lengths: opts.map(o => o.length), length_options: opts,
    colors: rows.map(r => r.querySelector('input[type=color]').value),
    color_names: rows.map(r => r.querySelector('.input').value.trim() || 'Colour'),
    description: $('#pd-desc').value.trim(), features: $('#pd-features').value.split('\n').map(s => s.trim()).filter(Boolean),
    visible: $('#pd-visible').checked,
  };
  const btn = $('#pd-save'); btn.disabled = true; btn.textContent = 'Saving…'; st.textContent = '';
  try {
    if (PHOTO) row.image_url = await api.uploadPhoto(PHOTO);
    await api.saveProduct(EDIT ? { id: EDIT.id, ...row } : row);
    S.products = await api.products(); renderProducts(); closeDrawer();
    toast(EDIT ? 'Product updated.' : 'Product added to the shop.');
  } catch (err) {
    console.error(err);
    st.textContent = 'Couldn’t save. Check your connection and try again.';
  }
  btn.disabled = false; btn.textContent = 'Save';
}
/* shrink photos to max 1200px so the shop stays fast */
function shrink(file) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1200 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => b ? res(b) : rej(), 'image/jpeg', .85);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

/* ═════════ SUBSCRIBERS ═════════ */
function renderSubs() {
  $('#subs-list').innerHTML = S.subs.length
    ? `<p class="muted small" style="padding:10px 8px">${S.subs.length} people get your new-drop emails.</p>` + S.subs.map(s => `<div class="s-row">${esc(s.email)}<span>${day(s.created_at)}</span></div>`).join('')
    : '<p class="empty">No subscribers yet. They sign up on the shop’s Contact page.</p>';
}

/* ═════════ DRAWERS ═════════ */
let openD = null;
function openDrawer(sel) { closeDrawer(); openD = $(sel); openD.classList.add('open'); $('#scrim').classList.add('on'); document.body.classList.add('locked'); setTimeout(() => openD?.querySelector('button,input')?.focus({ preventScroll: true }), 50); }
function closeDrawer() { if (!openD) return; openD.classList.remove('open'); openD = null; $('#scrim').classList.remove('on'); document.body.classList.remove('locked'); }

/* ═════════ HAIR CARE EDITOR ═════════ */
const starterHairCare = () => ({
  basics: STORE_DATA.knowledge.basics.map(b => ({ title: b.title, body: b.body })),
  care: JSON.parse(JSON.stringify(STORE_DATA.knowledge.care)),
});
function loadHairCare(value) {
  const v = value && (value.basics || value.care) ? value : null;
  const src = v || starterHairCare();
  S.hc = { basics: (src.basics || []).map(b => ({ title: b.title || '', body: b.body || '' })),
           care: Object.entries(src.care || {}).map(([name, steps]) => ({ name, steps: (steps || []).map(x => ({ title: x.title || '', body: x.body || '' })) })) };
  S.hcTab = 0;
  $('#hc-note').hidden = !!v;
  $('#hc-note').textContent = 'This is the original text from the shop. Edit anything, then tap Save changes to publish it.';
  setDirty(false);
  renderHairCare();
}
function setDirty(d) { $('#hc-dirty').hidden = !d; S.hcDirty = d; }
const itemHTML = (it, i, n, list) => `
  <div class="hc-item" data-list="${list}" data-i="${i}">
    <span class="n">${String(i + 1).padStart(2, '0')}</span>
    <div class="fields">
      <input class="input" data-f="title" value="${esc(it.title)}" placeholder="Title" aria-label="Title">
      <textarea class="input" data-f="body" rows="3" placeholder="Text shoppers will read" aria-label="Text">${esc(it.body)}</textarea>
    </div>
    <div class="hc-tools">
      <button type="button" data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button>
      <button type="button" data-act="down" ${i === n - 1 ? 'disabled' : ''} aria-label="Move down">↓</button>
      <button type="button" data-act="del" aria-label="Remove">×</button>
    </div>
  </div>`;
function renderHairCare() {
  const H = S.hc; if (!H) return;
  $('#hc-basics').innerHTML = H.basics.map((b, i) => itemHTML(b, i, H.basics.length, 'basics')).join('') || '<p class="empty">No basics yet.</p>';
  S.hcTab = Math.min(S.hcTab, Math.max(0, H.care.length - 1));
  $('#hc-tabs').innerHTML = H.care.map((c, i) => `<button class="chip${i === S.hcTab ? ' active' : ''}" data-tab="${i}">${esc(c.name || 'Untitled')}<b>${c.steps.length}</b></button>`).join('');
  const sec = H.care[S.hcTab];
  $('#hc-section').innerHTML = sec ? `
    <div class="hc-sec-head"><input class="input" id="hc-sec-name" value="${esc(sec.name)}" aria-label="Section name"><button type="button" class="link danger" id="hc-sec-del">Delete section</button></div>
    ${sec.steps.map((st, i) => itemHTML(st, i, sec.steps.length, 'steps')).join('')}
    <button type="button" class="btn oval small hc-add" id="hc-add-step">+ Add step</button>` : '<p class="empty">No sections yet.</p>';
}
function hcList(name) { return name === 'basics' ? S.hc.basics : S.hc.care[S.hcTab].steps; }
document.addEventListener('DOMContentLoaded', () => {
  const v = $('#v-haircare');
  v.addEventListener('input', e => {
    const f = e.target.dataset.f, row = e.target.closest('.hc-item');
    if (f && row) { hcList(row.dataset.list)[+row.dataset.i][f] = e.target.value; setDirty(true); }
    if (e.target.id === 'hc-sec-name') { S.hc.care[S.hcTab].name = e.target.value; setDirty(true); const chip = $(`#hc-tabs [data-tab="${S.hcTab}"]`); if (chip) chip.firstChild.textContent = e.target.value || 'Untitled'; }
  });
  v.addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'); if (t) { S.hcTab = +t.dataset.tab; renderHairCare(); return; }
    const a = e.target.closest('[data-act]');
    if (a) {
      const row = a.closest('.hc-item'), list = hcList(row.dataset.list), i = +row.dataset.i;
      if (a.dataset.act === 'del') list.splice(i, 1);
      if (a.dataset.act === 'up' && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
      if (a.dataset.act === 'down' && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
      setDirty(true); renderHairCare(); return;
    }
    if (e.target.id === 'hc-add-step') { S.hc.care[S.hcTab].steps.push({ title: '', body: '' }); setDirty(true); renderHairCare(); $$('#hc-section .hc-item').pop()?.querySelector('input')?.focus(); }
    if (e.target.id === 'hc-sec-del') { S.hc.care.splice(S.hcTab, 1); S.hcTab = 0; setDirty(true); renderHairCare(); }
  });
  $('#hc-add-basic').addEventListener('click', () => { S.hc.basics.push({ title: '', body: '' }); setDirty(true); renderHairCare(); $$('#hc-basics .hc-item').pop()?.querySelector('input')?.focus(); });
  $('#hc-add-section').addEventListener('click', () => { S.hc.care.push({ name: 'New section', steps: [{ title: '', body: '' }] }); S.hcTab = S.hc.care.length - 1; setDirty(true); renderHairCare(); $('#hc-sec-name')?.select(); });
  $('#hc-reset').addEventListener('click', () => { loadHairCare(null); setDirty(true); toast('Original text loaded — tap Save changes to publish it.'); });
  $('#hc-save').addEventListener('click', async () => {
    const clean = l => l.map(x => ({ title: x.title.trim(), body: x.body.trim() })).filter(x => x.title || x.body);
    const value = { basics: clean(S.hc.basics), care: {} };
    S.hc.care.forEach(c => { const name = c.name.trim() || 'Untitled'; value.care[name] = clean(c.steps); });
    const b = $('#hc-save'); b.disabled = true; b.textContent = 'Saving…';
    try { await api.saveHairCare(value); loadHairCare(value); toast('Saved — the Hair care page is updated.'); }
    catch (err) { console.error(err); toast('Couldn’t save — check your connection and try again.'); }
    b.disabled = false; b.textContent = 'Save changes';
  });
  window.addEventListener('beforeunload', e => { if (S.hcDirty) { e.preventDefault(); e.returnValue = ''; } });
});
