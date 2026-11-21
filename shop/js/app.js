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
let PRODUCTS = STORE_DATA.products;
let productsReady = null;
function loadProducts() {
  if (productsReady) return productsReady;
  productsReady = (async () => {
    if (!LIVE) return PRODUCTS;
    try {
      const c = JSON.parse(sessionStorage.getItem('bs_products') || 'null');
      if (c && Date.now() - c.t < 5 * 60e3 && c.rows.length) return (PRODUCTS = c.rows);
    } catch {}
    try {
      const r = await fetch(`${CFG.supabaseUrl}/rest/v1/products?select=*&visible=eq.true&order=sort.asc,id.asc`, {
        headers: { apikey: CFG.supabaseAnonKey, Authorization: `Bearer ${CFG.supabaseAnonKey}` },
      });
      if (r.ok) {
        const rows = (await r.json()).map(fromRow);
        if (rows.length) {
          PRODUCTS = rows;
          try { sessionStorage.setItem('bs_products', JSON.stringify({ t: Date.now(), rows })); } catch {}
        }
      }
    } catch (e) { console.warn('[BS] using data.js products', e); }
    return PRODUCTS;
  })();
  return productsReady;
}
function fromRow(r) {
  return {
    id: r.id, name: r.name, type: r.type || '', category: r.category || 'wigs',
    price: +r.price, oldPrice: r.old_price ? +r.old_price : null,
    lengths: r.lengths?.length ? r.lengths : ['Standard'],
    colors: r.colors?.length ? r.colors : ['#1a1008'], colorNames: r.color_names?.length ? r.color_names : ['Natural Black'],
    description: r.description || '', features: r.features || [],
    image: r.image_url || '', stock: r.stock ?? 0, hot: r.badge === 'hot', new: r.badge === 'new',
  };
}
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
  initReveal();
  if (!LIVE) showDemoBar();
  const page = { index: pageHome, shop: pageShop, care: pageCare, quiz: pageQuiz, delivery: pageDelivery, contact: pageContact }[document.body.dataset.page];
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
    <div class="pm-opt"><span class="eyebrow">Length</span><div class="chips small" id="pm-lengths"></div></div>
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
    <div class="or"><span>or</span></div>
    <button class="btn oval full" id="auth-google">Continue with Google</button>
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
  $$('.stats, .pack, .quote, .zone, .channels, .duo-card, .condensed, .wide-italic').forEach(el => { el.classList.add('rv'); revealIO.observe(el); });
}
const reveal = els => els.forEach(el => revealIO ? (el.classList.add('rv'), revealIO.observe(el)) : null);

/* ── product cards ──────────────────────────────────────── */
function cardHTML(p) {
  const badge = p.hot ? 'Bestseller' : p.new ? 'New in' : '';
  return `<a class="card" href="shop.html#p-${esc(p.id)}" data-open="${esc(p.id)}">
    <div class="card-img">${badge ? `<span class="card-badge">${badge}</span>` : ''}${imgTag(p.image, p.type)}</div>
    <div class="card-meta">${esc(p.name)}</div>
    <div class="card-price">${fmt(p.price)}${p.oldPrice ? `<s>${fmt(p.oldPrice)}</s>` : ''}</div>
  </a>`;
}
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]');
  if (o && !o.closest('.slider')) { e.preventDefault(); openProduct(o.dataset.open); }
});

/* ═════════ HOME ═════════ */
async function pageHome() {
  initLit();
  initLazyVideo();
  $('#quotes').innerHTML = STORE_DATA.testimonials.slice(0, 3).map(t => `
    <blockquote class="quote"><p>“${esc(t.body)}”</p>
      <footer><div class="who"><b>${esc(t.name)}</b><span>${esc(t.location)}</span></div><span class="stars" aria-label="${t.stars} stars">${'★'.repeat(t.stars)}</span></footer>
    </blockquote>`).join('');
  reveal($$('.quote'));
  await loadProducts();
  const picks = [...PRODUCTS].sort((a, b) => (b.hot - a.hot) || (b.new - a.new)).slice(0, 4);
  $('#home-grid').innerHTML = picks.map(cardHTML).join('');
  reveal($$('#home-grid .card'));
}

function initLit() {
  const el = $('#lit-text'); if (!el) return;
  const hot = new Set(['inspected', 'scented', 'boxed', 'anywhere']);
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

function initLazyVideo() {
  $$('video[data-lazy-video]').forEach(v => {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
    }, { rootMargin: '100px' }).observe(v);
  });
}

