/* ============================================================
   BADDIE STRANDS — shop logic (shared by every page)
   Settings: js/config.js   ·   Starter catalogue & copy: js/data.js
   When Supabase is connected, products come from the admin
   dashboard instead of data.js.
   ============================================================ */
'use strict';

const CFG = BS_CONFIG;
const LIVE = /^https:\/\//.test(CFG.supabaseUrl) && !String(CFG.supabaseAnonKey).startsWith('YOUR_');
const CARD_PAGE = 8;                 // products shown before "Show more"

/* ── helpers ────────────────────────────────────────────── */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => '₦' + Number(n || 0).toLocaleString('en-NG');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const onFrame = fn => { let q = false; return () => { if (q) return; q = true; requestAnimationFrame(() => { q = false; fn(); }); }; };
function openLink(url) { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); }
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
function toast(title, body) {
  const t = $('#toast'); if (!t) return;
  $('#toast-title').textContent = title; $('#toast-body').textContent = body;
  t.classList.add('show'); clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 3000);
}

/* images without a photo yet become a branded tile */
function fallbackFor(img) {
  if (img.dataset.fb || !img.closest('.card-img,.slide,.pm-img,.c-thumb')) return;
  img.dataset.fb = '1';
  const d = document.createElement('div');
  d.className = 'fallback';
  d.innerHTML = `<img src="assets/logo-pink.png" alt=""><small>${esc(img.alt)}</small>`;
  img.replaceWith(d);
}
document.addEventListener('error', e => { if (e.target.tagName === 'IMG') fallbackFor(e.target); }, true);
const imgTag = (src, alt, eager) => `<img src="${esc(src)}" alt="${esc(alt)}" ${eager ? '' : 'loading="lazy"'} decoding="async" draggable="false">`;

/* ── products (Supabase if connected, else data.js) ─────── */
let PRODUCTS = LIVE ? [] : STORE_DATA.products.map(withOptions);   // live: only what's in the admin
let productsReady = null;
function loadProducts() {
  if (productsReady) return productsReady;
  productsReady = (async () => {
    if (!LIVE) return PRODUCTS;
    // free stock held by card checkouts that were never paid (2h+)
    try { await fetch(`${CFG.supabaseUrl}/rest/v1/rpc/release_stale_orders`, { method: 'POST', headers: { apikey: CFG.supabaseAnonKey, 'Content-Type': 'application/json' }, body: '{}' }); } catch {}
    try {
      const c = JSON.parse(sessionStorage.getItem('bs_products') || 'null');
      if (c && Date.now() - c.t < 60e3 && c.rows.length) return (PRODUCTS = c.rows);
    } catch {}
    try {
      const r = await fetch(`${CFG.supabaseUrl}/rest/v1/products?select=*&visible=eq.true&order=sort.asc,id.asc`, {
        headers: { apikey: CFG.supabaseAnonKey },
      });
      if (r.ok) {
        const rows = (await r.json()).map(fromRow);
        PRODUCTS = rows;
        if (rows.length) try { sessionStorage.setItem('bs_products', JSON.stringify({ t: Date.now(), rows })); } catch {}
      }
    } catch (e) { console.warn('[BS] could not load products', e); }
    return PRODUCTS;
  })();
  return productsReady;
}
function fromRow(r) {
  return withOptions({
    id: r.id, name: r.name, type: r.type || '', category: r.category || 'wigs',
    price: +r.price, oldPrice: r.old_price ? +r.old_price : null,
    lengths: r.lengths?.length ? r.lengths : ['Standard'],
    colors: r.colors?.length ? r.colors : ['#1a1008'], colorNames: r.color_names?.length ? r.color_names : ['Natural Black'],
    description: r.description || '', features: r.features || [],
    image: r.image_url || '', stock: r.stock ?? 0, hot: r.badge === 'hot', new: r.badge === 'new',
    options: Array.isArray(r.length_options) ? r.length_options : [],
  });
}
/* Every product gets `options`: one per length, each with its own price,
   "was" price and stock. Older products without them share one price/stock. */
function withOptions(p) {
  let opts = (p.options || []).filter(o => o && o.length)
    .map(o => ({ length: String(o.length), price: +o.price || +p.price, oldPrice: +o.old_price || null, stock: Math.max(0, parseInt(o.stock) || 0) }));
  if (!opts.length) {
    const stock = p.stock === undefined ? 99 : Math.max(0, +p.stock || 0);
    opts = (p.lengths?.length ? p.lengths : ['Standard']).map(l => ({ length: l, price: +p.price, oldPrice: p.oldPrice || null, stock }));
    opts.shared = true;           // one stock count for all lengths
  }
  const avail = opts.filter(o => o.stock > 0);
  const prices = (avail.length ? avail : opts).map(o => o.price);
  const from = Math.min(...prices);
  const cheapest = opts.find(o => o.price === from);
  return { ...p, options: opts, lengths: opts.map(o => o.length), price: from, oldPrice: cheapest.oldPrice,
           varies: prices.some(x => x !== from),
           stock: opts.shared ? opts[0].stock : opts.reduce((n, o) => n + o.stock, 0) };
}
const optionFor = (p, length) => p?.options.find(o => o.length === length);
/* how many more of this product+length can go in the cart */
function roomFor(p, length) {
  const o = optionFor(p, length); if (!o) return 0;
  const inCart = STATE.cart.filter(i => String(i.id) === String(p.id) && (p.options.shared || i.length === length)).reduce((n, i) => n + i.qty, 0);
  return Math.max(0, o.stock - inCart);
}
const priceText = p => (p.varies ? 'From ' : '') + fmt(p.price);
const byId = id => PRODUCTS.find(p => String(p.id) === String(id));
const typeWord = p => (p.type || p.category).replace(/\s*(wig|deal|extensions?)$/i, '') || p.category;

/* ── Supabase client (loaded only when needed) ──────────── */
let _sb = null;
async function sb() {
  if (!LIVE) return null;
  if (_sb) return _sb;
  await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
  _sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
  return _sb;
}

/* ── state ──────────────────────────────────────────────── */
const STATE = { cart: store.get('bs_cart', []) };
const AUTH = { user: null, otpEmail: null, isRegister: false };
const CO = { step: 1, delivery: {}, pay: 'card' };
const PM = { p: null, qty: 1, length: null, color: 0 };

