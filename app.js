/* ============================================================
   BADDIE STRANDS — site logic
   Products, prices and copy live in data.js.
   ============================================================ */
'use strict';

/* ── CONFIG ─────────────────────────────────────────────── */
const BS_CONFIG = {
  paystackPublicKey: 'pk_live_YOUR_PAYSTACK_PUBLIC_KEY',
  adminEmail:        'baddiestrands@gmail.com',
  accessBankAcct:    '0000000000',   // replace with the real account number
  accessBankName:    'Baddie Strands',
  whatsappNum:       '2347033247980',
};

/* Brand images. Drop the files into the site folder with these names.
   The banner tries each file in order and uses the first that exists. */
const BS_ASSETS = {
  logo:   'assets/logo.png',
  banner: ['assets/banner.jpg', 'assets/banner.png'],
};

const DEMO = !window.BS_SUPABASE_READY;
const db = DEMO ? null : window.supabase;

/* ── HELPERS ────────────────────────────────────────────── */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => '₦' + Number(n).toLocaleString('en-NG');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const P = STORE_DATA.products;
const byId = id => P.find(p => p.id === id);
const TYPE_WORD = p => p.type.replace(/ (Wig|Deal|Extensions?)$/i, '').toUpperCase() || p.category.toUpperCase();
const lengthRange = p => p.lengths.length > 1 ? `${p.lengths[0]}–${p.lengths[p.lengths.length - 1]}` : p.lengths[0];
function openLink(url) { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); }

/* images that fail (no photo yet) become a branded tile */
function fallbackFor(img) {
  if (img.classList.contains('logo-img') || img.id === 'banner-img' || img.closest('.foot-word,.ft,#loader,.fallback') || img.dataset.fb) return;
  img.dataset.fb = '1';
  const d = document.createElement('div');
  d.className = 'fallback';
  d.innerHTML = `<img src="${BS_ASSETS.logo}" alt=""><small>${esc(img.dataset.label || img.alt || '')}</small>`;
  img.replaceWith(d);
}
document.addEventListener('error', e => { if (e.target.tagName === 'IMG') fallbackFor(e.target); }, true);
const imgTag = (src, label) => `<img src="${esc(src)}" alt="${esc(label)}" data-label="${esc(label)}" loading="lazy">`;

/* ── STATE ──────────────────────────────────────────────── */
const STATE = {
  cart: store.get('bs_cart', []),
  wish: store.get('bs_wishlist', []),
  filter: 'all',
  stageIdx: 0,
  quizStep: 0,
  quizAnswers: [],
  careTab: Object.keys(STORE_DATA.knowledge.care)[0],
};
const AUTH = { user: null, otpEmail: null, isRegister: false };
const CO = { step: 1, delivery: {}, pay: 'card' };
const PM = { p: null, qty: 1, length: null, color: 0 };

/* ── BOOT ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initAssets();
  initLoader();
  initMode();
  initNav();
  initLit();
  initMarquee();
  initShop();
  initKnowledge();
  initQuiz();
  initReviews();
  initDelivery();
  initForms();
  initOverlays();
  initCheckout();
  initAuth();
  initReveal();
  updateCartUI();
  if (DEMO) {
    let gone = false; try { gone = sessionStorage.getItem('bs_demo_x'); } catch {}
    if (!gone) $('#demo-bar').hidden = false;
    $('#demo-x').addEventListener('click', () => { $('#demo-bar').hidden = true; try { sessionStorage.setItem('bs_demo_x', '1'); } catch {} });
  }
});

/* ── ASSETS: logo + banner ─────────────────────────────── */
function initAssets() {
  const logo = $('.logo'), li = $('.logo-img');
  li.addEventListener('error', () => logo.classList.add('text'));
  li.src = BS_ASSETS.logo;
  if (li.complete && !li.naturalWidth) logo.classList.add('text');

  const wrap = $('.banner-wrap'), bi = $('#banner-img');
  let i = 0;
  const tryNext = () => {
    if (i >= BS_ASSETS.banner.length) { wrap.classList.add('no-img'); return; }
    bi.src = BS_ASSETS.banner[i++];
  };
  bi.addEventListener('error', tryNext);
  bi.addEventListener('load', () => wrap.classList.add('in'));
  $$('.ft img').forEach(im => im.addEventListener('error', () => im.closest('.ft').remove()));
  tryNext();

  // any image that already failed before this script ran
  $$('img').forEach(im => { if (im.complete && im.getAttribute('src') && !im.naturalWidth) fallbackFor(im); });
}