/* ═════════ SHOP ═════════ */
async function pageShop() {
  await loadProducts();
  let featured = PRODUCTS.filter(p => p.hot || p.new);
  if (featured.length < 3) featured = PRODUCTS.slice(0, 8);
  initSlider(featured);

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
    ${p.hot ? '<span class="card-badge">Bestseller</span>' : p.new ? '<span class="card-badge">New in</span>' : ''}${imgTag(p.image, p.type, i < 3)}</div>`).join('');
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
    $('#stage-price').textContent = p.oldPrice ? `${fmt(p.price)} — was ${fmt(p.oldPrice)}` : fmt(p.price);
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
function pageCare() {
  const B = STORE_DATA.knowledge.basics;
  $('#steps-list').innerHTML = B.map((b, i) => `<div class="step" data-i="${i}"><h3>${esc(b.title)}</h3><p>${esc(b.body)}</p></div>`).join('');
  $('#step-bars').innerHTML = B.map(() => '<i></i>').join('');
  const set = i => {
    $('#step-num').textContent = B[i].num;
    $('#step-of').textContent = `Step ${i + 1} of ${B.length}`;
    $$('#step-bars i').forEach((b, j) => b.classList.toggle('on', j <= i));
    $$('.step').forEach((s, j) => s.classList.toggle('on', j === i));
  };
  set(0);
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(+e.target.dataset.i); }), { rootMargin: '-45% 0px -45% 0px' });
  $$('.step').forEach(s => io.observe(s));

  const care = STORE_DATA.knowledge.care, tabs = Object.keys(care);
  $('#care-tabs').innerHTML = tabs.map((t, i) => `<button class="chip${i ? '' : ' active'}" data-t="${esc(t)}" aria-pressed="${!i}">${esc(t)}</button>`).join('');
  const render = t => {
    $('#care-list').innerHTML = care[t].map((c, i) => `<details><summary><span>${String(i + 1).padStart(2, '0')}</span>${esc(c.title)}</summary><p>${esc(c.body)}</p></details>`).join('');
  };
  $('#care-tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    $$('#care-tabs .chip').forEach(c => { c.classList.toggle('active', c === b); c.setAttribute('aria-pressed', c === b); });
    render(b.dataset.t);
  });
  render(tabs[0]);
}

/* ═════════ QUIZ ═════════ */
const QUIZ_CHAPTERS = ['Lifestyle', 'Styling time', 'Texture', 'Priority', 'Budget'];
const Q = { step: 0, answers: [] };
function pageQuiz() {
  loadProducts();
  $('#quiz-index').innerHTML = QUIZ_CHAPTERS.map(c => `<li>${c}</li>`).join('') + '<li>Your match</li>';
  $('#quiz-body').addEventListener('click', async e => {
    const o = e.target.closest('[data-a]');
    if (o) { Q.answers[Q.step] = +o.dataset.a; Q.step++; if (Q.step >= STORE_DATA.quiz.length) await loadProducts(); renderQuiz(); return; }
    if (e.target.closest('#q-back')) { Q.step = Math.max(0, Q.step - 1); renderQuiz(); return; }
    if (e.target.closest('#q-retake')) { Q.step = 0; Q.answers = []; renderQuiz(); return; }
    const add = e.target.closest('[data-qadd]');
    if (add) { const p = byId(add.dataset.qadd); addToCart(p, 1, p.lengths[0], 0); }
  });
  renderQuiz();
}
function renderQuiz() {
  const QS = STORE_DATA.quiz, s = Q.step;
  $$('#quiz-index li').forEach((li, i) => { li.classList.toggle('on', i === s); li.classList.toggle('done', i < s); });
  $('#quiz-progress').style.width = (s / QS.length * 100) + '%';
  const body = $('#quiz-body');
  if (s < QS.length) {
    body.innerHTML = `
      <p class="q-count">Question ${s + 1} of ${QS.length}</p>
      <h2 class="q-title">${esc(QS[s].q)}</h2>
      <div class="q-opts">${QS[s].options.map((o, i) => `<button class="q-opt" style="animation-delay:${i * 60}ms" data-a="${i}">${esc(o)}</button>`).join('')}</div>
      ${s ? '<button class="q-back" id="q-back">← Back</button>' : ''}`;
    return;
  }
  const p = quizMatch(Q.answers);
  body.innerHTML = `
    <div class="q-result">
      <div class="card-img">${imgTag(p.image, p.type, true)}</div>
      <div>
        <p class="q-count" style="margin:0">Your match</p>
        <h2>${esc(p.name)}</h2>
        <p>${esc(p.description)}</p>
        <div class="btns">
          <button class="btn pink" data-qadd="${esc(p.id)}">Add to cart — ${fmt(p.price)} <i>→</i></button>
          <button class="btn oval" data-open="${esc(p.id)}">See details</button>
        </div>
        <button class="q-back" id="q-retake">Retake the quiz</button>
      </div>
    </div>`;
}
function quizMatch(a) {
  const textures = [/straight|bone|silky/i, /body wave|water wave|loose|wave/i, /deep|curl/i, /kinky|coily|afro|4c/i];
  const max = [50000, 80000, 120000, Infinity][a[4] ?? 3];
  const rx = textures[a[2] ?? 0];
  let pool = PRODUCTS.filter(p => rx.test(`${p.name} ${p.type}`));
  if (!pool.length) pool = [...PRODUCTS];
  const easy = a[1] === 0 || a[3] === 3;
  pool.sort((x, y) => (easy ? (/glueless/i.test(y.name) - /glueless/i.test(x.name)) : 0) || (y.hot - x.hot));
  return pool.find(p => p.price <= max) || [...pool].sort((x, y) => x.price - y.price)[0] || PRODUCTS[0];
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
          headers: { apikey: CFG.supabaseAnonKey, Authorization: `Bearer ${CFG.supabaseAnonKey}`, 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal' },
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
  Object.assign(PM, { p, qty: 1, length: p.lengths[0], color: 0 });
  $('#pm-img').innerHTML = imgTag(p.image, p.type, true);
  $('#pm-type').textContent = p.type;
  $('#pm-name').textContent = p.name;
  $('#pm-price').innerHTML = fmt(p.price) + (p.oldPrice ? `<s>${fmt(p.oldPrice)}</s>` : '');
  $('#pm-colors').innerHTML = p.colors.map((c, i) => `<button class="swatch${i ? '' : ' active'}" style="background:${esc(c)}" data-c="${i}" aria-label="${esc(p.colorNames[i] || 'Colour ' + (i + 1))}" aria-pressed="${!i}"></button>`).join('');
  $('#pm-color-name').textContent = p.colorNames[0] || '';
  $('#pm-lengths').innerHTML = p.lengths.map((l, i) => `<button class="chip${i ? '' : ' active'}" data-l="${esc(l)}" aria-pressed="${!i}">${esc(l)}</button>`).join('');
  $('#pm-desc').textContent = p.description;
  $('#pm-features').innerHTML = (p.features || []).map(f => `<li>${esc(f)}</li>`).join('');
  $('.pm-more').open = false;
  $('#pm-qty').textContent = 1;
  const out = p.stock !== undefined && p.stock <= 0;
  $('#pm-add').disabled = out; $('#pm-add').textContent = out ? 'Sold out' : 'Add to cart';
  openLayer('#product-modal');
}

/* ═════════ CART ═════════ */
function addToCart(p, qty, length, color) {
  const key = `${p.id}-${length}-${color}`;
  const ex = STATE.cart.find(i => i.key === key);
  if (ex) ex.qty += qty;
  else STATE.cart.push({ key, id: p.id, name: p.name, price: p.price, qty, length, color: p.colorNames[color] || '', image: p.image });
  saveCart();
  toast('Added to cart', `${p.name} · ${length}`);
  $$('[data-cart-count]').forEach(c => { c.classList.add('bump'); setTimeout(() => c.classList.remove('bump'), 300); });
}
function saveCart() { store.set('bs_cart', STATE.cart); updateCartUI(); }
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
        <div class="c-qty"><button data-q="${esc(i.key)}" data-d="-1" aria-label="One less">−</button>${i.qty}<button data-q="${esc(i.key)}" data-d="1" aria-label="One more">+</button></div>
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
    if (q) { const it = STATE.cart.find(i => i.key === q.dataset.q); if (it) { it.qty = Math.max(1, it.qty + +q.dataset.d); saveCart(); } return; }
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
    PM.length = b.dataset.l;
    $$('.chip', $('#pm-lengths')).forEach(s => { s.classList.toggle('active', s === b); s.setAttribute('aria-pressed', s === b); });
  });
  $('#pm-minus').addEventListener('click', () => { PM.qty = Math.max(1, PM.qty - 1); $('#pm-qty').textContent = PM.qty; });
  $('#pm-plus').addEventListener('click', () => { PM.qty = Math.min(10, PM.qty + 1); $('#pm-qty').textContent = PM.qty; });
  $('#pm-add').addEventListener('click', () => { addToCart(PM.p, PM.qty, PM.length, PM.color); closeLayer(true); });

  const input = $('#search-input'), out = $('#search-results');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { out.innerHTML = ''; return; }
    const hits = PRODUCTS.filter(p => [p.name, p.type, p.category, p.description, ...(p.features || [])].join(' ').toLowerCase().includes(q)).slice(0, 8);
    out.innerHTML = hits.length
      ? hits.map(p => `<button class="sr" data-open="${esc(p.id)}">${esc(p.name)}<span>${esc(p.type)} · ${fmt(p.price)}</span></button>`).join('')
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
  $('#auth-google').addEventListener('click', async () => (await sb())?.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.href.split('#')[0] } }));
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
  CO.step = 1; CO.delivery = {}; CO.pay = 'card';
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
  if (CO.step === 3) CO.pay === 'card' ? payCard() : confirmOrder(`BS-TRF-${Date.now()}`, 'Bank Transfer – Access Bank');
}
async function payCard() {
  if (!LIVE || CFG.paystackPublicKey.includes('YOUR_')) {
    status('#pay-status', 'Card payment switches on once the Paystack key is added. Please choose bank transfer for now.', 'err');
    return;
  }
  const next = $('#co-next'); next.disabled = true; next.textContent = 'Opening Paystack…';
  try {
    if (!window.PaystackPop) await loadScript('https://js.paystack.co/v1/inline.js');
    PaystackPop.setup({
      key: CFG.paystackPublicKey, email: CO.delivery.email, amount: total() * 100, currency: 'NGN', ref: `BS-${Date.now()}`,
      metadata: { custom_fields: [{ display_name: 'Customer', variable_name: 'customer', value: CO.delivery.name }, { display_name: 'Phone', variable_name: 'phone', value: CO.delivery.phone }] },
      callback: r => confirmOrder(r.reference, 'Paystack Card'),
      onClose: () => { next.disabled = false; next.textContent = 'Pay now'; status('#pay-status', 'Payment window closed. Try again when you’re ready.', 'err'); },
    }).openIframe();
  } catch {
    next.disabled = false; next.textContent = 'Pay now';
    status('#pay-status', 'Couldn’t reach Paystack. Check your connection or pay by transfer.', 'err');
  }
}
async function confirmOrder(ref, method) {
  const next = $('#co-next'); next.disabled = true; next.textContent = 'Placing order…';
  const amount = total();
  let id;
  try {
    if (LIVE) {
      const c = await sb();
      const { data, error } = await c.from('orders').insert([{
        user_id: AUTH.user.id, status: method.includes('Transfer') ? 'Pending' : 'Processing',
        total_amount: amount, payment_method: method, payment_ref: ref,
        delivery_state: CO.delivery.state, delivery_address: CO.delivery,
      }]).select().single();
      if (error) throw error;
      const { error: e2 } = await c.from('order_items').insert(STATE.cart.map(i => ({
        order_id: data.id, product_id: Number(i.id) || null, product_name: i.name, length: i.length, color: i.color, quantity: i.qty, unit_price: i.price,
      })));
      if (e2) throw e2;
      id = String(data.id).split('-')[0].toUpperCase();
    } else {
      id = Math.random().toString(36).slice(2, 10).toUpperCase();
      const orders = store.get('bs_demo_orders', []);
      orders.unshift({ id, ref, method, amount, delivery: CO.delivery, items: STATE.cart, at: new Date().toISOString() });
      store.set('bs_demo_orders', orders);
    }
    $('#co-order-id').textContent = '#' + id;
    $('#co-success').textContent = method.includes('Transfer')
      ? (acctReady()
        ? `Please transfer ${fmt(amount)} to Access Bank ${CFG.accessBankAcct} (${CFG.accessBankName}) and send the receipt on WhatsApp with order #${id}. We confirm within 24 hours.`
        : `We’ll send our bank details on WhatsApp or email shortly. Please quote order #${id} with your payment.`)
      : `Payment received. Your order is on its way to ${CO.delivery.city}, ${CO.delivery.state}.`;
    STATE.cart = []; saveCart();
    coStep(4);
  } catch (err) {
    console.error('[BS] order error', err);
    next.disabled = false; next.textContent = 'Try again';
    status('#pay-status', 'Something went wrong placing your order. Try again or message us on WhatsApp.', 'err');
  }
}