/* ── boot ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  injectOverlays();
  initMode();
  initNav();
  initContacts();
  initOverlays();
  initCheckout();
  initAuth();
  updateCartUI();
  if (STATE.cart.length) loadProducts().then(syncCart);
  initReveal();
  if (!LIVE) showDemoBar();
  const page = { index: pageHome, shop: pageShop, care: pageCare, delivery: pageDelivery, contact: pageContact }[document.body.dataset.page];
  page && page();
  $$('img').forEach(im => { if (im.complete && im.getAttribute('src') && !im.naturalWidth) fallbackFor(im); });
});

function showDemoBar() {
  try { if (sessionStorage.getItem('bs_demo_x')) return; } catch {}
  document.body.insertAdjacentHTML('beforeend', '<div class="demo-bar" id="demo-bar"><span>Demo mode — orders stay in this browser until the shop is connected to its database.</span><button aria-label="Dismiss">×</button></div>');
  $('#demo-bar button').addEventListener('click', () => { $('#demo-bar').remove(); try { sessionStorage.setItem('bs_demo_x', '1'); } catch {} });
}

/* contact details from config */
function initContacts() {
  $$('[data-wa]').forEach(a => a.href = `https://wa.me/${CFG.whatsappNum}`);
  $$('[data-ig]').forEach(a => a.href = `https://instagram.com/${CFG.instagram}`);
}

/* ── overlays shared by every page ──────────────────────── */
function injectOverlays() {
  document.body.insertAdjacentHTML('beforeend', `
<div class="scroll-line" id="scroll-line"></div>
<div class="scrim" id="scrim"></div>

<div class="search" id="search" role="dialog" aria-modal="true" aria-label="Search">
  <div class="search-inner">
    <input id="search-input" placeholder="Search wigs, bundles, lace…" autocomplete="off" aria-label="Search products">
    <button class="round" data-close aria-label="Close search">×</button>
  </div>
  <div class="search-results" id="search-results"></div>
</div>

<div class="modal product-modal" id="product-modal" role="dialog" aria-modal="true" aria-labelledby="pm-name">
  <button class="round modal-x" data-close aria-label="Close">×</button>
  <div class="pm-img" id="pm-img"></div>
  <div class="pm-info">
    <div>
      <span class="eyebrow" id="pm-type"></span>
      <h3 id="pm-name"></h3>
    </div>
    <div class="pm-price" id="pm-price"></div>
    <div class="pm-opt"><span class="eyebrow">Colour — <b id="pm-color-name"></b></span><div class="swatches" id="pm-colors"></div></div>
    <div class="pm-opt"><span class="eyebrow">Length</span><div class="chips small" id="pm-lengths"></div><span class="pm-left" id="pm-left" aria-live="polite"></span></div>
    <div class="pm-buy">
      <div class="qty"><button id="pm-minus" aria-label="One less">−</button><span id="pm-qty" aria-live="polite">1</span><button id="pm-plus" aria-label="One more">+</button></div>
      <button class="btn pink grow" id="pm-add">Add to cart</button>
    </div>
    <details class="pm-more"><summary>Details</summary><p id="pm-desc"></p><ul id="pm-features"></ul></details>
  </div>
</div>

<aside class="drawer" id="cart" role="dialog" aria-modal="true" aria-label="Your cart">
  <div class="drawer-head"><h3>Your cart</h3><button class="round" data-close aria-label="Close cart">×</button></div>
  <div class="drawer-items" id="cart-items"></div>
  <div class="drawer-foot">
    <div class="row"><span>Subtotal</span><b id="cart-subtotal">₦0</b></div>
    <p class="muted small">Delivery fee is added at checkout. Nigeria only.</p>
    <button class="btn pink full" id="checkout-btn">Checkout <i>→</i></button>
    <a class="btn oval full" id="wa-order" target="_blank" rel="noopener">Order on WhatsApp</a>
  </div>
</aside>

<div class="modal small-modal" id="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
  <button class="round modal-x" data-close aria-label="Close">×</button>
  <span class="eyebrow">Account</span>
  <h3 id="auth-title">Welcome back</h3>
  <p class="muted">We’ll email you a 6-digit code. No password needed.</p>
  <div class="auth-step" id="auth-step-email">
    <input class="field" type="email" id="auth-email" placeholder="you@email.com" autocomplete="email" aria-label="Email">
    <button class="btn pink full" id="auth-send">Send code</button>
    ${CFG.googleSignIn ? `<div class="or"><span>or</span></div>
    <button class="btn oval full" id="auth-google">Continue with Google</button>` : ''}
    <button class="link" id="auth-toggle">New here? Create an account</button>
  </div>
  <div class="auth-step" id="auth-step-otp" hidden>
    <p class="muted">Code sent to <b id="otp-email"></b></p>
    <div class="otp" id="otp"></div>
    <button class="btn pink full" id="auth-verify">Verify</button>
    <button class="link" id="auth-back">Use a different email</button>
  </div>
  <div class="auth-step" id="auth-step-name" hidden>
    <input class="field" id="auth-name" placeholder="Your full name" autocomplete="name" aria-label="Full name">
    <button class="btn pink full" id="auth-finish">Finish</button>
  </div>
  <p class="status" id="auth-status" role="status"></p>
</div>

<div class="modal co-modal" id="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="co-title">
  <button class="round modal-x" data-close aria-label="Close">×</button>
  <div class="co-steps" id="co-dots"><span>Review</span><span>Delivery</span><span>Payment</span><span>Done</span></div>
  <h3 id="co-title">Review order</h3>
  <div class="co-step" id="co-step-1"><div id="co-review"></div></div>
  <div class="co-step" id="co-step-2" hidden>
    <div class="form two">
      <label>Full name<input id="del-name" autocomplete="name"></label>
      <label>Phone<input id="del-phone" type="tel" autocomplete="tel"></label>
      <label class="span2">Email<input id="del-email" type="email" autocomplete="email"></label>
      <label class="span2">Street address<input id="del-address" autocomplete="street-address"></label>
      <label>City / LGA<input id="del-city"></label>
      <label>State<select id="del-state"><option value="">Select state</option></select></label>
      <label class="span2">Notes (optional)<input id="del-notes" placeholder="Landmark, gate code…"></label>
    </div>
    <div class="row line"><span>Delivery</span><b id="del-fee">— choose state</b></div>
    <p class="note">We deliver within Nigeria only.</p>
  </div>
  <div class="co-step" id="co-step-3" hidden>
    <div id="co-pay-summary"></div>
    <div class="pay-opts">
      <button class="pay-opt selected" data-pay="card"><b>Card</b><span>Pay securely with Paystack</span></button>
      <button class="pay-opt" data-pay="transfer"><b>Bank transfer</b><span>Access Bank · <em id="acct-num"></em></span></button>
    </div>
    <button class="copy-btn" id="acct-copy" hidden>Copy account number</button>
    <p class="status" id="pay-status" role="status"></p>
  </div>
  <div class="co-step" id="co-step-4" hidden>
    <div class="done-mark">✓</div>
    <p class="eyebrow">Order <span id="co-order-id"></span></p>
    <p id="co-success"></p>
    <button class="btn pink" data-close>Keep shopping</button>
  </div>
  <div class="co-foot" id="co-foot">
    <button class="btn oval" id="co-back">Back</button>
    <button class="btn pink" id="co-next">Next</button>
  </div>
</div>

<div class="toast" id="toast" role="status" aria-live="polite"><b id="toast-title"></b><span id="toast-body"></span></div>`);
}