/* ── LOADER ─────────────────────────────────────────────── */
function initLoader() {
  const el = $('#loader'), pct = $('#loader-pct'), fill = $('#loader-fill');
  const seen = (() => { try { return sessionStorage.getItem('bs_seen'); } catch { return null; } })();
  const dur = seen ? 500 : 1700;
  const t0 = performance.now();
  const tick = now => {
    const k = Math.min(1, (now - t0) / dur);
    const v = Math.round((1 - Math.pow(1 - k, 3)) * 100);
    pct.textContent = v; fill.style.width = v + '%';
    if (k < 1) requestAnimationFrame(tick);
    else setTimeout(() => {
      el.classList.add('done');
      document.body.classList.add('ready');
      try { sessionStorage.setItem('bs_seen', '1'); } catch {}
      if (/^#[a-z][\w-]*$/i.test(location.hash)) setTimeout(() => $(location.hash)?.scrollIntoView(), 60);
      setTimeout(() => el.remove(), 1100);
    }, 180);
  };
  requestAnimationFrame(tick);
}

/* ── PINK MODE ──────────────────────────────────────────── */
function initMode() {
  const t = $('#mode-toggle');
  const apply = on => { document.body.classList.toggle('pink-mode', on); t.checked = on; };
  apply(store.get('bs_pink_mode', false));
  t.addEventListener('change', () => { apply(t.checked); store.set('bs_pink_mode', t.checked); });
}

/* ── NAV + MENU + SCROLL LINE ───────────────────────────── */
function initNav() {
  const nav = $('#nav'), btn = $('#menu-btn');
  const setOpen = o => { nav.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); };
  btn.addEventListener('click', e => { e.stopPropagation(); setOpen(!nav.classList.contains('open')); });
  $$('#menu-panel a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('click', e => { if (!nav.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });

  const line = $('#scroll-line');
  const links = $$('.nav-links a');
  const secs = links.map(a => $(a.getAttribute('href')));
  const onScroll = () => {
    const h = document.documentElement;
    line.style.width = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) * 100) + '%';
    const y = window.innerHeight * .4;
    links.forEach((a, i) => { const r = secs[i]?.getBoundingClientRect(); a.classList.toggle('on', !!r && r.top < y && r.bottom > y); });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── STATEMENT: words light up on scroll ───────────────── */
function initLit() {
  const el = $('#lit-text');
  const hot = new Set(['finest', 'virgin', 'anywhere']);
  el.innerHTML = el.textContent.trim().split(/\s+/).map(w => {
    const bare = w.toLowerCase().replace(/[^a-z]/g, '');
    return `<span class="w${hot.has(bare) ? ' h' : ''}">${esc(w)}</span>`;
  }).join(' ');
  const words = $$('.w', el);
  const run = () => {
    const r = el.getBoundingClientRect(), vh = window.innerHeight;
    const k = Math.min(1, Math.max(0, (vh * .85 - r.top) / (r.height + vh * .35)));
    const n = Math.round(k * words.length);
    words.forEach((w, i) => { const on = i < n; w.classList.toggle('on', on && !w.classList.contains('h')); w.classList.toggle('hot', on && w.classList.contains('h')); });
  };
  window.addEventListener('scroll', run, { passive: true });
  run();
}

/* ── MARQUEE ────────────────────────────────────────────── */
function initMarquee() {
  const cities = ['Abuja', 'Lagos', 'Port Harcourt', 'Enugu', 'Ibadan', 'London', 'Accra', 'Houston', 'Toronto', 'Manchester'];
  const html = cities.map(c => `<span>${c}</span>`).join('');
  $('#marquee-inner').innerHTML = html + html;
}

/* ── SHOP: stage carousel + grid ───────────────────────── */
const filtered = () => STATE.filter === 'all' ? P : P.filter(p => p.category === STATE.filter);

function initShop() {
  const cats = [['all', 'All'], ['wigs', 'Wigs'], ['bundles', 'Bundles'], ['extensions', 'Extensions']];
  const chips = $('#chips');
  chips.innerHTML = cats.map(([k, l]) => {
    const n = k === 'all' ? P.length : P.filter(p => p.category === k).length;
    return `<button class="chip${k === 'all' ? ' active' : ''}" data-f="${k}">${l}<b>${n}</b></button>`;
  }).join('');
  chips.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    $$('.chip', chips).forEach(c => c.classList.toggle('active', c === b));
    STATE.filter = b.dataset.f; STATE.stageIdx = 0;
    renderStage(true); renderGrid();
  });

  $('#stage-prev').addEventListener('click', () => stageGo(-1));
  $('#stage-next').addEventListener('click', () => stageGo(1));
  $('#stage-discover').addEventListener('click', () => openProduct(filtered()[STATE.stageIdx].id));
  $('#stage-track').addEventListener('click', e => {
    const it = e.target.closest('.s-item'); if (!it) return;
    const i = +it.dataset.i;
    i === STATE.stageIdx ? openProduct(+it.dataset.id) : (STATE.stageIdx = i, renderStage());
  });
  // swipe
  let sx = null;
  const st = $('#stage');
  st.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  st.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) stageGo(dx < 0 ? 1 : -1); sx = null; });
  document.addEventListener('keydown', e => {
    if (document.body.classList.contains('locked')) return;
    const r = st.getBoundingClientRect();
    if (r.top > window.innerHeight * .5 || r.bottom < window.innerHeight * .5) return;
    if (e.key === 'ArrowRight') stageGo(1);
    if (e.key === 'ArrowLeft') stageGo(-1);
  });
  window.addEventListener('resize', () => renderStage());

  renderStage(true);
  renderGrid();
}

function stageGo(d) {
  const n = filtered().length;
  STATE.stageIdx = (STATE.stageIdx + d + n) % n;
  renderStage();
}

