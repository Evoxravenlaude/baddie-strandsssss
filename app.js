// ============================================================
// BADDIE STRANDS — Storefront
// Showroom, grid, product detail, bag, search, quiz, guides.
// Sign-in and checkout live in checkout.js.
// ============================================================
'use strict';

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '₦' + Math.round(Number(n) || 0).toLocaleString('en-NG');
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const pad2 = (n) => String(n).padStart(2, '0');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icon = (id) => `<svg class="ico" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ } },
    del(key) { try { localStorage.removeItem(key); } catch (e) { /* storage unavailable */ } }
  };

  // ── Products ─────────────────────────────────────────────
  const CATEGORY_TONE = { wigs: '#7A1E46', bundles: '#A6652F', extensions: '#7D6BA8' };
  const CATEGORIES = [['all', 'All'], ['wigs', 'Wigs'], ['bundles', 'Bundles'], ['extensions', 'Extensions']];

  function tidy(p) {
    const colors = Array.isArray(p.colors) && p.colors.length ? p.colors : ['#1a1008'];
    const names = Array.isArray(p.colorNames) ? p.colorNames : [];
    const images = (Array.isArray(p.images) && p.images.length ? p.images : [p.image]).filter(Boolean);
    return Object.assign({}, p, {
      name: String(p.name || 'Untitled piece'),
      type: String(p.type || ''),
      category: p.category || 'wigs',
      price: Number(p.price) || 0,
      oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
      lengths: Array.isArray(p.lengths) && p.lengths.length ? p.lengths.map(String) : ['One length'],
      colors,
      colorNames: colors.map((c, i) => String(names[i] || 'Shade ' + (i + 1))),
      image: p.image || images[0] || '',
      images,
      features: Array.isArray(p.features) ? p.features.filter(Boolean) : [],
      rating: Number(p.rating) || 0,
      reviews: Number(p.reviews) || 0,
      stock: p.stock == null || p.stock === '' ? null : Number(p.stock),
      tone: p.tone || CATEGORY_TONE[p.category] || '#6F0A3A',
      description: String(p.description || '')
    });
  }

  const edited = store.get('bs_products_edited', null);
  const usingEdits = Array.isArray(edited) && edited.length > 0;
  const PRODUCTS = (usingEdits ? edited : STORE_DATA.products).map(tidy);
  const byId = (id) => PRODUCTS.find((p) => String(p.id) === String(id));
  const bestsellers = () => {
    const hot = PRODUCTS.filter((p) => p.hot);
    return (hot.length ? hot : PRODUCTS.slice()).sort((a, b) => b.reviews - a.reviews || b.rating - a.rating);
  };

  // ── Pictures ─────────────────────────────────────────────
  function sized(url, w, h) {
    if (!url) return '';
    if (!/images\.unsplash\.com/.test(url)) return url;
    return url.split('?')[0] + '?auto=format&fit=crop&crop=faces,entropy&q=78&w=' + w + (h ? '&h=' + h : '');
  }
  function media(url, w, h, alt, tone, cls, tag) {
    const t = tag || 'span';
    const img = url ? `<img src="${esc(sized(url, w, h))}" alt="${esc(alt || '')}" loading="lazy" decoding="async">` : '';
    return `<${t} class="media ${cls || ''}${url ? '' : ' is-missing'}" style="--tone:${esc(tone || '#6F0A3A')}">${img}</${t}>`;
  }
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t && t.tagName === 'IMG') { const m = t.closest('.media'); if (m) m.classList.add('is-missing'); }
  }, true);

  // ── Toast ────────────────────────────────────────────────
  function toast(title, body) {
    const el = $('#toast');
    if (!el) return;
    $('b', el).textContent = title || '';
    $('span', el).textContent = body || '';
    el.classList.add('is-on');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('is-on'), 3800);
  }

  // ── Overlays (detail, bag, search, quiz, sign in, checkout) ──
  const Overlay = (() => {
    let open = [];
    const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

    function show(id, focusSelector) {
      const el = document.getElementById(id);
      if (!el || open.includes(el)) return;
      el.returnTo = document.activeElement;
      el.hidden = false;
      void el.offsetWidth;
      el.classList.add('is-open');
      open.push(el);
      document.body.classList.add('is-locked');
      const target = (focusSelector && $(focusSelector, el)) || $('[role="dialog"]', el);
      setTimeout(() => { if (target && el.classList.contains('is-open')) target.focus({ preventScroll: true }); }, 80);
    }
    function hide(ref) {
      const el = typeof ref === 'string' ? document.getElementById(ref) : ref;
      if (!el || !open.includes(el)) return;
      el.classList.remove('is-open');
      open = open.filter((x) => x !== el);
      if (!open.length) document.body.classList.remove('is-locked');
      setTimeout(() => { if (!el.classList.contains('is-open')) el.hidden = true; }, reduced ? 0 : 460);
      el.dispatchEvent(new CustomEvent('overlay:close'));
      if (el.returnTo && document.contains(el.returnTo) && !open.length) el.returnTo.focus({ preventScroll: true });
    }
    document.addEventListener('click', (e) => {
      const c = e.target.closest('[data-close]');
      if (c) hide(c.closest('.overlay'));
    });
    document.addEventListener('keydown', (e) => {
      const top = open[open.length - 1];
      if (!top) return;
      if (e.key === 'Escape') { e.preventDefault(); hide(top); return; }
      if (e.key !== 'Tab') return;
      const items = $$(FOCUSABLE, top).filter((n) => n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !top.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    return { show, hide, isOpen: (id) => open.some((x) => x.id === id), any: () => open.length > 0 };
  })();

  // ── Visit counts for the admin dashboard ─────────────────
  const Stats = {
    read() { const a = store.get('bs_analytics', {}); return { views: a.views || 0, sessions: a.sessions || [], products_viewed: a.products_viewed || {} }; },
    pageView() {
      const a = this.read();
      a.views++;
      const today = new Date().toISOString().split('T')[0];
      const hit = a.sessions.find((s) => s.date === today);
      if (hit) hit.count++; else { a.sessions.push({ date: today, count: 1 }); if (a.sessions.length > 30) a.sessions.shift(); }
      store.set('bs_analytics', a);
    },
    productView(id) { const a = this.read(); a.products_viewed[id] = (a.products_viewed[id] || 0) + 1; store.set('bs_analytics', a); }
  };

  // ── Saved pieces ─────────────────────────────────────────
  const Wish = {
    ids: (store.get('bs_wishlist', []) || []).map(String),
    has(id) { return this.ids.includes(String(id)); },
    toggle(id) {
      const key = String(id), p = byId(id);
      if (this.has(key)) { this.ids = this.ids.filter((x) => x !== key); toast('Removed', (p ? p.name : 'Piece') + ' is no longer saved.'); }
      else { this.ids.push(key); toast('Saved', (p ? p.name : 'Piece') + ' is in your saved pieces.'); }
      store.set('bs_wishlist', this.ids);
      Shop.refresh();
      Detail.syncSave();
    }
  };

  // ── Bag ──────────────────────────────────────────────────
  const Cart = {
    items: (store.get('bs_cart', []) || []).filter((i) => i && i.key && i.name && Number(i.price) >= 0 && Number(i.qty) > 0),
    count() { return this.items.reduce((s, i) => s + Number(i.qty), 0); },
    subtotal() { return this.items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0); },
    save() { store.set('bs_cart', this.items); this.paint(); },
    add(p, qty, length, shade, quiet) {
      const len = length || p.lengths[0];
      const key = [p.id, len, shade || ''].join('_');
      const found = this.items.find((i) => i.key === key);
      if (found) found.qty += qty;
      else this.items.push({ key, id: p.id, name: p.name, type: p.type, price: p.price, currency: '₦', image: p.image, length: len, color: shade || '', qty });
      this.save();
      if (!quiet) toast('Added to bag', `${p.name}, ${len}${shade ? ', ' + shade : ''}`);
    },
    step(key, by) {
      const it = this.items.find((i) => i.key === key);
      if (!it) return;
      it.qty = Math.max(1, Number(it.qty) + by);
      this.save();
    },
    remove(key) { this.items = this.items.filter((i) => i.key !== key); this.save(); },
    clear() { this.items = []; this.save(); },
    paint() {
      const n = this.count();
      const badge = $('#bag-count');
      badge.textContent = n;
      badge.classList.toggle('is-full', n > 0);
      $('#bag-btn').setAttribute('aria-label', n ? `Open your bag, ${n} item${n === 1 ? '' : 's'}` : 'Open your bag');
      $('#cart-n').textContent = n ? `(${n})` : '';
      const list = $('#cart-items'), foot = $('#cart-foot');
      if (!this.items.length) {
        list.innerHTML = `<div class="empty"><b>Your bag is empty</b><p>Find a piece you love and it will wait for you here.</p><button class="btn btn--line" type="button" data-shop-filter="all" data-close>Shop the collection</button></div>`;
        foot.hidden = true;
        return;
      }
      foot.hidden = false;
      list.innerHTML = this.items.map((i) => {
        const p = byId(i.id);
        const bits = [i.type, i.length, i.color].filter(Boolean).map(esc).join(' · ');
        return `<div class="line" data-key="${esc(i.key)}">
          ${media(i.image, 180, 225, '', p ? p.tone : '')}
          <div><b>${esc(i.name)}</b><small>${bits}</small>
            <div class="stepper"><button type="button" data-step="-1" aria-label="One fewer ${esc(i.name)}">${icon('minus')}</button><output>${Number(i.qty)}</output><button type="button" data-step="1" aria-label="One more ${esc(i.name)}">${icon('plus')}</button></div>
          </div>
          <div class="line__end"><span>${money(i.price * i.qty)}</span><button class="linkbtn" type="button" data-remove>Remove</button></div>
        </div>`;
      }).join('');
      $('#cart-subtotal').textContent = money(this.subtotal());
    }
  };

  // ── Shop: showroom and grid ──────────────────────────────
  const Shop = (() => {
    const root = $('#shop'), track = $('#stage-track'), stage = $('#stage');
    const state = { cat: 'all', view: 'stage', sort: 'featured', index: 0, length: null, shade: null, saved: false, list: [] };
    const RATIOS = ['4/5', '1/1', '3/4', '5/4', '4/5', '3/4', '1/1'];
    const WASHES = ['#C0DAC0', '#FFBCC4', '#B8D2D5', '#F1E3B6'];
    let swapping = 0;

    function pool() {
      return PRODUCTS.filter((p) =>
        (!state.length || p.lengths.includes(state.length)) &&
        (!state.shade || p.colors.some((c) => c.toLowerCase() === state.shade.hex)) &&
        (!state.saved || Wish.has(p.id)));
    }
    function compute() {
      let list = pool().filter((p) => state.cat === 'all' || p.category === state.cat);
      if (state.sort === 'low') list = list.slice().sort((a, b) => a.price - b.price);
      if (state.sort === 'high') list = list.slice().sort((a, b) => b.price - a.price);
      if (state.sort === 'rated') list = list.slice().sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
      state.list = list;
      if (state.index >= list.length) state.index = 0;
    }

    function paintFilters() {
      const all = pool();
      const saved = Wish.ids.filter((id) => byId(id)).length;
      let html = CATEGORIES.map(([id, label]) => {
        const n = id === 'all' ? all.length : all.filter((p) => p.category === id).length;
        return `<button type="button" data-cat="${id}" aria-pressed="${state.cat === id && !state.saved}">${label}<span>${n}</span></button>`;
      }).join('');
      if (saved || state.saved) html += `<button type="button" data-saved aria-pressed="${state.saved}">Saved<span>${saved}</span></button>`;
      $('#filters').innerHTML = html;

      const chips = [];
      if (state.length) chips.push(`<span class="chipx">${esc(state.length)} length<button type="button" data-clear="length" aria-label="Clear the length filter">${icon('x')}</button></span>`);
      if (state.shade) chips.push(`<span class="chipx"><i style="background:${esc(state.shade.hex)}"></i>${esc(state.shade.name)}<button type="button" data-clear="shade" aria-label="Clear the shade filter">${icon('x')}</button></span>`);
      $('#shop-chips').innerHTML = chips.join('');
    }

    function flags(p) {
      const out = [];
      if (p.hot) out.push('Bestseller');
      if (p.new) out.push('New in');
      if (p.oldPrice) out.push('Sale');
      return out;
    }

    function paintStage(rebuild) {
      const list = state.list, empty = !list.length;
      $('#stage-empty').hidden = !empty;
      $('#stage-info').hidden = empty;
      $$('.stage__nav button').forEach((b) => { b.disabled = empty; });
      if (empty) {
        track.innerHTML = '';
        $('#stage-ghost span').textContent = '';
        $('#stage-empty').textContent = state.saved ? 'You haven\'t saved any pieces yet. Tap the heart on a piece to keep it here.' : 'No pieces match that yet. Clear a filter to see more.';
        $('#shop-count').textContent = '00 / 00';
        return;
      }
      if (rebuild) {
        track.innerHTML = list.map((p, i) =>
          `<li class="stage__item media" data-i="${i}" style="--tone:${esc(p.tone)}"><img src="${esc(sized(p.image, 720, 900))}" alt="" loading="lazy" decoding="async"><button type="button" tabindex="-1" aria-label="${esc(p.name)}"></button></li>`).join('');
      }
      const p = list[state.index];
      $$('.stage__item', track).forEach((li) => {
        const d = Number(li.dataset.i) - state.index;
        li.dataset.pos = d < 0 ? 'gone' : d > 2 ? 'far' : String(d);
        li.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
      });

      // backdrop: cross-fade between two layers
      const tones = $$('.shop__tone', root);
      const next = tones.find((t) => !t.classList.contains('is-on')) || tones[0];
      const cur = tones.find((t) => t !== next);
      if (cur.style.getPropertyValue('--t') !== p.tone || !cur.classList.contains('is-on')) {
        next.style.setProperty('--t', p.tone);
        next.classList.add('is-on');
        cur.classList.remove('is-on');
      }

      // ghost word
      const ghost = $('#stage-ghost span');
      const word = p.type || p.category;
      if (ghost.textContent !== word) {
        ghost.classList.add('is-out');
        clearTimeout(swapping);
        swapping = setTimeout(() => { ghost.textContent = word; ghost.classList.remove('is-out'); }, reduced ? 0 : 260);
      }

      const more = p.colorNames.length - 1;
      const badges = flags(p).map((f) => `<span class="badge">${f}</span>`).join('');
      $('#stage-info').innerHTML =
        `<p class="stage__type">${esc(p.type)}</p>
         <h3 class="stage__name">${esc(p.name)}</h3>
         <p class="stage__shade">in ${esc(p.colorNames[0])}${more > 0 ? ` and ${more} more shade${more === 1 ? '' : 's'}` : ''}</p>
         <p class="stage__price"><span>${money(p.price)}</span>${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ''}${badges}</p>`;
      root.classList.remove('is-swap');
      void root.offsetWidth;
      root.classList.add('is-swap');
      $('#shop-count').textContent = `${pad2(state.index + 1)} / ${pad2(list.length)}`;
    }

    function columns() { return window.matchMedia('(min-width: 1100px)').matches ? 3 : 2; }
    function paintGrid() {
      const grid = $('#grid'), list = state.list;
      if (!list.length) {
        grid.innerHTML = `<p class="grid__none">${state.saved ? 'You haven\'t saved any pieces yet. Tap the heart on a piece to keep it here.' : 'No pieces match that yet. Clear a filter to see more.'}</p>`;
        return;
      }
      const n = columns();
      const cols = Array.from({ length: n }, () => []);
      list.forEach((p, i) => {
        const saved = Wish.has(p.id);
        cols[i % n].push(`<article class="tile">
          <div class="tile__wrap">
            <button class="tile__media media" type="button" data-open="${esc(p.id)}" aria-label="View ${esc(p.name)}" style="--tone:${esc(p.tone)};--wash:${WASHES[i % WASHES.length]};--ar:${RATIOS[i % RATIOS.length]}"><img src="${esc(sized(p.image, 800, 1000))}" alt="${esc(p.name)}" loading="lazy" decoding="async"></button>
            <div class="tile__flags">${flags(p).map((f) => `<span class="badge">${f}</span>`).join('')}</div>
            <button class="tile__save${saved ? ' is-saved' : ''}" type="button" data-save="${esc(p.id)}" aria-pressed="${saved}" aria-label="${saved ? 'Remove from saved' : 'Save'}: ${esc(p.name)}">${icon('heart')}</button>
          </div>
          <div class="tile__cap"><h3 class="tile__name">${esc(p.name)}</h3><button class="tile__go" type="button" data-open="${esc(p.id)}" tabindex="-1" aria-hidden="true">View</button></div>
          <p class="tile__meta"><span>${esc(p.type)}</span><span>/ ${money(p.price)}${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ''}</span></p>
        </article>`);
      });
      grid.innerHTML = cols.map((c) => `<div class="grid__col">${c.join('')}</div>`).join('');
    }

    function refresh(rebuild) {
      compute();
      paintFilters();
      paintStage(rebuild !== false);
      if (state.view === 'grid') paintGrid();
    }
    function go(i) {
      const n = state.list.length;
      if (!n) return;
      state.index = (i + n) % n;
      paintStage(false);
    }
    function setView(v) {
      state.view = v;
      root.dataset.view = v;
      $$('[data-view-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.viewBtn === v)));
      if (v === 'grid') paintGrid(); else paintStage(true);
    }
    function reveal() { root.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }

    // events
    $('#filters').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-saved')) { state.saved = !state.saved; if (state.saved) state.cat = 'all'; }
      else { state.cat = b.dataset.cat; state.saved = false; }
      state.index = 0;
      refresh();
    });
    $('#shop-chips').addEventListener('click', (e) => {
      const b = e.target.closest('[data-clear]');
      if (!b) return;
      state[b.dataset.clear] = null;
      state.index = 0;
      refresh();
    });
    $$('[data-view-btn]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.viewBtn)));
    $('#sort-select').addEventListener('change', (e) => { state.sort = e.target.value; state.index = 0; refresh(); });
    $('#stage-prev').addEventListener('click', () => go(state.index - 1));
    $('#stage-next').addEventListener('click', () => go(state.index + 1));
    $('#stage-open').addEventListener('click', () => { const p = state.list[state.index]; if (p) Detail.open(p.id); });
    stage.addEventListener('keydown', (e) => {
      if (e.target !== stage) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(state.index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(state.index - 1); }
      if (e.key === 'Enter') { const p = state.list[state.index]; if (p) Detail.open(p.id); }
    });
    let drag = null, swiped = false;
    stage.addEventListener('pointerdown', (e) => { if (!e.target.closest('.stage__nav')) drag = { x: e.clientX, y: e.clientY }; swiped = false; });
    window.addEventListener('pointerup', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag = null;
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) { swiped = true; go(state.index + (dx < 0 ? 1 : -1)); }
    });
    window.addEventListener('pointercancel', () => { drag = null; });
    track.addEventListener('click', (e) => {
      if (swiped) { swiped = false; return; }
      const li = e.target.closest('.stage__item');
      if (!li) return;
      const i = Number(li.dataset.i);
      if (i === state.index) Detail.open(state.list[i].id); else go(i);
    });
    $('#grid').addEventListener('click', (e) => {
      const s = e.target.closest('[data-save]');
      if (s) { Wish.toggle(s.dataset.save); return; }
      const o = e.target.closest('[data-open]');
      if (o) Detail.open(o.dataset.open);
    });
    let cols = columns();
    window.addEventListener('resize', () => { const c = columns(); if (c !== cols) { cols = c; if (state.view === 'grid') paintGrid(); } });

    return {
      refresh: () => refresh(true),
      setCategory(cat) { state.cat = CATEGORIES.some((c) => c[0] === cat) ? cat : 'all'; state.saved = false; state.index = 0; refresh(); },
      setLength(len) { state.length = len; state.cat = 'all'; state.saved = false; state.index = 0; refresh(); setView('grid'); reveal(); },
      setShade(shade) { state.shade = shade; state.cat = 'all'; state.saved = false; state.index = 0; refresh(); setView('grid'); reveal(); },
      reveal
    };
  })();

  // ── Product detail ───────────────────────────────────────
  const Detail = (() => {
    const s = { p: null, qty: 1, len: null, ci: 0, img: 0 };

    function paintImage() {
      const src = s.p.images[s.img] || s.p.image;
      const fig = $('.detail__figure');
      fig.classList.toggle('is-missing', !src);
      const img = $('#detail-img');
      img.alt = s.p.name;
      if (src) img.src = sized(src, 900, 1125); else img.removeAttribute('src');
      $$('#detail-thumbs button').forEach((b, i) => b.setAttribute('aria-pressed', String(i === s.img)));
    }
    function paintChoice() {
      const p = s.p;
      $('#detail-length-out').textContent = s.len;
      $('#detail-shade-out').textContent = p.colorNames[s.ci];
      $$('#detail-lengths button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.len === s.len)));
      $$('#detail-shades button').forEach((b, i) => b.setAttribute('aria-pressed', String(i === s.ci)));
      $('#detail-qty').textContent = s.qty;
      const add = $('#detail-add');
      const out = p.stock === 0;
      add.disabled = out;
      add.textContent = out ? 'Sold out' : `Add to bag · ${money(p.price * s.qty)}`;
      $('#detail-ask').href = BS_CONFIG.waLink(`Hi Baddie Strands! I'm interested in the *${p.name}* (${s.len}, ${p.colorNames[s.ci]}). Can you help me?`);
    }
    function syncSave() {
      if (!s.p) return;
      const saved = Wish.has(s.p.id), btn = $('#detail-save');
      btn.classList.toggle('is-saved', saved);
      btn.setAttribute('aria-pressed', String(saved));
      $('span', btn).textContent = saved ? 'Saved' : 'Save for later';
    }

    function open(id, opts) {
      const p = byId(id);
      if (!p) return;
      const o = opts || {};
      s.p = p; s.qty = 1; s.img = 0;
      s.len = o.length && p.lengths.includes(o.length) ? o.length : p.lengths[0];
      s.ci = clamp(o.colorIndex || 0, 0, p.colors.length - 1);

      const stageEl = $('.detail__stage'), article = $('.detail');
      stageEl.style.setProperty('--t', p.tone);
      article.style.background = `color-mix(in srgb, ${p.tone} 9%, #fff5ec)`;
      const word = (p.type || p.category).split(' ')[0];
      const ghost = $('#detail-ghost');
      ghost.textContent = word;
      ghost.style.fontSize = `min(23vw, ${Math.round(52 / (Math.max(3, word.length) * 0.72) * 10) / 10}vw)`;

      const status = [];
      if (p.hot) status.push('Bestseller');
      if (p.new) status.push('New in');
      if (p.oldPrice) status.push('On sale');
      if (p.stock === 0) status.push('Sold out');
      else if (p.stock != null && p.stock <= 10) status.push(`Only ${p.stock} left`);
      $('#detail-status').textContent = status.join(' · ');

      let n = 0;
      const name = $('#detail-name');
      name.setAttribute('aria-label', p.name);
      name.innerHTML = p.name.split(' ').map((w) => `<span class="wd" aria-hidden="true">${Array.from(w).map((ch) => `<span class="l" style="--i:${n++}">${esc(ch)}</span>`).join('')}</span>`).join(' ');

      const lens = p.lengths.length > 1 ? `${p.lengths[0]}–${p.lengths[p.lengths.length - 1]}` : p.lengths[0];
      const spec = [lens, `${p.colors.length} shade${p.colors.length === 1 ? '' : 's'}`];
      if (p.rating) spec.push(`${p.rating.toFixed(1)} rating${p.reviews ? ` from ${p.reviews} reviews` : ''}`);
      $('#detail-spec').textContent = spec.join('  ·  ');
      $('#detail-price').innerHTML = `${money(p.price)}${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ''}`;
      $('#detail-desc').textContent = p.description;
      $('.detail__bill').hidden = !p.features.length;
      $('#detail-features').innerHTML = p.features.map((f) => `<li>${esc(f)}</li>`).join('');
      $('#detail-lengths').innerHTML = p.lengths.map((l) => `<button class="len" type="button" data-len="${esc(l)}">${esc(l)}</button>`).join('');
      $('#detail-shades').innerHTML = p.colors.map((c, i) => `<button class="sw" type="button" style="--c:${esc(c)}" aria-label="${esc(p.colorNames[i])}" title="${esc(p.colorNames[i])}"></button>`).join('');
      $('#detail-thumbs').innerHTML = p.images.length > 1 ? p.images.map((src, i) => `<button class="media" type="button" aria-label="Photo ${i + 1}"><img src="${esc(sized(src, 140, 140))}" alt=""></button>`).join('') : '';
      $('#detail-stock').textContent = p.stock == null ? '' : p.stock === 0 ? 'Out of stock' : `${p.stock} in stock`;

      const also = PRODUCTS.filter((x) => x.id !== p.id && x.category === p.category).concat(PRODUCTS.filter((x) => x.id !== p.id && x.category !== p.category)).slice(0, 3);
      $('#detail-also').innerHTML = also.length ? `<p class="detail__label">You may also like</p><div class="also">${also.map((x) => `<button type="button" data-open="${esc(x.id)}">${media(x.image, 360, 450, '', x.tone)}<b>${esc(x.name)}</b><span>/ ${money(x.price)}</span></button>`).join('')}</div>` : '';

      paintImage(); paintChoice(); syncSave();
      $('.detail__body').scrollTop = 0;
      article.scrollTop = 0;
      Overlay.show('detail');
      try { history.replaceState(null, '', '#p/' + encodeURIComponent(p.id)); } catch (e) { /* file:// */ }
      Stats.productView(p.id);
    }

    $('#detail-lengths').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { s.len = b.dataset.len; paintChoice(); } });
    $('#detail-shades').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { s.ci = $$('#detail-shades button').indexOf(b); paintChoice(); } });
    $('#detail-thumbs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { s.img = $$('#detail-thumbs button').indexOf(b); paintImage(); } });
    $('#detail-minus').addEventListener('click', () => { s.qty = Math.max(1, s.qty - 1); paintChoice(); });
    $('#detail-plus').addEventListener('click', () => { const max = s.p.stock == null ? 99 : Math.max(1, s.p.stock); s.qty = Math.min(max, s.qty + 1); paintChoice(); });
    $('#detail-add').addEventListener('click', () => {
      Cart.add(s.p, s.qty, s.len, s.p.colorNames[s.ci], true); // the bag opens, so no toast
      Overlay.hide('detail');
      setTimeout(() => Overlay.show('cart'), reduced ? 0 : 300);
    });
    $('#detail-save').addEventListener('click', () => Wish.toggle(s.p.id));
    $('#detail-also').addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) open(b.dataset.open); });
    $('#detail').addEventListener('overlay:close', () => {
      if (/^#p\//.test(location.hash)) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ } }
    });
    return { open, syncSave };
  })();

  // ── Bestsellers ──────────────────────────────────────────
  function initWanted() {
    const list = bestsellers().slice(0, 5), rank = $('#rank'), gauge = $('#gauge');
    if (!list.length) { $('#bestsellers').hidden = true; return; }
    function paint(i) {
      const p = list[i];
      $$('button', rank).forEach((b, n) => b.setAttribute('aria-current', String(n === i)));
      const stats = [];
      if (p.rating) stats.push(`<div><b>${p.rating.toFixed(1)}</b><small>Rating</small></div>`);
      if (p.reviews) stats.push(`<div><b>${p.reviews}</b><small>Reviews</small></div>`);
      if (p.stock != null) stats.push(`<div><b>${p.stock}</b><small>In stock</small></div>`);
      gauge.innerHTML = `<div class="gauge__frame">${media(p.image, 560, 700, p.name, p.tone, 'gauge__pic')}<span class="gauge__glow"></span><span class="gauge__num" aria-hidden="true">${pad2(i + 1)}</span></div>
        <div class="gauge__info">
          <div><h3 class="gauge__name">${esc(p.name)}</h3><p class="gauge__price">${esc(p.type)}<b>${money(p.price)}</b>${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ''}</p></div>
          <div class="gauge__stats">${stats.join('')}</div>
          <button class="gauge__go" type="button" data-open="${esc(p.id)}">View details</button>
        </div>`;
    }
    rank.innerHTML = list.map((p, i) => `<li><button type="button" data-i="${i}"><span>${esc(p.name)}</span><i>${ROMAN[i]}</i></button></li>`).join('');
    rank.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) paint(Number(b.dataset.i)); });
    rank.addEventListener('mouseover', (e) => { const b = e.target.closest('button'); if (b && b.getAttribute('aria-current') !== 'true') paint(Number(b.dataset.i)); });
    gauge.addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) Detail.open(b.dataset.open); });
    paint(0);
  }

  // ── Reviews ──────────────────────────────────────────────
  function initVoices() {
    const list = STORE_DATA.testimonials || [], quote = $('#voice-quote'), picker = $('#voice-picker');
    if (!list.length) { $('#reviews').hidden = true; return; }
    function paint(i) {
      const t = list[i];
      const stars = Array.from({ length: clamp(t.stars || 0, 0, 5) }, () => icon('star')).join('');
      quote.innerHTML = `<p>“${esc(t.body)}”</p><footer>${stars ? `<span class="stars" role="img" aria-label="${t.stars} out of 5 stars">${stars}</span>` : ''}<b>${esc(t.name)}</b><span>${esc(t.location || '')}</span></footer>`;
      $$('button', picker).forEach((b, n) => b.setAttribute('aria-pressed', String(n === i)));
    }
    picker.innerHTML = list.map((t, i) => `<button type="button" data-i="${i}" aria-label="Review from ${esc(t.name)}"><small>${pad2(i + 1)}</small>${esc(t.avatar || t.name.charAt(0))}</button>`).join('');
    picker.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) paint(Number(b.dataset.i)); });
    picker.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const btns = $$('button', picker), cur = btns.indexOf(document.activeElement);
      if (cur < 0) return;
      const nx = (cur + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length;
      btns[nx].focus(); paint(nx);
    });
    paint(0);
  }

  // ── Length guide ─────────────────────────────────────────
  function initLength() {
    const guide = STORE_DATA.lengthGuide, svg = $('#length-svg'), range = $('#length-range');
    const IN = 13, TOP = 26, CX = 150, RULER = 322;
    const y = (inches) => TOP + inches * IN;
    let texture = guide.textures[0];
    const half = (v) => { const r = Math.round(v * 2) / 2; return (Number.isInteger(r) ? r : Math.floor(r) + '½') + '"'; };

    function hair(len, tex) {
      const top = 92, end = Math.max(y(len), top + 14), spread = Math.min(40, 10 + len * 1.15);
      const amp = tex === 'wavy' ? 4.2 : tex === 'curly' ? 6 : 0, period = tex === 'curly' ? 17 : 36;
      const right = [], left = [];
      for (let yy = top; yy <= end; yy += 4) {
        const t = (yy - top) / Math.max(1, end - top);
        const wob = amp ? Math.sin(((yy - top) / period) * Math.PI * 2) * amp * Math.min(1, t * 3) : 0;
        const x = 45 + spread * Math.pow(t, 0.8);
        right.push(`${(CX + x + wob).toFixed(1)} ${yy.toFixed(1)}`);
        left.push(`${(CX - x - wob).toFixed(1)} ${yy.toFixed(1)}`);
      }
      const edge = 45 + spread;
      const dip = tex === 'curly' ? 16 : tex === 'wavy' ? 12 : 9;
      return `M ${CX - 45} ${top} C ${CX - 47} 40 ${CX - 30} 14 ${CX} 14 C ${CX + 30} 14 ${CX + 47} 40 ${CX + 45} ${top} L ${right.join(' L ')} Q ${CX + edge * 0.5} ${end + dip} ${CX} ${end + dip * 0.7} Q ${CX - edge * 0.5} ${end + dip} ${left[left.length - 1]} L ${left.reverse().join(' L ')} Z`;
    }

    const ticks = [];
    for (let i = 8; i <= 30; i++) {
      const even = i % 2 === 0;
      ticks.push(`<line class="lg-tick" x1="${RULER}" y1="${y(i)}" x2="${RULER + (even ? 12 : 6)}" y2="${y(i)}"/>`);
      if (even) ticks.push(`<text class="lg-num" x="${RULER + 18}" y="${y(i) + 4}">${i}</text>`);
    }
    const body = 'M 135 136 L 135 150 C 135 164 112 166 88 172 C 66 178 56 190 58 206 C 60 222 72 228 74 240 C 80 280 92 300 92 332 C 92 366 68 378 66 406 L 68 452 L 232 452 L 234 406 C 232 378 208 366 208 332 C 208 300 220 280 226 240 C 228 228 240 222 242 206 C 244 190 234 178 212 172 C 188 166 165 164 165 150 L 165 136 Z';
    svg.insertAdjacentHTML('beforeend',
      `<path class="lg-body" d="${body}"/><ellipse class="lg-body" cx="${CX}" cy="83" rx="37" ry="56"/>
       <path class="lg-ghost" id="lg-ghost" d=""/><path class="lg-hair" id="lg-hair" d=""/>
       <line class="lg-tick" x1="${RULER}" y1="${y(8)}" x2="${RULER}" y2="${y(30)}"/>${ticks.join('')}
       <g id="lg-ghost-mark"><line class="lg-mark lg-mark--ghost" id="lg-gline" x1="0" x2="${RULER}" y1="0" y2="0"/><text class="lg-lab lg-lab--ghost" id="lg-glab" x="${RULER - 6}" text-anchor="end"></text></g>
       <line class="lg-mark" id="lg-line" x1="0" x2="${RULER}" y1="0" y2="0"/><circle class="lg-dot" id="lg-dot" cx="${RULER}" r="5"/><text class="lg-lab" id="lg-lab" x="${RULER - 6}" text-anchor="end"></text>`);

    $('#textures').innerHTML = guide.textures.map((t) => `<button type="button" data-tex="${t.id}" aria-pressed="${t === texture}">${esc(t.label)}${icon('diamond')}</button>`).join('');

    function paint() {
      const len = Number(range.value), label = len + '"';
      const sits = len * (1 - texture.sitsShorter);
      const land = (guide.landmarks.find((l) => sits <= l.upTo) || guide.landmarks[guide.landmarks.length - 1]).label;
      const spread = 45 + Math.min(40, 10 + sits * 1.15);
      $('#lg-hair').setAttribute('d', hair(sits, texture.id));
      const yy = y(sits);
      $('#lg-line').setAttribute('x1', CX + spread + 4); $('#lg-line').setAttribute('y1', yy); $('#lg-line').setAttribute('y2', yy);
      $('#lg-dot').setAttribute('cy', yy);
      const lab = $('#lg-lab');
      lab.setAttribute('y', yy - 7);
      lab.textContent = texture.sitsShorter ? 'Sits here' : label;
      const ghost = texture.sitsShorter > 0;
      $('#lg-ghost-mark').style.display = ghost ? '' : 'none';
      $('#lg-ghost').setAttribute('d', ghost ? hair(len, 'straight') : '');
      if (ghost) {
        const gy = y(len), gs = 45 + Math.min(40, 10 + len * 1.15);
        $('#lg-gline').setAttribute('x1', CX + gs + 4); $('#lg-gline').setAttribute('y1', gy); $('#lg-gline').setAttribute('y2', gy);
        const gl = $('#lg-glab'); gl.setAttribute('y', gy + 17); gl.textContent = label + ' stretched';
      }
      $('#length-num').textContent = len;
      $('#length-out').textContent = label;
      $('#length-land').textContent = land;
      $('#length-note').textContent = ghost
        ? `A ${label} ${texture.label.toLowerCase()} unit sits about where ${half(sits)} of straight hair would.`
        : 'Straight hair hangs at its full measured length.';
      $('#length-desc').textContent = `A ${label} ${texture.label.toLowerCase()} unit falls to about the ${land.toLowerCase()}.`;
      range.setAttribute('aria-valuetext', `${len} inches, ${land}`);
      const n = PRODUCTS.filter((p) => p.lengths.includes(label)).length, btn = $('#length-shop');
      btn.disabled = !n;
      btn.textContent = n ? `Shop ${label} pieces (${n})` : `No ${label} pieces right now`;
      btn.dataset.len = label;
    }
    range.addEventListener('input', paint);
    $('#textures').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      texture = guide.textures.find((t) => t.id === b.dataset.tex) || texture;
      $$('#textures button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      paint();
    });
    $('#length-shop').addEventListener('click', (e) => Shop.setLength(e.currentTarget.dataset.len));
    paint();
  }

  // ── Shade scale ──────────────────────────────────────────
  function initShade() {
    const lum = (hex) => {
      const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
      if (!m) return 0;
      const n = parseInt(m[1], 16), ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
    };
    const map = new Map();
    PRODUCTS.forEach((p) => p.colors.forEach((c, i) => {
      const hex = String(c).toLowerCase();
      if (!map.has(hex)) map.set(hex, { hex, names: [], items: [] });
      const s = map.get(hex);
      if (!s.names.includes(p.colorNames[i])) s.names.push(p.colorNames[i]);
      s.items.push({ p, i });
    }));
    const shades = Array.from(map.values()).sort((a, b) => lum(a.hex) - lum(b.hex));
    if (!shades.length) { $('#shade').hidden = true; return; }
    const range = $('#shade-range'), scale = $('#shade-scale');
    range.max = shades.length - 1;
    range.style.setProperty('--n', shades.length);
    scale.innerHTML = shades.map((s, i) => `<button type="button" data-i="${i}" style="--c:${esc(s.hex)}" aria-label="${esc(s.names[0])}" title="${esc(s.names[0])}"></button>`).join('');

    function paint(i) {
      const s = shades[i], card = $('#shade-card'), n = s.items.length;
      card.style.setProperty('--sw', s.hex);
      card.classList.toggle('is-light', lum(s.hex) > 0.36);
      card.innerHTML = `<small>Shade ${i + 1} of ${shades.length}</small><b>${esc(s.names[0])}</b><span class="tag">In ${n} piece${n === 1 ? '' : 's'}</span>`;
      $$('button', scale).forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
      range.value = i;
      range.setAttribute('aria-valuetext', s.names[0]);
      const rows = [];
      if (s.names.length > 1) rows.push(`<dt>Also listed as</dt><dd>${s.names.slice(1).map(esc).join(', ')}</dd>`);
      rows.push(`<dt>Comes in</dt><dd>${s.items.map((x) => `<button class="linkbtn" type="button" data-open="${esc(x.p.id)}" data-ci="${x.i}">${esc(x.p.name)}</button>`).join('')}</dd>`);
      rows.push(`<dt>Shop</dt><dd><button class="btn btn--line" type="button" data-shade="${i}">See every piece in ${esc(s.names[0])}</button></dd>`);
      $('#shade-specs').innerHTML = rows.join('');
    }
    scale.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) paint(Number(b.dataset.i)); });
    range.addEventListener('input', () => paint(Number(range.value)));
    $('#shade-specs').addEventListener('click', (e) => {
      const o = e.target.closest('[data-open]');
      if (o) { Detail.open(o.dataset.open, { colorIndex: Number(o.dataset.ci) }); return; }
      const sh = e.target.closest('[data-shade]');
      if (sh) { const s = shades[Number(sh.dataset.shade)]; Shop.setShade({ hex: s.hex, name: s.names[0] }); }
    });
    paint(0);
  }

  // ── Story ────────────────────────────────────────────────
  function initStory() {
    const m = STORE_DATA.media || {};
    $('#story-img').src = sized(m.story, 900, 1125);
    $('#promise-img').src = sized(m.promise, 900, 1125);
    $('#promise-list').innerHTML = (STORE_DATA.promise || []).map((x) => `<li><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p></li>`).join('');
    $$('[data-founded]').forEach((n) => { n.textContent = BS_CONFIG.founded; });

    const story = $('#story'), thread = $('#story-thread'), dot = $('#story-dot');
    function place() {
      const s = story.getBoundingClientRect(), d = dot.getBoundingClientRect();
      thread.style.setProperty('--thread-x', (d.left + d.width / 2 - s.left) + 'px');
      thread.style.top = (d.bottom - s.top - d.height * 0.14) + 'px';
    }
    function progress() {
      const r = thread.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      thread.style.setProperty('--p', clamp((window.innerHeight * 0.72 - r.top) / Math.max(1, r.height), 0, 1).toFixed(4));
    }
    place(); progress();
    window.addEventListener('resize', () => { place(); progress(); });
    window.addEventListener('scroll', progress, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { place(); progress(); });
  }

  // ── Knowledge: basics and care ───────────────────────────
  function act(go) {
    if (!go) return;
    if (go === 'quiz') { Quiz.open(); return; }
    if (go.indexOf('shop:') === 0) { Shop.setCategory(go.slice(5)); Shop.reveal(); return; }
    const el = $(go);
    if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }
  function initBasics() {
    const list = (STORE_DATA.knowledge && STORE_DATA.knowledge.basics) || [], box = $('#chapters');
    $('#basics-img').src = sized((STORE_DATA.media || {}).basics, 1800);
    box.innerHTML = list.map((c, i) => `<div class="chapter">
      <h3><button class="chapter__row" type="button" aria-expanded="false" aria-controls="chapter-${i}"><span class="chapter__num">${ROMAN[i] || i + 1}.</span><span class="chapter__title">${esc(c.title)}</span><span class="chapter__plus">${icon('plus')}</span></button></h3>
      <div class="chapter__panel" id="chapter-${i}"><div><p>${esc(c.body)}</p>${c.action ? `<button class="linkbtn" type="button" data-go="${esc(c.action.go)}">${esc(c.action.label)}</button>` : ''}</div></div>
    </div>`).join('');
    box.addEventListener('click', (e) => {
      const go = e.target.closest('[data-go]');
      if (go) { act(go.dataset.go); return; }
      const row = e.target.closest('.chapter__row');
      if (!row) return;
      const ch = row.closest('.chapter'), willOpen = !ch.classList.contains('is-open');
      $$('.chapter', box).forEach((x) => { x.classList.remove('is-open'); $('.chapter__row', x).setAttribute('aria-expanded', 'false'); });
      if (willOpen) { ch.classList.add('is-open'); row.setAttribute('aria-expanded', 'true'); }
    });
  }
  function initCare() {
    const care = (STORE_DATA.knowledge && STORE_DATA.knowledge.care) || {}, topics = Object.keys(care);
    if (!topics.length) { $('#care').hidden = true; return; }
    const tabs = $('#care-tabs'), pics = (STORE_DATA.media || {}).care || {};
    tabs.innerHTML = topics.map((t, i) => `<button type="button" role="tab" data-topic="${esc(t)}" aria-selected="${i === 0}" aria-controls="care-steps">${esc(t)}</button>`).join('');
    function paint(topic) {
      const steps = care[topic] || [];
      $$('button', tabs).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.topic === topic)));
      $('#care-steps').innerHTML = steps.map((s, i) => `<li><p class="steps__num" aria-hidden="true">${pad2(i + 1)}</p><p class="steps__of">Step ${i + 1} of ${steps.length}</p><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p></li>`).join('');
      const fig = $('.care__figure'), img = $('#care-img');
      fig.classList.remove('is-missing');
      if (pics[topic]) img.src = sized(pics[topic], 900, 1125); else { img.removeAttribute('src'); fig.classList.add('is-missing'); }
      $('#care-cap').textContent = topic;
    }
    tabs.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) paint(b.dataset.topic); });
    paint(topics[0]);
  }

  // ── Delivery timeline ────────────────────────────────────
  function initDelivery() {
    const days = ['Today'].concat(Array.from({ length: 14 }, (_, i) => String(i + 1)));
    const row = (z, far) => {
      const d = Array.isArray(z.days) ? z.days : null;
      let bar = '';
      if (d) bar = d[1] === 0 ? '<span class="year__bar year__bar--dot" style="--a:1;--b:2"></span>' : `<span class="year__bar${far ? ' year__bar--far' : ''}" style="--a:${clamp(d[0], 0, 14) + 1};--b:${clamp(d[1], 0, 14) + 2}"></span>`;
      return `<div class="year__row" role="listitem"><span class="year__zone">${esc(z.zone)}</span><span class="year__lane" aria-hidden="true">${bar}</span><span class="year__price">${esc(z.price)}<small>${esc(z.time)}</small></span></div>`;
    };
    $('#year').innerHTML =
      `<div class="year__head" aria-hidden="true"><span></span><span class="year__days">${days.map((d) => `<span>${d}</span>`).join('')}</span><span></span></div>
       <p class="year__group">Nigeria</p><div role="list">${DELIVERY.local.map((z) => row(z, false)).join('')}</div>
       <p class="year__group">International, in business days</p><div role="list">${DELIVERY.international.map((z) => row(z, true)).join('')}</div>`;
  }

  // ── Lookbook wall ────────────────────────────────────────
  function initWall() {
    const ratios = ['4/5', '1/1', '5/4', '3/4', '4/3', '4/5'];
    const pics = PRODUCTS.filter((p) => p.image);
    if (!pics.length) { $('#lookbook').hidden = true; return; }
    const row = (list, shift) => {
      const cells = list.map((p, i) => `<span class="media" style="--tone:${esc(p.tone)};--ar:${ratios[(i + shift) % ratios.length]}"><img src="${esc(sized(p.image, 700, 760))}" alt="" loading="lazy" decoding="async"></span>`).join('');
      return `<div class="wall__row">${cells}${cells}</div>`;
    };
    const half = Math.ceil(pics.length / 2);
    const a = pics.slice(0, half), b = pics.slice(half).concat(pics.slice(0, Math.max(0, half - (pics.length - half))));
    $('#wall-rows').innerHTML = row(a.length < 4 ? a.concat(a) : a, 0) + row((b.length < 4 ? b.concat(b) : b).reverse(), 3);
  }

  // ── Words that brighten as you scroll ────────────────────
  function initReveal() {
    const blocks = $$('[data-reveal-words]');
    blocks.forEach((el) => {
      const words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map((w) => `<span class="w">${esc(w)}</span>`).join(' ');
      el.words = $$('.w', el);
    });
    if (reduced) { blocks.forEach((el) => el.words.forEach((w) => w.classList.add('is-in'))); return; }
    let queued = false;
    function run() {
      queued = false;
      const vh = window.innerHeight;
      blocks.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -40 || r.top > vh + 40) return;
        const p = clamp((vh * 0.88 - r.top) / (vh * 0.5 + r.height * 0.6), 0, 1);
        const n = Math.round(p * el.words.length);
        el.words.forEach((w, i) => w.classList.toggle('is-in', i < n));
      });
    }
    window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(run); } }, { passive: true });
    window.addEventListener('resize', run);
    run();
  }

  // ── Contact, custom orders, newsletter ───────────────────
  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  function subscribe(email) {
    const v = String(email || '').trim().toLowerCase();
    if (!validEmail(v)) return 'bad';
    const subs = store.get('bs_subscribers', []) || [];
    if (subs.includes(v)) return 'dup';
    subs.push(v);
    store.set('bs_subscribers', subs);
    return 'ok';
  }
  function initContact() {
    const c = BS_CONFIG;
    $$('[data-wa-link]').forEach((a) => { a.href = c.waLink(); });
    $$('[data-mail-link]').forEach((a) => { a.href = 'mailto:' + c.email; });
    $$('[data-ig-link]').forEach((a) => {
      a.href = 'https://www.instagram.com/' + c.instagram;
      if (!a.children.length && a.textContent.trim().charAt(0) === '@') a.textContent = '@' + c.instagram;
    });
    $$('[data-wa-text]').forEach((n) => { n.textContent = c.whatsappDisplay; });
    $$('[data-mail-text]').forEach((n) => { n.textContent = c.email; });
    $$('[data-ig-text]').forEach((n) => { n.textContent = '@' + c.instagram; });
    $$('[data-year]').forEach((n) => { n.textContent = new Date().getFullYear(); });

    // custom order line with a typed-out placeholder
    const input = $('#ask-input');
    const ideas = ['24" bone straight in honey blonde', '13×6 frontal, deep wave, 22"', 'Kinky coily bundles, 16"', 'A blunt bob in jet black, 12"'];
    if (reduced) input.placeholder = ideas[0];
    else {
      let idea = 0, pos = 0, dir = 1;
      (function type() {
        if (document.activeElement !== input && !input.value) {
          pos += dir;
          input.placeholder = ideas[idea].slice(0, pos);
          if (pos === ideas[idea].length) { dir = -1; return setTimeout(type, 1700); }
          if (pos === 0) { dir = 1; idea = (idea + 1) % ideas.length; }
        }
        setTimeout(type, dir > 0 ? 70 : 28);
      })();
    }
    $('#ask-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const want = input.value.trim();
      if (!want) { input.focus(); toast('Tell us what you want', 'Type the length, texture and shade you\'re after.'); return; }
      window.open(c.waLink(`Hi Baddie Strands! I'm looking for: ${want}\n\nIs this something you can get for me?`), '_blank', 'noopener');
      toast('Opening WhatsApp', 'Send the message there and we\'ll reply within 2 hours.');
      input.value = '';
    });

    $('#contact-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target, d = new FormData(f), err = $('#contact-error');
      const name = String(d.get('name') || '').trim(), email = String(d.get('email') || '').trim(), msg = String(d.get('message') || '').trim();
      const problem = !name ? 'Add your name so we know who to reply to.' : !validEmail(email) ? 'Add a valid email address.' : !msg ? 'Write a short message first.' : '';
      err.hidden = !problem;
      err.textContent = problem;
      if (problem) { (!name ? f.elements.name : !validEmail(email) ? f.elements.email : f.elements.message).focus(); return; }
      window.open(c.waLink(`Hi Baddie Strands!\n\nName: ${name}\nEmail: ${email}\nSubject: ${d.get('subject')}\n\nMessage:\n${msg}`), '_blank', 'noopener');
      toast('Opening WhatsApp', 'Send the message there and we\'ll reply within 2 hours.');
      f.reset();
    });

    $('#newsletter-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target, note = $('#newsletter-note'), res = subscribe(f.elements.email.value);
      note.className = 'circle__note ' + (res === 'bad' ? 'is-err' : 'is-ok');
      note.textContent = res === 'bad' ? 'That email doesn\'t look right. Check it and try again.' : res === 'dup' ? 'You\'re already in the inner circle.' : 'Subscribed. Welcome to the inner circle.';
      if (res !== 'bad') f.reset(); else f.elements.email.focus();
    });
    $('#promo-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target, res = subscribe(f.elements.email.value);
      if (res === 'bad') { toast('Check your email', 'That address doesn\'t look right.'); f.elements.email.focus(); return; }
      toast(res === 'dup' ? 'Already subscribed' : 'Subscribed', res === 'dup' ? 'You\'re already in the inner circle.' : 'Welcome to the inner circle.');
      f.reset();
    });
  }

  // ── Opening hours and the Abuja clock ────────────────────
  function initClock() {
    const c = BS_CONFIG, tz = c.timeZone || 'Africa/Lagos';
    const hour = (h) => (h % 12 || 12) + (h < 12 ? 'am' : 'pm');
    $('#hours-list').innerHTML = c.hours.map((h) => `<dt>${esc(h.label)}</dt><dd>${hour(h.open)} to ${hour(h.close)}</dd>`).join('');
    let timeFmt, partFmt;
    try {
      timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      partFmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', hour: 'numeric', hour12: false });
    } catch (e) { return; }
    const DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    function tick() {
      const now = new Date(), parts = partFmt.formatToParts(now);
      const day = DAYS[(parts.find((p) => p.type === 'weekday') || {}).value];
      const hr = Number((parts.find((p) => p.type === 'hour') || {}).value) % 24;
      const slot = c.hours.find((h) => h.days.includes(day));
      const open = !!slot && hr >= slot.open && hr < slot.close;
      let text = 'We\'re open now';
      if (!open) {
        let next = slot && hr < slot.open ? slot : null, when = 'today';
        for (let i = 1; !next && i <= 7; i++) { next = c.hours.find((h) => h.days.includes((day + i) % 7)); when = i === 1 ? 'tomorrow' : 'soon'; }
        text = next ? `Closed. Back ${when} at ${hour(next.open)}` : 'Closed right now';
      }
      $('#clock').textContent = timeFmt.format(now).replace(/\s?(am|pm)$/i, (m) => ' ' + m.trim().toUpperCase());
      $('#clock-state').textContent = text;
      const state = $('#hours-state');
      state.textContent = text;
      state.classList.toggle('is-open', open);
    }
    tick();
    setInterval(() => { if (!document.hidden) tick(); }, 1000);
  }

  // ── Type that is fitted to its container ─────────────────
  function initFit() {
    const grow = $('#foot-grow'), text = grow.textContent.trim(), letters = Array.from(text);
    const last = letters.length - 1;
    grow.innerHTML = letters.map((ch, i) => `<span aria-hidden="true" style="--k:${(1 + (i / last) * 1.3).toFixed(3)}">${ch === ' ' ? ' ' : esc(ch)}</span>`).join('');
    const word = $('.story__word');
    function natural(el) { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; }
    function fit() {
      grow.style.setProperty('--grow-fs', '100px');
      const gw = natural(grow), room = grow.clientWidth;
      if (gw > 0) grow.style.setProperty('--grow-fs', (100 * room / gw * 0.995).toFixed(2) + 'px');
      word.style.fontSize = '100px';
      const ww = natural(word), wr = word.parentElement.clientWidth;
      if (ww > 0) word.style.fontSize = (100 * wr / ww * 0.985).toFixed(2) + 'px';
    }
    fit();
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }

  // ── Search ───────────────────────────────────────────────
  function initSearch() {
    const input = $('#search-input'), out = $('#search-results');
    const hit = (p) => `<button class="hit" type="button" data-open="${esc(p.id)}">${media(p.image, 160, 160, '', p.tone)}<span><b>${esc(p.name)}</b><small>${esc(p.type)} · ${money(p.price)}</small></span></button>`;
    function paint() {
      const q = input.value.trim().toLowerCase();
      if (!q) { out.innerHTML = `<p>Popular right now</p>${bestsellers().slice(0, 4).map(hit).join('')}`; return; }
      const found = PRODUCTS.filter((p) => [p.name, p.type, p.category, p.colorNames.join(' '), p.features.join(' ')].join(' ').toLowerCase().includes(q));
      out.innerHTML = found.length ? found.map(hit).join('') : `<p>Nothing matches “${esc(input.value.trim())}”. Try a texture, a length or a shade, or ask us for a custom order.</p>`;
    }
    let t = 0;
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(paint, 140); });
    out.addEventListener('click', (e) => {
      const b = e.target.closest('[data-open]');
      if (!b) return;
      Overlay.hide('search');
      setTimeout(() => Detail.open(b.dataset.open), reduced ? 0 : 200);
    });
    const open = () => { input.value = ''; paint(); Overlay.show('search', '#search-input'); };
    $('#search-btn').addEventListener('click', open);
    document.addEventListener('keydown', (e) => {
      if (e.key !== '/' || Overlay.any() || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
      e.preventDefault(); open();
    });
  }

  // ── Quiz ─────────────────────────────────────────────────
  const Quiz = (() => {
    const body = $('#quiz-body'), foot = $('#quiz-foot'), tag = $('#quiz-tag');
    const Q = STORE_DATA.quiz || [];
    let step = -1, answers = [];

    function match() {
      const life = answers[0], time = answers[1], tex = answers[2], prio = answers[3], budget = answers[4];
      const cap = [50000, 80000, 120000, Infinity][budget];
      const texture = [/straight/i, /body wave|loose wave|water wave|wavy/i, /curly|deep wave|bob/i, /coily|kinky|4c|afro/i][tex];
      const score = (p) => {
        const head = p.name + ' ' + p.type, all = head + ' ' + p.description + ' ' + p.features.join(' ');
        let s = p.rating / 10;
        if (texture && texture.test(head)) s += 5;
        if (prio === 0 && /hd|undetectable|lace/i.test(all)) s += 2;
        if (prio === 1 && /200%|volume|full|double weft/i.test(all)) s += 2;
        if (prio === 2 && /reusable|built to last|zero shedding|low shedding|heat resistant/i.test(all)) s += 2;
        if (prio === 3 && /easy|beginner|glueless|pre-styled|no heat/i.test(all)) s += 2;
        if (life === 0 && /glueless|ponytail|protective|no heat|secure/i.test(all)) s += 1.5;
        if (life === 1 && /straight|sleek|closure|bob/i.test(all)) s += 1.5;
        if (life === 2 && /frontal|ombre|colour|volume|drama/i.test(all)) s += 1.5;
        if (life === 3 && /u-part|clip|easy|protective/i.test(all)) s += 1.5;
        if (time === 0 && /glueless|60-second|pre-styled|clip|beginner|easy/i.test(all)) s += 1.5;
        if (time >= 2 && /can be (curled|heat styled|bleached)|versatile/i.test(all)) s += 1;
        return s;
      };
      const inStock = PRODUCTS.filter((p) => p.stock !== 0);
      let pool = inStock.filter((p) => p.price <= (cap == null ? Infinity : cap)), stretched = false;
      if (!pool.length) { pool = inStock.slice().sort((a, b) => a.price - b.price).slice(0, 3); stretched = true; }
      const picks = pool.map((p) => ({ p, s: score(p) })).sort((a, b) => b.s - a.s || b.p.reviews - a.p.reviews).slice(0, 2).map((x) => x.p);
      return { picks, stretched };
    }

    function paint() {
      if (step === -1) {
        const lead = bestsellers()[0] || PRODUCTS[0];
        tag.textContent = 'Take the quiz';
        body.innerHTML = `<h2 class="card__title" id="quiz-head">Find your crown</h2><p class="card__sub">${Q.length} quick questions about your life, your style and your budget. We'll match you to the hair that fits.</p>${lead ? media(lead.image, 400, 540, '', lead.tone, 'card__pic', 'div') : ''}`;
        foot.innerHTML = '<button class="bar" type="button" data-act="next">Start now</button>';
        return;
      }
      if (step < Q.length) {
        const q = Q[step], chosen = answers[step];
        tag.textContent = `Step ${step + 1} of ${Q.length}`;
        body.innerHTML = `<h2 class="card__title" id="quiz-head">${esc(q.q)}</h2><p class="card__sub">Select one option below</p>
          <div class="opts" role="radiogroup" aria-labelledby="quiz-head">${q.options.map((o, i) => {
            const parts = String(o).split(' — ');
            return `<button class="optile" type="button" role="radio" aria-checked="${chosen === i}" data-i="${i}"><b>${esc(parts[0])}</b>${parts[1] ? `<small>${esc(parts[1])}</small>` : ''}</button>`;
          }).join('')}</div>`;
        foot.innerHTML = `<button class="bar" type="button" data-act="next"${chosen == null ? ' disabled' : ''}>${step === Q.length - 1 ? 'See my matches' : 'Continue'}</button><p class="card__links"><button class="linkbtn" type="button" data-act="back">Back to previous</button></p>`;
        return;
      }
      const res = match();
      const ls = ['active', 'professional', 'social', 'relaxed'][answers[0]] || 'versatile';
      const tx = ['sleek straight', 'natural wavy', 'bouncy curly', 'authentic coily'][answers[2]] || 'beautiful';
      tag.textContent = 'Your perfect match';
      body.innerHTML = `<h2 class="card__title" id="quiz-head">We found your crown</h2>
        <p class="card__sub">${res.stretched ? 'Nothing sits inside that budget right now, so here are our closest pieces.' : `For your ${ls} lifestyle, these are your ${tx} matches.`}</p>
        <div class="matches">${res.picks.map((p, i) => `<button class="match" type="button" data-open="${esc(p.id)}">${media(p.image, 380, 475, '', p.tone)}<i>${i === 0 ? 'Best match' : 'Also great'}</i><b>${esc(p.name)}</b><span>${money(p.price)}</span></button>`).join('')}</div>`;
      foot.innerHTML = '<button class="bar" type="button" data-act="browse">Browse the collection</button><p class="card__links"><button class="linkbtn" type="button" data-act="again">Retake the quiz</button></p>';
    }

    body.addEventListener('click', (e) => {
      const o = e.target.closest('.optile');
      if (o) {
        answers[step] = Number(o.dataset.i);
        $$('.optile', body).forEach((b) => b.setAttribute('aria-checked', String(b === o)));
        const next = $('[data-act="next"]', foot);
        if (next) next.disabled = false;
        return;
      }
      const m = e.target.closest('[data-open]');
      if (m) { Overlay.hide('quiz-sheet'); setTimeout(() => Detail.open(m.dataset.open), reduced ? 0 : 220); }
    });
    body.addEventListener('keydown', (e) => {
      if (!/^Arrow/.test(e.key)) return;
      const tiles = $$('.optile', body), cur = tiles.indexOf(document.activeElement);
      if (cur < 0) return;
      e.preventDefault();
      const nx = (cur + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + tiles.length) % tiles.length;
      tiles[nx].focus();
    });
    foot.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const a = b.dataset.act;
      if (a === 'next') { if (step >= 0 && answers[step] == null) return; step++; }
      if (a === 'back') step--;
      if (a === 'again') { step = 0; answers = []; }
      if (a === 'browse') { Overlay.hide('quiz-sheet'); Shop.setCategory('all'); Shop.reveal(); return; }
      paint();
      body.scrollTop = 0;
      const focus = $('.optile[aria-checked="true"]', body) || $('.optile', body) || $('.bar', foot);
      if (focus) focus.focus({ preventScroll: true });
    });
    return { open() { step = -1; answers = []; paint(); Overlay.show('quiz-sheet', '.bar'); } };
  })();

  // ── Navigation ───────────────────────────────────────────
  function initNav() {
    const nav = $('#nav'), btn = $('#menu-btn'), panel = $('#menu-panel');
    const set = (open) => { nav.classList.toggle('is-open', open); panel.hidden = !open; btn.setAttribute('aria-expanded', String(open)); btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu'); };
    btn.addEventListener('click', () => set(panel.hidden));
    panel.addEventListener('click', (e) => { if (e.target.closest('a,button')) set(false); });
    document.addEventListener('click', (e) => { if (!panel.hidden && !nav.contains(e.target)) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden && !Overlay.any()) { set(false); btn.focus(); } });
    $('#bag-btn').addEventListener('click', () => { set(false); Overlay.show('cart'); });

    document.addEventListener('click', (e) => {
      const quiz = e.target.closest('[data-open-quiz]');
      if (quiz) { e.preventDefault(); Quiz.open(); return; }
      const auth = e.target.closest('[data-open-auth]');
      if (auth && window.BSCheckout) { e.preventDefault(); window.BSCheckout.openAuth(); return; }
      const cat = e.target.closest('[data-shop-filter]');
      if (cat) { Shop.setCategory(cat.dataset.shopFilter); if (cat.tagName !== 'A') Shop.reveal(); }
    });
  }

  // ── Bag events ───────────────────────────────────────────
  function initCart() {
    $('#cart-items').addEventListener('click', (e) => {
      const line = e.target.closest('.line');
      if (!line) return;
      const key = line.dataset.key;
      const st = e.target.closest('[data-step]');
      if (st) { Cart.step(key, Number(st.dataset.step)); return; }
      if (e.target.closest('[data-remove]')) Cart.remove(key);
    });
    $('#checkout-btn').addEventListener('click', () => {
      if (!Cart.items.length) { toast('Your bag is empty', 'Add a piece before checking out.'); return; }
      if (window.BSCheckout) window.BSCheckout.start();
    });
    Cart.paint();
  }

  // ── Hero ─────────────────────────────────────────────────
  function initHero() {
    $('#hero-img').src = sized((STORE_DATA.media || {}).hero, 1000, 1500);
    const pick = bestsellers()[0], promo = $('#promo');
    let hidden = false;
    try { hidden = sessionStorage.getItem('bs_promo_off') === '1'; } catch (e) { /* ignore */ }
    if (hidden) { promo.hidden = true; return; }
    if (pick) {
      $('#promo-pick').innerHTML = `${media(pick.image, 200, 200, '', pick.tone)}<div><p><small>${pick.hot ? 'Bestseller' : 'Featured'}</small><b>${esc(pick.name)}</b></p><span>${money(pick.price)}<button class="linkbtn" type="button" data-open="${esc(pick.id)}">View</button></span></div>`;
      $('#promo-pick').addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) Detail.open(b.dataset.open); });
    }
    $('#promo-close').addEventListener('click', () => { promo.hidden = true; try { sessionStorage.setItem('bs_promo_off', '1'); } catch (e) { /* ignore */ } });
  }

  // ── Opening counter ──────────────────────────────────────
  function initLoader() {
    const el = $('#loader');
    if (!el) return;
    let seen = false;
    try { seen = sessionStorage.getItem('bs_seen') === '1'; sessionStorage.setItem('bs_seen', '1'); } catch (e) { /* ignore */ }
    if (seen || reduced) { el.remove(); return; }
    const num = $('#loader-num'), t0 = performance.now(), dur = 1250;
    (function tick(now) {
      const p = clamp((now - t0) / dur, 0, 1);
      num.textContent = Math.round((1 - Math.pow(1 - p, 3)) * 100);
      if (p < 1) { requestAnimationFrame(tick); return; }
      setTimeout(() => { el.classList.add('is-done'); setTimeout(() => el.remove(), 1000); }, 220);
    })(t0);
  }

  // ── Notice when this browser is showing admin edits ──────
  function initPreviewNotice() {
    if (!usingEdits) return;
    const chip = document.createElement('div');
    chip.className = 'previewchip';
    chip.innerHTML = '<span>Showing products edited in Admin on this device</span><button type="button">Use data.js</button>';
    $('button', chip).addEventListener('click', () => { store.del('bs_products_edited'); location.reload(); });
    document.body.appendChild(chip);
  }

  // ── Shared with checkout.js ──────────────────────────────
  window.BS = { $, $$, esc, money, store, toast, Overlay, Cart, validEmail, reduced, openProduct: (id, o) => Detail.open(id, o) };
  window.showToast = toast;

  // ── Start ────────────────────────────────────────────────
  initLoader();
  initNav();
  initHero();
  Shop.refresh();
  initWanted();
  initVoices();
  initLength();
  initShade();
  const pair = bestsellers().slice(1, 3);
  $('#quiz-pair').innerHTML = pair.map((p) => media(p.image, 520, 700, '', p.tone)).join('');
  initFit();
  initStory();
  initBasics();
  initCare();
  initDelivery();
  initWall();
  initContact();
  initClock();
  initReveal();
  initSearch();
  initCart();
  initPreviewNotice();
  Stats.pageView();

  const deep = /^#p\/(.+)$/.exec(location.hash);
  if (deep) setTimeout(() => Detail.open(decodeURIComponent(deep[1])), 400);
})();