/* ── pink mode ──────────────────────────────────────────── */
function initMode() {
  const t = $('#mode-toggle');
  const apply = on => { document.body.classList.toggle('pink-mode', on); if (t) t.checked = on; };
  apply(store.get('bs_pink_mode', false));
  t?.addEventListener('change', () => { apply(t.checked); store.set('bs_pink_mode', t.checked); });
}

/* ── nav, menu, scroll line ─────────────────────────────── */
function initNav() {
  const nav = $('#nav'), btn = $('#menu-btn');
  const setOpen = o => { nav.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); };
  btn.addEventListener('click', e => { e.stopPropagation(); setOpen(!nav.classList.contains('open')); });
  document.addEventListener('click', e => { if (!nav.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  const line = $('#scroll-line');
  const upd = onFrame(() => {
    const h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    line.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
  });
  window.addEventListener('scroll', upd, { passive: true });
  upd();
}

/* ── reveal on scroll ───────────────────────────────────── */
let revealIO = null;
function initReveal() {
  if (!('IntersectionObserver' in window)) return;
  revealIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.stats, .zone, .channels, .duo-card, .condensed').forEach(el => { el.classList.add('rv'); revealIO.observe(el); });
}
const reveal = els => els.forEach(el => revealIO ? (el.classList.add('rv'), revealIO.observe(el)) : null);

/* ── product cards ──────────────────────────────────────── */
function cardHTML(p) {
  return `<a class="card" href="shop.html#p-${esc(p.id)}" data-open="${esc(p.id)}">
    <div class="card-img">${imgTag(p.image, p.type)}</div>
    <div class="card-meta">${esc(p.name)}</div>
    <div class="card-price">${p.stock <= 0 ? 'Sold out' : priceText(p)}${p.oldPrice && !p.varies && p.stock > 0 ? `<s>${fmt(p.oldPrice)}</s>` : ''}</div>
  </a>`;
}
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]');
  if (o && !o.closest('.slider')) { e.preventDefault(); openProduct(o.dataset.open); }
});

const emptyHTML = `<p class="empty-note">New pieces are on the way. They land on <a data-wa href="https://wa.me/${esc(CFG.whatsappNum)}" target="_blank" rel="noopener">WhatsApp</a> first.</p>`;

/* ═════════ HOME ═════════ */
async function pageHome() {
  initLit();
  await loadProducts();
  const picks = PRODUCTS.slice(0, 4);
  $('#home-grid').innerHTML = picks.length ? picks.map(cardHTML).join('') : emptyHTML;
  reveal($$('#home-grid .card'));
}

function initLit() {
  const el = $('#lit-text'); if (!el) return;
  const hot = new Set(['inspected', 'groomed', 'boxed', 'anywhere']);
  el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w${hot.has(w.toLowerCase().replace(/[^a-z]/g, '')) ? ' h' : ''}">${esc(w)}</span>`).join(' ');
  const words = $$('.w', el);
  let lastN = -1;
  const run = onFrame(() => {
    const r = el.getBoundingClientRect(), vh = window.innerHeight;
    const k = Math.min(1, Math.max(0, (vh * .85 - r.top) / (r.height + vh * .3)));
    const n = Math.round(k * words.length);
    if (n === lastN) return; lastN = n;
    words.forEach((w, i) => w.classList.toggle('on', i < n));
  });
  let on = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on) { on = true; window.addEventListener('scroll', run, { passive: true }); run(); }
    else if (!e.isIntersecting && on) { on = false; window.removeEventListener('scroll', run); }
  }).observe(el);
}

/* ═════════ SHOP ═════════ */
async function pageShop() {
  await loadProducts();
  if (!PRODUCTS.length) {
    $('#stage').hidden = true;
    $('#grid').innerHTML = emptyHTML;
    return;
  }
  initSlider(PRODUCTS.slice(0, 8));

  const cats = [['all', 'All'], ['wigs', 'Wigs'], ['bundles', 'Bundles'], ['extensions', 'Extensions']]
    .filter(([k]) => k === 'all' || PRODUCTS.some(p => p.category === k));
  let filter = 'all', shown = CARD_PAGE;
  const chips = $('#chips');
  chips.innerHTML = cats.map(([k, l]) => `<button class="chip${k === 'all' ? ' active' : ''}" data-f="${k}" aria-pressed="${k === 'all'}">${l}<b>${k === 'all' ? PRODUCTS.length : PRODUCTS.filter(p => p.category === k).length}</b></button>`).join('');
  const render = () => {
    const list = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);
    $('#grid').innerHTML = list.slice(0, shown).map(cardHTML).join('');
    $('#grid-count').textContent = `${Math.min(shown, list.length)} of ${list.length}`;
    $('#show-more').hidden = shown >= list.length;
    reveal($$('#grid .card'));
  };
  chips.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    $$('.chip', chips).forEach(c => { c.classList.toggle('active', c === b); c.setAttribute('aria-pressed', c === b); });
    filter = b.dataset.f; shown = CARD_PAGE; render();
  });
  $('#show-more').addEventListener('click', () => { shown += CARD_PAGE; render(); });
  render();

  const m = location.hash.match(/^#p-(\w+)$/);
  if (m && byId(m[1])) openProduct(m[1]);
}

/* Slider: native horizontal scroll with snap, so it moves by touch swipe,
   trackpad, mouse drag, keyboard arrows and the buttons. */