function renderStage(rebuild) {
  const list = filtered(), track = $('#stage-track');
  if (rebuild || track.children.length !== list.length) {
    track.innerHTML = list.map((p, i) => `
      <div class="s-item" data-i="${i}" data-id="${p.id}" role="button" tabindex="-1" aria-label="${esc(p.name)}">
        ${p.hot ? '<span class="s-badge">Bestseller</span>' : p.new ? '<span class="s-badge">New in</span>' : ''}
        ${imgTag(p.image, p.type)}
      </div>`).join('');
  }
  const mobile = window.innerWidth < 640;
  const cur = STATE.stageIdx;
  $$('.s-item', track).forEach((el, i) => {
    let d = i - cur;
    if (d < -1) d += list.length; // wrap so the end of the list sits behind
    let tx, s, o = 1, z = 10 - Math.abs(d), f = 'none';
    if (d === 0)      { tx = -50; s = 1; }
    else if (d === -1){ tx = -260; s = .7; o = 0; }
    else {
      const step = mobile ? [0, 70, 120, 160] : [0, 95, 175, 240];
      tx = -50 + (step[d] ?? 300); s = Math.max(.3, 1 - .26 * d); o = d > 3 ? 0 : 1 - d * .12; f = `brightness(${1 - d * .15})`;
    }
    el.style.transform = `translate(${tx}%, -50%) scale(${s})`;
    el.style.opacity = o; el.style.zIndex = z; el.style.filter = f;
    el.style.pointerEvents = o === 0 ? 'none' : 'auto';
    el.tabIndex = d === 0 ? 0 : -1;
  });
  const p = list[cur];
  $('#stage-ghost').textContent = TYPE_WORD(p);
  $('#stage-type').textContent = p.type;
  $('#stage-name').textContent = p.name;
  $('#stage-sub').textContent = p.oldPrice ? `${fmt(p.price)} — was ${fmt(p.oldPrice)}` : fmt(p.price);
  $('#stage-counter').textContent = `${String(cur + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
}

function renderGrid() {
  const list = filtered();
  $('#grid-count').textContent = `${list.length} piece${list.length === 1 ? '' : 's'}`;
  $('#grid').innerHTML = list.map(p => `
    <article class="card rv" data-id="${p.id}">
      <div class="card-img">
        ${imgTag(p.image, p.type)}
        <button class="card-wish${STATE.wish.includes(p.id) ? ' on' : ''}" data-wish="${p.id}" aria-label="Save ${esc(p.name)}">${STATE.wish.includes(p.id) ? '♥' : '♡'}</button>
        <button class="card-add" data-add="${p.id}">Quick add — ${esc(p.lengths[0])}</button>
      </div>
      <div class="card-meta"><span>${esc(p.name)}</span><span class="len">${esc(lengthRange(p))}</span></div>
      <div class="card-price">${fmt(p.price)}${p.oldPrice ? `<s>${fmt(p.oldPrice)}</s>` : ''}</div>
    </article>`).join('');
  observeReveal($$('#grid .rv'));
}

document.addEventListener('click', e => {
  const add = e.target.closest('[data-add]');
  if (add) { e.stopPropagation(); const p = byId(+add.dataset.add); addToCart(p, 1, p.lengths[0], 0); return; }
  const w = e.target.closest('[data-wish]');
  if (w) { e.stopPropagation(); toggleWish(+w.dataset.wish); return; }
  const card = e.target.closest('.card[data-id]');
  if (card) openProduct(+card.dataset.id);
});

function toggleWish(id) {
  const i = STATE.wish.indexOf(id);
  i > -1 ? STATE.wish.splice(i, 1) : STATE.wish.push(id);
  store.set('bs_wishlist', STATE.wish);
  const on = STATE.wish.includes(id);
  $$(`[data-wish="${id}"]`).forEach(b => { b.classList.toggle('on', on); b.textContent = on ? '♥' : '♡'; });
  if (PM.p?.id === id) { $('#pm-wish').classList.toggle('on', on); $('#pm-wish').textContent = on ? '♥' : '♡'; }
  toast(on ? 'Saved' : 'Removed', on ? 'Added to your wishlist.' : 'Taken off your wishlist.');
}

/* ── PRODUCT MODAL ─────────────────────────────────────── */
function openProduct(id) {
  const p = byId(id); if (!p) return;
  Object.assign(PM, { p, qty: 1, length: p.lengths[0], color: 0 });
  $('#pm-img').innerHTML = imgTag(p.image, p.type);
  $('#pm-type').textContent = p.type;
  $('#pm-name').textContent = p.name;
  $('#pm-meta').innerHTML = `<b>★ ${p.rating.toFixed(1)}</b> · ${p.reviews} reviews · ${p.stock <= 10 ? `only ${p.stock} left` : 'in stock'}`;
  $('#pm-price').innerHTML = fmt(p.price) + (p.oldPrice ? `<s>${fmt(p.oldPrice)}</s>` : '');
  $('#pm-desc').textContent = p.description;
  $('#pm-colors').innerHTML = p.colors.map((c, i) => `<button class="swatch${i ? '' : ' active'}" style="background:${esc(c)}" data-c="${i}" aria-label="${esc(p.colorNames[i])}"></button>`).join('');
  $('#pm-color-name').textContent = p.colorNames[0];
  $('#pm-lengths').innerHTML = p.lengths.map((l, i) => `<button class="chip${i ? '' : ' active'}" data-l="${esc(l)}">${esc(l)}</button>`).join('');
  $('#pm-features').innerHTML = p.features.map(f => `<li>${esc(f)}</li>`).join('');
  $('#pm-qty').textContent = 1;
  const on = STATE.wish.includes(p.id);
  $('#pm-wish').classList.toggle('on', on); $('#pm-wish').textContent = on ? '♥' : '♡';
  openLayer('#product-modal');
}

/* ── CART ───────────────────────────────────────────────── */
function addToCart(p, qty, length, color) {
  const key = `${p.id}-${length}-${color}`;
  const ex = STATE.cart.find(i => i.key === key);
  if (ex) ex.qty += qty;
  else STATE.cart.push({ key, id: p.id, name: p.name, price: p.price, qty, length, color: p.colorNames[color], image: p.image });
  saveCart();
  toast('Added to bag', `${p.name} · ${length}`);
  const c = $('#cart-count'); c.classList.add('bump'); setTimeout(() => c.classList.remove('bump'), 300);
}
function saveCart() { store.set('bs_cart', STATE.cart); updateCartUI(); }
const subtotal = () => STATE.cart.reduce((s, i) => s + i.price * i.qty, 0);

function updateCartUI() {
  $('#cart-count').textContent = STATE.cart.reduce((s, i) => s + i.qty, 0);
  $('#cart-subtotal').textContent = fmt(subtotal());
  const box = $('#cart-items');
  if (!STATE.cart.length) {
    box.innerHTML = `<div class="drawer-empty"><b>Empty for now</b>Your crown is waiting.</div>`;
  } else {
    box.innerHTML = STATE.cart.map(i => `
      <div class="c-item">
        <div class="c-thumb">${imgTag(i.image, '')}</div>
        <div>
          <div class="c-name">${esc(i.name)}</div>
          <div class="c-sub">${esc(i.length)}${i.color ? ' · ' + esc(i.color) : ''}</div>
          <div class="c-qty"><button data-q="${esc(i.key)}" data-d="-1" aria-label="Less">−</button>${i.qty}<button data-q="${esc(i.key)}" data-d="1" aria-label="More">+</button></div>
        </div>
        <div class="c-right">${fmt(i.price * i.qty)}<button data-rm="${esc(i.key)}">Remove</button></div>
      </div>`).join('');
  }
  $('#checkout-btn').disabled = !STATE.cart.length;
  const lines = STATE.cart.map(i => `• ${i.name} (${i.length}${i.color ? ', ' + i.color : ''}) × ${i.qty} — ${fmt(i.price * i.qty)}`).join('\n');
  $('#wa-order').href = `https://wa.me/${BS_CONFIG.whatsappNum}?text=${encodeURIComponent(`Hi Baddie Strands! I'd like to order:\n${lines}\n\nSubtotal: ${fmt(subtotal())}`)}`;
  $('#wa-order').hidden = !STATE.cart.length;
}
$('#cart-items')?.addEventListener('click', e => {
  const q = e.target.closest('[data-q]');
  if (q) { const it = STATE.cart.find(i => i.key === q.dataset.q); if (it) { it.qty = Math.max(1, it.qty + +q.dataset.d); saveCart(); } return; }
  const rm = e.target.closest('[data-rm]');
  if (rm) { STATE.cart = STATE.cart.filter(i => i.key !== rm.dataset.rm); saveCart(); }
});

