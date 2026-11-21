// ============================================================
// BADDIE STRANDS — admin dashboard
// Sign-in, Today, Orders, Products, Customers, Messages,
// Discount codes, Delivery fees, Website text, Settings, How to.
// All reading and saving goes through BSDB (db.js).
// ============================================================
'use strict';

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DB = window.BSDB, CFG = window.BS_CONFIG || {};
  const money = DB.naira;
  const icon = (id) => `<svg class="ico" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const SHOP = String(CFG.shopUrl || '').replace(/\/+$/, '');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const STATUS = { new: 'New', confirmed: 'Confirmed', packing: 'Packing', shipped: 'Sent', delivered: 'Delivered', cancelled: 'Cancelled' };
  const PAY = { unpaid: 'Not paid', to_check: 'Check payment', paid: 'Paid', refunded: 'Refunded' };
  const METHOD = { card: 'Card (Paystack)', transfer: 'Bank transfer', whatsapp: 'WhatsApp', cash: 'Cash', other: 'Other' };
  const SOURCE = { website: 'Website', instagram: 'Instagram', whatsapp: 'WhatsApp', 'in person': 'In person', other: 'Other' };
  const CATS = { wigs: 'Wig', bundles: 'Bundles', closures: 'Closure', extensions: 'Extensions' };
  const TEXTURES = { bone: 'Bone straight', straight: 'Straight', body: 'Body wave', loose: 'Loose wave', water: 'Water wave', deep: 'Deep wave', curly: 'Curly', coily: 'Kinky coily' };
  const SHADE_PRESETS = [['Jet black', '#0d0806'], ['Natural black', '#1a1008'], ['Off black', '#2b1d0e'], ['Dark brown', '#3d2b1f'], ['Chestnut', '#6b3a2a'], ['Burgundy 99J', '#5e1224'], ['Honey blonde', '#c8a96e'], ['Blonde 613', '#f2d7a0'], ['Ginger', '#b5561f'], ['Ombre 1B/30', '#7a4a2a']];
  const badge = (kind, text) => `<span class="badge badge--${kind}">${esc(text)}</span>`;
  const statusBadge = (o) => badge(o.status, STATUS[o.status] || o.status);
  const payBadge = (o) => badge(o.payment_status, PAY[o.payment_status] || o.payment_status);

  // ── dates in Abuja time ──────────────────────────────────
  const TZ = 'Africa/Lagos';
  const dayKey = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(d));
  const today = () => dayKey(Date.now());
  function when(d) {
    const k = dayKey(d), t = new Date(d);
    const time = t.toLocaleTimeString('en-NG', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).replace(' ', '').toLowerCase();
    if (k === today()) return `Today, ${time}`;
    if (k === dayKey(Date.now() - 864e5)) return `Yesterday, ${time}`;
    return t.toLocaleDateString('en-NG', { timeZone: TZ, day: 'numeric', month: 'short', year: k.slice(0, 4) === today().slice(0, 4) ? undefined : 'numeric' });
  }
  const dateLong = (d) => new Date(d).toLocaleString('en-NG', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const daysAgo = (n) => Date.now() - n * 864e5;

  // ── contacting customers ─────────────────────────────────
  function waNumber(phone) {
    let d = String(phone || '').replace(/\D/g, '');
    if (d.length === 11 && d[0] === '0') d = '234' + d.slice(1);
    return d;
  }
  const waLink = (phone, text) => `https://wa.me/${waNumber(phone)}${text ? '?text=' + encodeURIComponent(text) : ''}`;
  const first = (name) => String(name || '').trim().split(/\s+/)[0] || 'there';
  const trackUrl = (o) => `${SHOP || ''}/track.html?n=${encodeURIComponent(o.number)}&e=${encodeURIComponent(o.email)}`;
  const TEMPLATES = {
    confirm: (o) => `Hi ${first(o.customer_name)}! Your Baddie Strands order ${o.number} is confirmed. We're getting it ready and will let you know when it's on its way.`,
    pay: (o) => `Hi ${first(o.customer_name)}! Thank you for order ${o.number} (${money(o.total)}). Just checking in on payment so we can get it packed for you.`,
    shipped: (o) => `Hi ${first(o.customer_name)}! Your order ${o.number} is on its way${o.tracking ? ` with ${o.tracking}` : ''}. You can follow it here: ${trackUrl(o)}`,
    review: (o) => `Hi ${first(o.customer_name)}! We hope you love your new hair. Would you send us a quick review or a photo? It helps other queens find us.`
  };

  // ── CSV downloads ────────────────────────────────────────
  function csv(name, rows) {
    const cell = (v) => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const blob = new Blob(['﻿' + rows.map((r) => r.map(cell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${name}-${today()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ── toast ────────────────────────────────────────────────
  function toast(text, opts) {
    opts = opts || {};
    const t = $('#toast');
    $('#toast-text').textContent = text;
    const act = $('#toast-act');
    act.innerHTML = '';
    if (opts.action) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = opts.action;
      b.addEventListener('click', () => { t.classList.remove('is-on'); opts.onAction(); });
      act.appendChild(b);
    }
    t.classList.toggle('is-bad', !!opts.bad);
    t.classList.add('is-on');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('is-on'), opts.long ? 8000 : 4200);
  }
  const oops = (e) => toast(e && e.message ? e.message : 'Something went wrong. Try again.', { bad: true, long: true });
  async function busy(btn, fn) {
    if (btn) { btn.classList.add('is-busy'); btn.disabled = true; }
    try { return await fn(); }
    finally { if (btn) { btn.classList.remove('is-busy'); btn.disabled = false; } }
  }

  // ── dialogs ──────────────────────────────────────────────
  function dialog({ title, body, foot, wide, cls, onOpen, focus }) {
    return new Promise((resolve) => {
      const back = document.activeElement;
      const el = document.createElement('div');
      el.className = `dlg${wide ? ' dlg--wide' : ''}${cls ? ' ' + cls : ''}`;
      el.innerHTML = `<div class="dlg__scrim" data-x></div><div class="dlg__box" role="dialog" aria-modal="true" aria-labelledby="dlg-t" tabindex="-1">
        ${title ? `<div class="dlg__head"><h2 id="dlg-t">${title}</h2><button class="iconbtn" type="button" data-x aria-label="Close">${icon('close')}</button></div>` : ''}
        <div class="dlg__body">${body || ''}</div>${foot ? `<div class="dlg__foot">${foot}</div>` : ''}</div>`;
      $('#dialogs').appendChild(el);
      document.body.classList.add('is-locked');
      requestAnimationFrame(() => el.classList.add('is-open'));
      const close = (val) => {
        el.classList.remove('is-open');
        document.removeEventListener('keydown', key, true);
        setTimeout(() => { el.remove(); if (!$('#dialogs').children.length) document.body.classList.remove('is-locked'); }, reduced ? 0 : 220);
        if (back && document.contains(back)) back.focus({ preventScroll: true });
        resolve(val);
      };
      const key = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(null); return; }
        if (e.key !== 'Tab') return;
        const items = $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex="0"]', el).filter((n) => n.offsetParent !== null);
        if (!items.length) return;
        const a = items[0], z = items[items.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      };
      document.addEventListener('keydown', key, true);
      el.addEventListener('click', (e) => { if (e.target.closest('[data-x]')) close(null); });
      const api = { el, close };
      if (onOpen) onOpen(api);
      setTimeout(() => { const f = (focus && $(focus, el)) || $('input,select,textarea', $('.dlg__body', el)) || $('.dlg__box', el); if (f) f.focus(); }, 60);
    });
  }
  function confirmBox(title, text, ok, danger) {
    return dialog({
      title: esc(title), body: `<p>${text}</p>`,
      foot: `<button class="btn" type="button" data-x>Keep it</button><button class="btn ${danger ? 'btn--black' : 'btn--pink'}" type="button" data-ok>${esc(ok)}</button>`,
      focus: '[data-ok]',
      onOpen: ({ el, close }) => $('[data-ok]', el).addEventListener('click', () => close(true))
    });
  }

  // ════════════════════════════════════════════════════════
  // DATA
  // ════════════════════════════════════════════════════════
  const D = { orders: null, products: null, messages: null, subscribers: null, discounts: null, settings: null, admins: null };
  const loaders = {
    orders: () => DB.orders(), products: () => DB.products({ all: true }), messages: () => DB.messages(),
    subscribers: () => DB.subscribers(), discounts: () => DB.discounts(), settings: () => DB.settings(), admins: () => DB.admins()
  };
  async function need(...keys) {
    await Promise.all(keys.filter((k) => D[k] === null).map(async (k) => { D[k] = await loaders[k](); }));
    paintCounts();
  }
  async function reload(...keys) { await Promise.all(keys.map(async (k) => { D[k] = await loaders[k](); })); paintCounts(); }
  function paintCounts() {
    const set = (k, n) => $$(`[data-n="${k}"]`).forEach((el) => { el.hidden = !n; el.textContent = n; });
    if (D.orders) set('orders', D.orders.filter((o) => o.status === 'new' || o.payment_status === 'to_check').length);
    if (D.messages) set('messages', D.messages.filter((m) => !m.done).length);
    if (D.products) set('products', D.products.filter((p) => p.active && p.stock !== null && p.stock <= 3).length);
  }
  const productById = (id) => (D.products || []).find((p) => p.id === id);
  const art = (p) => (p && p.images && p.images[0] ? `<img src="${esc(p.images[0])}" alt="" loading="lazy">` : `<img src="${window.BSArt(p || {}, 0)}" alt="">`);
  const itemArt = (it) => it.image ? `<img src="${esc(it.image)}" alt="" loading="lazy">` : art(productById(it.product_id));

  // ════════════════════════════════════════════════════════
  // ROUTER
  // ════════════════════════════════════════════════════════
  let view = $('#view');
  let guard = null; // function returning true when there are unsaved changes
  let current = '';
  const routes = [
    [/^\/?$/, 'today', viewToday],
    [/^\/orders\/?$/, 'orders', viewOrders],
    [/^\/orders\/(.+)$/, 'orders', viewOrder],
    [/^\/products\/?$/, 'products', viewProducts],
    [/^\/products\/(.+)$/, 'products', viewProduct],
    [/^\/customers\/?$/, 'customers', viewCustomers],
    [/^\/messages\/?$/, 'messages', viewMessages],
    [/^\/discounts\/?$/, 'discounts', viewDiscounts],
    [/^\/delivery\/?$/, 'delivery', viewDelivery],
    [/^\/content\/?$/, 'content', viewContent],
    [/^\/settings\/?$/, 'settings', viewSettings],
    [/^\/help(?:\/(.+))?$/, 'help', viewHelp]
  ];
  const path = () => decodeURIComponent((location.hash || '#/').slice(1).split('?')[0]) || '/';
  const query = () => new URLSearchParams((location.hash.split('?')[1]) || '');
  function go(to) { location.hash = '#' + to; }
  async function route() {
    const p = path();
    if (guard && guard() && current !== p) {
      const leave = await confirmBox('Leave without saving?', 'You have changes on this page that aren’t saved yet.', 'Leave without saving', true);
      if (!leave) { history.replaceState(null, '', '#' + current); return; }
    }
    guard = null; current = p;
    const r = routes.find(([re]) => re.test(p)) || routes[0];
    const m = p.match(r[0]) || [];
    $$('[data-r]').forEach((a) => { if (a.dataset.r === r[1]) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    closeSide();
    // a fresh container per page, so no page's listeners outlive it
    const fresh = view.cloneNode(false);
    view.replaceWith(fresh);
    view = fresh;
    view.innerHTML = '<div class="loading">Loading</div>';
    window.scrollTo(0, 0);
    try { await r[2](m[1]); }
    catch (e) { console.error(e); view.innerHTML = `<div class="empty"><b>This page didn’t load.</b><p>${esc(e.message || 'Check your internet connection.')}</p><button class="btn btn--pink" type="button" onclick="location.reload()">Try again</button></div>`; }
    if (document.activeElement === document.body || !view.contains(document.activeElement)) view.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', (e) => { if (guard && guard()) { e.preventDefault(); e.returnValue = ''; } });

  // ════════════════════════════════════════════════════════
  // TODAY
  // ════════════════════════════════════════════════════════
  async function viewToday() {
    await need('orders', 'products', 'messages');
    const O = D.orders, live = O.filter((o) => o.status !== 'cancelled');
    const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: 'numeric', hour12: false }).format(new Date()));
    const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const n = {
      newO: O.filter((o) => o.status === 'new' && o.payment_status !== 'to_check').length,
      check: O.filter((o) => o.payment_status === 'to_check' && o.status !== 'cancelled').length,
      waiting: O.filter((o) => o.payment_status === 'unpaid' && o.status !== 'cancelled' && o.payment_method === 'transfer').length,
      pack: O.filter((o) => o.status === 'confirmed' || o.status === 'packing').length,
      low: D.products.filter((p) => p.active && p.stock !== null && p.stock <= 3).length,
      msgs: D.messages.filter((m) => !m.done).length
    };
    const todo = [
      [n.check, 'Card payments to check', 'Look them up in Paystack, then mark them paid.', '#/orders?pay=to_check'],
      [n.newO, `New order${n.newO === 1 ? '' : 's'} to confirm`, 'Check the details and confirm with the customer.', '#/orders?tab=new'],
      [n.waiting, `Bank transfer${n.waiting === 1 ? '' : 's'} to look out for`, 'Mark them paid when the money lands.', '#/orders?pay=unpaid'],
      [n.pack, `Order${n.pack === 1 ? '' : 's'} to pack and send`, 'Confirmed and waiting to go out.', '#/orders?tab=pack'],
      [n.low, `Product${n.low === 1 ? '' : 's'} running low`, '3 or fewer left in stock.', '#/products?f=low'],
      [n.msgs, `Unread message${n.msgs === 1 ? '' : 's'}`, 'From the contact page.', '#/messages']
    ].filter((t) => t[0] > 0);

    const paid = (a, b) => O.filter((o) => o.payment_status === 'paid' && new Date(o.created_at) >= a && new Date(o.created_at) < b);
    const sum = (l) => l.reduce((s, o) => s + o.total, 0);
    const wk = paid(daysAgo(7), Date.now() + 1), prev = paid(daysAgo(14), daysAgo(7));
    const orders7 = live.filter((o) => new Date(o.created_at) >= daysAgo(7)).length, ordersPrev = live.filter((o) => new Date(o.created_at) >= daysAgo(14) && new Date(o.created_at) < daysAgo(7)).length;
    const paid30 = paid(daysAgo(30), Date.now() + 1);
    const owed = live.filter((o) => o.payment_status !== 'paid' && o.payment_status !== 'refunded');
    const delta = (a, b) => {
      if (!b) return a ? '<span class="tile__delta">New this week</span>' : '<span class="tile__delta">Nothing yet</span>';
      const pct = Math.round(((a - b) / b) * 100);
      return `<span class="tile__delta ${pct > 0 ? 'is-up' : pct < 0 ? 'is-down' : ''}">${pct > 0 ? '▲' : pct < 0 ? '▼' : ''} ${Math.abs(pct)}% vs the week before</span>`;
    };
    // best sellers, last 30 days
    const units = new Map();
    O.filter((o) => o.status !== 'cancelled' && new Date(o.created_at) >= daysAgo(30)).forEach((o) => o.items.forEach((it) => {
      const k = it.product_id || it.name, u = units.get(k) || { name: it.name, qty: 0, money: 0, id: it.product_id };
      u.qty += it.qty; u.money += it.price * it.qty; units.set(k, u);
    }));
    const top = Array.from(units.values()).sort((a, b) => b.qty - a.qty || b.money - a.money).slice(0, 5);
    const maxQ = top.length ? top[0].qty : 1;

    view.innerHTML = `
      <div class="head"><div><h1>${hello}.</h1><p>${new Date().toLocaleDateString('en-NG', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
        <div class="head__act"><button class="btn" type="button" data-sale>${icon('plus')}Record a sale</button><a class="btn btn--pink" href="#/products/new">${icon('plus')}Add a product</a></div></div>
      <div class="grid2">
        <section class="panel" aria-labelledby="todo-t">
          <div class="panel__head"><h2 class="sub" id="todo-t">Needs you</h2></div>
          ${todo.length ? `<div class="todo">${todo.map((t) => `<a href="${t[3]}"><span class="todo__n">${t[0]}</span><span><b>${t[1]}</b><span class="muted">${t[2]}</span></span><span class="go">Open</span></a>`).join('')}</div>`
            : `<div class="clear"><i>${icon('check')}</i><div><b>You’re all caught up.</b><p class="muted">New orders and messages will show up here.</p></div></div>`}
        </section>
        <div class="stack">
          <div class="tiles" style="grid-template-columns:1fr 1fr">
            <div class="tile"><span class="tile__label">Sales, last 7 days</span><span class="tile__value">${money(sum(wk))}</span>${delta(sum(wk), sum(prev))}</div>
            <div class="tile"><span class="tile__label">Orders, last 7 days</span><span class="tile__value">${orders7}</span>${delta(orders7, ordersPrev)}</div>
            <div class="tile"><span class="tile__label">Average order, 30 days</span><span class="tile__value">${paid30.length ? money(sum(paid30) / paid30.length) : '₦0'}</span><span class="tile__delta">${paid30.length} paid order${paid30.length === 1 ? '' : 's'}</span></div>
            <div class="tile"><span class="tile__label">Waiting to be paid</span><span class="tile__value">${money(sum(owed))}</span><span class="tile__delta">${owed.length} order${owed.length === 1 ? '' : 's'}</span></div>
          </div>
        </div>
      </div>
      <section class="panel" aria-labelledby="chart-t">
        <div class="panel__head"><div><h2 class="sub" id="chart-t">Paid sales by day</h2><p class="small muted" data-chart-sum></p></div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><div class="seg" role="group" aria-label="Period"><button type="button" data-days="30" aria-pressed="true">30 days</button><button type="button" data-days="90" aria-pressed="false">90 days</button></div><button class="btn btn--sm btn--ghost" type="button" data-as-table>Show as table</button></div></div>
        <div class="panel__body"><div class="chart" data-chart></div><div data-chart-table hidden></div></div>
      </section>
      <div class="grid2">
        <section class="panel" aria-labelledby="recent-t">
          <div class="panel__head"><h2 class="sub" id="recent-t">Latest orders</h2><a class="linkbtn" href="#/orders">See all orders</a></div>
          ${O.length ? orderTable(O.slice(0, 6), true) : '<div class="empty"><b>No orders yet.</b><p>When someone checks out on the shop, the order appears here.</p></div>'}
        </section>
        <section class="panel" aria-labelledby="top-t">
          <div class="panel__head"><h2 class="sub" id="top-t">Best sellers, 30 days</h2></div>
          ${top.length ? `<div class="panel__body" style="display:grid;gap:14px">${top.map((t) => `<div><div style="display:flex;justify-content:space-between;gap:12px"><span class="strong">${esc(t.name)}</span><span class="num">${t.qty} sold</span></div><div style="height:6px;border-radius:6px;background:var(--bg);margin-top:6px"><div style="height:100%;width:${Math.max(6, t.qty / maxQ * 100)}%;border-radius:6px;background:var(--pink-ink)"></div></div><span class="small muted">${money(t.money)}</span></div>`).join('')}</div>` : '<div class="empty"><p>Sales will show here.</p></div>'}
        </section>
      </div>`;
    bindOrderRows(view);
    $('[data-sale]', view).addEventListener('click', recordSale);
    let days = 30;
    const draw = () => salesChart($('[data-chart]', view), O, days);
    $$('[data-days]', view).forEach((b) => b.addEventListener('click', () => { days = Number(b.dataset.days); $$('[data-days]', view).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); draw(); }));
    $('[data-as-table]', view).addEventListener('click', (e) => {
      const t = $('[data-chart-table]', view), c = $('[data-chart]', view), show = t.hidden;
      t.hidden = !show; c.hidden = show; e.target.textContent = show ? 'Show as chart' : 'Show as table';
    });
    draw();
  }

  // one series: paid sales per day, columns, hover/focus for the exact figure
  function salesChart(box, orders, days) {
    const keys = [];
    for (let i = days - 1; i >= 0; i--) keys.push(dayKey(daysAgo(i)));
    const byDay = new Map(keys.map((k) => [k, { sum: 0, n: 0 }]));
    orders.forEach((o) => { if (o.payment_status !== 'paid') return; const b = byDay.get(dayKey(o.created_at)); if (b) { b.sum += o.total; b.n++; } });
    const data = keys.map((k) => ({ k, ...byDay.get(k) }));
    const total = data.reduce((s, d) => s + d.sum, 0), nOrders = data.reduce((s, d) => s + d.n, 0);
    $('[data-chart-sum]', box.closest('.panel')).textContent = `${money(total)} from ${nOrders} paid order${nOrders === 1 ? '' : 's'} in the last ${days} days`;
    const W = Math.max(320, box.clientWidth || 800), H = 240, L = 56, R = 8, T = 12, B = 28;
    const max = Math.max(1, ...data.map((d) => d.sum));
    const step = [10000, 20000, 50000, 100000, 200000, 250000, 500000, 1e6, 2e6, 5e6].find((s) => max / s <= 4) || 1e7;
    const top = Math.ceil(max / step) * step;
    const y = (v) => T + (H - T - B) * (1 - v / top);
    const slot = (W - L - R) / data.length, bw = Math.min(24, Math.max(3, slot - 2));
    const short = (v) => v >= 1e6 ? '₦' + (v / 1e6).toFixed(v % 1e6 ? 1 : 0) + 'M' : v >= 1000 ? '₦' + Math.round(v / 1000) + 'K' : '₦' + v;
    const label = (k) => new Date(k + 'T12:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
    let grid = '', ticks = '';
    for (let v = 0; v <= top; v += step) { grid += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`; ticks += `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${short(v)}</text>`; }
    const every = days <= 30 ? 7 : 21;
    let xt = '';
    data.forEach((d, i) => { if ((data.length - 1 - i) % every === 0) xt += `<text x="${L + slot * i + slot / 2}" y="${H - 8}" text-anchor="middle">${label(d.k)}</text>`; });
    const bars = data.map((d, i) => {
      const x = L + slot * i + (slot - bw) / 2;
      if (!d.sum) return `<rect class="zero" x="${x}" y="${y(0) - 1}" width="${bw}" height="1"/>`;
      const h = Math.max(2, y(0) - y(d.sum)), r = Math.min(4, bw / 2, h);
      const x2 = x + bw, yt = y(0) - h;
      return `<path class="col" data-i="${i}" d="M${x} ${y(0)} V${yt + r} Q${x} ${yt} ${x + r} ${yt} H${x2 - r} Q${x2} ${yt} ${x2} ${yt + r} V${y(0)} Z"/>`;
    }).join('');
    const hits = data.map((d, i) => `<rect class="hit" data-i="${i}" x="${L + slot * i}" y="${T}" width="${slot}" height="${H - T - B}"/>`).join('');
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Paid sales per day for the last ${days} days. Use the arrow keys to read each day." tabindex="0"><g class="grid">${grid}</g><g class="axis">${ticks}${xt}</g>${bars}${hits}</svg><div class="tip" hidden></div>`;
    const svg = $('svg', box), tip = $('.tip', box);
    let cur = -1;
    const show = (i) => {
      cur = i;
      const d = data[i];
      box.classList.add('is-hover');
      $$('.col', box).forEach((c) => c.classList.toggle('is-on', Number(c.dataset.i) === i));
      tip.hidden = false;
      tip.innerHTML = '';
      const b = document.createElement('b'); b.textContent = money(d.sum);
      const s = document.createElement('span'); s.textContent = `${label(d.k)}, ${d.n} paid order${d.n === 1 ? '' : 's'}`;
      tip.append(b, s);
      const k = box.clientWidth / W;
      tip.style.left = Math.min(box.clientWidth - 80, Math.max(80, (L + slot * i + slot / 2) * k)) + 'px';
      tip.style.top = (y(d.sum) * k) + 'px';
    };
    const hide = () => { cur = -1; box.classList.remove('is-hover'); tip.hidden = true; };
    svg.addEventListener('pointermove', (e) => { const h = e.target.closest('.hit, .col'); if (h) show(Number(h.dataset.i)); });
    svg.addEventListener('pointerleave', hide);
    svg.addEventListener('blur', hide);
    svg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show(Math.min(data.length - 1, Math.max(0, (cur < 0 ? data.length : cur) + (e.key === 'ArrowRight' ? 1 : -1)))); }
      if (e.key === 'Escape') hide();
    });
    const tbl = $('[data-chart-table]', box.parentElement);
    tbl.innerHTML = `<div class="table-wrap"><table class="table"><thead><tr><th>Day</th><th class="r">Paid orders</th><th class="r">Sales</th></tr></thead><tbody>${data.slice().reverse().filter((d) => d.n).map((d) => `<tr><td>${label(d.k)}</td><td class="r num">${d.n}</td><td class="r num">${money(d.sum)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">No paid orders in this period.</td></tr>'}</tbody></table></div>`;
    if (!salesChart.bound) { salesChart.bound = true; window.addEventListener('resize', () => { const c = $('[data-chart]'); if (c && c.isConnected && !c.hidden) $('[data-days][aria-pressed="true"]').click(); }); }
  }

  // ════════════════════════════════════════════════════════
  // ORDERS
  // ════════════════════════════════════════════════════════
  function orderTable(list, compact) {
    return `<div class="table-wrap"><table class="table table--cards"><thead><tr><th>Order</th><th>Customer</th>${compact ? '' : '<th>Items</th>'}<th class="r">Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>
      ${list.map((o) => {
        const n = o.items.reduce((s, i) => s + i.qty, 0);
        return `<tr data-href="#/orders/${esc(o.number)}" tabindex="0"><td><b>${esc(o.number)}</b><small>${when(o.created_at)}</small></td><td><span class="strong">${esc(o.customer_name)}</span><small>${esc(o.state || SOURCE[o.source] || '')}</small></td>${compact ? '' : `<td data-m="hide">${n} piece${n === 1 ? '' : 's'}<small>${esc(o.items.map((i) => i.name).join(', ').slice(0, 60))}</small></td>`}<td class="r num"><b>${money(o.total)}</b></td><td>${payBadge(o)}</td><td>${statusBadge(o)}</td></tr>`;
      }).join('')}</tbody></table></div>`;
  }
  function bindOrderRows(root) {
    root.addEventListener('click', (e) => { const tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a,button')) location.hash = tr.dataset.href; });
    root.addEventListener('keydown', (e) => { const tr = e.target.closest('tr[data-href]'); if (tr && e.key === 'Enter') location.hash = tr.dataset.href; });
  }

  async function viewOrders() {
    await need('orders', 'products');
    const q = query();
    const st = { tab: q.get('tab') || 'all', pay: q.get('pay') || '', search: q.get('q') || '', period: 'all' };
    const TABS = [['all', 'All', () => true], ['new', 'New', (o) => o.status === 'new'], ['pack', 'To pack', (o) => o.status === 'confirmed' || o.status === 'packing'], ['shipped', 'Sent', (o) => o.status === 'shipped'], ['delivered', 'Delivered', (o) => o.status === 'delivered'], ['cancelled', 'Cancelled', (o) => o.status === 'cancelled']];
    view.innerHTML = `
      <div class="head"><div><h1>Orders</h1><p>Every order from the shop, plus sales you record yourself.</p></div>
        <div class="head__act"><button class="btn" type="button" data-csv>${icon('down')}Download</button><button class="btn btn--pink" type="button" data-sale>${icon('plus')}Record a sale</button></div></div>
      <div class="tabs" role="tablist" aria-label="Order status" data-tabs></div>
      <div class="bar">
        <label class="search"><span class="visually-hidden">Search orders</span>${icon('search')}<input class="input" type="search" placeholder="Order number, name, phone or email" data-q value="${esc(st.search)}"></label>
        <select class="input" style="width:auto" data-pay aria-label="Payment"><option value="">Any payment</option><option value="to_check">Check payment</option><option value="unpaid">Not paid</option><option value="paid">Paid</option><option value="refunded">Refunded</option></select>
        <select class="input" style="width:auto" data-period aria-label="When"><option value="all">Any time</option><option value="1">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select>
      </div>
      <section class="panel" data-list></section>`;
    $('[data-pay]', view).value = st.pay;
    const paint = () => {
      const words = st.search.toLowerCase().split(/\s+/).filter(Boolean);
      const base = D.orders.filter((o) => (!st.pay || o.payment_status === st.pay)
        && (st.period === 'all' || (st.period === '1' ? dayKey(o.created_at) === today() : new Date(o.created_at) >= daysAgo(Number(st.period))))
        && words.every((w) => [o.number, o.customer_name, o.email, o.phone, o.state, o.city].join(' ').toLowerCase().includes(w)));
      $('[data-tabs]', view).innerHTML = TABS.map(([id, name, f]) => `<button type="button" role="tab" data-tab="${id}" aria-selected="${st.tab === id}">${name}<span>${base.filter(f).length}</span></button>`).join('');
      const list = base.filter(TABS.find((t) => t[0] === st.tab)[2]);
      $('[data-list]', view).innerHTML = list.length ? orderTable(list) : `<div class="empty"><b>No orders here.</b><p>${words.length || st.pay || st.period !== 'all' ? 'Try a different search or filter.' : 'Orders show up here as soon as they’re placed.'}</p></div>`;
      const hq = new URLSearchParams(); if (st.tab !== 'all') hq.set('tab', st.tab); if (st.pay) hq.set('pay', st.pay); if (st.search) hq.set('q', st.search);
      history.replaceState(null, '', '#/orders' + (hq.toString() ? '?' + hq : ''));
    };
    $('[data-tabs]', view).addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { st.tab = b.dataset.tab; paint(); } });
    let t = 0;
    $('[data-q]', view).addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { st.search = e.target.value.trim(); paint(); }, 150); });
    $('[data-pay]', view).addEventListener('change', (e) => { st.pay = e.target.value; paint(); });
    $('[data-period]', view).addEventListener('change', (e) => { st.period = e.target.value; paint(); });
    $('[data-sale]', view).addEventListener('click', recordSale);
    $('[data-csv]', view).addEventListener('click', () => csv('orders', [['Order', 'Date', 'Customer', 'Email', 'Phone', 'Address', 'City', 'State', 'Items', 'Subtotal', 'Discount', 'Delivery', 'Total', 'Payment method', 'Payment', 'Status', 'Source']]
      .concat(D.orders.map((o) => [o.number, new Date(o.created_at).toLocaleString('en-NG', { timeZone: TZ }), o.customer_name, o.email, o.phone, o.address, o.city, o.state, o.items.map((i) => `${i.qty} x ${i.name}${i.length ? ' ' + i.length : ''}${i.shade ? ' ' + i.shade : ''}`).join('; '), o.subtotal, o.discount, o.delivery_fee, o.total, METHOD[o.payment_method] || o.payment_method, PAY[o.payment_status], STATUS[o.status], SOURCE[o.source] || o.source]))));
    bindOrderRows($('[data-list]', view));
    paint();
  }

  // what to do next with an order, in one sentence and one button
  function nextStep(o) {
    if (o.status === 'cancelled') return { title: 'This order was cancelled.', text: 'Its pieces went back into stock. Restore it if it was cancelled by mistake.', acts: [['restore', 'Restore order', '']] };
    if (o.payment_status === 'to_check') return { title: 'Check this card payment.', text: `The customer paid by card. Find reference <b>${esc(o.payment_ref || o.number)}</b> in your Paystack dashboard. If it says “Success”, mark it as paid.`, acts: [['paid', 'It’s there: mark as paid', 'pink'], ['paystack', 'Open Paystack', ''], ['notfound', 'I can’t find it', 'ghost']] };
    if (o.payment_status === 'unpaid' && o.status === 'new') {
      if (o.payment_method === 'transfer') return { title: `Waiting for a transfer of ${money(o.total)}.`, text: `Look for <b>${esc(o.number)}</b> or the name <b>${esc(o.customer_name)}</b> in your bank app. Mark it paid when the money lands.`, acts: [['paid', 'Mark as paid', 'pink'], ['wa-pay', 'Remind her on WhatsApp', '']] };
      return { title: 'Agree payment with the customer.', text: 'She chose to finish on WhatsApp. Once she’s paid, mark it as paid so you can pack it.', acts: [['wa-pay', 'Message her on WhatsApp', 'pink'], ['paid', 'Mark as paid', '']] };
    }
    if (o.status === 'new') return { title: 'Paid. Confirm the order.', text: 'Let her know it’s confirmed and coming. Confirming moves it to “To pack”.', acts: [['confirmed', 'Confirm order', 'pink'], ['wa-confirm', 'Tell her on WhatsApp', '']] };
    if (o.status === 'confirmed') return { title: 'Pack it.', text: 'When you start packing, mark it so nothing gets missed.', acts: [['packing', 'Start packing', 'pink']] };
    if (o.status === 'packing') return { title: 'Send it.', text: 'Mark it as sent when it leaves with the rider or courier. You can add the courier’s name or tracking number.', acts: [['shipped', 'Mark as sent', 'pink']] };
    if (o.status === 'shipped') return { title: 'On its way.', text: 'Mark it delivered once she has it.', acts: [['delivered', 'Mark as delivered', 'pink'], ['wa-shipped', 'Send her the tracking link', '']] };
    return { title: 'Delivered. All done.', text: 'A happy customer is your best advert.', acts: [['wa-review', 'Ask for a review on WhatsApp', '']] };
  }
  const HISTORY = { paid: 'Payment confirmed', unpaid: 'Marked as not paid', refunded: 'Refunded', to_check: 'Payment waiting to be checked', new: 'Moved back to new', confirmed: 'Order confirmed', packing: 'Being packed', shipped: 'On its way', delivered: 'Delivered', cancelled: 'Cancelled' };

  async function viewOrder(number) {
    await need('orders', 'products', 'settings');
    const o = D.orders.find((x) => x.number === number || x.id === number);
    if (!o) { view.innerHTML = `<a class="back" href="#/orders">${icon('left')}Orders</a><div class="empty"><b>We couldn’t find order ${esc(number)}.</b><p>It may have been deleted.</p></div>`; return; }
    const ns = nextStep(o);
    const n = o.items.reduce((s, i) => s + i.qty, 0);
    view.innerHTML = `
      <a class="back" href="#/orders">${icon('left')}Orders</a>
      <div class="head"><div><h1>${esc(o.number)}</h1><p>${dateLong(o.created_at)}, from ${esc(SOURCE[o.source] || o.source)}. ${statusBadge(o)} ${payBadge(o)}</p></div>
        <div class="head__act"><button class="btn" type="button" data-print>${icon('print')}Packing slip</button><button class="btn" type="button" data-more>${icon('more')}More</button></div></div>
      <div class="order">
        <div class="stack">
          <section class="panel next" aria-live="polite"><p class="next__title">${ns.title}</p><p class="muted">${ns.text}</p><div class="next__act">${ns.acts.map((a) => `<button class="btn ${a[2] ? 'btn--' + a[2] : ''}" type="button" data-act="${a[0]}">${a[1]}</button>`).join('')}</div></section>
          <section class="panel" aria-labelledby="it-t">
            <div class="panel__head"><h2 class="sub" id="it-t">${n} piece${n === 1 ? '' : 's'}</h2><span class="small muted">${esc(METHOD[o.payment_method] || o.payment_method)}</span></div>
            <div class="items">${o.items.map((it) => `<div class="item"><span class="pic">${itemArt(it)}</span><div><b>${esc(it.name)}</b><div class="small muted">${[it.length, it.shade].filter(Boolean).map(esc).join(', ')}${it.product_id && productById(it.product_id) ? ` <a class="linkbtn" href="#/products/${esc(it.product_id)}" style="font-size:13px">Product</a>` : ''}</div></div><div class="num" style="text-align:right">${it.qty} × ${money(it.price)}<br><b>${money(it.qty * it.price)}</b></div></div>`).join('') || '<div class="item"><span class="muted">No pieces listed.</span></div>'}</div>
            <div class="totals"><div><span>Subtotal</span><span class="num">${money(o.subtotal)}</span></div>${o.discount ? `<div><span>Discount ${esc(o.discount_code || '')}</span><span class="num">−${money(o.discount)}</span></div>` : ''}<div><span>Delivery</span><span class="num">${o.delivery_fee ? money(o.delivery_fee) : 'Free'}</span></div><div class="total"><span>Total</span><span class="num">${money(o.total)}</span></div></div>
          </section>
          <section class="panel"><div class="panel__head"><h2 class="sub">Private note</h2><span class="small muted" data-note-state>Only you can see this</span></div><div class="panel__body"><label class="visually-hidden" for="anote">Private note</label><textarea class="input" id="anote" data-note placeholder="Anything to remember: which bundle you set aside, when she’ll pick up">${esc(o.admin_note)}</textarea></div></section>
        </div>
        <div class="stack">
          <section class="panel"><div class="panel__head"><h2 class="sub">Customer</h2></div><div class="panel__body kv">
            <div><span class="k">Name</span><b>${esc(o.customer_name)}</b></div>
            ${o.phone ? `<div><span class="k">Phone</span><span>${esc(o.phone)}</span></div>` : ''}
            ${o.email ? `<div><span class="k">Email</span><span style="word-break:break-all">${esc(o.email)}</span></div>` : ''}
            <div class="contact-btns">${o.phone ? `<a class="btn btn--sm" href="${waLink(o.phone)}" target="_blank" rel="noopener">${icon('wa')}WhatsApp</a><a class="btn btn--sm" href="tel:${esc(o.phone.replace(/[^\d+]/g, ''))}">${icon('phone')}Call</a>` : ''}${o.email ? `<a class="btn btn--sm" href="mailto:${esc(o.email)}?subject=${encodeURIComponent('Your Baddie Strands order ' + o.number)}">${icon('mail')}Email</a>` : ''}</div>
          </div></section>
          <section class="panel"><div class="panel__head"><h2 class="sub">Delivery</h2><button class="btn btn--sm btn--ghost" type="button" data-copy-addr>${icon('copy')}Copy</button></div><div class="panel__body kv">
            <div><span class="k">Address</span><span>${esc([o.address, o.city, o.state, o.country !== 'Nigeria' ? o.country : ''].filter(Boolean).join(', ')) || '<span class="muted">No address given</span>'}</span></div>
            ${o.note ? `<div><span class="k">Customer’s note</span><span>${esc(o.note)}</span></div>` : ''}
            ${o.tracking ? `<div><span class="k">Courier or tracking</span><span>${esc(o.tracking)}</span></div>` : ''}
          </div></section>
          <section class="panel"><div class="panel__head"><h2 class="sub">What happened</h2></div><div class="panel__body"><ol class="timeline">${(o.history || []).slice().reverse().map((h) => `<li>${esc(h.text)}<small>${dateLong(h.at)}</small></li>`).join('') || `<li>Order placed<small>${dateLong(o.created_at)}</small></li>`}</ol></div></section>
        </div>
      </div>`;

    async function update(patch, msg, undo) {
      const before = { status: o.status, payment_status: o.payment_status, tracking: o.tracking, history: o.history };
      const hist = (o.history || []).slice();
      ['payment_status', 'status'].forEach((k) => { if (patch[k] && patch[k] !== o[k]) hist.push({ at: new Date().toISOString(), text: HISTORY[patch[k]] }); });
      const saved = await DB.updateOrder(o.id, Object.assign({}, patch, { history: hist }));
      Object.assign(o, saved || patch);
      if (patch.status && (patch.status === 'cancelled' || before.status === 'cancelled')) await reload('products');
      paintCounts();
      toast(msg, undo ? { action: 'Undo', onAction: async () => { try { const back = await DB.updateOrder(o.id, before); Object.assign(o, back || before); if (patch.status === 'cancelled' || before.status === 'cancelled') await reload('products'); paintCounts(); if (path() === '/orders/' + o.number) viewOrder(o.number); } catch (e) { oops(e); } } } : {});
      if (path() === '/orders/' + o.number) viewOrder(o.number);
    }
    $('.next__act', view).addEventListener('click', async (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const a = b.dataset.act;
      try {
        if (a === 'paid') await busy(b, () => update({ payment_status: 'paid' }, `${o.number} marked as paid.`, true));
        else if (a === 'notfound') {
          const ok = await confirmBox('Mark as not paid?', 'If the payment isn’t in Paystack, the order goes back to “Not paid”. Message the customer to ask her to try again or pay by transfer.', 'Mark as not paid');
          if (ok) await update({ payment_status: 'unpaid' }, `${o.number} marked as not paid.`, true);
        }
        else if (a === 'paystack') window.open('https://dashboard.paystack.com/#/transactions', '_blank', 'noopener');
        else if (a === 'restore') await busy(b, () => update({ status: 'new' }, `${o.number} restored.`, true));
        else if (a === 'shipped') {
          const r = await dialog({
            title: 'Mark as sent', body: `<label class="field"><span>Courier or tracking number (optional)</span><input class="input" name="tracking" value="${esc(o.tracking)}" placeholder="GIG Logistics, 4821 9930"><small>She’ll see this on her tracking page.</small></label>`,
            foot: '<button class="btn" type="button" data-x>Cancel</button><button class="btn btn--pink" type="button" data-ok>Mark as sent</button>',
            onOpen: ({ el, close }) => { $('[data-ok]', el).addEventListener('click', () => close({ tracking: $('[name=tracking]', el).value.trim() })); $('[name=tracking]', el).addEventListener('keydown', (ev) => { if (ev.key === 'Enter') close({ tracking: ev.target.value.trim() }); }); }
          });
          if (r) { await update({ status: 'shipped', tracking: r.tracking }, `${o.number} marked as sent.`, true); if (o.phone) toast(`${o.number} marked as sent.`, { action: 'Send her the tracking link', onAction: () => window.open(waLink(o.phone, TEMPLATES.shipped(o)), '_blank', 'noopener'), long: true }); }
        }
        else if (STATUS[a]) await busy(b, () => update({ status: a }, `${o.number}: ${STATUS[a].toLowerCase()}.`, true));
        else if (a.startsWith('wa-')) window.open(waLink(o.phone, TEMPLATES[a.slice(3)](o)), '_blank', 'noopener');
      } catch (err) { oops(err); }
    });
    // private note saves itself
    let nt = 0;
    $('[data-note]', view).addEventListener('input', (e) => {
      clearTimeout(nt);
      $('[data-note-state]', view).textContent = 'Saving…';
      nt = setTimeout(async () => { try { await DB.updateOrder(o.id, { admin_note: e.target.value }); o.admin_note = e.target.value; $('[data-note-state]', view).textContent = 'Saved'; } catch (err) { $('[data-note-state]', view).textContent = 'Not saved'; oops(err); } }, 700);
    });
    $('[data-copy-addr]', view).addEventListener('click', async () => {
      const text = `${o.customer_name}\n${o.phone}\n${[o.address, o.city, o.state].filter(Boolean).join(', ')}`;
      try { await navigator.clipboard.writeText(text); toast('Address copied. Paste it to your rider.'); } catch (e) { toast('Copy didn’t work here. Select the address and copy it.'); }
    });
    $('[data-print]', view).addEventListener('click', () => printSlip(o));
    $('[data-more]', view).addEventListener('click', () => orderMore(o, update));
  }

  async function orderMore(o, update) {
    const r = await dialog({
      title: `Change ${esc(o.number)}`,
      body: `<p class="muted">Use these if something needs correcting. Most days the main button on the order page is all you need.</p>
        <div class="fgrid"><label class="field"><span>Status</span><select class="input" name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="field"><span>Payment</span><select class="input" name="pay">${Object.entries(PAY).map(([k, v]) => `<option value="${k}" ${o.payment_status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="field full"><span>Courier or tracking</span><input class="input" name="tracking" value="${esc(o.tracking)}"></label></div>
        <p class="small muted">Cancelling puts the pieces back into stock.</p>`,
      foot: `<button class="btn btn--danger" type="button" data-del style="margin-right:auto">${icon('trash')}Delete order</button><button class="btn" type="button" data-x>Close</button><button class="btn btn--pink" type="button" data-ok>Save</button>`,
      onOpen: ({ el, close }) => {
        $('[data-ok]', el).addEventListener('click', () => close({ status: $('[name=status]', el).value, payment_status: $('[name=pay]', el).value, tracking: $('[name=tracking]', el).value.trim() }));
        $('[data-del]', el).addEventListener('click', () => close('delete'));
      }
    });
    if (!r) return;
    try {
      if (r === 'delete') {
        const ok = await confirmBox(`Delete ${o.number}?`, 'This removes the order for good, including from your sales figures. To keep a record, cancel it instead.', 'Delete for good', true);
        if (!ok) return;
        if (o.status !== 'cancelled') await DB.updateOrder(o.id, { status: 'cancelled' }); // return its stock first
        await DB.deleteOrder(o.id);
        D.orders = D.orders.filter((x) => x.id !== o.id);
        await reload('products');
        toast(`${o.number} deleted.`);
        go('/orders');
        return;
      }
      const patch = {};
      if (r.status !== o.status) patch.status = r.status;
      if (r.payment_status !== o.payment_status) patch.payment_status = r.payment_status;
      if (r.tracking !== o.tracking) patch.tracking = r.tracking;
      if (Object.keys(patch).length) await update(patch, `${o.number} updated.`, true);
    } catch (e) { oops(e); }
  }

  function printSlip(o) {
    const s = D.settings || { store: {} };
    $('#slip').innerHTML = `<h1>Baddie Strands</h1><p>${esc(s.store.phone_display || '')} · ${esc(s.store.email || '')} · @${esc(String(s.store.instagram || '').replace(/^@/, ''))}</p>
      <div class="cols"><div><b>Order ${esc(o.number)}</b><br>${dateLong(o.created_at)}<br>${esc(METHOD[o.payment_method] || '')}: ${esc(PAY[o.payment_status])}</div>
      <div><b>Deliver to</b><br>${esc(o.customer_name)}<br>${esc(o.phone)}<br>${esc([o.address, o.city, o.state].filter(Boolean).join(', '))}${o.note ? `<br><i>${esc(o.note)}</i>` : ''}</div></div>
      <table><thead><tr><th>Piece</th><th>Length</th><th>Shade</th><th>Qty</th><th>Packed</th></tr></thead><tbody>${o.items.map((i) => `<tr><td>${esc(i.name)}</td><td>${esc(i.length || '')}</td><td>${esc(i.shade || '')}</td><td>${i.qty}</td><td>☐</td></tr>`).join('')}</tbody></table>
      <p>Total ${money(o.total)}. Thank you for shopping with Baddie Strands.</p>`;
    window.print();
  }

  // a sale made on Instagram, WhatsApp or in person
  async function recordSale() {
    await need('products', 'settings');
    const P = D.products.slice();
    const line = () => `<div class="rowedit" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) 70px 120px 40px" data-line>
      <select class="input" name="p" aria-label="Product"><option value="">Choose a product</option>${P.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select>
      <select class="input" name="len" aria-label="Length"></select><select class="input" name="shade" aria-label="Shade"></select>
      <input class="input num" name="qty" type="number" min="1" max="99" value="1" aria-label="Quantity">
      <span class="money"><input class="input" name="price" inputmode="numeric" aria-label="Price each"></span>
      <button class="iconbtn" type="button" data-rm aria-label="Remove this line">${icon('trash')}</button></div>`;
    const r = await dialog({
      title: 'Record a sale', wide: true,
      body: `<p class="muted">For sales on Instagram, WhatsApp or in person. It counts in your sales and takes the pieces out of stock.</p>
        <div class="fgrid">
          <label class="field"><span>Customer’s name</span><input class="input" name="name" required></label>
          <label class="field"><span>Phone</span><input class="input" name="phone" type="tel"></label>
          <label class="field"><span>Email (optional)</span><input class="input" name="email" type="email"></label>
          <label class="field"><span>Where did she order?</span><select class="input" name="source"><option value="instagram">Instagram</option><option value="whatsapp">WhatsApp</option><option value="in person">In person</option><option value="other">Other</option></select></label>
        </div>
        <div class="field"><span class="label">What she bought</span><div class="rows" data-lines>${line()}</div><div><button class="btn btn--sm" type="button" data-add-line>${icon('plus')}Add another piece</button></div></div>
        <div class="fgrid3">
          <label class="field"><span>Delivery fee</span><span class="money"><input class="input" name="fee" inputmode="numeric" value="0"></span></label>
          <label class="field"><span>Paid by</span><select class="input" name="method"><option value="transfer">Bank transfer</option><option value="cash">Cash</option><option value="card">Card</option><option value="other">Other</option></select></label>
          <label class="field"><span>Payment</span><select class="input" name="pay"><option value="paid">Paid</option><option value="unpaid">Not paid yet</option></select></label>
          <label class="field full"><span>Delivery address (optional)</span><input class="input" name="address"></label>
        </div>
        <p class="strong" data-total></p><p class="err" data-err role="alert"></p>`,
      foot: '<button class="btn" type="button" data-x>Cancel</button><button class="btn btn--pink" type="button" data-ok>Save sale</button>',
      onOpen: ({ el, close }) => {
        const lines = $('[data-lines]', el);
        const fill = (row) => {
          const p = P.find((x) => x.id === $('[name=p]', row).value);
          $('[name=len]', row).innerHTML = p && p.lengths.length ? p.lengths.map((l) => `<option>${esc(l.length)}</option>`).join('') : '<option value="">No length</option>';
          $('[name=shade]', row).innerHTML = p && p.shades.length ? p.shades.map((s) => `<option>${esc(s.name)}</option>`).join('') : '<option value="">No shade</option>';
          $('[name=price]', row).value = p ? DB.priceFor(p, $('[name=len]', row).value || null) : '';
        };
        const total = () => {
          let t = 0;
          $$('[data-line]', el).forEach((row) => { t += (Number($('[name=price]', row).value.replace(/\D/g, '')) || 0) * (Number($('[name=qty]', row).value) || 0); });
          t += Number(el.querySelector('[name=fee]').value.replace(/\D/g, '')) || 0;
          $('[data-total]', el).textContent = `Total: ${money(t)}`;
        };
        el.addEventListener('change', (e) => { const row = e.target.closest('[data-line]'); if (row && e.target.name === 'p') fill(row); if (row && e.target.name === 'len') { const p = P.find((x) => x.id === $('[name=p]', row).value); if (p) $('[name=price]', row).value = DB.priceFor(p, e.target.value); } total(); });
        el.addEventListener('input', total);
        $('[data-add-line]', el).addEventListener('click', () => { lines.insertAdjacentHTML('beforeend', line()); });
        lines.addEventListener('click', (e) => { if (e.target.closest('[data-rm]') && $$('[data-line]', el).length > 1) { e.target.closest('[data-line]').remove(); total(); } });
        $('[data-ok]', el).addEventListener('click', () => {
          const f = (n) => el.querySelector(`[name=${n}]`).value.trim();
          const items = $$('[data-line]', el).map((row) => {
            const p = P.find((x) => x.id === $('[name=p]', row).value);
            if (!p) return null;
            return { product_id: p.id, name: p.name, length: $('[name=len]', row).value || null, shade: $('[name=shade]', row).value || null, qty: Math.max(1, Number($('[name=qty]', row).value) || 1), price: Number($('[name=price]', row).value.replace(/\D/g, '')) || 0, image: p.images[0] || '' };
          }).filter(Boolean);
          const err = $('[data-err]', el);
          if (f('name').length < 2) { err.textContent = 'Add the customer’s name.'; return; }
          if (!items.length) { err.textContent = 'Choose at least one product.'; return; }
          const sub = items.reduce((s, i) => s + i.price * i.qty, 0), fee = Number(f('fee').replace(/\D/g, '')) || 0;
          close({ customer_name: f('name'), phone: f('phone'), email: f('email').toLowerCase(), source: f('source'), items, subtotal: sub, delivery_fee: fee, total: sub + fee, payment_method: f('method'), payment_status: f('pay'), status: 'confirmed', address: f('address') });
        });
        total();
      }
    });
    if (!r) return;
    try {
      const o = await DB.addOrder(r);
      await reload('orders', 'products');
      toast(`Sale ${o.number} recorded.`);
      go('/orders/' + o.number);
    } catch (e) { oops(e); }
  }

  // ════════════════════════════════════════════════════════
  // PRODUCTS
  // ════════════════════════════════════════════════════════
  async function viewProducts() {
    await need('products');
    const st = { f: query().get('f') || 'all', q: '' };
    const F = [['all', 'All', () => true], ['on', 'On the shop', (p) => p.active], ['off', 'Hidden', (p) => !p.active], ['low', 'Running low', (p) => p.stock !== null && p.stock > 0 && p.stock <= 3], ['out', 'Sold out', (p) => p.stock === 0]];
    view.innerHTML = `
      <div class="head"><div><h1>Products</h1><p>What’s on the shop, at what price, and how many you have.</p></div>
        <div class="head__act">${SHOP ? `<a class="btn" href="${esc(SHOP)}/shop.html" target="_blank" rel="noopener">${icon('ext')}See the shop</a>` : ''}<a class="btn btn--pink" href="#/products/new">${icon('plus')}Add a product</a></div></div>
      <div class="tabs" role="tablist" aria-label="Show" data-tabs></div>
      <div class="bar"><label class="search"><span class="visually-hidden">Search products</span>${icon('search')}<input class="input" type="search" placeholder="Search products" data-q></label></div>
      <section class="panel"><div class="plist" data-list></div></section>`;
    const paint = () => {
      const words = st.q.toLowerCase().split(/\s+/).filter(Boolean);
      const base = D.products.filter((p) => words.every((w) => [p.name, TEXTURES[p.texture], CATS[p.category]].join(' ').toLowerCase().includes(w)));
      $('[data-tabs]', view).innerHTML = F.map(([id, name, fn]) => `<button type="button" role="tab" data-f="${id}" aria-selected="${st.f === id}">${name}<span>${base.filter(fn).length}</span></button>`).join('');
      const list = base.filter(F.find((x) => x[0] === st.f)[2]);
      $('[data-list]', view).innerHTML = list.length ? list.map((p) => {
        const [lo, hi] = DB.priceRange(p);
        return `<div class="prow" data-id="${esc(p.id)}">
          <a class="prow__pic" href="#/products/${esc(p.id)}" tabindex="-1" aria-hidden="true">${art(p)}</a>
          <div class="prow__main"><a class="prow__name" href="#/products/${esc(p.id)}">${esc(p.name)}</a><span class="small muted">${esc(CATS[p.category] || p.category)}, ${esc((TEXTURES[p.texture] || p.texture).toLowerCase())}</span></div>
          <div class="prow__price num"><b>${money(lo)}</b>${hi !== lo ? `<small class="muted"> to ${money(hi)}</small>` : ''}</div>
          <div class="prow__stock">${p.stock === null ? '<span class="small muted">Not counted</span>' : `<div class="stock" title="How many you have"><button type="button" data-s="-1" aria-label="One fewer ${esc(p.name)}">−</button><input type="number" min="0" value="${p.stock}" aria-label="Stock of ${esc(p.name)}" data-stock><button type="button" data-s="1" aria-label="One more ${esc(p.name)}">+</button></div>`}${p.stock === 0 ? ' ' + badge('out', 'Sold out') : p.stock !== null && p.stock <= 3 ? ' ' + badge('low', 'Low') : ''}</div>
          <label class="switch prow__show"><input type="checkbox" data-show ${p.active ? 'checked' : ''} aria-label="Show ${esc(p.name)} on the shop"><small>${p.active ? 'On the shop' : 'Hidden'}</small></label>
          <a class="iconbtn prow__more" href="#/products/${esc(p.id)}" aria-label="Edit ${esc(p.name)}">${icon('right')}</a>
        </div>`;
      }).join('') : `<div class="empty"><b>${D.products.length ? 'No products here.' : 'No products yet.'}</b><p>${D.products.length ? 'Try another filter.' : 'Add your first piece and it will appear on the shop straight away.'}</p>${D.products.length ? '' : '<a class="btn btn--pink" href="#/products/new">Add a product</a>'}</div>`;
    };
    $('[data-tabs]', view).addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) { st.f = b.dataset.f; paint(); } });
    $('[data-q]', view).addEventListener('input', (e) => { st.q = e.target.value.trim(); paint(); });
    const list = $('[data-list]', view);
    const timers = {};
    const saveStock = (row, val) => {
      const p = productById(row.dataset.id);
      val = Math.max(0, Math.round(Number(val) || 0));
      $('[data-stock]', row).value = val;
      clearTimeout(timers[p.id]);
      timers[p.id] = setTimeout(async () => {
        try { const saved = await DB.saveProduct(Object.assign({}, p, { stock: val })); Object.assign(p, saved); paintCounts(); toast(`${p.name}: ${val} in stock.`); }
        catch (e) { oops(e); }
      }, 700);
    };
    list.addEventListener('click', (e) => {
      const b = e.target.closest('[data-s]');
      if (b) { const row = b.closest('.prow'); saveStock(row, Number($('[data-stock]', row).value) + Number(b.dataset.s)); }
    });
    list.addEventListener('change', async (e) => {
      const row = e.target.closest('.prow');
      if (!row) return;
      if (e.target.matches('[data-stock]')) saveStock(row, e.target.value);
      if (e.target.matches('[data-show]')) {
        const p = productById(row.dataset.id), on = e.target.checked;
        try { const saved = await DB.saveProduct(Object.assign({}, p, { active: on })); Object.assign(p, saved); e.target.nextElementSibling.textContent = on ? 'On the shop' : 'Hidden'; toast(on ? `${p.name} is on the shop.` : `${p.name} is hidden from the shop.`); paint(); }
        catch (err) { e.target.checked = !on; oops(err); }
      }
    });
    paint();
  }

  async function viewProduct(id) {
    await need('products');
    const isNew = id === 'new';
    const orig = isNew ? null : productById(id);
    if (!isNew && !orig) { view.innerHTML = `<a class="back" href="#/products">${icon('left')}Products</a><div class="empty"><b>That product doesn’t exist any more.</b></div>`; return; }
    const p = JSON.parse(JSON.stringify(orig || { name: '', category: 'wigs', texture: 'straight', description: '', details: [], price: 0, compare_at: null, lengths: [], shades: [{ name: 'Natural black', hex: '#1a1008' }], images: [], stock: null, featured: false, is_new: true, active: true, sort: D.products.length }));
    let saved = JSON.stringify(p);
    const COMMON_LENGTHS = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 40];
    view.innerHTML = `
      <a class="back" href="#/products">${icon('left')}Products</a>
      <div class="head"><div><h1>${isNew ? 'Add a product' : esc(p.name)}</h1><p>${isNew ? 'Fill in what a customer needs to choose. You can change anything later.' : `Last changed ${when(p.updated_at)}.`}</p></div>
        <div class="head__act">${!isNew ? `${SHOP ? `<a class="btn" href="${esc(SHOP)}/product.html?p=${encodeURIComponent(p.slug)}" target="_blank" rel="noopener">${icon('ext')}See it on the shop</a>` : ''}<button class="btn" type="button" data-dup>Duplicate</button>` : ''}</div></div>
      <form class="editor" data-form novalidate>
        <div class="panel">
          <section class="sect"><div class="sect__head"><h2>Photos</h2><p>The first photo is the main one. Drag to reorder. Square or portrait photos look best.</p></div>
            <div class="photos" data-photos></div>
            <label class="drop" data-drop><input type="file" accept="image/*" multiple hidden data-file><b>Add photos</b><span class="small muted">Click to choose, or drop them here. They’re resized for you.</span></label>
            ${D.products.length && DB.mode === 'demo' ? '<p class="hint">Demo mode keeps photos in this browser only. Once the database is connected they’re stored online.</p>' : ''}
          </section>
          <section class="sect"><div class="sect__head"><h2>About it</h2></div>
            <label class="field"><span>Name</span><input class="input" name="name" value="${esc(p.name)}" required maxlength="120" placeholder="Deep Wave Frontal Wig"></label>
            <div class="field"><span class="label">Type</span><div class="choice" role="radiogroup" aria-label="Type">${Object.entries({ wigs: 'Wig', bundles: 'Bundles', closures: 'Closure or frontal', extensions: 'Extensions' }).map(([k, v]) => `<label><input type="radio" name="category" value="${k}" ${p.category === k ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div></div>
            <label class="field"><span>Texture</span><select class="input" name="texture">${Object.entries(TEXTURES).map(([k, v]) => `<option value="${k}" ${p.texture === k ? 'selected' : ''}>${v}</option>`).join('')}</select><small>Customers can filter the shop by texture.</small></label>
            <label class="field"><span>Description</span><textarea class="input" name="description" maxlength="2000" placeholder="What makes it special, in two or three sentences.">${esc(p.description)}</textarea></label>
            <label class="field"><span>What’s included (one per line)</span><textarea class="input" name="details" style="min-height:96px" placeholder="13×6 HD lace frontal&#10;200% density&#10;Pre-plucked hairline">${esc(p.details.join('\n'))}</textarea></label>
          </section>
          <section class="sect"><div class="sect__head"><h2>Price</h2></div>
            <div class="fgrid"><label class="field"><span>Price</span><span class="money"><input class="input" name="price" inputmode="numeric" value="${p.price || ''}" placeholder="85000"></span></label>
            <label class="field"><span>Was (optional)</span><span class="money"><input class="input" name="compare_at" inputmode="numeric" value="${p.compare_at || ''}" placeholder="110000"></span><small>Shows it on sale, with this price crossed out.</small></label></div>
          </section>
          <section class="sect"><div class="sect__head"><h2>Lengths</h2><p>Tap the lengths you sell. If a length costs more, put its price beside it.</p></div>
            <div class="choice" data-len-chips>${COMMON_LENGTHS.map((n) => `<label><input type="checkbox" value='${n}"' ${p.lengths.some((l) => l.length === n + '"') ? 'checked' : ''}><span>${n}″</span></label>`).join('')}</div>
            <div class="rows" data-len-rows></div>
          </section>
          <section class="sect"><div class="sect__head"><h2>Shades</h2><p>The first shade shows by default. Tap a colour to fine-tune it.</p></div>
            <div class="rows" data-shades></div>
            <div><p class="hint" style="margin-bottom:8px">Quick add:</p><div class="presets" data-presets>${SHADE_PRESETS.map(([n, h]) => `<button type="button" data-preset="${esc(n)}|${h}"><i style="--c:${h}"></i>${esc(n)}</button>`).join('')}</div></div>
            <div><button class="btn btn--sm" type="button" data-add-shade>${icon('plus')}Add your own shade</button></div>
          </section>
          <section class="sect"><div class="sect__head"><h2>Stock</h2></div>
            <label class="switch"><input type="checkbox" name="track" ${p.stock !== null ? 'checked' : ''}><span><b>Count how many I have</b><small>When it reaches 0 the shop shows “Sold out” and stops selling it.</small></span></label>
            <label class="field" data-stock-field style="max-width:200px"><span>How many</span><input class="input num" name="stock" type="number" min="0" value="${p.stock === null ? '' : p.stock}"></label>
          </section>
          <section class="sect"><div class="sect__head"><h2>On the shop</h2></div>
            <label class="switch"><input type="checkbox" name="active" ${p.active ? 'checked' : ''}><span><b>Show on the shop</b><small>Turn off to hide it without deleting it.</small></span></label>
            <label class="switch"><input type="checkbox" name="featured" ${p.featured ? 'checked' : ''}><span><b>Bestseller</b><small>Shows on the home page and first in the shop.</small></span></label>
            <label class="switch"><input type="checkbox" name="is_new" ${p.is_new ? 'checked' : ''}><span><b>New in</b><small>Adds a “New” label and shows it under “Just in”.</small></span></label>
          </section>
          <div class="savebar"><span class="savebar__state" data-state></span>${!isNew ? `<button class="btn btn--danger" type="button" data-del>${icon('trash')}Delete</button>` : ''}<button class="btn btn--pink btn--lg" type="submit" data-save>${isNew ? 'Add product' : 'Save changes'}</button></div>
        </div>
        <aside class="editor__side"><div class="panel"><div class="panel__head"><h2 class="sub">How it looks on the shop</h2></div><div class="preview" data-preview></div></div>
          <div class="panel"><div class="panel__body small muted" data-tips></div></div></aside>
      </form>`;
    const form = $('[data-form]', view);
    const num = (v) => { const n = Number(String(v || '').replace(/[^\d]/g, '')); return n || 0; };

    // read the form into p
    function read() {
      const f = form.elements;
      p.name = f.name.value.trim();
      p.category = (form.querySelector('[name=category]:checked') || {}).value || 'wigs';
      p.texture = f.texture.value;
      p.description = f.description.value.trim();
      p.details = f.details.value.split('\n').map((s) => s.trim()).filter(Boolean);
      p.price = num(f.price.value);
      p.compare_at = num(f.compare_at.value) || null;
      p.stock = f.track.checked ? num(f.stock.value) : null;
      p.active = f.active.checked; p.featured = f.featured.checked; p.is_new = f.is_new.checked;
      $$('[data-len-row]', view).forEach((row) => { const l = p.lengths.find((x) => x.length === row.dataset.lenRow); if (l) { const v = num($('input', row).value); l.price = v && v !== p.price ? v : null; } });
      $$('[data-shade-row]', view).forEach((row, i) => { if (p.shades[i]) { p.shades[i].name = $('[data-sname]', row).value.trim(); p.shades[i].hex = $('[data-shex]', row).value; } });
    }
    function paintLengths() {
      p.lengths.sort((a, b) => parseFloat(a.length) - parseFloat(b.length));
      $('[data-len-rows]', view).innerHTML = p.lengths.length ? `<div class="hint">Price for each length (leave empty to use ${p.price ? money(p.price) : 'the main price'}):</div>` + p.lengths.map((l) => `<div class="rowedit rowedit--len" data-len-row="${esc(l.length)}"><b>${esc(l.length.replace('"', '″'))}</b><span class="money"><input class="input" inputmode="numeric" value="${l.price || ''}" placeholder="Same as main price" aria-label="Price for ${esc(l.length)}"></span><button class="iconbtn" type="button" data-len-rm="${esc(l.length)}" aria-label="Remove ${esc(l.length)}">${icon('trash')}</button></div>`).join('') : '<p class="hint">No lengths chosen. Fine for things like closures sold in one size.</p>';
    }
    function paintShades() {
      $('[data-shades]', view).innerHTML = p.shades.map((s, i) => `<div class="rowedit rowedit--shade" data-shade-row><input type="color" data-shex value="${esc(/^#[0-9a-f]{6}$/i.test(s.hex) ? s.hex : '#1a1008')}" aria-label="Colour of shade ${i + 1}"><input class="input" data-sname value="${esc(s.name)}" placeholder="Shade name" aria-label="Name of shade ${i + 1}"><button class="iconbtn" type="button" data-shade-rm="${i}" aria-label="Remove ${esc(s.name || 'this shade')}">${icon('trash')}</button></div>`).join('') || '<p class="hint">No shades. Add at least one so customers can choose.</p>';
    }
    function paintPhotos() {
      $('[data-photos]', view).innerHTML = p.images.map((src, i) => `<div class="photo" draggable="true" data-ph="${i}"><img src="${esc(src)}" alt="Photo ${i + 1}">${i === 0 ? '<span class="photo__main">Main</span>' : ''}<span class="photo__tools">${i ? `<button type="button" data-ph-main="${i}" aria-label="Make photo ${i + 1} the main photo" title="Make main">${icon('up')}</button>` : ''}<button type="button" data-ph-rm="${i}" aria-label="Remove photo ${i + 1}" title="Remove">${icon('trash')}</button></span></div>`).join('');
    }
    function preview() {
      const [lo, hi] = DB.priceRange(p);
      const img = p.images[0] ? `<img src="${esc(p.images[0])}" alt="">` : art(p);
      $('[data-preview]', view).innerHTML = `<span class="pic">${img}</span><div style="display:flex;gap:6px;flex-wrap:wrap">${!p.active ? badge('off', 'Hidden') : ''}${p.stock === 0 ? badge('out', 'Sold out') : p.compare_at && p.compare_at > lo ? badge('new', 'Sale') : ''}${p.is_new ? badge('confirmed', 'New') : ''}</div><b>${esc(p.name || 'Product name')}</b><span class="num">${lo !== hi ? 'From ' : ''}${money(lo)}${p.compare_at && p.compare_at > lo ? ` <s class="muted">${money(p.compare_at)}</s>` : ''}</span><span class="small muted">${esc(TEXTURES[p.texture] || '')}${p.lengths.length ? `, ${p.lengths.length} length${p.lengths.length === 1 ? '' : 's'}` : ''}${p.shades.length ? `, ${p.shades.length} shade${p.shades.length === 1 ? '' : 's'}` : ''}</span>`;
      const tips = [];
      if (!p.images.length) tips.push('Add a photo. Until you do, the shop shows a drawing of the texture in the first shade.');
      if (!p.description) tips.push('A short description helps customers decide.');
      if (!p.lengths.length && p.category !== 'closures') tips.push('Most hair is sold in lengths. Tap the ones you sell.');
      if (p.compare_at && p.compare_at <= p.price) tips.push('The “Was” price should be higher than the price.');
      $('[data-tips]', view).innerHTML = tips.length ? tips.map((t) => `<p>${esc(t)}</p>`).join('<br>') : '<p>Looks good. Save when you’re ready.</p>';
      $('[data-stock-field]', view).hidden = !form.elements.track.checked;
      const dirty = JSON.stringify(p) !== saved;
      const stt = $('[data-state]', view);
      stt.textContent = dirty ? 'Not saved yet' : isNew ? '' : 'All changes saved';
      stt.classList.toggle('is-dirty', dirty);
    }
    const refresh = () => { read(); preview(); };
    form.addEventListener('input', refresh);
    form.addEventListener('change', (e) => {
      if (e.target.closest('[data-len-chips]')) {
        read();
        const v = e.target.value;
        if (e.target.checked) { if (!p.lengths.some((l) => l.length === v)) p.lengths.push({ length: v, price: null }); }
        else p.lengths = p.lengths.filter((l) => l.length !== v);
        paintLengths();
      }
      refresh();
    });
    view.addEventListener('click', (e) => {
      const lr = e.target.closest('[data-len-rm]'), sr = e.target.closest('[data-shade-rm]'), pr = e.target.closest('[data-preset]');
      if (lr) { read(); p.lengths = p.lengths.filter((l) => l.length !== lr.dataset.lenRm); const cb = $(`[data-len-chips] input[value='${lr.dataset.lenRm}']`, view); if (cb) cb.checked = false; paintLengths(); refresh(); }
      if (sr) { read(); p.shades.splice(Number(sr.dataset.shadeRm), 1); paintShades(); refresh(); }
      if (pr) { read(); const [n, h] = pr.dataset.preset.split('|'); if (!p.shades.some((s) => s.name === n)) p.shades.push({ name: n, hex: h }); paintShades(); refresh(); }
      if (e.target.closest('[data-add-shade]')) { read(); p.shades.push({ name: '', hex: '#3d2b1f' }); paintShades(); refresh(); $$('[data-sname]', view).pop().focus(); }
      const pm = e.target.closest('[data-ph-main]'), prm = e.target.closest('[data-ph-rm]');
      if (pm) { const i = Number(pm.dataset.phMain); p.images.unshift(p.images.splice(i, 1)[0]); paintPhotos(); refresh(); }
      if (prm) { p.images.splice(Number(prm.dataset.phRm), 1); paintPhotos(); refresh(); }
    });
    // photo upload
    const drop = $('[data-drop]', view), file = $('[data-file]', view);
    async function upload(files) {
      const list = Array.from(files).filter((f) => /^image\//.test(f.type));
      if (!list.length) { toast('Choose photos: JPG, PNG or WebP.', { bad: true }); return; }
      const box = $('[data-photos]', view);
      for (const f of list) {
        const ph = document.createElement('div'); ph.className = 'photo is-loading'; ph.textContent = 'Uploading…';
        box.appendChild(ph);
        try { const url = await DB.uploadPhoto(f); read(); p.images.push(url); }
        catch (e) { oops(e); }
        ph.remove(); paintPhotos(); refresh();
      }
    }
    file.addEventListener('change', () => { upload(file.files); file.value = ''; });
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) { e.preventDefault(); drop.classList.add('is-over'); } }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('is-over')));
    drop.addEventListener('drop', (e) => { e.preventDefault(); upload(e.dataTransfer.files); });
    // drag photos to reorder
    let dragI = null;
    const photos = $('[data-photos]', view);
    photos.addEventListener('dragstart', (e) => { const ph = e.target.closest('[data-ph]'); if (!ph) return; dragI = Number(ph.dataset.ph); ph.classList.add('is-drag'); e.dataTransfer.effectAllowed = 'move'; });
    photos.addEventListener('dragover', (e) => { const ph = e.target.closest('[data-ph]'); if (dragI === null || !ph) return; e.preventDefault(); $$('.is-target', photos).forEach((x) => x.classList.remove('is-target')); ph.classList.add('is-target'); });
    photos.addEventListener('drop', (e) => { const ph = e.target.closest('[data-ph]'); if (dragI === null || !ph) return; e.preventDefault(); const to = Number(ph.dataset.ph); p.images.splice(to, 0, p.images.splice(dragI, 1)[0]); dragI = null; paintPhotos(); refresh(); });
    photos.addEventListener('dragend', () => { dragI = null; $$('.is-drag,.is-target', photos).forEach((x) => x.classList.remove('is-drag', 'is-target')); });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      read();
      const f = form.elements;
      $$('[aria-invalid]', form).forEach((x) => x.removeAttribute('aria-invalid'));
      const bad = !p.name ? [f.name, 'Give the product a name.'] : !p.price ? [f.price, 'Add a price.'] : p.shades.some((s) => !s.name) ? [$$('[data-sname]', view).find((x) => !x.value.trim()), 'Give every shade a name, or remove the empty one.'] : null;
      if (bad) { bad[0].setAttribute('aria-invalid', 'true'); bad[0].focus(); toast(bad[1], { bad: true }); return; }
      try {
        const out = await busy($('[data-save]', view), () => DB.saveProduct(p));
        if (isNew) D.products.push(out); else Object.assign(orig, out);
        Object.assign(p, out);
        saved = JSON.stringify(p);
        paintCounts();
        toast(isNew ? `${out.name} added to the shop.` : 'Changes saved. The shop shows them now.');
        if (isNew) go('/products/' + out.id); else { preview(); $('h1', view).textContent = out.name; }
      } catch (err) { oops(err); }
    });
    const del = $('[data-del]', view);
    if (del) del.addEventListener('click', async () => {
      const ok = await confirmBox(`Delete ${p.name}?`, 'It disappears from the shop. Orders that included it keep their details. To take it off the shop for a while instead, turn off “Show on the shop”.', 'Delete product', true);
      if (!ok) return;
      try { await DB.deleteProduct(p.id); D.products = D.products.filter((x) => x.id !== p.id); guard = null; toast(`${p.name} deleted.`); go('/products'); } catch (e) { oops(e); }
    });
    const dup = $('[data-dup]', view);
    if (dup) dup.addEventListener('click', async () => {
      try {
        const copy = JSON.parse(JSON.stringify(orig));
        delete copy.id; delete copy.slug; delete copy.created_at; delete copy.updated_at;
        copy.name = orig.name + ' (copy)'; copy.active = false;
        const out = await DB.saveProduct(copy);
        D.products.push(out);
        toast('Copy made. It’s hidden until you turn it on.');
        go('/products/' + out.id);
      } catch (e) { oops(e); }
    });
    guard = () => JSON.stringify(p) !== saved;
    paintLengths(); paintShades(); paintPhotos(); preview();
  }

  // ════════════════════════════════════════════════════════
  // CUSTOMERS
  // ════════════════════════════════════════════════════════
  async function viewCustomers() {
    await need('orders', 'subscribers');
    const map = new Map();
    D.orders.forEach((o) => {
      const k = (o.email || o.phone || o.customer_name).toLowerCase();
      const c = map.get(k) || { key: k, name: o.customer_name, email: o.email, phone: o.phone, state: o.state, orders: [], spent: 0, last: o.created_at, firstAt: o.created_at };
      c.orders.push(o);
      if (o.status !== 'cancelled' && o.payment_status === 'paid') c.spent += o.total;
      if (o.created_at > c.last) { c.last = o.created_at; c.name = o.customer_name; c.phone = o.phone || c.phone; }
      if (o.created_at < c.firstAt) c.firstAt = o.created_at;
      map.set(k, c);
    });
    const all = Array.from(map.values());
    const st = { tab: query().get('tab') || 'buyers', q: '', sort: 'recent' };
    view.innerHTML = `
      <div class="head"><div><h1>Customers</h1><p>Everyone who has ordered, and everyone on your newsletter list.</p></div><div class="head__act"><button class="btn" type="button" data-csv>${icon('down')}Download</button></div></div>
      <div class="tabs" role="tablist"><button type="button" role="tab" data-tab="buyers">Customers<span>${all.length}</span></button><button type="button" role="tab" data-tab="news">Newsletter<span>${D.subscribers.length}</span></button></div>
      <div data-body></div>`;
    const paint = () => {
      $$('[data-tab]', view).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === st.tab)));
      const body = $('[data-body]', view);
      if (st.tab === 'news') {
        body.innerHTML = `<p class="muted" style="margin-bottom:12px">People who joined from the shop’s footer. Download the list to email them from Gmail, Mailchimp or similar.</p><section class="panel">${D.subscribers.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Email</th><th>Joined</th><th></th></tr></thead><tbody>${D.subscribers.map((s) => `<tr><td>${esc(s.email)}</td><td>${when(s.created_at)}</td><td class="r"><button class="btn btn--sm btn--ghost" type="button" data-unsub="${esc(s.email)}">Remove</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty"><b>No one yet.</b><p>Sign-ups from the shop footer land here.</p></div>'}</section>`;
        return;
      }
      const words = st.q.toLowerCase().split(/\s+/).filter(Boolean);
      const list = all.filter((c) => words.every((w) => [c.name, c.email, c.phone, c.state].join(' ').toLowerCase().includes(w)))
        .sort((a, b) => st.sort === 'spent' ? b.spent - a.spent : st.sort === 'orders' ? b.orders.length - a.orders.length : (a.last < b.last ? 1 : -1));
      body.innerHTML = `<div class="bar"><label class="search"><span class="visually-hidden">Search customers</span>${icon('search')}<input class="input" type="search" placeholder="Name, email, phone or state" data-q value="${esc(st.q)}"></label>
        <select class="input" style="width:auto" data-sort aria-label="Sort"><option value="recent">Most recent</option><option value="spent">Spent the most</option><option value="orders">Most orders</option></select></div>
        <section class="panel">${list.length ? `<div class="table-wrap"><table class="table table--cards"><thead><tr><th>Customer</th><th>Contact</th><th class="r">Orders</th><th class="r">Spent</th><th>Last order</th></tr></thead><tbody>${list.map((c) => `<tr data-c="${esc(c.key)}" tabindex="0" data-href="x"><td><b>${esc(c.name)}</b><small>${esc(c.state || '')}</small></td><td data-m="hide">${esc(c.phone || '')}<small>${esc(c.email && !/no-email\.local$/.test(c.email) ? c.email : '')}</small></td><td class="r num">${c.orders.length}</td><td class="r num"><b>${money(c.spent)}</b></td><td>${when(c.last)}${c.orders.length > 1 ? ' ' + badge('confirmed', 'Returning') : ''}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty"><b>No customers found.</b></div>'}</section>`;
      $('[data-sort]', body).value = st.sort;
      const qi = $('[data-q]', body);
      qi.addEventListener('input', () => { st.q = qi.value; const pos = qi.selectionStart; paint(); const n = $('[data-q]', view); n.focus(); n.setSelectionRange(pos, pos); });
      $('[data-sort]', body).addEventListener('change', (e) => { st.sort = e.target.value; paint(); });
    };
    view.addEventListener('click', async (e) => {
      const t = e.target.closest('[data-tab]'); if (t) { st.tab = t.dataset.tab; paint(); return; }
      const u = e.target.closest('[data-unsub]');
      if (u) {
        if (!(await confirmBox('Remove from the newsletter?', `${esc(u.dataset.unsub)} won’t be on the list any more.`, 'Remove'))) return;
        try { await DB.deleteSubscriber(u.dataset.unsub); D.subscribers = D.subscribers.filter((s) => s.email !== u.dataset.unsub); paint(); toast('Removed from the newsletter.'); } catch (err) { oops(err); }
        return;
      }
      const row = e.target.closest('[data-c]');
      if (row) customer(map.get(row.dataset.c));
    });
    view.addEventListener('keydown', (e) => { const row = e.target.closest('[data-c]'); if (row && e.key === 'Enter') customer(map.get(row.dataset.c)); });
    $('[data-csv]', view).addEventListener('click', () => {
      if (st.tab === 'news') csv('newsletter', [['Email', 'Joined']].concat(D.subscribers.map((s) => [s.email, s.created_at.slice(0, 10)])));
      else csv('customers', [['Name', 'Email', 'Phone', 'State', 'Orders', 'Spent (paid)', 'First order', 'Last order']].concat(all.map((c) => [c.name, c.email, c.phone, c.state, c.orders.length, c.spent, c.firstAt.slice(0, 10), c.last.slice(0, 10)])));
    });
    paint();
  }
  function customer(c) {
    if (!c) return;
    dialog({
      title: esc(c.name), wide: true,
      body: `<div class="tiles" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="tile"><span class="tile__label">Orders</span><span class="tile__value">${c.orders.length}</span></div><div class="tile"><span class="tile__label">Spent</span><span class="tile__value">${money(c.spent)}</span></div><div class="tile"><span class="tile__label">Customer since</span><span class="tile__value" style="font-size:18px">${new Date(c.firstAt).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}</span></div></div>
        <div class="contact-btns">${c.phone ? `<a class="btn btn--sm" href="${waLink(c.phone)}" target="_blank" rel="noopener">${icon('wa')}WhatsApp</a><a class="btn btn--sm" href="tel:${esc(String(c.phone).replace(/[^\d+]/g, ''))}">${icon('phone')}Call</a>` : ''}${c.email && !/no-email\.local$/.test(c.email) ? `<a class="btn btn--sm" href="mailto:${esc(c.email)}">${icon('mail')}Email</a>` : ''}</div>
        <div class="panel">${orderTable(c.orders.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1)), true)}</div>`,
      onOpen: ({ el, close }) => el.addEventListener('click', (e) => { const tr = e.target.closest('tr[data-href]'); if (tr) { close(); location.hash = tr.dataset.href; } })
    });
  }

  // ════════════════════════════════════════════════════════
  // MESSAGES
  // ════════════════════════════════════════════════════════
  async function viewMessages() {
    await need('messages');
    let tab = 'open';
    view.innerHTML = `<div class="head"><div><h1>Messages</h1><p>From the contact form on the shop. Reply on WhatsApp or by email, then mark it done.</p></div></div>
      <div class="tabs" role="tablist" data-tabs></div><section class="panel" data-list></section>`;
    const paint = () => {
      const open = D.messages.filter((m) => !m.done), done = D.messages.filter((m) => m.done);
      $('[data-tabs]', view).innerHTML = `<button type="button" role="tab" data-t="open" aria-selected="${tab === 'open'}">To reply<span>${open.length}</span></button><button type="button" role="tab" data-t="done" aria-selected="${tab === 'done'}">Done<span>${done.length}</span></button>`;
      const list = tab === 'open' ? open : done;
      $('[data-list]', view).innerHTML = list.length ? list.map((m) => `<article class="msg${m.done ? ' is-done' : ''}" data-id="${esc(m.id)}"><span class="msg__dot" aria-hidden="true"></span><div><p><span class="msg__who">${esc(m.name)}</span> <span class="small muted">${when(m.created_at)}</span></p><p class="msg__body">${esc(m.body)}</p>
        <div class="contact-btns">${m.phone ? `<a class="btn btn--sm" href="${waLink(m.phone, `Hi ${first(m.name)}! Thanks for your message to Baddie Strands. `)}" target="_blank" rel="noopener">${icon('wa')}Reply on WhatsApp</a>` : ''}${m.email ? `<a class="btn btn--sm" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: your message to Baddie Strands')}&body=${encodeURIComponent(`Hi ${first(m.name)},\n\n`)}">${icon('mail')}Reply by email</a>` : ''}
        <button class="btn btn--sm ${m.done ? '' : 'btn--black'}" type="button" data-done>${m.done ? 'Move back to “To reply”' : `${icon('check')}Mark as done`}</button><button class="btn btn--sm btn--ghost" type="button" data-del>${icon('trash')}Delete</button></div>
        <p class="small muted" style="margin-top:8px">${[m.phone, m.email].filter(Boolean).map(esc).join(' · ')}</p></div><span></span></article>`).join('')
        : `<div class="empty"><b>${tab === 'open' ? 'Nothing to reply to.' : 'Nothing here yet.'}</b><p>${tab === 'open' ? 'New messages from the contact page appear here.' : 'Messages you mark as done move here.'}</p></div>`;
    };
    view.addEventListener('click', async (e) => {
      const t = e.target.closest('[data-t]'); if (t) { tab = t.dataset.t; paint(); return; }
      const art = e.target.closest('.msg'); if (!art) return;
      const m = D.messages.find((x) => x.id === art.dataset.id);
      if (e.target.closest('[data-done]')) {
        try { await DB.updateMessage(m.id, { done: !m.done }); m.done = !m.done; paintCounts(); paint(); toast(m.done ? 'Marked as done.' : 'Moved back to “To reply”.', { action: 'Undo', onAction: async () => { await DB.updateMessage(m.id, { done: !m.done }); m.done = !m.done; paintCounts(); paint(); } }); } catch (err) { oops(err); }
      }
      if (e.target.closest('[data-del]')) {
        if (!(await confirmBox('Delete this message?', 'It’s removed for good.', 'Delete', true))) return;
        try { await DB.deleteMessage(m.id); D.messages = D.messages.filter((x) => x.id !== m.id); paintCounts(); paint(); toast('Message deleted.'); } catch (err) { oops(err); }
      }
    });
    paint();
  }

  // ════════════════════════════════════════════════════════
  // DISCOUNT CODES
  // ════════════════════════════════════════════════════════
  const discountState = (d) => {
    if (!d.active) return ['off', 'Off'];
    if (d.expires_on && d.expires_on < today()) return ['off', 'Ended'];
    if (d.max_uses && d.uses >= d.max_uses) return ['off', 'Used up'];
    return ['on', 'Working'];
  };
  const discountSentence = (d) => {
    const v = d.kind === 'percent' ? `${d.value || 0}% off` : `${money(d.value || 0)} off`;
    const bits = [`${v} the order`];
    if (d.min_spend) bits.push(`when they spend ${money(d.min_spend)} or more`);
    let s = bits.join(' ') + '.';
    if (d.max_uses) s += ` Can be used ${d.max_uses} time${d.max_uses === 1 ? '' : 's'} in total.`;
    if (d.expires_on) s += ` Works until the end of ${new Date(d.expires_on + 'T12:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}.`;
    return s;
  };
  async function viewDiscounts() {
    await need('discounts');
    view.innerHTML = `<div class="head"><div><h1>Discount codes</h1><p>Codes customers type at checkout. Share them on Instagram, WhatsApp status or with your regulars.</p></div><div class="head__act"><button class="btn btn--pink" type="button" data-new>${icon('plus')}Make a code</button></div></div><section class="panel" data-list></section>`;
    const paint = () => {
      $('[data-list]', view).innerHTML = D.discounts.length ? `<div class="table-wrap"><table class="table table--cards"><thead><tr><th>Code</th><th>What it does</th><th class="r">Used</th><th>Status</th><th><span class="visually-hidden">Edit</span></th></tr></thead><tbody>${D.discounts.map((d) => { const s = discountState(d); return `<tr><td><b style="font-size:16px;letter-spacing:.02em">${esc(d.code)}</b></td><td data-m="hide" style="max-width:420px">${esc(discountSentence(d))}</td><td class="r num">${d.uses}${d.max_uses ? ' of ' + d.max_uses : ''}</td><td>${badge(s[0], s[1])}</td><td class="r"><button class="btn btn--sm" type="button" data-edit="${esc(d.code)}">Edit</button></td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty"><b>No codes yet.</b><p>Make one for a sale, a birthday, or your best customers.</p></div>';
    };
    view.addEventListener('click', (e) => {
      if (e.target.closest('[data-new]')) editDiscount(null, paint);
      const ed = e.target.closest('[data-edit]'); if (ed) editDiscount(D.discounts.find((d) => d.code === ed.dataset.edit), paint);
    });
    paint();
  }
  async function editDiscount(d, after) {
    const isNew = !d;
    const x = Object.assign({ code: '', kind: 'percent', value: 10, min_spend: 0, max_uses: null, expires_on: null, active: true, uses: 0 }, d || {});
    const gen = () => ['QUEEN', 'BADDIE', 'CROWN', 'GLOW', 'SLAY'][Math.floor(Math.random() * 5)] + Math.floor(10 + Math.random() * 89);
    const r = await dialog({
      title: isNew ? 'Make a discount code' : `Edit ${esc(x.code)}`,
      body: `<div class="fgrid">
          <label class="field full"><span>Code</span><div style="display:flex;gap:8px"><input class="input" name="code" value="${esc(x.code)}" ${isNew ? '' : 'readonly'} style="text-transform:uppercase;font-weight:700;letter-spacing:.03em" placeholder="QUEEN10" maxlength="30">${isNew ? '<button class="btn" type="button" data-gen>Make one up</button>' : ''}</div><small>Letters and numbers, no spaces. Customers type it at checkout.</small></label>
          <div class="field full"><span class="label">Type of discount</span><div class="choice"><label><input type="radio" name="kind" value="percent" ${x.kind === 'percent' ? 'checked' : ''}><span>Percent off</span></label><label><input type="radio" name="kind" value="amount" ${x.kind === 'amount' ? 'checked' : ''}><span>Naira off</span></label></div></div>
          <label class="field"><span data-vlabel>${x.kind === 'percent' ? 'Percent off' : 'Naira off'}</span><input class="input num" name="value" inputmode="numeric" value="${x.value}"></label>
          <label class="field"><span>Minimum spend (optional)</span><span class="money"><input class="input" name="min" inputmode="numeric" value="${x.min_spend || ''}"></span></label>
          <label class="field"><span>How many times it can be used (optional)</span><input class="input num" name="max" type="number" min="1" value="${x.max_uses || ''}" placeholder="No limit"></label>
          <label class="field"><span>Last day it works (optional)</span><input class="input" name="ends" type="date" value="${esc(x.expires_on || '')}"></label>
          <label class="switch full"><input type="checkbox" name="active" ${x.active ? 'checked' : ''}><span><b>Code is working</b><small>Turn off to stop it without deleting it.</small></span></label>
        </div>
        <p class="panel" style="padding:14px 16px;background:var(--blush);border:0" data-sentence></p>
        ${!isNew ? `<p class="small muted">Used ${x.uses} time${x.uses === 1 ? '' : 's'} so far.</p>` : ''}<p class="err" data-err role="alert"></p>`,
      foot: `${!isNew ? `<button class="btn btn--danger" type="button" data-del style="margin-right:auto">${icon('trash')}Delete</button>` : ''}<button class="btn" type="button" data-x>Cancel</button><button class="btn btn--pink" type="button" data-ok>${isNew ? 'Make code' : 'Save'}</button>`,
      onOpen: ({ el, close }) => {
        const v = (n) => el.querySelector(`[name=${n}]`);
        const read = () => ({ code: v('code').value.trim().toUpperCase(), kind: el.querySelector('[name=kind]:checked').value, value: Number(v('value').value.replace(/\D/g, '')) || 0, min_spend: Number(v('min').value.replace(/\D/g, '')) || 0, max_uses: Number(v('max').value) || null, expires_on: v('ends').value || null, active: v('active').checked });
        const sync = () => { const y = read(); $('[data-vlabel]', el).textContent = y.kind === 'percent' ? 'Percent off' : 'Naira off'; $('[data-sentence]', el).textContent = `${y.code || 'This code'} takes ${discountSentence(y).charAt(0).toLowerCase()}${discountSentence(y).slice(1)}`; };
        el.addEventListener('input', sync); el.addEventListener('change', sync); sync();
        const g = $('[data-gen]', el); if (g) g.addEventListener('click', () => { v('code').value = gen(); sync(); });
        const del = $('[data-del]', el); if (del) del.addEventListener('click', () => close('delete'));
        $('[data-ok]', el).addEventListener('click', () => {
          const y = read(), err = $('[data-err]', el);
          if (!/^[A-Z0-9_-]{3,30}$/.test(y.code)) { err.textContent = 'Codes are 3 to 30 letters or numbers, no spaces.'; return; }
          if (!y.value) { err.textContent = 'How much should it take off?'; return; }
          if (y.kind === 'percent' && y.value > 100) { err.textContent = 'A percent discount can’t be more than 100.'; return; }
          close(y);
        });
      }
    });
    if (!r) return;
    try {
      if (r === 'delete') {
        if (!(await confirmBox(`Delete ${x.code}?`, 'Customers won’t be able to use it any more.', 'Delete code', true))) return;
        await DB.deleteDiscount(x.code); D.discounts = D.discounts.filter((z) => z.code !== x.code); toast(`${x.code} deleted.`);
      } else {
        const out = await DB.saveDiscount(Object.assign({}, x, r), isNew);
        if (isNew) D.discounts.unshift(out); else Object.assign(D.discounts.find((z) => z.code === x.code), out);
        toast(isNew ? `${out.code} is ready to share.` : `${out.code} saved.`);
      }
      after();
    } catch (e) { oops(e); }
  }

  // ════════════════════════════════════════════════════════
  // DELIVERY FEES
  // ════════════════════════════════════════════════════════
  async function viewDelivery() {
    await need('settings');
    const s = JSON.parse(JSON.stringify(D.settings));
    const d = s.delivery;
    const states = Object.keys(d.fees).sort((a, b) => (/FCT/.test(a) ? -1 : /FCT/.test(b) ? 1 : a.localeCompare(b)));
    let saved = JSON.stringify(d);
    view.innerHTML = `<div class="head"><div><h1>Delivery fees</h1><p>What customers pay for delivery at checkout, by state, and how long it takes.</p></div></div>
      <form data-form novalidate>
        <section class="panel"><div class="panel__body fgrid3">
          <label class="field"><span>Free delivery when they spend</span><span class="money"><input class="input" name="free" inputmode="numeric" value="${d.free_over || ''}" placeholder="Off"></span><small>Leave empty for no free delivery.</small></label>
          <label class="field"><span>Fee for anywhere not listed</span><span class="money"><input class="input" name="dfee" inputmode="numeric" value="${d.default_fee}"></span></label>
          <label class="field"><span>Time for anywhere not listed</span><input class="input" name="ddays" value="${esc(d.default_days || '')}" placeholder="2 to 4 days"></label>
        </div></section>
        <section class="panel">
          <div class="panel__head"><label class="search" style="max-width:300px"><span class="visually-hidden">Find a state</span>${icon('search')}<input class="input" type="search" placeholder="Find a state" data-q></label>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="small muted">Change many at once:</span><span class="money" style="width:130px"><input class="input" data-all-fee inputmode="numeric" placeholder="Fee" aria-label="Fee for all shown states"></span><button class="btn btn--sm" type="button" data-apply>Apply to states shown</button></div></div>
          <div class="table-wrap"><table class="table"><thead><tr><th>State</th><th style="width:180px">Fee</th><th style="width:220px">Arrives in</th></tr></thead><tbody data-rows>
          ${states.map((n) => `<tr data-st="${esc(n)}"><td class="strong">${esc(n)}</td><td><span class="money"><input class="input" inputmode="numeric" data-fee value="${d.fees[n]}" aria-label="Fee for ${esc(n)}"></span></td><td><input class="input" data-days value="${esc((d.days || {})[n] || '')}" placeholder="${esc(d.default_days || '2 to 4 days')}" aria-label="Time for ${esc(n)}"></td></tr>`).join('')}
          </tbody></table></div>
          <div class="savebar"><span class="savebar__state" data-state></span><button class="btn btn--pink btn--lg" type="submit">Save delivery fees</button></div>
        </section>
      </form>`;
    const form = $('[data-form]', view);
    const num = (v) => Number(String(v || '').replace(/\D/g, '')) || 0;
    const read = () => {
      d.free_over = num(form.elements.free.value);
      d.default_fee = num(form.elements.dfee.value);
      d.default_days = form.elements.ddays.value.trim() || '2 to 4 days';
      d.days = {};
      $$('[data-st]', view).forEach((tr) => { const n = tr.dataset.st; d.fees[n] = num($('[data-fee]', tr).value); const dy = $('[data-days]', tr).value.trim(); if (dy) d.days[n] = dy; });
    };
    const mark = () => { read(); const dirty = JSON.stringify(d) !== saved; const el = $('[data-state]', view); el.textContent = dirty ? 'Not saved yet' : 'All changes saved'; el.classList.toggle('is-dirty', dirty); };
    form.addEventListener('input', mark);
    $('[data-q]', view).addEventListener('input', (e) => { const q = e.target.value.trim().toLowerCase(); $$('[data-st]', view).forEach((tr) => { tr.hidden = q && !tr.dataset.st.toLowerCase().includes(q); }); });
    $('[data-apply]', view).addEventListener('click', () => { const v = $('[data-all-fee]', view).value; if (!num(v)) { toast('Type a fee first.', { bad: true }); return; } $$('[data-st]:not([hidden]) [data-fee]', view).forEach((i) => { i.value = num(v); }); mark(); toast('Applied. Save to keep it.'); });
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); read();
      try { D.settings = await busy($('[type=submit]', form), () => DB.saveSettings(Object.assign({}, D.settings, { delivery: d }))); saved = JSON.stringify(d); mark(); toast('Delivery fees saved. Checkout uses them now.'); }
      catch (err) { oops(err); }
    });
    guard = () => { read(); return JSON.stringify(d) !== saved; };
    read(); saved = JSON.stringify(d); // compare against the page as first shown
    mark();
  }

  // ════════════════════════════════════════════════════════
  // WEBSITE TEXT
  // ════════════════════════════════════════════════════════
  async function viewContent() {
    await need('settings');
    const s = JSON.parse(JSON.stringify(D.settings));
    if (!Array.isArray(s.stats)) s.stats = [];
    while (s.stats.length < 3) s.stats.push({ value: '', label: '' });
    if (!Array.isArray(s.ticker)) s.ticker = [];
    const pick = () => JSON.stringify({ a: s.announcement, r: s.reviews, f: s.faq, s: s.stats, t: s.ticker });
    let saved = pick();
    view.innerHTML = `<div class="head"><div><h1>Website text</h1><p>The bar at the top of the shop, the numbers and the moving pink strip on the home page, the reviews, and the questions on the Help page.</p></div></div>
      <form data-form novalidate>
        <section class="panel"><div class="panel__head"><h2 class="sub">Top bar</h2></div><div class="panel__body" style="display:grid;gap:12px">
          <label class="field"><span>Message</span><input class="input" name="ann" value="${esc(s.announcement || '')}" maxlength="140" placeholder="Same-day delivery in Abuja."><small>Shows on every page. Leave empty to hide the bar.</small></label>
          <p style="background:#111010;border:1px solid var(--line);color:var(--text-2);text-align:center;font-size:13px;letter-spacing:.06em;padding:9px;border-radius:2px" data-ann-prev></p></div></section>
        <section class="panel"><div class="panel__head"><div><h2 class="sub">Home page</h2><p class="small muted">The three numbers in the card on the home page, and the pink strip of messages that moves under the big headline.</p></div></div><div class="panel__body" style="display:grid;gap:18px">
          <div class="rows" data-stats>${s.stats.slice(0, 3).map((x, i) => `<div class="rowedit rowedit--stat" data-st="${i}"><input class="input" data-k="value" value="${esc(x.value || '')}" placeholder="500+" aria-label="Number ${i + 1}" maxlength="8"><input class="input" data-k="label" value="${esc(x.label || '')}" placeholder="Happy queens" aria-label="What number ${i + 1} means" maxlength="24"><span></span></div>`).join('')}<small class="hint">Leave a row empty to hide it. Keep the numbers true.</small></div>
          <label class="field"><span>Pink strip messages</span><textarea class="input" name="ticker" style="min-height:130px" placeholder="One message per line">${esc(s.ticker.join('\n'))}</textarea><small>One message per line. Short works best, like “Same-day delivery in Abuja”. Leave empty to hide the strip.</small></label>
        </div></section>
        <section class="panel"><div class="panel__head"><div><h2 class="sub">Reviews</h2><p class="small muted">The home page shows them as a row of cards, in this order.</p></div><button class="btn btn--sm" type="button" data-add-review>${icon('plus')}Add a review</button></div><div class="panel__body rows" data-reviews></div></section>
        <section class="panel"><div class="panel__head"><div><h2 class="sub">Help page questions</h2><p class="small muted">Grouped by topic on the Help page. Customers can search them.</p></div><button class="btn btn--sm" type="button" data-add-faq>${icon('plus')}Add a question</button></div><div class="panel__body rows" data-faq></div>
          <div class="savebar"><span class="savebar__state" data-state></span><button class="btn btn--pink btn--lg" type="submit">Save website text</button></div></section>
      </form>`;
    const form = $('[data-form]', view);
    const groups = () => Array.from(new Set(['Delivery', 'The hair', 'Care', 'Ordering'].concat(s.faq.map((f) => f.group).filter(Boolean))));
    const paintReviews = () => { $('[data-reviews]', view).innerHTML = s.reviews.map((r, i) => `<div class="panel" style="padding:12px;display:grid;gap:8px" data-rv="${i}"><div class="rowedit rowedit--review"><input class="input" data-k="name" value="${esc(r.name)}" placeholder="Name, like Adaeze O." aria-label="Name"><input class="input" data-k="place" value="${esc(r.place || '')}" placeholder="City" aria-label="City"><select class="input" data-k="stars" aria-label="Stars">${[5, 4, 3, 2, 1].map((n) => `<option value="${n}" ${Number(r.stars) === n ? 'selected' : ''}>${n} stars</option>`).join('')}</select><button class="iconbtn" type="button" data-rm-rv="${i}" aria-label="Remove this review">${icon('trash')}</button></div><textarea class="input" data-k="text" style="min-height:70px" placeholder="What she said" aria-label="Review">${esc(r.text)}</textarea><div style="display:flex;gap:6px">${i ? `<button class="btn btn--sm btn--ghost" type="button" data-up-rv="${i}">${icon('up')}Move up</button>` : ''}</div></div>`).join('') || '<p class="muted">No reviews. The home page hides the reviews section until you add one.</p>'; };
    const paintFaq = () => { $('[data-faq]', view).innerHTML = s.faq.map((f, i) => `<div class="panel" style="padding:12px;display:grid;gap:8px" data-fq="${i}"><div class="rowedit" style="grid-template-columns:180px minmax(0,1fr) 40px"><select class="input" data-k="group" aria-label="Topic">${groups().map((g) => `<option ${f.group === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select><input class="input" data-k="q" value="${esc(f.q)}" placeholder="Question" aria-label="Question"><button class="iconbtn" type="button" data-rm-fq="${i}" aria-label="Remove this question">${icon('trash')}</button></div><textarea class="input" data-k="a" style="min-height:70px" placeholder="Answer" aria-label="Answer">${esc(f.a)}</textarea></div>`).join(''); };
    const read = () => {
      s.announcement = form.elements.ann.value.trim();
      s.stats = $$('[data-st]', view).map((el) => ({ value: $('[data-k="value"]', el).value.trim(), label: $('[data-k="label"]', el).value.trim() }));
      s.ticker = form.elements.ticker.value.split('\n').map((t) => t.trim()).filter(Boolean);
      $$('[data-rv]', view).forEach((el) => { const r = s.reviews[Number(el.dataset.rv)]; $$('[data-k]', el).forEach((i) => { r[i.dataset.k] = i.dataset.k === 'stars' ? Number(i.value) : i.value.trim(); }); });
      $$('[data-fq]', view).forEach((el) => { const f = s.faq[Number(el.dataset.fq)]; $$('[data-k]', el).forEach((i) => { f[i.dataset.k] = i.value.trim(); }); });
      $('[data-ann-prev]', view).textContent = s.announcement || '(bar hidden)';
      const dirty = pick() !== saved, st = $('[data-state]', view);
      st.textContent = dirty ? 'Not saved yet' : 'All changes saved'; st.classList.toggle('is-dirty', dirty);
    };
    form.addEventListener('input', read); form.addEventListener('change', read);
    view.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      read();
      if (b.matches('[data-add-review]')) { s.reviews.push({ name: '', place: '', stars: 5, text: '' }); paintReviews(); $$('[data-rv]', view).pop().querySelector('input').focus(); }
      else if (b.matches('[data-add-faq]')) { s.faq.push({ group: 'Ordering', q: '', a: '' }); paintFaq(); $$('[data-fq]', view).pop().querySelector('input').focus(); }
      else if (b.dataset.rmRv) { s.reviews.splice(Number(b.dataset.rmRv), 1); paintReviews(); }
      else if (b.dataset.upRv) { const i = Number(b.dataset.upRv); s.reviews.splice(i - 1, 0, s.reviews.splice(i, 1)[0]); paintReviews(); }
      else if (b.dataset.rmFq) { s.faq.splice(Number(b.dataset.rmFq), 1); paintFaq(); }
      else return;
      read();
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); read();
      s.reviews = s.reviews.filter((r) => r.text); s.faq = s.faq.filter((f) => f.q && f.a);
      try { D.settings = await busy($('[type=submit]', form), () => DB.saveSettings(Object.assign({}, D.settings, { announcement: s.announcement, reviews: s.reviews, faq: s.faq, stats: s.stats.filter((x) => x.value), ticker: s.ticker }))); saved = pick(); paintReviews(); paintFaq(); read(); toast('Saved. The shop shows the new text now.'); }
      catch (err) { oops(err); }
    });
    guard = () => { read(); return pick() !== saved; };
    paintReviews(); paintFaq(); read(); saved = pick(); read();
  }

  // ════════════════════════════════════════════════════════
  // SETTINGS
  // ════════════════════════════════════════════════════════
  async function viewSettings() {
    await need('settings');
    if (DB.mode === 'live') await need('admins'); else await need('admins');
    const s = JSON.parse(JSON.stringify(D.settings));
    const st = s.store, pay = s.payments;
    if (!Array.isArray(st.hours)) st.hours = [[12, 18], [9, 21], [9, 21], [9, 21], [9, 21], [9, 21], [9, 21]];
    const pick = () => JSON.stringify({ st, pay });
    let saved = pick();
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hourOpts = (sel) => Array.from({ length: 25 }, (_, h) => `<option value="${h}" ${Number(sel) === h ? 'selected' : ''}>${h === 0 || h === 24 ? (h ? 'midnight' : '12am') : (h % 12 || 12) + (h < 12 ? 'am' : 'pm')}</option>`).join('');
    view.innerHTML = `<div class="head"><div><h1>Settings</h1><p>Contact details, opening hours, payments and who can sign in here.</p></div></div>
      <form data-form novalidate class="stack">
        <section class="panel"><div class="panel__head"><h2 class="sub">Shop details</h2></div><div class="panel__body fgrid">
          <label class="field"><span>WhatsApp number</span><input class="input" name="whatsapp" value="${esc(st.whatsapp || '')}" inputmode="tel" placeholder="2347033247980"><small>With 234 in front, no + or spaces. The shop’s WhatsApp buttons use it.</small></label>
          <label class="field"><span>Phone number as it should look</span><input class="input" name="phone_display" value="${esc(st.phone_display || '')}" placeholder="+234 703 324 7980"></label>
          <label class="field"><span>Email</span><input class="input" name="email" type="email" value="${esc(st.email || '')}"></label>
          <label class="field"><span>Instagram name</span><input class="input" name="instagram" value="${esc(st.instagram || '')}" placeholder="the_baddie_strands"></label>
          <label class="field"><span>TikTok name</span><input class="input" name="tiktok" value="${esc(st.tiktok || '')}" placeholder="baddie.strands"><small>Leave empty to hide the TikTok link.</small></label>
        </div></section>
        <section class="panel"><div class="panel__head"><div><h2 class="sub">Opening hours</h2><p class="small muted">The shop shows “Open now” or when you open next, in Abuja time.</p></div></div><div class="panel__body rows">
          ${DAYS.map((name, i) => { const h = st.hours[i]; return `<div class="rowedit" style="grid-template-columns:130px 110px minmax(0,1fr) minmax(0,1fr)" data-day="${i}"><b>${name}</b><label class="switch"><input type="checkbox" data-open ${h ? 'checked' : ''} aria-label="Open on ${name}"><small>${h ? 'Open' : 'Closed'}</small></label><select class="input" data-from aria-label="${name} opens" ${h ? '' : 'disabled'}>${hourOpts(h ? h[0] : 9)}</select><select class="input" data-to aria-label="${name} closes" ${h ? '' : 'disabled'}>${hourOpts(h ? h[1] : 18)}</select></div>`; }).join('')}
        </div></section>
        <section class="panel"><div class="panel__head"><div><h2 class="sub">Payments</h2><p class="small muted">Turn on the ways customers can pay at checkout.</p></div></div><div class="panel__body" style="display:grid;gap:18px">
          <label class="field"><span>Paystack public key (for card payments)</span><input class="input" name="pk" value="${esc(pay.paystack_public_key || '')}" placeholder="pk_live_..." autocomplete="off" spellcheck="false"><small>Paystack dashboard, Settings, API Keys. Copy the <b>Public</b> key, never the Secret one. Leave empty to switch card payments off.</small></label>
          <div class="fgrid3">
            <label class="field"><span>Bank</span><input class="input" name="bank" value="${esc(pay.bank_name || '')}" placeholder="Access Bank"></label>
            <label class="field"><span>Account name</span><input class="input" name="acct_name" value="${esc(pay.bank_account_name || '')}"></label>
            <label class="field"><span>Account number</span><input class="input num" name="acct" value="${esc(pay.bank_account_number || '')}" inputmode="numeric" maxlength="10"><small>Leave empty to switch bank transfer off.</small></label>
          </div>
          <label class="switch"><input type="checkbox" name="wa_orders" ${pay.whatsapp_orders !== false ? 'checked' : ''}><span><b>Let customers finish on WhatsApp</b><small>They place the order, then confirm it and pay with you in a chat. Always on if card and transfer are both off.</small></span></label>
          <p class="err" data-err role="alert"></p>
        </div>
        <div class="savebar"><span class="savebar__state" data-state></span><button class="btn btn--pink btn--lg" type="submit">Save settings</button></div></section>
      </form>
      <section class="panel" style="margin-top:20px"><div class="panel__head"><div><h2 class="sub">Team</h2><p class="small muted">Emails allowed to sign in to this dashboard.</p></div></div><div class="panel__body" style="display:grid;gap:14px">
        <div data-admins></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><label class="visually-hidden" for="new-admin">Email to add</label><input class="input" id="new-admin" type="email" placeholder="name@example.com" style="max-width:320px"><button class="btn" type="button" data-add-admin>Add to team</button></div>
        <p class="hint">${DB.mode === 'live' ? 'After adding an email here, create their sign-in in Supabase: Authentication, Users, Add user. Use the same email and a password you send them.' : 'In demo mode anyone can sign in. Once live, only these emails can.'}</p>
      </div></section>
      <section class="panel" style="margin-top:20px"><div class="panel__head"><div><h2 class="sub">New order alerts</h2><p class="small muted">Get a pop-up on this computer when an order comes in, while this dashboard is open in a tab.</p></div></div><div class="panel__body" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><p class="muted" style="flex:1;min-width:240px" data-alert-state></p><button class="btn" type="button" data-alerts>Turn on alerts</button></div></section>
      ${DB.mode === 'live' ? `<section class="panel" style="margin-top:20px"><div class="panel__head"><h2 class="sub">Your password</h2></div><div class="panel__body" style="display:flex;gap:8px;flex-wrap:wrap;align-items:end"><label class="field" style="flex:1;max-width:320px"><span>New password</span><input class="input" type="password" id="new-pw" autocomplete="new-password" minlength="8"><small>At least 8 characters.</small></label><button class="btn" type="button" data-pw>Change password</button></div></section>`
        : `<section class="panel" style="margin-top:20px"><div class="panel__head"><h2 class="sub">Demo data</h2></div><div class="panel__body" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><p class="muted" style="flex:1;min-width:240px">Start the demo again with the sample orders and products. Only affects this browser.</p><button class="btn" type="button" data-reset>Reset demo data</button></div></section>`}`;
    const form = $('[data-form]', view);
    const f = form.elements;
    const read = () => {
      st.whatsapp = f.whatsapp.value.replace(/\D/g, ''); st.phone_display = f.phone_display.value.trim(); st.email = f.email.value.trim(); st.instagram = f.instagram.value.trim().replace(/^@/, ''); st.tiktok = f.tiktok.value.trim().replace(/^@/, '');
      st.hours = $$('[data-day]', view).map((row) => { const on = $('[data-open]', row).checked; $('[data-from]', row).disabled = !on; $('[data-to]', row).disabled = !on; $('[data-open]', row).nextElementSibling.textContent = on ? 'Open' : 'Closed'; return on ? [Number($('[data-from]', row).value), Number($('[data-to]', row).value)] : null; });
      pay.paystack_public_key = f.pk.value.trim(); pay.bank_name = f.bank.value.trim(); pay.bank_account_name = f.acct_name.value.trim(); pay.bank_account_number = f.acct.value.replace(/\D/g, ''); pay.whatsapp_orders = f.wa_orders.checked;
      const dirty = pick() !== saved, el = $('[data-state]', view);
      el.textContent = dirty ? 'Not saved yet' : 'All changes saved'; el.classList.toggle('is-dirty', dirty);
    };
    form.addEventListener('input', read); form.addEventListener('change', read);
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); read();
      const err = $('[data-err]', view);
      err.textContent = '';
      if (pay.paystack_public_key && !/^pk_(live|test)_[A-Za-z0-9]+$/.test(pay.paystack_public_key)) { err.textContent = /^sk_/.test(pay.paystack_public_key) ? 'That’s your Secret key. Never put it here. Copy the Public key (it starts with pk_).' : 'A Paystack public key starts with pk_live_ or pk_test_.'; f.pk.focus(); return; }
      if (pay.bank_account_number && pay.bank_account_number.length !== 10) { err.textContent = 'Nigerian account numbers are 10 digits.'; f.acct.focus(); return; }
      if (pay.bank_account_number && (!pay.bank_name || !pay.bank_account_name)) { err.textContent = 'Add the bank and the account name too, so customers can check before paying.'; return; }
      if (st.hours.some((h) => h && h[1] <= h[0])) { toast('A closing time is earlier than its opening time.', { bad: true }); return; }
      try { D.settings = await busy($('[type=submit]', form), () => DB.saveSettings(Object.assign({}, D.settings, { store: st, payments: pay }))); saved = pick(); read(); toast('Settings saved. The shop uses them now.'); }
      catch (x) { oops(x); }
    });
    const paintAdmins = () => { $('[data-admins]', view).innerHTML = `<div class="table-wrap"><table class="table"><tbody>${D.admins.map((a) => `<tr><td><b>${esc(a.email)}</b>${me && me.email && a.email.toLowerCase() === me.email.toLowerCase() ? ' <span class="small muted">(you)</span>' : ''}</td><td class="r"><button class="btn btn--sm btn--ghost" type="button" data-rm-admin="${esc(a.email)}">Remove</button></td></tr>`).join('')}</tbody></table></div>`; };
    view.addEventListener('click', async (e) => {
      const rm = e.target.closest('[data-rm-admin]');
      try {
        if (rm) {
          if (!(await confirmBox('Remove from the team?', `${esc(rm.dataset.rmAdmin)} won’t be able to sign in here any more.`, 'Remove', true))) return;
          await DB.removeAdmin(rm.dataset.rmAdmin); await reload('admins'); paintAdmins(); toast('Removed from the team.');
        }
        if (e.target.closest('[data-add-admin]')) { const i = $('#new-admin'); await DB.addAdmin(i.value); i.value = ''; await reload('admins'); paintAdmins(); toast('Added to the team.'); }
        if (e.target.closest('[data-pw]')) { const pw = $('#new-pw').value; if (pw.length < 8) { toast('Use at least 8 characters.', { bad: true }); return; } await busy(e.target.closest('[data-pw]'), () => DB.updatePassword(pw)); $('#new-pw').value = ''; toast('Password changed.'); }
        if (e.target.closest('[data-alerts]')) { if (!window.Notification) return; const r = await Notification.requestPermission(); paintAlerts(); if (r === 'granted') toast('Alerts are on for this computer.'); }
        if (e.target.closest('[data-reset]')) { if (await confirmBox('Reset the demo?', 'Your demo changes in this browser are replaced with the sample data.', 'Reset demo')) { DB.resetDemo(); Object.keys(D).forEach((k) => { D[k] = null; }); toast('Demo reset.'); go('/'); } }
      } catch (x) { oops(x); }
    });
    guard = () => { read(); return pick() !== saved; };
    const paintAlerts = () => {
      const el = $('[data-alert-state]', view), b = $('[data-alerts]', view);
      if (!window.Notification) { el.textContent = 'This browser can’t show alerts. The Orders badge and the pop-up inside the dashboard still tell you.'; b.hidden = true; return; }
      const p = Notification.permission;
      el.textContent = p === 'granted' ? 'Alerts are on for this computer.' : p === 'denied' ? 'Alerts are blocked in this browser’s settings for this site. Allow notifications there to turn them on.' : 'Alerts are off.';
      b.hidden = p !== 'default';
    };
    paintAlerts();
    paintAdmins(); read(); saved = pick(); read();
  }

  // ════════════════════════════════════════════════════════
  // HOW TO
  // ════════════════════════════════════════════════════════
  async function viewHelp(sub) {
    const open = (id) => (sub === id ? ' open' : '');
    view.innerHTML = `<div class="head"><div><h1>How to</h1><p>Short answers for the things you’ll do most.</p></div></div>
      <div class="guide">
        <details${sub ? '' : ' open'}><summary>How an order moves</summary><div class="guide__body">
          <div class="flow">${badge('new', 'New')}<span>→</span>${badge('paid', 'Paid')}<span>→</span>${badge('confirmed', 'Confirmed')}<span>→</span>${badge('packing', 'Packing')}<span>→</span>${badge('shipped', 'Sent')}<span>→</span>${badge('delivered', 'Delivered')}</div>
          <p>Open any order and the box at the top tells you the next thing to do, with one button for it. Follow the buttons and every order moves along by itself. The customer sees the same steps on her tracking page.</p>
          <p>Cancelling an order puts its pieces back in stock. If you cancel by mistake, press <b>Undo</b>, or open it and press <b>Restore order</b>.</p></div></details>
        <details${open('card')}><summary>Checking a card payment</summary><div class="guide__body"><ol><li>When a customer pays by card, the order says <b>Check payment</b>.</li><li>Press <b>Open Paystack</b> on the order. Find the payment by the reference shown, or by her email.</li><li>If Paystack says <b>Success</b>, press <b>It’s there: mark as paid</b>. If you can’t find it, press <b>I can’t find it</b> and message her.</li></ol><p>We check by hand because the website can’t see inside your Paystack account. It takes a few seconds and protects you from fake receipts.</p></div></details>
        <details${open('transfer')}><summary>Bank transfers</summary><div class="guide__body"><p>Customers who choose bank transfer see your account details and the amount, with their order number as the reference. When the money shows in your bank app, open the order and press <b>Mark as paid</b>.</p><p>Change the account in <a class="linkbtn" href="#/settings">Settings</a>. Leave the account number empty to switch transfers off.</p></div></details>
        <details${open('products')}><summary>Adding or changing a product</summary><div class="guide__body"><ol><li>Go to <a class="linkbtn" href="#/products">Products</a> and press <b>Add a product</b>.</li><li>Add photos, a name, the type and texture, a price, the lengths you sell and the shades.</li><li>If longer lengths cost more, type the price beside each length.</li><li>Press <b>Add product</b>. It’s on the shop straight away.</li></ol><p>To change stock quickly, use the − and + beside each product in the list. To take something off the shop for a while, switch off <b>On the shop</b> instead of deleting it.</p></div></details>
        <details${open('sale')}><summary>Recording a sale from Instagram or WhatsApp</summary><div class="guide__body"><p>Press <b>Record a sale</b> on Today or Orders. Choose what she bought, the price and how she paid. It counts in your sales figures and takes the pieces out of stock, so your numbers stay right.</p></div></details>
        <details${open('codes')}><summary>Discount codes</summary><div class="guide__body"><p>Go to <a class="linkbtn" href="#/discounts">Discount codes</a> and press <b>Make a code</b>. Choose percent or naira off, and optionally a minimum spend, how many times it can be used, and the last day it works. The box at the bottom says in plain words what the code will do.</p></div></details>
        <details${open('text')}><summary>Changing the words on the shop</summary><div class="guide__body"><p>The top bar message, the home page numbers and pink strip, the reviews and the Help page questions are all in <a class="linkbtn" href="#/content">Website text</a>. Your phone number, email, Instagram, TikTok and opening hours are in <a class="linkbtn" href="#/settings">Settings</a>. Delivery prices are in <a class="linkbtn" href="#/delivery">Delivery fees</a>.</p></div></details>
        <details${open('live')}><summary>Going live: connecting the database</summary><div class="guide__body">
          <p>${DB.mode === 'live' ? '<b>You’re connected.</b> This dashboard and the shop read and save to your Supabase database.' : '<b>You’re in demo mode.</b> Until the steps below are done, this dashboard shows sample data saved in this browser, and the shop’s orders stay in each customer’s browser.'}</p>
          <ol>
            <li>Make a free account at <b>supabase.com</b> and create a new project. Pick the region closest to Nigeria (for example, London or Frankfurt).</li>
            <li>In the project, open <b>SQL Editor</b>, then <b>New query</b>. Open the file <code>supabase/1-setup.sql</code>, change the admin email near the bottom to yours, paste it all in and press <b>Run</b>.</li>
            <li>To start with the products from the old site, do the same with <code>supabase/2-sample-products.sql</code>.</li>
            <li>Open <b>Authentication</b>, <b>Users</b>, <b>Add user</b>. Use the same email and choose a password. Then in <b>Authentication</b>, <b>Sign In / Providers</b>, switch off <b>Allow new users to sign up</b>.</li>
            <li>Open <b>Project Settings</b>, <b>API</b>. Copy the <b>Project URL</b> and the <b>anon public</b> key into <code>config.js</code> in both the <code>shop</code> and <code>admin</code> folders.</li>
            <li>Publish both folders again. Sign in here with your email and password.</li>
          </ol></div></details>
      </div>`;
    if (sub) { const d = $(`details[open]`, view); if (d) d.scrollIntoView({ block: 'start' }); }
  }

  // ════════════════════════════════════════════════════════
  // FIND ANYTHING (Ctrl K)
  // ════════════════════════════════════════════════════════
  async function find() {
    await need('orders', 'products');
    const PAGES = [['Today', '/'], ['Orders', '/orders'], ['Products', '/products'], ['Add a product', '/products/new'], ['Customers', '/customers'], ['Newsletter list', '/customers?tab=news'], ['Messages', '/messages'], ['Discount codes', '/discounts'], ['Delivery fees', '/delivery'], ['Website text', '/content'], ['Settings', '/settings'], ['How to', '/help']];
    dialog({
      cls: 'cmd', body: `<label class="visually-hidden" for="cmd-q">Find</label><input class="cmd__input" id="cmd-q" placeholder="Type an order number, name, product or page" autocomplete="off"><div class="cmd__list" role="listbox" aria-label="Results" data-res></div>`,
      onOpen: ({ el, close }) => {
        const box = $('.dlg__body', el); box.style.padding = '0';
        const input = $('#cmd-q', el), res = $('[data-res]', el);
        let items = [], sel = 0;
        const paint = () => {
          const q = input.value.trim().toLowerCase(), words = q.split(/\s+/).filter(Boolean);
          const hit = (s) => words.every((w) => s.toLowerCase().includes(w));
          const groups = [];
          const pages = PAGES.filter((p) => !q || hit(p[0])).slice(0, q ? 4 : 12).map((p) => ({ label: p[0], to: p[1], note: 'Page' }));
          if (q) {
            const orders = D.orders.filter((o) => hit([o.number, o.customer_name, o.email, o.phone].join(' '))).slice(0, 6).map((o) => ({ label: `${o.number}  ${o.customer_name}`, to: '/orders/' + o.number, note: `${money(o.total)}, ${STATUS[o.status]}` }));
            const prods = D.products.filter((p) => hit(p.name + ' ' + (TEXTURES[p.texture] || ''))).slice(0, 6).map((p) => ({ label: p.name, to: '/products/' + p.id, note: p.stock === null ? 'Product' : `${p.stock} in stock` }));
            if (orders.length) groups.push(['Orders', orders]);
            if (prods.length) groups.push(['Products', prods]);
          }
          if (pages.length) groups.push(['Go to', pages]);
          items = groups.flatMap((g) => g[1]);
          sel = Math.min(sel, Math.max(0, items.length - 1));
          let k = 0;
          res.innerHTML = groups.map(([g, list]) => `<p class="cmd__group">${g}</p>${list.map((it) => `<button class="cmd__item" type="button" role="option" data-k="${k}" aria-selected="${k++ === sel}">${esc(it.label)}<small>${esc(it.note)}</small></button>`).join('')}`).join('') || '<p class="muted" style="padding:16px">Nothing found.</p>';
        };
        input.addEventListener('input', () => { sel = 0; paint(); });
        input.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % Math.max(1, items.length); paint(); const s = $('[aria-selected="true"]', res); if (s) s.scrollIntoView({ block: 'nearest' }); }
          if (e.key === 'Enter' && items[sel]) { close(); go(items[sel].to); }
        });
        res.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) { close(); go(items[Number(b.dataset.k)].to); } });
        paint();
      }
    });
  }

  // ════════════════════════════════════════════════════════
  // SIGN IN
  // ════════════════════════════════════════════════════════
  let me = null;
  function showAuth(kind, msg) {
    $('#app').hidden = true; $('#auth').hidden = false;
    const box = $('#auth-forms');
    const demo = DB.mode === 'demo';
    if (kind === 'denied') {
      box.innerHTML = `<form><h1>Not on the team</h1><p class="muted">${esc(msg || '')} is signed in, but isn’t on the list of people who can use this dashboard. Ask the shop owner to add this email under Settings, Team.</p><button class="btn btn--black btn--lg" type="button" data-out>Sign out</button></form>`;
      $('[data-out]', box).addEventListener('click', async () => { await DB.signOut(); showAuth('in'); });
      return;
    }
    if (kind === 'newpw') {
      box.innerHTML = `<form data-f novalidate><h1>Choose a new password</h1><label class="field"><span>New password</span><input class="input" type="password" name="pw" autocomplete="new-password" minlength="8" required><small>At least 8 characters.</small></label><p class="err" data-err role="alert"></p><button class="btn btn--pink btn--lg" type="submit">Save password</button></form>`;
      $('[data-f]', box).addEventListener('submit', async (e) => {
        e.preventDefault();
        const pw = e.target.elements.pw.value;
        if (pw.length < 8) { $('[data-err]', box).textContent = 'Use at least 8 characters.'; return; }
        try { await busy($('[type=submit]', box), () => DB.updatePassword(pw)); history.replaceState(null, '', location.pathname + '#/'); boot(); }
        catch (x) { $('[data-err]', box).textContent = x.message; }
      });
      return;
    }
    if (kind === 'reset') {
      box.innerHTML = `<form data-f novalidate><h1>Reset your password</h1><p class="muted">We’ll email you a link to choose a new one.</p><label class="field"><span>Email</span><input class="input" type="email" name="email" autocomplete="email" required></label><p class="err" data-err role="alert"></p><p class="okmsg" data-ok role="status"></p><button class="btn btn--pink btn--lg" type="submit">Send the link</button><button class="linkbtn" type="button" data-back style="justify-self:start">Back to sign in</button></form>`;
      $('[data-back]', box).addEventListener('click', () => showAuth('in'));
      $('[data-f]', box).addEventListener('submit', async (e) => {
        e.preventDefault();
        const em = e.target.elements.email.value;
        if (!DB.validEmail(em)) { $('[data-err]', box).textContent = 'Please check the email address.'; return; }
        try { await busy($('[type=submit]', box), () => DB.resetPassword(em)); $('[data-err]', box).textContent = ''; $('[data-ok]', box).textContent = 'Check your inbox for the link. It can take a minute.'; }
        catch (x) { $('[data-err]', box).textContent = x.message; }
      });
      return;
    }
    box.innerHTML = `<form data-f novalidate><h1>Sign in</h1>
      ${demo ? '<p class="panel" style="padding:12px 14px;background:var(--warn-bg);border:0;color:var(--warn)"><b>Demo mode.</b> Any email and password will do. You’ll see sample data that stays in this browser.</p>' : ''}
      <label class="field"><span>Email</span><input class="input" type="email" name="email" autocomplete="username" required value="${demo ? 'baddiestrands@gmail.com' : ''}"></label>
      <label class="field"><span>Password</span><input class="input" type="password" name="pw" autocomplete="current-password" required value="${demo ? 'demo-password' : ''}"></label>
      <p class="err" data-err role="alert">${esc(msg || '')}</p>
      <button class="btn btn--pink btn--lg" type="submit">Sign in</button>
      ${demo ? '' : '<button class="linkbtn" type="button" data-reset style="justify-self:start">Forgot your password?</button>'}</form>`;
    const r = $('[data-reset]', box); if (r) r.addEventListener('click', () => showAuth('reset'));
    $('[data-f]', box).addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target.elements;
      if (!DB.validEmail(f.email.value)) { $('[data-err]', box).textContent = 'Please check the email address.'; return; }
      if (!f.pw.value) { $('[data-err]', box).textContent = 'Type your password.'; return; }
      try { await busy($('[type=submit]', box), () => DB.signIn(f.email.value, f.pw.value)); boot(); }
      catch (x) { $('[data-err]', box).textContent = x.message; }
    });
    setTimeout(() => { const i = $('input', box); if (i) i.focus(); }, 50);
  }

  // ── shell behaviour ──────────────────────────────────────
  function closeSide() { $('#side').classList.remove('is-open'); $('#menu-btn').setAttribute('aria-expanded', 'false'); }
  let shellBound = false;
  function bindShell() {
    if (shellBound) return;
    shellBound = true;
    $('#menu-btn').addEventListener('click', () => { const s = $('#side'); s.classList.add('is-open'); $('#menu-btn').setAttribute('aria-expanded', 'true'); $('a', s).focus(); });
    $('#more-btn').addEventListener('click', () => { const s = $('#side'); s.classList.add('is-open'); $('#menu-btn').setAttribute('aria-expanded', 'true'); });
    document.addEventListener('click', (e) => { const s = $('#side'); if (s.classList.contains('is-open') && !s.contains(e.target) && !e.target.closest('#menu-btn,#more-btn')) closeSide(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && $('#side').classList.contains('is-open')) closeSide();
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && !$('#dialogs').children.length)) { e.preventDefault(); find(); }
    });
    $('#find-btn').addEventListener('click', find);
    $('#sign-out').addEventListener('click', async () => { await DB.signOut(); Object.keys(D).forEach((k) => { D[k] = null; }); showAuth('in'); });
    $('#refresh').addEventListener('click', async (e) => { try { await busy(e.currentTarget, () => reload('orders', 'messages', 'products')); toast('Up to date.'); if (!(guard && guard())) route(); } catch (x) { oops(x); } });
    window.addEventListener('scroll', () => $('#top').classList.toggle('is-scrolled', window.scrollY > 4), { passive: true });
    // look for new orders and messages every minute
    setInterval(async () => {
      if (!D.orders || $('#app').hidden) return;
      try {
        const known = new Set(D.orders.map((o) => o.id)), unread = (D.messages || []).filter((m) => !m.done).length;
        await reload('orders', 'messages');
        const fresh = D.orders.filter((o) => !known.has(o.id));
        if (fresh.length) {
          const o = fresh[0];
          if (document.hidden && window.Notification && Notification.permission === 'granted') {
            try { const n = new Notification(fresh.length === 1 ? `New order ${o.number}` : `${fresh.length} new orders`, { body: fresh.length === 1 ? `${o.customer_name}, ${money(o.total)}` : 'Open the dashboard to see them.', icon: 'assets/img/icon.svg', tag: 'bs-orders' }); n.onclick = () => { window.focus(); go(fresh.length === 1 ? '/orders/' + o.number : '/orders?tab=new'); n.close(); }; } catch (e) { /* phones need an app for this */ }
          }
          toast(fresh.length === 1 ? `New order ${o.number} from ${o.customer_name}, ${money(o.total)}.` : `${fresh.length} new orders.`, { action: 'Open', onAction: () => go(fresh.length === 1 ? '/orders/' + o.number : '/orders?tab=new'), long: true });
          if (/^\/(orders)?$/.test(path()) && !(guard && guard())) route();
        } else if (D.messages.filter((m) => !m.done).length > unread) toast('You have a new message.', { action: 'Open', onAction: () => go('/messages') });
      } catch (e) { /* offline for a moment; try again next minute */ }
    }, 60000);
  }

  async function boot() {
    let user = null;
    try { user = await DB.user(); } catch (e) { showAuth('in', e.message); return; }
    if (!user) { showAuth('in'); return; }
    let ok = true;
    try { ok = await DB.isAdmin(); } catch (e) { showAuth('in', e.message); return; }
    if (!ok) { showAuth('denied', user.email); return; }
    me = user;
    $('#auth').hidden = true; $('#app').hidden = false;
    $('#who').textContent = user.email;
    $('#mode').textContent = DB.mode === 'live' ? 'Connected' : 'Demo mode';
    $('#mode').classList.toggle('is-demo', DB.mode === 'demo');
    $('#demo-bar').hidden = DB.mode !== 'demo';
    const sl = $('#shop-link'); if (SHOP) sl.href = SHOP; else sl.hidden = true;
    bindShell();
    route();
    need('orders', 'messages', 'products').catch(() => {});
  }

  // a password-reset link brings the user back here signed in for one purpose
  DB.onAuth((event) => { if (event === 'PASSWORD_RECOVERY') showAuth('newpw'); });
  if (/type=recovery/.test(location.hash)) showAuth('newpw'); else boot();
})();