function initSlider(list) {
  const sl = $('#slider');
  sl.innerHTML = list.map((p, i) => `<div class="slide" data-i="${i}" data-id="${esc(p.id)}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${list.length}: ${esc(p.name)}">
    ${imgTag(p.image, p.type, i < 3)}</div>`).join('');
  const slides = $$('.slide', sl);
  let cur = -1;
  const setActive = i => {
    if (i === cur) return;
    cur = i;
    slides.forEach((s, j) => s.classList.toggle('on', j === i));
    const p = list[i];
    $('#stage-ghost').textContent = typeWord(p);
    $('#stage-type').textContent = p.type;
    $('#stage-name').textContent = p.name;
    $('#stage-price').textContent = p.stock <= 0 ? 'Sold out' : p.oldPrice && !p.varies ? `${fmt(p.price)} — was ${fmt(p.oldPrice)}` : priceText(p);
    $('#stage-counter').textContent = `${String(i + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
  };
  const nearest = () => {
    const c = sl.scrollLeft + sl.clientWidth / 2;
    let best = 0, bd = Infinity;
    slides.forEach((s, j) => { const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - c); if (d < bd) { bd = d; best = j; } });
    return best;
  };
  const goTo = (i, smooth = true) => {
    i = (i + slides.length) % slides.length;
    const s = slides[i];
    sl.scrollTo({ left: s.offsetLeft + s.offsetWidth / 2 - sl.clientWidth / 2, behavior: smooth ? 'smooth' : 'auto' });
    setActive(i);
  };
  sl.addEventListener('scroll', onFrame(() => setActive(nearest())), { passive: true });
  $('#stage-prev').addEventListener('click', () => goTo(cur - 1));
  $('#stage-next').addEventListener('click', () => goTo(cur + 1));
  $('#stage-view').addEventListener('click', () => openProduct(list[cur].id));
  sl.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(cur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(cur - 1); }
    if (e.key === 'Enter') openProduct(list[cur].id);
  });

  // mouse drag (touch and trackpads already scroll natively)
  let drag = null, justDragged = false;
  sl.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: sl.scrollLeft, moved: false, id: e.pointerId };
  });
  sl.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; sl.classList.add('dragging'); sl.setPointerCapture(drag.id); }
    if (drag.moved) sl.scrollLeft = drag.left - dx;
  });
  const endDrag = () => {
    if (!drag) return;
    const moved = drag.moved; drag = null;
    if (moved) {
      sl.classList.remove('dragging');
      justDragged = true; setTimeout(() => (justDragged = false), 50);
      goTo(nearest());
    }
  };
  sl.addEventListener('pointerup', endDrag);
  sl.addEventListener('pointercancel', endDrag);
  sl.addEventListener('click', e => {
    if (justDragged) return;
    const s = e.target.closest('.slide'); if (!s) return;
    const i = +s.dataset.i;
    i === cur ? openProduct(s.dataset.id) : goTo(i);
  });
  setActive(0);
}

/* ═════════ HAIR CARE ═════════ */
async function loadHairCare() {
  if (!LIVE) return STORE_DATA.knowledge;
  try {
    const r = await fetch(`${CFG.supabaseUrl}/rest/v1/site_content?key=eq.hair_care&select=value`, {
      headers: { apikey: CFG.supabaseAnonKey },
    });
    if (r.ok) { const v = (await r.json())[0]?.value; if (v?.basics?.length || Object.keys(v?.care || {}).length) return v; }
  } catch {}
  return STORE_DATA.knowledge;
}
async function pageCare() {
  const K = await loadHairCare();
  const B = K.basics || [];
  const care = K.care || {}, tabs = Object.keys(care);
  const stepsWrap = $('.steps');
  if (!B.length) stepsWrap.hidden = true;
  else {
    $('#steps-list').innerHTML = B.map((b, i) => `<div class="step" data-i="${i}"><h3>${esc(b.title)}</h3><p>${esc(b.body)}</p></div>`).join('');
    $('#step-bars').innerHTML = B.map(() => '<i></i>').join('');
    const set = i => {
      $('#step-num').textContent = String(i + 1).padStart(2, '0');
      $('#step-of').textContent = `Step ${i + 1} of ${B.length}`;
      $$('#step-bars i').forEach((b, j) => b.classList.toggle('on', j <= i));
      $$('.step').forEach((s, j) => s.classList.toggle('on', j === i));
    };
    set(0);
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(+e.target.dataset.i); }), { rootMargin: '-45% 0px -45% 0px' });
    $$('.step').forEach(s => io.observe(s));
  }
  if (!tabs.length) { $('.care').hidden = true; return; }
  $('#care-tabs').innerHTML = tabs.map((t, i) => `<button class="chip${i ? '' : ' active'}" data-t="${esc(t)}" aria-pressed="${!i}">${esc(t)}</button>`).join('');
  const render = t => {
    $('#care-list').innerHTML = (care[t] || []).map((c, i) => `<details><summary><span>${String(i + 1).padStart(2, '0')}</span>${esc(c.title)}</summary><p>${esc(c.body)}</p></details>`).join('');
  };
  $('#care-tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    $$('#care-tabs .chip').forEach(c => { c.classList.toggle('active', c === b); c.setAttribute('aria-pressed', c === b); });
    render(b.dataset.t);
  });
  render(tabs[0]);
}

/* ═════════ DELIVERY ═════════ */
function pageDelivery() {
  $('#zone-local').innerHTML = DELIVERY.local.map(z => `<li><span>${esc(z.zone)}</span><span>${esc(z.price)}</span><span>${esc(z.time)}</span></li>`).join('');
  const sel = $('#lookup-state');
  sel.insertAdjacentHTML('beforeend', stateOptions());
  sel.addEventListener('change', () => {
    const s = sel.value, f = DELIVERY_FEES[s];
    $('#lookup-out').innerHTML = s
      ? `<div><b>${fmt(f)}</b><span>Delivery fee</span></div><div><b>${esc(DELIVERY_TIMES[f] || '2–4 days')}</b><span>Arrives in</span></div>`
      : '<span class="muted">Fee and time will show here.</span>';
  });
}
const stateOptions = () => Object.keys(DELIVERY_FEES)
  .sort((a, b) => a.startsWith('FCT') ? -1 : b.startsWith('FCT') ? 1 : a.localeCompare(b))
  .map(s => `<option>${esc(s)}</option>`).join('');

/* ═════════ CONTACT ═════════ */
function pageContact() {
  $('#contact-form').addEventListener('submit', e => {
    e.preventDefault();
    const n = $('#c-name').value.trim(), r = $('#c-reach').value.trim(), m = $('#c-msg').value.trim();
    if (!n || !r || !m) { toast('Almost there', 'Please add your name, contact and message.'); return; }
    openLink(`https://wa.me/${CFG.whatsappNum}?text=${encodeURIComponent(`Hi Baddie Strands, I'm ${n} (${r}).\n\n${m}`)}`);
    e.target.reset();
    toast('Opening WhatsApp', 'Your message is ready to send.');
  });
  $('#news-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#news-email').value.trim().toLowerCase();
    if (!validEmail(email)) { toast('Check your email', 'That address doesn’t look right.'); return; }
    if (LIVE) {
      try {
        await fetch(`${CFG.supabaseUrl}/rest/v1/subscribers?on_conflict=email`, {
          method: 'POST',
          headers: { apikey: CFG.supabaseAnonKey, 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal' },
          body: JSON.stringify({ email }),
        });
      } catch {}
    } else {
      const s = store.get('bs_subscribers', []); if (!s.includes(email)) s.push(email); store.set('bs_subscribers', s);
    }
    e.target.reset();
    toast('You’re in', 'New drops will reach you first.');
  });
}