/* ── OVERLAYS (scrim, modals, drawer, search) ──────────── */
let openEl = null;
function openLayer(sel) {
  closeLayer(true);
  openEl = $(sel);
  openEl.classList.add('open');
  $('#scrim').classList.add('on');
  document.body.classList.add('locked');
  $('#nav').classList.remove('open');
}
function closeLayer(silent) {
  if (!openEl) return;
  const was = openEl; openEl = null;
  was.classList.remove('open');
  $('#scrim').classList.remove('on');
  document.body.classList.remove('locked');
  if (!silent && was.id === 'checkout-modal' && CO.step < 4 && STATE.cart.length) openLayer('#cart');
}
function initOverlays() {
  $('#scrim').addEventListener('click', () => closeLayer());
  $$('[data-close]').forEach(b => b.addEventListener('click', () => closeLayer()));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLayer();
    if (e.key === '/' && !openEl && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
  });
  $('#cart-btn').addEventListener('click', () => openLayer('#cart'));
  $('#cart-close').addEventListener('click', () => closeLayer());
  $('#search-btn').addEventListener('click', openSearch);
  $('#search-close').addEventListener('click', () => closeLayer());

  // product modal controls
  $('#pm-colors').addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    PM.color = +b.dataset.c;
    $$('.swatch', $('#pm-colors')).forEach(s => s.classList.toggle('active', s === b));
    $('#pm-color-name').textContent = PM.p.colorNames[PM.color];
  });
  $('#pm-lengths').addEventListener('click', e => {
    const b = e.target.closest('[data-l]'); if (!b) return;
    PM.length = b.dataset.l;
    $$('.chip', $('#pm-lengths')).forEach(s => s.classList.toggle('active', s === b));
  });
  $('#pm-minus').addEventListener('click', () => { PM.qty = Math.max(1, PM.qty - 1); $('#pm-qty').textContent = PM.qty; });
  $('#pm-plus').addEventListener('click', () => { PM.qty = Math.min(10, PM.qty + 1); $('#pm-qty').textContent = PM.qty; });
  $('#pm-add').addEventListener('click', () => { addToCart(PM.p, PM.qty, PM.length, PM.color); closeLayer(); });
  $('#pm-wish').addEventListener('click', () => toggleWish(PM.p.id));

  // search
  const input = $('#search-input'), out = $('#search-results');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { out.innerHTML = ''; return; }
    const hits = P.filter(p => [p.name, p.type, p.category, p.description, ...p.features].join(' ').toLowerCase().includes(q));
    out.innerHTML = hits.length
      ? hits.map(p => `<button class="sr" data-open="${p.id}">${esc(p.name)}<span>${esc(p.type)} · ${fmt(p.price)}</span></button>`).join('')
      : `<p class="muted" style="padding:16px 0">Nothing for “${esc(input.value)}”. Try “wig”, “bundle” or “lace”.</p>`;
  });
  out.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openProduct(+b.dataset.open); });
}
function openSearch() { openLayer('#search'); setTimeout(() => $('#search-input').focus(), 120); }