/* ═════════ PRODUCT MODAL ═════════ */
async function openProduct(id) {
  await loadProducts();
  const p = byId(id); if (!p) return;
  const first = p.options.find(o => roomFor(p, o.length) > 0) || p.options[0];
  Object.assign(PM, { p, qty: 1, length: first.length, color: 0 });
  $('#pm-img').innerHTML = imgTag(p.image, p.type, true);
  $('#pm-type').textContent = p.type;
  $('#pm-name').textContent = p.name;

  $('#pm-colors').innerHTML = p.colors.map((c, i) => `<button class="swatch${i ? '' : ' active'}" style="background:${esc(c)}" data-c="${i}" aria-label="${esc(p.colorNames[i] || 'Colour ' + (i + 1))}" aria-pressed="${!i}"></button>`).join('');
  $('#pm-color-name').textContent = p.colorNames[0] || '';
  $('#pm-lengths').innerHTML = p.options.map(o => {
    const out = optionFor(p, o.length).stock <= 0;
    return `<button class="chip${out ? ' out' : ''}" data-l="${esc(o.length)}" aria-pressed="false"${out ? ' disabled aria-disabled="true" title="Sold out"' : ''}>${esc(o.length)}${p.varies ? `<small>${fmt(o.price)}</small>` : ''}</button>`;
  }).join('');
  $('#pm-desc').textContent = p.description;
  $('#pm-features').innerHTML = (p.features || []).map(f => `<li>${esc(f)}</li>`).join('');
  $('.pm-more').open = false;
  pmRefresh();
  openLayer('#product-modal');
}

/* price, stock note, quantity and button for the chosen length */
function pmRefresh() {
  const p = PM.p, o = optionFor(p, PM.length), room = roomFor(p, PM.length);
  PM.qty = Math.max(1, Math.min(PM.qty, room || 1));
  $$('.chip', $('#pm-lengths')).forEach(c => { const on = c.dataset.l === PM.length; c.classList.toggle('active', on); c.setAttribute('aria-pressed', on); });
  $('#pm-price').innerHTML = fmt(o.price) + (o.oldPrice && o.oldPrice > o.price ? `<s>${fmt(o.oldPrice)}</s>` : '');
  $('#pm-qty').textContent = PM.qty;
  $('#pm-plus').disabled = PM.qty >= room;
  $('#pm-minus').disabled = PM.qty <= 1;
  const left = $('#pm-left');
  if (left) left.textContent = o.stock <= 0 ? 'Sold out' : o.stock <= 3 ? `Only ${o.stock} left` : '';
  const btn = $('#pm-add');
  btn.disabled = room <= 0;
  btn.textContent = p.stock <= 0 || o.stock <= 0 ? 'Sold out' : room <= 0 ? 'All in your cart' : 'Add to cart';
}

/* ═════════ CART ═════════ */
function addToCart(p, qty, length, color) {
  const room = roomFor(p, length);
  if (room <= 0) { toast('That’s all we have', `${p.name} · ${length} is already in your cart.`); return; }
  qty = Math.min(qty, room);
  const price = optionFor(p, length).price;
  const key = `${p.id}-${length}-${color}`;
  const ex = STATE.cart.find(i => i.key === key);
  if (ex) { ex.qty += qty; ex.price = price; }
  else STATE.cart.push({ key, id: p.id, name: p.name, price, qty, length, color: p.colorNames[color] || '', image: p.image });
  saveCart();
  toast('Added to cart', `${p.name} · ${length}`);
  $$('[data-cart-count]').forEach(c => { c.classList.add('bump'); setTimeout(() => c.classList.remove('bump'), 300); });
}
function saveCart() { store.set('bs_cart', STATE.cart); updateCartUI(); }
/* Keep the cart honest: latest prices, never more than what's in stock,
   and items that are gone are taken out (with a note). */
function syncCart() {
  if (!PRODUCTS.length && LIVE) return;
  const notes = [];
  const kept = [];
  for (const it of STATE.cart) {
    const p = byId(it.id), o = p && optionFor(p, it.length);
    if (!o || o.stock <= 0) { notes.push(`${it.name} · ${it.length} sold out`); continue; }
    it.price = o.price;
    const used = kept.filter(k => String(k.id) === String(p.id) && (p.options.shared || k.length === it.length)).reduce((n, k) => n + k.qty, 0);
    const max = o.stock - used;
    if (max <= 0) { notes.push(`${it.name} · ${it.length} sold out`); continue; }
    if (it.qty > max) { notes.push(`${it.name} · ${it.length}: only ${o.stock} left`); it.qty = max; }
    kept.push(it);
  }
  STATE.cart = kept; saveCart();
  if (notes.length) toast('Cart updated', notes.join(' · '));
}
async function refreshStock() {
  try { sessionStorage.removeItem('bs_products'); } catch {}
  productsReady = null;
  await loadProducts();
  syncCart();
  if (CO.step === 3) $('#co-pay-summary').innerHTML = summary(true);   // totals may have changed
}
const subtotal = () => STATE.cart.reduce((s, i) => s + i.price * i.qty, 0);
function updateCartUI() {
  const count = STATE.cart.reduce((s, i) => s + i.qty, 0);
  $$('[data-cart-count]').forEach(c => c.textContent = count);
  $$('[data-open-cart]').forEach(b => b.setAttribute('aria-label', `Cart, ${count} item${count === 1 ? '' : 's'}`));
  $('#cart-subtotal').textContent = fmt(subtotal());
  const box = $('#cart-items');
  box.innerHTML = STATE.cart.length ? STATE.cart.map(i => `
    <div class="c-item">
      <div class="c-thumb">${imgTag(i.image, i.name)}</div>
      <div>
        <div class="c-name">${esc(i.name)}</div>
        <div class="c-sub">${esc(i.length)}${i.color ? ' · ' + esc(i.color) : ''}</div>
        <div class="c-qty"><button data-q="${esc(i.key)}" data-d="-1" aria-label="One less">−</button>${i.qty}<button data-q="${esc(i.key)}" data-d="1" aria-label="One more"${(() => { const p = byId(i.id); return p && roomFor(p, i.length) <= 0 ? ' disabled' : ''; })()}>+</button></div>
      </div>
      <div class="c-right">${fmt(i.price * i.qty)}<button data-rm="${esc(i.key)}">Remove</button></div>
    </div>`).join('')
    : `<div class="drawer-empty"><b>Your cart is empty</b>Your crown is waiting.<br><br><a class="btn oval" href="shop.html">Go to shop</a></div>`;
  $('#checkout-btn').disabled = !STATE.cart.length;
  const lines = STATE.cart.map(i => `• ${i.name} (${i.length}${i.color ? ', ' + i.color : ''}) × ${i.qty} — ${fmt(i.price * i.qty)}`).join('\n');
  $('#wa-order').href = `https://wa.me/${CFG.whatsappNum}?text=${encodeURIComponent(`Hi Baddie Strands! I'd like to order:\n${lines}\n\nSubtotal: ${fmt(subtotal())}`)}`;
  $('#wa-order').hidden = !STATE.cart.length;
}

/* ═════════ OVERLAYS ═════════ */
let openEl = null, lastFocus = null;
function openLayer(sel) {
  if (openEl) closeLayer(true); else lastFocus = document.activeElement;
  openEl = $(sel);
  openEl.classList.add('open');
  $('#scrim').classList.add('on');
  document.body.classList.add('locked');
  $('#nav').classList.remove('open');
  setTimeout(() => openEl?.querySelector('input:not([type=hidden]),button:not([data-close])')?.focus({ preventScroll: true }), 60);
}
function closeLayer(silent) {
  if (!openEl) return;
  const was = openEl; openEl = null;
  was.classList.remove('open');
  $('#scrim').classList.remove('on');
  document.body.classList.remove('locked');
  if (!silent) {
    if (was.id === 'checkout-modal' && CO.step < 4 && STATE.cart.length) return openLayer('#cart');
    lastFocus?.focus?.({ preventScroll: true });
  }
}
function initOverlays() {
  $('#scrim').addEventListener('click', () => closeLayer());
  document.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeLayer(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLayer();
    if (e.key === '/' && !openEl && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
  });
  $$('[data-open-cart]').forEach(b => b.addEventListener('click', () => openLayer('#cart')));
  $$('[data-open-search]').forEach(b => b.addEventListener('click', openSearch));

  $('#cart-items').addEventListener('click', e => {
    const q = e.target.closest('[data-q]');
    if (q) {
      const it = STATE.cart.find(i => i.key === q.dataset.q); if (!it) return;
      const d = +q.dataset.d, p = byId(it.id);
      if (d > 0 && p && roomFor(p, it.length) <= 0) { toast('That’s all we have', `No more ${it.name} · ${it.length} in stock.`); return; }
      it.qty = Math.max(1, it.qty + d); saveCart(); return;
    }
    const rm = e.target.closest('[data-rm]');
    if (rm) { STATE.cart = STATE.cart.filter(i => i.key !== rm.dataset.rm); saveCart(); }
  });

  $('#pm-colors').addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    PM.color = +b.dataset.c;
    $$('.swatch', $('#pm-colors')).forEach(s => { s.classList.toggle('active', s === b); s.setAttribute('aria-pressed', s === b); });
    $('#pm-color-name').textContent = PM.p.colorNames[PM.color] || '';
  });
  $('#pm-lengths').addEventListener('click', e => {
    const b = e.target.closest('[data-l]'); if (!b) return;
    if (b.disabled) return;
    PM.length = b.dataset.l; PM.qty = 1; pmRefresh();
  });
  $('#pm-minus').addEventListener('click', () => { PM.qty = Math.max(1, PM.qty - 1); pmRefresh(); });
  $('#pm-plus').addEventListener('click', () => { PM.qty = Math.min(roomFor(PM.p, PM.length), PM.qty + 1); pmRefresh(); });
  $('#pm-add').addEventListener('click', () => { addToCart(PM.p, PM.qty, PM.length, PM.color); closeLayer(true); });

  const input = $('#search-input'), out = $('#search-results');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { out.innerHTML = ''; return; }
    const hits = PRODUCTS.filter(p => [p.name, p.type, p.category, p.description, ...(p.features || [])].join(' ').toLowerCase().includes(q)).slice(0, 8);
    out.innerHTML = hits.length
      ? hits.map(p => `<button class="sr" data-open="${esc(p.id)}">${esc(p.name)}<span>${esc(p.type)} · ${p.stock <= 0 ? 'Sold out' : priceText(p)}</span></button>`).join('')
      : `<p class="muted" style="padding:16px 0">Nothing for “${esc(input.value)}”. Try “wig”, “bundle” or “lace”.</p>`;
  });
}
function openSearch() { loadProducts(); openLayer('#search'); }