/* ── KNOWLEDGE ──────────────────────────────────────────── */
function initKnowledge() {
  const B = STORE_DATA.knowledge.basics;
  $('#steps-list').innerHTML = B.map((b, i) => `<div class="step" data-i="${i}"><h4>${esc(b.title)}</h4><p>${esc(b.body)}</p></div>`).join('');
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

  const tabs = Object.keys(STORE_DATA.knowledge.care);
  $('#care-tabs').innerHTML = tabs.map((t, i) => `<button class="chip${i ? '' : ' active'}" data-t="${esc(t)}">${esc(t)}</button>`).join('');
  const renderCare = () => {
    $('#care-list').innerHTML = STORE_DATA.knowledge.care[STATE.careTab].map((c, i) =>
      `<li style="animation-delay:${i * 60}ms"><b>${esc(c.title)}</b><p>${esc(c.body)}</p></li>`).join('');
  };
  $('#care-tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    STATE.careTab = b.dataset.t;
    $$('#care-tabs .chip').forEach(c => c.classList.toggle('active', c === b));
    renderCare();
  });
  renderCare();
}

/* ── QUIZ ───────────────────────────────────────────────── */
const QUIZ_CHAPTERS = ['Lifestyle', 'Styling time', 'Texture', 'Priority', 'Budget'];
function initQuiz() {
  $('#quiz-index').innerHTML = QUIZ_CHAPTERS.map(c => `<li>${c}</li>`).join('') + '<li>Your match</li>';
  $('#quiz-body').addEventListener('click', e => {
    const o = e.target.closest('[data-a]');
    if (o) { STATE.quizAnswers[STATE.quizStep] = +o.dataset.a; STATE.quizStep++; renderQuiz(); return; }
    if (e.target.closest('#q-back')) { STATE.quizStep = Math.max(0, STATE.quizStep - 1); renderQuiz(); return; }
    if (e.target.closest('#q-retake')) { STATE.quizStep = 0; STATE.quizAnswers = []; renderQuiz(); return; }
    const add = e.target.closest('[data-qadd]');
    if (add) { const p = byId(+add.dataset.qadd); addToCart(p, 1, p.lengths[0], 0); }
    const view = e.target.closest('[data-qview]');
    if (view) openProduct(+view.dataset.qview);
  });
  renderQuiz();
}
function renderQuiz() {
  const Q = STORE_DATA.quiz, s = STATE.quizStep;
  $$('#quiz-index li').forEach((li, i) => { li.classList.toggle('on', i === s); li.classList.toggle('done', i < s); });
  $('#quiz-progress').style.width = (s / Q.length * 100) + '%';
  const body = $('#quiz-body');
  if (s < Q.length) {
    body.innerHTML = `
      <p class="q-count">Question ${s + 1} / ${Q.length}</p>
      <h2 class="q-title">${esc(Q[s].q)}</h2>
      <div class="q-opts">${Q[s].options.map((o, i) => `<button class="q-opt" style="animation-delay:${i * 70}ms" data-a="${i}">${esc(o)}</button>`).join('')}</div>
      ${s ? '<button class="q-back" id="q-back">← Back</button>' : ''}`;
    return;
  }
  const p = quizMatch(STATE.quizAnswers);
  body.innerHTML = `
    <div class="q-result">
      <div class="card-img">${imgTag(p.image, p.type)}</div>
      <div>
        <p class="q-count" style="margin:0">Your match</p>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.description)}</p>
        <div class="btns">
          <button class="btn pink" data-qadd="${p.id}">Add to bag — ${fmt(p.price)} <i>→</i></button>
          <button class="btn oval" data-qview="${p.id}">See details</button>
        </div>
        <button class="q-back" id="q-retake">Retake the quiz</button>
      </div>
    </div>`;
}
function quizMatch(a) {
  const byTexture = [[5, 1, 10, 12, 8], [2, 6, 11, 9], [3, 11, 7], [4, 3]][a[2] ?? 0];
  const max = [50000, 80000, 120000, Infinity][a[4] ?? 3];
  let pool = byTexture.map(byId).filter(Boolean);
  if (a[1] === 0 || a[3] === 3) pool.sort((x, y) => (y.id === 6) - (x.id === 6)); // quick or low-maintenance → glueless first
  return pool.find(p => p.price <= max)
      || [...pool].sort((x, y) => x.price - y.price)[0]
      || P.find(p => p.price <= max) || P[0];
}

/* ── REVIEWS ────────────────────────────────────────────── */
function initReviews() {
  $('#quotes').innerHTML = STORE_DATA.testimonials.map(t => `
    <blockquote class="quote">
      <p>“${esc(t.body)}”</p>
      <footer><div class="who"><b>${esc(t.name)}</b><span>${esc(t.location)}</span></div><span class="stars">${'★'.repeat(t.stars)}</span></footer>
    </blockquote>`).join('');
}

/* ── DELIVERY ───────────────────────────────────────────── */
function initDelivery() {
  const row = z => `<li><span>${esc(z.zone)}</span><span>${esc(z.price)}</span><span>${esc(z.time)}</span></li>`;
  $('#zone-local').innerHTML = DELIVERY.local.map(row).join('');
  $('#zone-intl').innerHTML = DELIVERY.international.map(row).join('');
}

/* ── CONTACT + NEWSLETTER ──────────────────────────────── */
function initForms() {
  $('#contact-form').addEventListener('submit', e => {
    e.preventDefault();
    const n = $('#c-name').value.trim(), r = $('#c-reach').value.trim(), m = $('#c-msg').value.trim();
    if (!n || !r || !m) { toast('Almost', 'Please fill in your name, contact and message.'); return; }
    openLink(`https://wa.me/${BS_CONFIG.whatsappNum}?text=${encodeURIComponent(`Hi Baddie Strands, I'm ${n} (${r}).\n\n${m}`)}`);
    e.target.reset();
    toast('Opening WhatsApp', 'Your message is ready to send.');
  });
  $('#news-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#news-email').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Check your email', 'That address doesn’t look right.'); return; }
    if (db) { try { await db.from('subscribers').upsert({ email }); } catch {} }
    else { const s = store.get('bs_subscribers', []); if (!s.includes(email)) s.push(email); store.set('bs_subscribers', s); }
    e.target.reset();
    toast('You’re in', 'New drops will reach you first.');
  });
}

/* ── AUTH (Supabase email code) ─────────────────────────── */
function initAuth() {
  $('#account-tile').addEventListener('click', () => {
    if (DEMO) { toast('Demo mode', 'Accounts switch on once the shop is connected.'); return; }
    if (AUTH.user) { db.auth.signOut(); AUTH.user = null; renderAccount(); toast('Signed out', 'See you soon.'); return; }
    openAuth();
  });
  const otp = $('#otp');
  otp.innerHTML = Array.from({ length: 6 }, () => '<input inputmode="numeric" maxlength="1" aria-label="Digit">').join('');
  const cells = $$('input', otp);
  cells.forEach((c, i) => {
    c.addEventListener('input', () => { c.value = c.value.replace(/\D/g, ''); if (c.value && cells[i + 1]) cells[i + 1].focus(); });
    c.addEventListener('keydown', e => { if (e.key === 'Backspace' && !c.value && cells[i - 1]) cells[i - 1].focus(); });
    c.addEventListener('paste', e => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (t.length > 1) { e.preventDefault(); t.split('').forEach((d, j) => cells[j] && (cells[j].value = d)); cells[Math.min(5, t.length - 1)].focus(); } });
  });
  $('#auth-toggle').addEventListener('click', () => { AUTH.isRegister = !AUTH.isRegister; authHeads(); });
  $('#auth-send').addEventListener('click', authSend);
  $('#auth-email').addEventListener('keydown', e => { if (e.key === 'Enter') authSend(); });
  $('#auth-verify').addEventListener('click', authVerify);
  $('#auth-back').addEventListener('click', () => { cells.forEach(c => c.value = ''); authStep('email'); });
  $('#auth-finish').addEventListener('click', authFinish);
  $('#auth-google').addEventListener('click', () => db?.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.href } }));
  $('#auth-apple').addEventListener('click', () => db?.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: location.href } }));

  if (db) {
    db.auth.getSession().then(async ({ data: { session } }) => {
      if (session) { AUTH.user = session.user; await loadProfile(); renderAccount(); }
    }).catch(() => {});
    db.auth.onAuthStateChange((_e, session) => { AUTH.user = session?.user || null; renderAccount(); });
  }
  renderAccount();
}
async function loadProfile() { try { const { data } = await db.from('profiles').select('*').eq('id', AUTH.user.id).single(); if (data) AUTH.user.profile = data; } catch {} }
function renderAccount() {
  const name = AUTH.user?.profile?.full_name?.split(' ')[0];
  $('#account-tile-label').textContent = DEMO ? 'Account (demo)' : AUTH.user ? `Hi ${name || 'queen'} — sign out` : 'Sign in';
}
function openAuth() { AUTH.isRegister = false; authHeads(); authStep('email'); status('#auth-status', ''); openLayer('#auth-modal'); setTimeout(() => $('#auth-email').focus(), 120); }
function authHeads() {
  $('#auth-title').textContent = AUTH.isRegister ? 'Join the circle' : 'Welcome back';
  $('#auth-toggle').textContent = AUTH.isRegister ? 'Already have an account? Sign in' : 'New here? Create an account';
}
function authStep(s) { ['email', 'otp', 'name'].forEach(k => $(`#auth-step-${k}`).hidden = k !== s); }
function status(sel, msg, type = '') { const el = $(sel); el.textContent = msg; el.className = 'status ' + type; }
async function authSend() {
  const email = $('#auth-email').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status('#auth-status', 'Enter a valid email address.', 'err'); return; }
  const b = $('#auth-send'); b.disabled = true; b.textContent = 'Sending…';
  const { error } = await db.auth.signInWithOtp({ email });
  b.disabled = false; b.textContent = 'Send code';
  if (error) { status('#auth-status', error.message, 'err'); return; }
  AUTH.otpEmail = email; $('#otp-email').textContent = email;
  authStep('otp'); status('#auth-status', 'Code sent — check your inbox.', 'ok');
  setTimeout(() => $('#otp input').focus(), 80);
}
async function authVerify() {
  const token = $$('#otp input').map(c => c.value).join('');
  if (token.length < 6) { status('#auth-status', 'Enter all 6 digits.', 'err'); return; }
  const { data, error } = await db.auth.verifyOtp({ email: AUTH.otpEmail, token, type: 'email' });
  if (error) { status('#auth-status', 'That code didn’t work. Try again.', 'err'); return; }
  AUTH.user = data.user; await loadProfile();
  if (!AUTH.user.profile?.full_name) { authStep('name'); status('#auth-status', ''); setTimeout(() => $('#auth-name').focus(), 80); return; }
  authDone();
}
async function authFinish() {
  const name = $('#auth-name').value.trim();
  if (!name) { status('#auth-status', 'Please enter your name.', 'err'); return; }
  await db.from('profiles').upsert({ id: AUTH.user.id, full_name: name, email: AUTH.user.email });
  AUTH.user.profile = { full_name: name };
  authDone();
}
function authDone() {
  renderAccount(); closeLayer(true);
  toast('Welcome', `Signed in as ${AUTH.user.email}`);
  if (window._bsPendingCheckout) { window._bsPendingCheckout = false; openCheckout(); }
}