/* ═════════ ACCOUNT (Supabase email code) ═════════ */
function initAuth() {
  $('#account-tile')?.addEventListener('click', async () => {
    if (!LIVE) { toast('Demo mode', 'Accounts switch on once the shop is connected.'); return; }
    await ensureSession();
    if (AUTH.user) { (await sb()).auth.signOut(); AUTH.user = null; renderAccount(); toast('Signed out', 'See you soon.'); return; }
    openAuth();
  });
  const otp = $('#otp');
  otp.innerHTML = Array.from({ length: 6 }, (_, i) => `<input inputmode="numeric" maxlength="1" aria-label="Digit ${i + 1}">`).join('');
  const cells = $$('input', otp);
  cells.forEach((c, i) => {
    c.addEventListener('input', () => { c.value = c.value.replace(/\D/g, ''); if (c.value && cells[i + 1]) cells[i + 1].focus(); });
    c.addEventListener('keydown', e => { if (e.key === 'Backspace' && !c.value && cells[i - 1]) cells[i - 1].focus(); if (e.key === 'Enter') authVerify(); });
    c.addEventListener('paste', e => {
      const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      if (t.length > 1) { e.preventDefault(); t.split('').forEach((d, j) => cells[j] && (cells[j].value = d)); cells[Math.min(5, t.length - 1)].focus(); }
    });
  });
  $('#auth-toggle').addEventListener('click', () => { AUTH.isRegister = !AUTH.isRegister; authHeads(); });
  $('#auth-send').addEventListener('click', authSend);
  $('#auth-email').addEventListener('keydown', e => { if (e.key === 'Enter') authSend(); });
  $('#auth-verify').addEventListener('click', authVerify);
  $('#auth-back').addEventListener('click', () => { cells.forEach(c => c.value = ''); authStep('email'); });
  $('#auth-finish').addEventListener('click', authFinish);
  $('#auth-google')?.addEventListener('click', async () => (await sb())?.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.href.split('#')[0] } }));
  // returning from Google sign-in, or a saved session: restore quietly
  if (LIVE && (/access_token|code=/.test(location.href) || Object.keys(localStorage).some(k => k.startsWith('sb-')))) {
    (window.requestIdleCallback || setTimeout)(() => ensureSession());
  }
  renderAccount();
}
let sessionChecked = false;
async function ensureSession() {
  if (!LIVE || sessionChecked) return AUTH.user;
  const c = await sb();
  const { data: { session } } = await c.auth.getSession();
  sessionChecked = true;
  if (session) { AUTH.user = session.user; await loadProfile(); }
  c.auth.onAuthStateChange((_e, s) => { AUTH.user = s?.user || null; renderAccount(); });
  renderAccount();
  return AUTH.user;
}
async function loadProfile() { try { const { data } = await (await sb()).from('profiles').select('*').eq('id', AUTH.user.id).single(); if (data) AUTH.user.profile = data; } catch {} }
function renderAccount() {
  const el = $('#account-label'); if (!el) return;
  const first = AUTH.user?.profile?.full_name?.split(' ')[0];
  el.textContent = !LIVE ? 'Account (demo)' : AUTH.user ? `Hi ${first || 'queen'} — sign out` : 'Sign in';
}
function openAuth() { AUTH.isRegister = false; authHeads(); authStep('email'); status('#auth-status', ''); openLayer('#auth-modal'); }
function authHeads() {
  $('#auth-title').textContent = AUTH.isRegister ? 'Join the circle' : 'Welcome back';
  $('#auth-toggle').textContent = AUTH.isRegister ? 'Already have an account? Sign in' : 'New here? Create an account';
}
function authStep(s) { ['email', 'otp', 'name'].forEach(k => $(`#auth-step-${k}`).hidden = k !== s); }
function status(sel, msg, type = '') { const el = $(sel); el.textContent = msg; el.className = 'status ' + type; }
async function authSend() {
  const email = $('#auth-email').value.trim();
  if (!validEmail(email)) { status('#auth-status', 'Enter a valid email address.', 'err'); return; }
  const b = $('#auth-send'); b.disabled = true; b.textContent = 'Sending…';
  const { error } = await (await sb()).auth.signInWithOtp({ email });
  b.disabled = false; b.textContent = 'Send code';
  if (error) { status('#auth-status', error.message, 'err'); return; }
  AUTH.otpEmail = email; $('#otp-email').textContent = email;
  authStep('otp'); status('#auth-status', 'Check your inbox for the code.');
  setTimeout(() => $('#otp input').focus(), 60);
}
async function authVerify() {
  const token = $$('#otp input').map(c => c.value).join('');
  if (token.length < 6) { status('#auth-status', 'Enter all 6 digits.', 'err'); return; }
  const { data, error } = await (await sb()).auth.verifyOtp({ email: AUTH.otpEmail, token, type: 'email' });
  if (error) { status('#auth-status', 'That code didn’t work. Try again.', 'err'); return; }
  AUTH.user = data.user; sessionChecked = true; await loadProfile();
  if (!AUTH.user.profile?.full_name) { authStep('name'); status('#auth-status', ''); setTimeout(() => $('#auth-name').focus(), 60); return; }
  authDone();
}
async function authFinish() {
  const name = $('#auth-name').value.trim();
  if (!name) { status('#auth-status', 'Please add your name.', 'err'); return; }
  await (await sb()).from('profiles').upsert({ id: AUTH.user.id, full_name: name, email: AUTH.user.email });
  AUTH.user.profile = { full_name: name };
  authDone();
}
function authDone() {
  renderAccount(); closeLayer(true);
  toast('Welcome', `Signed in as ${AUTH.user.email}`);
  if (window._bsPendingCheckout) { window._bsPendingCheckout = false; openCheckout(); }
}

/* ═════════ CHECKOUT ═════════ */
const fee = () => DELIVERY_FEES[CO.delivery.state] ?? 3500;
const total = () => subtotal() + (CO.delivery.state ? fee() : 0);
const acctReady = () => !/^0+$/.test(CFG.accessBankAcct);

function initCheckout() {
  $('#del-state').insertAdjacentHTML('beforeend', stateOptions());
  $('#del-state').addEventListener('change', e => {
    const s = e.target.value;
    $('#del-fee').textContent = s ? `${fmt(DELIVERY_FEES[s] ?? 3500)} · ${DELIVERY_TIMES[DELIVERY_FEES[s]] || '2–4 days'}` : '— choose state';
  });
  $('#checkout-btn').addEventListener('click', async () => {
    if (!STATE.cart.length) return;
    if (LIVE && !(await ensureSession())) { window._bsPendingCheckout = true; openAuth(); return; }
    openCheckout();
  });
  $('#co-next').addEventListener('click', coNext);
  $('#co-back').addEventListener('click', () => { if (CO.step > 1) coStep(CO.step - 1); });
  $$('.pay-opt').forEach(b => b.addEventListener('click', () => {
    CO.pay = b.dataset.pay;
    $$('.pay-opt').forEach(x => x.classList.toggle('selected', x === b));
    $('#acct-copy').hidden = CO.pay !== 'transfer' || !acctReady();
    $('#co-next').textContent = CO.pay === 'card' ? 'Pay now' : 'Place order';
    status('#pay-status', '');
  }));
  $('#acct-copy').addEventListener('click', () => {
    navigator.clipboard?.writeText(CFG.accessBankAcct).then(() => toast('Copied', 'Account number copied.')).catch(() => toast('Account number', CFG.accessBankAcct));
  });
}
function openCheckout() {
  CO.step = 1; CO.delivery = {}; CO.pay = 'card'; CO.order = null;
  $$('.pay-opt').forEach(x => x.classList.toggle('selected', x.dataset.pay === 'card'));
  $('#acct-copy').hidden = true;
  coStep(1);
  openLayer('#checkout-modal');
  if (AUTH.user) {
    if (!$('#del-email').value) $('#del-email').value = AUTH.user.email || '';
    if (!$('#del-name').value && AUTH.user.profile?.full_name) $('#del-name').value = AUTH.user.profile.full_name;
  }
}
function summary(withFee) {
  const rows = STATE.cart.map(i => `<div class="r"><span>${esc(i.name)} (${esc(i.length)}) × ${i.qty}</span><span>${fmt(i.price * i.qty)}</span></div>`).join('');
  const f = withFee && CO.delivery.state ? `<div class="r"><span>Delivery — ${esc(CO.delivery.state)}</span><span>${fmt(fee())}</span></div>` : '';
  return `<div class="sum">${rows}${f}<div class="r t"><span>Total</span><span>${fmt(withFee ? total() : subtotal())}</span></div></div>`;
}
function coStep(n) {
  CO.step = n;
  if (n < 3) CO.order = null;   // details changed → a fresh order is saved at payment
  $$('#co-dots span').forEach((s, i) => { s.classList.toggle('on', i + 1 === n); s.classList.toggle('done', i + 1 < n); });
  for (let i = 1; i <= 4; i++) $(`#co-step-${i}`).hidden = i !== n;
  $('#co-title').textContent = ['Review order', 'Delivery details', 'Payment', 'Order placed'][n - 1];
  $('#co-foot').hidden = n === 4;
  $('#co-back').style.visibility = n > 1 ? 'visible' : 'hidden';
  const next = $('#co-next'); next.disabled = false;
  if (n === 1) { $('#co-review').innerHTML = summary(false); next.textContent = 'Next'; }
  if (n === 2) { next.textContent = 'Continue to payment'; }
  if (n === 3) {
    $('#co-pay-summary').innerHTML = summary(true);
    $('#acct-num').textContent = acctReady() ? CFG.accessBankAcct : 'details sent after order';
    next.textContent = CO.pay === 'card' ? 'Pay now' : 'Place order';
    status('#pay-status', '');
  }
}
function coNext() {
  if (CO.step === 1) return coStep(2);
  if (CO.step === 2) {
    const f = { name: 'full name', phone: 'phone number', email: 'email', address: 'street address', city: 'city / LGA', state: 'state' };
    for (const [k, label] of Object.entries(f)) {
      const el = $(`#del-${k}`);
      if (!el.value.trim()) { toast('Missing details', `Please add your ${label}.`); el.focus(); return; }
    }
    if (!validEmail($('#del-email').value.trim())) { toast('Check your email', 'That address doesn’t look right.'); $('#del-email').focus(); return; }
    CO.delivery = Object.fromEntries(['name', 'phone', 'email', 'address', 'city', 'state', 'notes'].map(k => [k, $(`#del-${k}`).value.trim()]));
    return coStep(3);
  }
  if (CO.step === 3) CO.pay === 'card' ? payCard() : payTransfer();
}
/* LIVE: save the order first (as "Waiting for payment"). The database
   re-prices the items and recalculates the total, so the amount charged
   always matches the shop's real prices. */