/* ── CHECKOUT ───────────────────────────────────────────── */
const fee = () => DELIVERY_FEES[CO.delivery.state] ?? 3500;
const total = () => subtotal() + (CO.delivery.state ? fee() : 0);

function initCheckout() {
  $('#del-state').insertAdjacentHTML('beforeend',
    Object.keys(DELIVERY_FEES).sort((a, b) => a.startsWith('FCT') ? -1 : b.startsWith('FCT') ? 1 : a.localeCompare(b))
      .map(s => `<option>${esc(s)}</option>`).join(''));
  $('#del-state').addEventListener('change', e => { const s = e.target.value; $('#del-fee').textContent = s ? fmt(DELIVERY_FEES[s] ?? 3500) : '— select state'; });
  $('#checkout-btn').addEventListener('click', () => {
    if (!STATE.cart.length) { toast('Empty bag', 'Add something first.'); return; }
    if (!DEMO && !AUTH.user) { window._bsPendingCheckout = true; openAuth(); return; }
    openCheckout();
  });
  $('#co-next').addEventListener('click', coNext);
  $('#co-back').addEventListener('click', () => { if (CO.step > 1) coStep(CO.step - 1); });
  $$('.pay-opt').forEach(b => b.addEventListener('click', e => {
    if (e.target.id === 'acct-copy') return;
    CO.pay = b.dataset.pay;
    $$('.pay-opt').forEach(x => x.classList.toggle('selected', x === b));
    $('#co-next').textContent = CO.pay === 'card' ? 'Pay now' : 'Confirm transfer';
    status('#pay-status', '');
  }));
  $('#acct-copy').addEventListener('click', e => {
    e.stopPropagation();
    navigator.clipboard?.writeText(BS_CONFIG.accessBankAcct).then(() => toast('Copied', 'Account number copied.')).catch(() => toast('Account number', BS_CONFIG.accessBankAcct));
  });
}
function openCheckout() {
  CO.step = 1; CO.delivery = {}; CO.pay = 'card';
  $$('.pay-opt').forEach(x => x.classList.toggle('selected', x.dataset.pay === 'card'));
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
  return `<div class="sum">${rows}<div class="r"><span>Subtotal</span><span>${fmt(subtotal())}</span></div>${f}<div class="r t"><span>Total</span><span>${fmt(withFee ? total() : subtotal())}</span></div></div>`;
}
function coStep(n) {
  CO.step = n;
  $$('#co-dots span').forEach((s, i) => { s.classList.toggle('on', i + 1 === n); s.classList.toggle('done', i + 1 < n); });
  for (let i = 1; i <= 4; i++) $(`#co-step-${i}`).hidden = i !== n;
  $('#co-title').textContent = ['Review order', 'Delivery details', 'Payment', 'Order confirmed'][n - 1];
  $('#co-foot').hidden = n === 4;
  $('#co-back').style.visibility = n > 1 ? 'visible' : 'hidden';
  const next = $('#co-next'); next.disabled = false;
  if (n === 1) { $('#co-review').innerHTML = summary(false); next.textContent = 'Next'; }
  if (n === 2) { next.textContent = 'Continue to payment'; setTimeout(() => $('#del-name').focus(), 60); }
  if (n === 3) {
    $('#co-pay-summary').innerHTML = summary(true);
    $('#acct-num').textContent = /^0+$/.test(BS_CONFIG.accessBankAcct) ? 'number added at launch' : BS_CONFIG.accessBankAcct;
    next.textContent = CO.pay === 'card' ? 'Pay now' : 'Confirm transfer';
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#del-email').value.trim())) { toast('Check your email', 'That address doesn’t look right.'); $('#del-email').focus(); return; }
    CO.delivery = Object.fromEntries(['name', 'phone', 'email', 'address', 'city', 'state', 'notes'].map(k => [k, $(`#del-${k}`).value.trim()]));
    return coStep(3);
  }
  if (CO.step === 3) CO.pay === 'card' ? payCard() : confirmOrder(`BS-TRF-${Date.now()}`, 'Bank Transfer – Access Bank');
}
function loadPaystack() {
  return new Promise((res, rej) => {
    if (window.PaystackPop) return res();
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js'; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}
async function payCard() {
  if (DEMO || BS_CONFIG.paystackPublicKey.includes('YOUR_')) {
    status('#pay-status', 'Card payments switch on once the Paystack key is added. Choose bank transfer for now.', 'err');
    return;
  }
  const next = $('#co-next'); next.disabled = true; next.textContent = 'Opening Paystack…';
  try {
    await loadPaystack();
    PaystackPop.setup({
      key: BS_CONFIG.paystackPublicKey, email: CO.delivery.email, amount: total() * 100, currency: 'NGN', ref: `BS-${Date.now()}`,
      metadata: { custom_fields: [{ display_name: 'Customer', variable_name: 'customer', value: CO.delivery.name }, { display_name: 'Phone', variable_name: 'phone', value: CO.delivery.phone }] },
      callback: r => confirmOrder(r.reference, 'Paystack Card'),
      onClose: () => { next.disabled = false; next.textContent = 'Pay now'; status('#pay-status', 'Payment window closed. Try again when ready.', 'err'); },
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
    if (db) {
      const { data, error } = await db.from('orders').insert([{
        user_id: AUTH.user.id, status: method.includes('Transfer') ? 'Pending' : 'Processing',
        total_amount: amount, payment_method: method, payment_ref: ref,
        delivery_state: CO.delivery.state, delivery_address: CO.delivery,
      }]).select().single();
      if (error) throw error;
      const { error: e2 } = await db.from('order_items').insert(STATE.cart.map(i => ({ order_id: data.id, product_id: i.id, quantity: i.qty, unit_price: i.price })));
      if (e2) throw e2;
      id = String(data.id).split('-')[0].toUpperCase();
    } else {
      id = Math.random().toString(36).slice(2, 10).toUpperCase();
      const orders = store.get('bs_demo_orders', []);
      orders.unshift({ id, ref, method, amount, delivery: CO.delivery, items: STATE.cart, at: new Date().toISOString() });
      store.set('bs_demo_orders', orders);
    }
    $('#co-order-id').textContent = '#' + id;
    const acct = /^0+$/.test(BS_CONFIG.accessBankAcct) ? 'our Access Bank account' : `Access Bank ${BS_CONFIG.accessBankAcct} (${BS_CONFIG.accessBankName})`;
    $('#co-success').textContent = method.includes('Transfer')
      ? `Please transfer ${fmt(amount)} to ${acct} and send your receipt to ${BS_CONFIG.adminEmail} or WhatsApp with order #${id}. We confirm within 24 hours.`
      : `Payment confirmed. Your order is headed to ${CO.delivery.address}, ${CO.delivery.city}, ${CO.delivery.state}.`;
    STATE.cart = []; saveCart();
    coStep(4);
  } catch (err) {
    console.error('[BS] order error', err);
    next.disabled = false; next.textContent = 'Try again';
    status('#pay-status', 'Something went wrong placing your order. Try again or message us on WhatsApp.', 'err');
  }
}

/* ── REVEAL ─────────────────────────────────────────────── */
let revealIO;
function observeReveal(els) { els.forEach(el => revealIO ? revealIO.observe(el) : el.classList.add('in')); }
function initReveal() {
  revealIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.sec-head, .stats, .pack, .zone, .quote, .condensed, .wide-italic, .channels, .form, .care').forEach(el => el.classList.add('rv'));
  observeReveal($$('.rv'));
}

/* ── TOAST ──────────────────────────────────────────────── */
function toast(title, body) {
  const t = $('#toast');
  $('#toast-title').textContent = title; $('#toast-body').textContent = body;
  t.classList.add('show'); clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 3200);
}