async function placeOrder(kind) {
  const c = await sb();
  const { data, error } = await c.rpc('place_order', {
    p_items: STATE.cart.map(i => ({ product_id: Number(i.id) || null, product_name: i.name, length: i.length, color: i.color, quantity: i.qty })),
    p_delivery: CO.delivery, p_state: CO.delivery.state, p_fee: fee(),
    p_method: kind === 'card' ? 'Paystack Card' : 'Bank Transfer – Access Bank',
    p_ref: kind === 'card' ? null : `BS-TRF-${Date.now()}`,
  });
  if (error) { const e = new Error(error.message); e.stock = /left of|sold out|no longer available/i.test(error.message); throw e; }
  return { id: data.id, short: String(data.id).split('-')[0].toUpperCase(), total: Number(data.total ?? total()) };
}
function busy(label) { const n = $('#co-next'); n.disabled = true; n.textContent = label; }
function unbusy(label) { const n = $('#co-next'); n.disabled = false; n.textContent = label; }
function orderDone(short, message) {
  $('#co-order-id').textContent = '#' + short;
  $('#co-success').textContent = message;
  STATE.cart = []; saveCart(); CO.order = null;
  coStep(4);
}
async function payCard() {
  if (!LIVE || CFG.paystackPublicKey.includes('YOUR_')) {
    status('#pay-status', 'Card payment switches on once the Paystack key is added. Please choose bank transfer for now.', 'err');
    return;
  }
  busy('Opening Paystack…');
  try {
    CO.order = CO.order || await placeOrder('card');
    if (!window.PaystackPop) await loadScript('https://js.paystack.co/v1/inline.js');
    const o = CO.order;
    PaystackPop.setup({
      key: CFG.paystackPublicKey, email: CO.delivery.email, amount: Math.round(o.total * 100), currency: 'NGN',
      metadata: { order_id: o.id, custom_fields: [{ display_name: 'Order', variable_name: 'order', value: '#' + o.short }, { display_name: 'Customer', variable_name: 'customer', value: CO.delivery.name }, { display_name: 'Phone', variable_name: 'phone', value: CO.delivery.phone }] },
      callback: r => { verifyCard(o, r.reference); },
      onClose: () => { unbusy('Pay now'); status('#pay-status', 'Payment window closed. Your order is saved — tap Pay now to try again.', 'err'); },
    }).openIframe();
  } catch (err) {
    console.error('[BS] card error', err);
    unbusy('Pay now');
    if (err.stock) { status('#pay-status', err.message, 'err'); refreshStock(); return; }
    status('#pay-status', 'Couldn’t start the payment. Check your connection, or pay by bank transfer.', 'err');
  }
}
async function verifyCard(o, reference) {
  busy('Confirming payment…');
  let paid = false;
  try {
    const { data, error } = await (await sb()).functions.invoke('paystack-verify', { body: { order_id: o.id, reference } });
    paid = !error && data?.paid === true;
  } catch {}
  orderDone(o.short, paid
    ? `Payment confirmed — ${fmt(o.total)}. We’ll email you a receipt and send updates on WhatsApp until it’s at your door.`
    : `Payment received (ref ${reference}). We’re confirming it now and will email you shortly.`);
}
async function payTransfer() {
  busy('Placing order…');
  try {
    let short, amount;
    if (LIVE) {
      const o = await placeOrder('transfer');
      short = o.short; amount = o.total;
      (await sb()).functions.invoke('order-notify', { body: { order_id: o.id, event: 'placed' } }).catch(() => {});
    } else {
      short = Math.random().toString(36).slice(2, 10).toUpperCase(); amount = total();
      const orders = store.get('bs_demo_orders', []);
      orders.unshift({ id: short, method: 'Bank Transfer – Access Bank', amount, delivery: CO.delivery, items: STATE.cart, at: new Date().toISOString() });
      store.set('bs_demo_orders', orders);
    }
    orderDone(short, acctReady()
      ? `Please transfer ${fmt(amount)} to Access Bank ${CFG.accessBankAcct} (${CFG.accessBankName}) and send the receipt on WhatsApp with order #${short}. We confirm within 24 hours.`
      : `We’ll send our bank details by email or WhatsApp shortly. Please quote order #${short} with your payment.`);
  } catch (err) {
    console.error('[BS] order error', err);
    unbusy('Try again');
    if (err.stock) { status('#pay-status', err.message, 'err'); refreshStock(); return; }
    status('#pay-status', 'Something went wrong placing your order. Try again or message us on WhatsApp.', 'err');
  }
}
