// ============================================================
// BADDIE STRANDS — Storefront
// Loader, the pinned texture scene, showroom, stylist, product
// detail, story, reviews, answers. Motion: GSAP + ScrollTrigger
// + Lenis. Sign-in and checkout live in checkout.js.
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
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  const G = window.gsap, ST = window.ScrollTrigger, Split = window.SplitText;
  const motion = !!(G && ST) && !reduced;
  if (G && ST) G.registerPlugin(ST);
  if (G && Split) G.registerPlugin(Split);
  const narrow = () => window.innerWidth < 860;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ } },
    del(key) { try { localStorage.removeItem(key); } catch (e) { /* storage unavailable */ } }
  };

  // ── Products ─────────────────────────────────────────────
  const CATEGORY_TONE = { wigs: '#7A1E46', bundles: '#A6652F', extensions: '#7D6BA8' };
  const CATEGORIES = [['all', 'All'], ['wigs', 'Wigs'], ['bundles', 'Bundles'], ['extensions', 'Extensions']];
  function tidy(p) {
    const colors = Array.isArray(p.colors) && p.colors.length ? p.colors : ['#1a1008'];
    const names = Array.isArray(p.colorNames) ? p.colorNames : [];
    return Object.assign({}, p, {
      name: String(p.name || 'Untitled piece'), type: String(p.type || ''), category: p.category || 'wigs',
      price: Number(p.price) || 0, oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
      lengths: Array.isArray(p.lengths) && p.lengths.length ? p.lengths.map(String) : ['18"'],
      colors, colorNames: colors.map((c, i) => String(names[i] || 'Shade ' + (i + 1))),
      image: p.image || '', features: Array.isArray(p.features) ? p.features.filter(Boolean) : [],
      rating: Number(p.rating) || 0, reviews: Number(p.reviews) || 0,
      stock: p.stock == null || p.stock === '' ? null : Number(p.stock),
      tone: p.tone || CATEGORY_TONE[p.category] || '#6F0A3A',
      texture: Strands.TEXTURES[p.texture] ? p.texture : 'body',
      description: String(p.description || '')
    });
  }
  const edited = store.get('bs_products_edited', null);
  const usingEdits = Array.isArray(edited) && edited.length > 0;
  const PRODUCTS = (usingEdits ? edited : STORE_DATA.products).map(tidy);
  const byId = (id) => PRODUCTS.find((p) => String(p.id) === String(id));
  const bestsellers = () => { const hot = PRODUCTS.filter((p) => p.hot); return (hot.length ? hot : PRODUCTS.slice()).sort((a, b) => b.reviews - a.reviews); };
  const inches = Strands.inches;
  const look = (p, ci, len) => Strands.lookOf(p, ci || 0, len ? inches(len) : null);
  const hexState = (h) => { const c = Strands.rgb(h); return { r: c[0], g: c[1], b: c[2] }; };
  const tipState = (h) => { const c = Strands.rgb(h); return { r2: c[0], g2: c[1], b2: c[2] }; };
  const shapeState = (shape) => ({ dome: shape === 'dome' ? 1 : 0, weft: shape === 'weft' || shape === 'clip' ? 1 : 0, pony: shape === 'pony' ? 1 : 0, clip: shape === 'clip' ? 1 : 0 });
  const stateOf = (lk) => Object.assign({}, Strands.TEXTURES[lk.texture], hexState(lk.shade), tipState(lk.tip || lk.shade), shapeState(lk.shape));

  // Drawn pictures take 10–90ms each, so they are painted in idle time, one
  // at a time, and fade in. Pics.now() draws one straight away when needed.
  const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const Pics = (() => {
    const jobs = new Map(), done = new Map();
    let busy = false, started = false;
    const idle = window.requestIdleCallback ? (f) => window.requestIdleCallback(f, { timeout: 400 }) : (f) => setTimeout(f, 30);
    const key = (p, o) => [p.id, p.texture, (p.colors || []).join(''), o.w, o.h, o.ci || 0, o.inches || ''].join('|');
    const opts = (o) => ({ w: o.w, h: o.h, shade: o.ci || 0, inches: o.inches, bg: false });
    function kick() { if (!started || busy || !jobs.size) return; busy = true; idle(step); }
    function step() {
      busy = false;
      const first = jobs.entries().next().value;
      if (!first) return;
      const [k, j] = first;
      jobs.delete(k);
      const url = Strands.thumb(j.p, opts(j.o));
      done.set(k, url);
      $$('img[data-hair]').forEach((im) => { if (im.dataset.hair === k) { im.src = url; im.classList.add('is-in'); } });
      kick();
    }
    return {
      // returns [src, key, ready]
      get(p, o) {
        const k = key(p, o);
        if (done.has(k)) return [done.get(k), k, true];
        if (!jobs.has(k)) jobs.set(k, { p, o });
        kick();
        return [BLANK, k, false];
      },
      now(p, o) {
        const k = key(p, o);
        if (!done.has(k)) { done.set(k, Strands.thumb(p, opts(o))); jobs.delete(k); }
        return done.get(k);
      },
      start() { started = true; kick(); }
    };
  })();
  function pic(p, o, extra) {
    if (p.image) return `<img src="${esc(p.image)}" alt="${esc(o.alt || '')}"${extra || ''} loading="lazy" decoding="async">`;
    const [src, k, ready] = Pics.get(p, o);
    return `<img src="${esc(src)}" data-hair="${esc(k)}" class="${ready ? 'is-in' : ''}" alt="${esc(o.alt || '')}"${extra || ''}>`;
  }
  // Picture for a product: their own photo if set, otherwise its hair, drawn.
  function art(p, o) {
    o = Object.assign({ w: 360, h: 450 }, o);
    return `<${o.tag || 'span'} class="art${p.image ? ' art--photo' : ''} ${o.cls || ''}" style="--tone:${esc(p.tone)}${o.style ? ';' + o.style : ''}"${o.attrs || ''}>${pic(p, o)}</${o.tag || 'span'}>`;
  }

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

  // ── Smooth scrolling ─────────────────────────────────────
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ST.update);
    G.ticker.add((t) => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }
  function scrollToY(y, fast) {
    if (lenis) lenis.scrollTo(y, { duration: fast ? 0.9 : 1.5, force: true });
    else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }
  function scrollToEl(el) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.5, force: true });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  // ── Overlays ─────────────────────────────────────────────
  const Overlay = (() => {
    let open = [];
    const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
    function show(id, focusSelector) {
      const el = document.getElementById(id);
      if (!el || open.includes(el)) return;
      el.returnTo = document.activeElement;
      el.hidden = false;
      void el.offsetWidth;
      el.classList.add('is-open');
      open.push(el);
      document.body.classList.add('is-locked');
      if (lenis) lenis.stop();
      const target = (focusSelector && $(focusSelector, el)) || $('[role="dialog"]', el);
      setTimeout(() => { if (target && el.classList.contains('is-open')) target.focus({ preventScroll: true }); }, 80);
    }
    function hide(ref) {
      const el = typeof ref === 'string' ? document.getElementById(ref) : ref;
      if (!el || !open.includes(el)) return;
      el.classList.remove('is-open');
      open = open.filter((x) => x !== el);
      if (!open.length) { document.body.classList.remove('is-locked'); if (lenis) lenis.start(); }
      setTimeout(() => { if (!el.classList.contains('is-open')) el.hidden = true; }, reduced ? 0 : 460);
      el.dispatchEvent(new CustomEvent('overlay:close'));
      if (el.returnTo && document.contains(el.returnTo) && !open.length) el.returnTo.focus({ preventScroll: true });
    }
    document.addEventListener('click', (e) => { const c = e.target.closest('[data-close]'); if (c) hide(c.closest('.overlay')); });
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
    read() { const a = store.get('bs_analytics', {}) || {}; return { views: a.views || 0, sessions: a.sessions || [], products_viewed: a.products_viewed || {} }; },
    pageView() {
      const a = this.read(); a.views++;
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
      else { this.ids.push(key); toast('Saved', (p ? p.name : 'Piece') + ' is waiting for you under Saved.'); }
      store.set('bs_wishlist', this.ids);
      Shop.refresh(); Detail.syncSave();
    }
  };

  // ── Bag ──────────────────────────────────────────────────
  function fly(fromEl, p, ci) {
    const bag = $('#bag-btn');
    if (!motion || !fromEl || !bag) { if (bag) { bag.classList.remove('is-bump'); void bag.offsetWidth; bag.classList.add('is-bump'); } return; }
    const a = fromEl.getBoundingClientRect(), b = bag.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'fly art';
    el.style.setProperty('--tone', p.tone);
    el.innerHTML = `<img src="${esc(p.image || Pics.now(p, { w: 160, h: 200, ci: ci || 0 }))}" alt="">`;
    document.body.appendChild(el);
    const x0 = a.left + a.width / 2 - 28, y0 = a.top + a.height / 2 - 35, x1 = b.left + b.width / 2 - 28, y1 = b.top + b.height / 2 - 35;
    G.set(el, { x: x0, y: y0, scale: 0.6, rotate: -8 });
    G.timeline({ onComplete: () => { el.remove(); bag.classList.remove('is-bump'); void bag.offsetWidth; bag.classList.add('is-bump'); } })
      .to(el, { scale: 1.15, duration: 0.25, ease: 'back.out(2)' })
      .to(el, { x: x1, duration: 0.75, ease: 'power2.inOut' }, 0.15)
      .to(el, { y: Math.min(y0, y1) - 120, duration: 0.35, ease: 'power2.out' }, 0.15)
      .to(el, { y: y1, duration: 0.4, ease: 'power2.in' }, 0.5)
      .to(el, { scale: 0.2, rotate: 12, opacity: 0.2, duration: 0.3 }, 0.62);
  }
  const Cart = {
    items: (store.get('bs_cart', []) || []).filter((i) => i && i.key && i.name && Number(i.price) >= 0 && Number(i.qty) > 0),
    count() { return this.items.reduce((s, i) => s + Number(i.qty), 0); },
    subtotal() { return this.items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0); },
    save() { store.set('bs_cart', this.items); this.paint(); },
    add(p, qty, length, shade, opts) {
      opts = opts || {};
      const len = length || p.lengths[0];
      const ci = Math.max(0, p.colorNames.indexOf(shade));
      const key = [p.id, len, shade || ''].join('_');
      const found = this.items.find((i) => i.key === key);
      if (found) found.qty += qty;
      else this.items.push({ key, id: p.id, name: p.name, type: p.type, price: p.price, currency: '₦', image: p.image || '', ci, length: len, color: shade || '', qty });
      this.save();
      fly(opts.from, p, ci);
      if (!opts.quiet) toast('In your bag', `${p.name}, ${len}${shade ? ', ' + shade : ''}`);
    },
    step(key, by) { const it = this.items.find((i) => i.key === key); if (!it) return; it.qty = Math.max(1, Number(it.qty) + by); this.save(); },
    remove(key) { this.items = this.items.filter((i) => i.key !== key); this.save(); },
    clear() { this.items = []; this.save(); },
    paint() {
      const n = this.count(), badge = $('#bag-count');
      badge.textContent = n;
      badge.classList.toggle('is-full', n > 0);
      $('#bag-btn').setAttribute('aria-label', n ? `Open your bag, ${n} item${n === 1 ? '' : 's'}` : 'Open your bag');
      $('#cart-n').textContent = n ? `(${n})` : '';
      const list = $('#cart-items'), foot = $('#cart-foot');
      if (!this.items.length) {
        list.innerHTML = `<div class="empty"><b>Your bag is empty</b><p>Find a piece you love and it will wait for you here.</p><button class="btn btn--line" type="button" data-shop-filter="all" data-close>Go to the shop</button></div>`;
        foot.hidden = true;
        return;
      }
      foot.hidden = false;
      list.innerHTML = this.items.map((i) => {
        const p = byId(i.id) || { id: i.id, tone: '#6F0A3A', image: i.image, colors: ['#1a1008'], texture: 'body', category: 'wigs', lengths: [i.length] };
        const bits = [i.type, i.length, i.color].filter(Boolean).map(esc).join(' · ');
        return `<div class="line" data-key="${esc(i.key)}">
          ${art(p, { w: 168, h: 210, ci: i.ci || 0, inches: inches(i.length) })}
          <div><b>${esc(i.name)}</b><small>${bits}</small>
            <div class="stepper"><button type="button" data-step="-1" aria-label="One fewer ${esc(i.name)}">${icon('minus')}</button><output>${Number(i.qty)}</output><button type="button" data-step="1" aria-label="One more ${esc(i.name)}">${icon('plus')}</button></div>
          </div>
          <div class="line__end"><span>${money(i.price * i.qty)}</span><button class="linkbtn" type="button" data-remove>Remove</button></div>
        </div>`;
      }).join('');
      $('#cart-subtotal').textContent = money(this.subtotal());
    }
  };

  // ── Cursor ───────────────────────────────────────────────
  function initCursor() {
    if (!motion || !fine) return;
    const c = $('#cursor'), label = $('.cursor__label', c);
    document.documentElement.classList.add('has-cursor');
    const xTo = G.quickTo(c, 'x', { duration: 0.32, ease: 'power3' }), yTo = G.quickTo(c, 'y', { duration: 0.32, ease: 'power3' });
    window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { xTo(e.clientX); yTo(e.clientY); c.style.opacity = 1; } }, { passive: true });
    document.addEventListener('pointerleave', () => { c.style.opacity = 0; });
    document.addEventListener('pointerover', (e) => {
      const t = e.target;
      const act = t.closest('a,button,select,summary,label,input[type="range"],[role="radio"]');
      const zone = t.closest('[data-cursor]');
      c.classList.toggle('is-hover', !!act);
      const word = !act && zone ? zone.dataset.cursor : '';
      c.classList.toggle('is-label', !!word);
      label.textContent = word;
    });
    window.addEventListener('pointerdown', () => c.classList.add('is-down'));
    window.addEventListener('pointerup', () => c.classList.remove('is-down'));
  }

  // ── Characters, words, lines ─────────────────────────────
  function chars(el) {
    if (el.dataset.chars) return $$('.ch', el);
    el.dataset.chars = '1';
    const text = el.textContent;
    el.innerHTML = `<span class="visually-hidden">${esc(text.trim())}</span>` + Array.from(text).map((c) => (c === ' ' ? ' ' : `<span class="ch" aria-hidden="true">${esc(c)}</span>`)).join('');
    return $$('.ch', el);
  }
  function words(el) {
    const parts = el.textContent.trim().split(/\s+/);
    el.innerHTML = parts.map((w) => `<span class="w">${esc(w)}</span>`).join(' ');
    return $$('.w', el);
  }
  function revealLines() {
    if (!motion || !Split) return;
    $$('[data-split]').forEach((el) => {
      const sp = new Split(el, { type: 'lines', mask: 'lines', linesClass: 'line' });
      G.from(sp.lines, { yPercent: 115, duration: 1.15, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: el, start: 'top 86%' } });
    });
  }

  // ── Fit big words to their width ─────────────────────────
  function natural(el) { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; }
  function fitAll() {
    $$('[data-fit]').forEach((el) => {
      el.style.fontSize = '100px';
      const room = el.parentElement.closest('.scene__stage').clientWidth * (narrow() ? 0.9 : 0.94);
      const w = natural(el);
      if (w > 0) el.style.fontSize = Math.min(100 * room / w, window.innerHeight * 0.36) + 'px';
    });
    const word = $('#story-word');
    word.style.fontSize = '100px';
    const ww = natural(word), wr = word.parentElement.clientWidth;
    if (ww > 0) word.style.fontSize = (100 * wr / ww * 0.985) + 'px';
    const grow = $('#foot-grow');
    grow.style.setProperty('--grow-fs', '100px');
    const gw = natural(grow);
    if (gw > 0) grow.style.setProperty('--grow-fs', (100 * grow.clientWidth / gw * 0.995) + 'px');
  }

  // ════════════════════════════════════════════════════════
  // THE SCENE: hero, then four textures, one pinned stage
  // ════════════════════════════════════════════════════════
  const Scene = (() => {
    const stage = $('#scene');
    const chapters = (STORE_DATA.chapters || []).map((c) => Object.assign({}, c, { p: byId(c.product) })).filter((c) => c.p);
    const heroLook = () => (narrow() ? { ax: 0.5, ay: 0.25, lockW: 0.6, len: 0.42 } : { ax: 0.5, ay: 0.2, lockW: 0.27, len: 0.72 });
    const chapLook = () => (narrow() ? { ax: 0.5, ay: 0.16, lockW: 0.5, len: 0.4 } : { ax: 0.5, ay: 0.12, lockW: 0.28, len: 0.74 });
    const hair = new Strands($('#hair'), Object.assign({ layout: 'lock', shape: 'dome', texture: 'straight', shade: '#1a1008', interactive: true }, heroLook()));
    const chapLookFor = (c) => look(c.p, c.shade);
    let tl = null;

    // chapters markup
    $('#chap-ghosts').innerHTML = chapters.map((c) => `<span>${esc(c.title)}</span>`).join('');
    $('#chap-list').innerHTML = chapters.map((c, i) => `<li class="chap__item" data-i="${i}">
        <div>
          <p class="chap__num">${ROMAN[i]}.</p>
          <h2 class="chap__title">${esc(c.title)}</h2>
          <p class="chap__line">${esc(c.line)}</p>
        </div>
        <div class="chap__pick">
          <small>Wear it as</small>
          <b>${esc(c.p.name)}</b>
          <span>${money(c.p.price)}${c.p.colorNames[c.shade] ? ' · ' + esc(c.p.colorNames[c.shade]) : ''}</span>
          <button class="oval" type="button" data-chapter-open="${i}"><span>See this piece</span></button>
        </div>
      </li>`).join('');
    $('#chap-dots').innerHTML = chapters.map((c, i) => `<button class="chap__dot" type="button" data-dot="${i}" aria-label="${ROMAN[i]}. ${esc(c.title)}"><svg viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="14"/><circle cx="15" cy="15" r="14"/></svg></button>`).join('');

    $('#chap-list').addEventListener('click', (e) => {
      const b = e.target.closest('[data-chapter-open]');
      if (!b) return;
      const c = chapters[Number(b.dataset.chapterOpen)];
      Detail.open(c.p.id, { colorIndex: c.shade, from: $('#hair') });
    });

    function staticFallback() {
      $('#chap').hidden = true;
      const box = $('#chap-static');
      box.hidden = false;
      box.innerHTML = chapters.map((c, i) => `<article style="--tone:${esc(c.bg)};color:${esc(c.ink)}">
        ${art(c.p, { w: 240, h: 300, ci: c.shade })}
        <div><p>${ROMAN[i]}.</p><h3>${esc(c.title)}</h3><p>${esc(c.line)}</p><button class="linkbtn" type="button" data-static-open="${i}">See the ${esc(c.p.name)}</button></div>
      </article>`).join('');
      box.addEventListener('click', (e) => { const b = e.target.closest('[data-static-open]'); if (b) { const c = chapters[Number(b.dataset.staticOpen)]; Detail.open(c.p.id, { colorIndex: c.shade }); } });
    }

    function build() {
      if (!motion || !chapters.length) { staticFallback(); return; }
      const items = $$('.chap__item'), dots = $$('.chap__dot'), ghosts = $('#chap-ghosts');
      const n = chapters.length;
      G.set(items, { autoAlpha: 0, y: 40 });
      G.set(['.chap__ghost'], { autoAlpha: 0 });
      tl = G.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: stage, start: 'top top', end: () => '+=' + Math.round(window.innerHeight * (n * 0.95 + 0.7)),
          pin: true, scrub: 0.9, invalidateOnRefresh: true, anticipatePin: 1,
          snap: { snapTo: 'labels', inertia: false, duration: { min: 0.35, max: 1 }, delay: 0.12, ease: 'power2.inOut' },
          onUpdate: (self) => {
            const t = self.progress * tl.duration();
            dots.forEach((d, i) => {
              const f = clamp(t - i, 0, 1);
              d.querySelector('circle + circle').style.strokeDashoffset = (88 * (1 - f)).toFixed(1);
              d.setAttribute('aria-current', t >= i + 0.5 && t < i + 1.5 ? 'step' : 'false');
            });
          }
        }
      });
      tl.addLabel('hero', 0);
      const first = chapters[0], s0 = stateOf(chapLookFor(first)), L = chapLook;
      tl.to('.scene__word--top', { yPercent: -70, opacity: 0, duration: 0.55, ease: 'power2.in' }, 0)
        .to('.scene__word--bot', { yPercent: 70, opacity: 0, duration: 0.55, ease: 'power2.in' }, 0)
        .to('.scene__hello, .scene__go, .scene__cue', { y: 30, autoAlpha: 0, duration: 0.35 }, 0)
        .to(stage, { '--bg': first.bg, '--ink': first.ink, duration: 0.7 }, 0.1)
        .to(hair.state, Object.assign({}, s0, { ax: () => L().ax, ay: () => L().ay, lockW: () => L().lockW, len: () => Math.min(L().len, chapLookFor(first).len), duration: 1 }), 0)
        .to('.chap__ghost', { autoAlpha: 1, duration: 0.4 }, 0.45)
        .to(items[0], { autoAlpha: 1, y: 0, duration: 0.45 }, 0.55)
        .to(['.chap__dots', '.chap__skip'], { autoAlpha: 1, duration: 0.3 }, 0.55)
        .addLabel('c0', 1);
      for (let i = 1; i < n; i++) {
        const c = chapters[i], lk = chapLookFor(c), at = i;
        tl.to(items[i - 1], { autoAlpha: 0, y: -40, duration: 0.35, ease: 'power2.in' }, at)
          .to(ghosts, { yPercent: -100 * i / n, duration: 0.8 }, at)
          .to(stage, { '--bg': c.bg, '--ink': c.ink, duration: 0.8 }, at)
          .to(hair.state, Object.assign({}, stateOf(lk), { len: () => Math.min(L().len, lk.len), duration: 0.95 }), at)
          .to(items[i], { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, at + 0.5)
          .addLabel('c' + i, at + 1);
      }
      tl.to({}, { duration: 0.35 });

      dots.forEach((d, i) => d.addEventListener('click', () => scrollToY(tl.scrollTrigger.labelToScroll('c' + i))));
      $('#chap-skip').addEventListener('click', () => scrollToEl($('#shop')));
    }

    function intro() {
      hair.play();
      if (!motion) return;
      // the intro moves letters, inner text and the hair's growth; the scroll scene moves their containers
      const ch = $$('.scene__word .ch');
      G.from(ch, { yPercent: 115, opacity: 0, duration: 1.25, ease: 'expo.out', stagger: 0.03 });
      G.fromTo(hair.state, { grow: 0.02 }, { grow: 1, duration: 2.1, ease: 'power3.out' });
      G.from('.scene__hello > *, .scene__go > *, .nav__bar', { y: 24, opacity: 0, duration: 0.9, stagger: 0.07, delay: 0.55, ease: 'power3.out', clearProps: 'transform,opacity' });
    }

    $$('.scene__word').forEach(chars);
    return { build, intro, hair, toChapter(i) { if (tl) scrollToY(tl.scrollTrigger.labelToScroll('c' + i)); } };
  })();

  // ════════════════════════════════════════════════════════
  // SHOWROOM
  // ════════════════════════════════════════════════════════
  const Shop = (() => {
    const root = $('#shop'), track = $('#stage-track'), stage = $('#stage');
    const state = { cat: 'all', view: 'stage', sort: 'featured', index: 0, saved: false, list: [] };
    const RATIOS = ['4/5', '1/1', '3/4', '5/4', '4/5', '3/4', '1/1'];
    const live = new Strands($('#stage-live'), { layout: 'lock', ay: 0.1, lockW: 0.56, len: 0.7, interactive: true, texture: 'body' });
    let lastGhost = '';

    function pool() { return PRODUCTS.filter((p) => !state.saved || Wish.has(p.id)); }
    function compute() {
      let list = pool().filter((p) => state.cat === 'all' || p.category === state.cat);
      if (state.sort === 'low') list = list.slice().sort((a, b) => a.price - b.price);
      if (state.sort === 'high') list = list.slice().sort((a, b) => b.price - a.price);
      if (state.sort === 'rated') list = list.slice().sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
      state.list = list;
      if (state.index >= list.length) state.index = 0;
    }
    function paintFilters() {
      const all = pool(), saved = Wish.ids.filter((id) => byId(id)).length;
      let html = CATEGORIES.map(([id, label]) => {
        const n = id === 'all' ? all.length : all.filter((p) => p.category === id).length;
        return `<button type="button" data-cat="${id}" aria-pressed="${state.cat === id && !state.saved}">${label}<span>${n}</span></button>`;
      }).join('');
      if (saved || state.saved) html += `<button type="button" data-saved aria-pressed="${state.saved}">Saved<span>${saved}</span></button>`;
      $('#filters').innerHTML = html;
    }
    const flags = (p) => [p.hot && 'Bestseller', p.new && 'New in', p.oldPrice && 'Sale'].filter(Boolean);

    function swapGhost(word) {
      const el = $('#stage-ghost');
      if (word === lastGhost) return;
      lastGhost = word;
      if (!motion) { el.textContent = word; return; }
      const old = $$('.ch', el);
      const run = () => {
        el.textContent = word;
        delete el.dataset.chars;
        const ch = chars(el);
        G.fromTo(ch, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.025, ease: 'expo.out' });
      };
      if (old.length) G.to(old, { yPercent: -100, opacity: 0, duration: 0.35, stagger: 0.012, ease: 'power2.in', onComplete: run });
      else run();
    }

    function paintStage(rebuild, dir) {
      const list = state.list, empty = !list.length;
      $('#stage-empty').hidden = !empty;
      $('#stage-info').hidden = empty;
      $('#stage-live').hidden = empty;
      $$('.stage__nav button').forEach((b) => { b.disabled = empty; });
      if (empty) {
        track.innerHTML = '';
        $('#stage-empty').textContent = state.saved ? 'Nothing saved yet. Tap the heart on a piece to keep it here.' : 'Nothing here yet. Try another filter.';
        $('#shop-count').textContent = '00 / 00';
        return;
      }
      if (rebuild) {
        track.innerHTML = list.map((p, i) => `<li class="stage__item${p.image ? ' art--photo' : ''}" data-i="${i}">${pic(p, { w: 360, h: 450 }, ' draggable="false"')}</li>`).join('');
      }
      const p = list[state.index];
      $$('.stage__item', track).forEach((li) => {
        const d = Number(li.dataset.i) - state.index;
        li.dataset.pos = d < 0 ? 'gone' : d > 2 ? 'far' : String(d);
      });
      const tones = $$('.shop__tone', root);
      const next = tones.find((t) => !t.classList.contains('is-on')) || tones[0];
      const cur = tones.find((t) => t !== next);
      next.style.setProperty('--t', p.tone); next.classList.add('is-on'); cur.classList.remove('is-on');

      const canvas = $('#stage-live');
      canvas.hidden = !!p.image;
      if (!p.image) {
        live.set(look(p, 0), rebuild ? 0 : 1.1, 'power3.inOut');
        live.play();
        // GSAP folds the CSS translate(-50%,-50%) into xPercent/yPercent, so animate around -50
        if (motion && !rebuild) G.fromTo(canvas, { xPercent: -50 + (dir > 0 ? 18 : -18), yPercent: -50, scale: 0.86 }, { xPercent: -50, yPercent: -50, scale: 1, duration: 1, ease: 'expo.out' });
      }
      swapGhost(p.type || p.category);

      const more = p.colorNames.length - 1;
      const info = $('#stage-info');
      info.innerHTML = `<p class="stage__type">${esc(p.type)}</p>
         <h3 class="stage__name">${esc(p.name)}</h3>
         <p class="stage__shade">in ${esc(p.colorNames[0])}${more > 0 ? ` and ${more} more shade${more === 1 ? '' : 's'}` : ''}</p>
         <p class="stage__price"><span>${money(p.price)}</span>${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ''}${flags(p).map((f) => `<span class="badge">${f}</span>`).join('')}</p>`;
      if (motion) G.from(info.children, { y: 26, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out' });
      $('#shop-count').textContent = `${pad2(state.index + 1)} / ${pad2(list.length)}`;
    }

    function columns() { return window.matchMedia('(min-width: 1100px)').matches ? 3 : 2; }
    function paintGrid() {
      const grid = $('#grid'), list = state.list;
      if (!list.length) { grid.innerHTML = `<p class="grid__none">${state.saved ? 'Nothing saved yet. Tap the heart on a piece to keep it here.' : 'Nothing here yet. Try another filter.'}</p>`; return; }
      const n = columns(), cols = Array.from({ length: n }, () => []);
      list.forEach((p, i) => {
        const saved = Wish.has(p.id);
        cols[i % n].push(`<article class="tile">
          <div class="tile__wrap">
            ${art(p, { tag: 'button', cls: 'tile__media', w: 440, h: 550, style: '--ar:' + RATIOS[i % RATIOS.length], attrs: ` type="button" data-open="${esc(p.id)}" aria-label="View ${esc(p.name)}"`, alt: '' })}
            <div class="tile__flags">${flags(p).map((f) => `<span class="badge">${f}</span>`).join('')}</div>
            <button class="tile__save${saved ? ' is-saved' : ''}" type="button" data-save="${esc(p.id)}" aria-pressed="${saved}" aria-label="${saved ? 'Remove from saved' : 'Save'}: ${esc(p.name)}">${icon('heart')}</button>
          </div>
          <div class="tile__cap"><h3 class="tile__name">${esc(p.name)}</h3><button class="tile__go" type="button" data-open="${esc(p.id)}" tabindex="-1" aria-hidden="true">View</button></div>
          <p class="tile__meta"><span>${esc(p.type)}</span><span>/ ${money(p.price)}${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ''}</span></p>
        </article>`);
      });
      grid.innerHTML = cols.map((c) => `<div class="grid__col">${c.join('')}</div>`).join('');
      if (motion) G.from($$('.tile', grid), { y: 60, opacity: 0, duration: 1, stagger: 0.05, ease: 'expo.out' });
    }

    function refresh(rebuild) { compute(); paintFilters(); paintStage(rebuild !== false, 0); if (state.view === 'grid') paintGrid(); }
    function go(i) {
      const n = state.list.length;
      if (!n) return;
      const dir = i > state.index ? 1 : -1;
      state.index = (i + n) % n;
      paintStage(false, dir);
    }
    function setView(v) {
      state.view = v;
      root.dataset.view = v;
      $$('[data-view-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.viewBtn === v)));
      if (v === 'grid') { live.pause(); paintGrid(); } else paintStage(true, 0);
      if (ST) ST.refresh();
    }
    const openActive = () => { const p = state.list[state.index]; if (p) Detail.open(p.id, { from: p.image ? $(`.stage__item[data-i="${state.index}"]`) : $('#stage-live') }); };

    $('#filters').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-saved')) { state.saved = !state.saved; if (state.saved) state.cat = 'all'; }
      else { state.cat = b.dataset.cat; state.saved = false; }
      state.index = 0;
      refresh();
    });
    $$('[data-view-btn]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.viewBtn)));
    $('#sort-select').addEventListener('change', (e) => { state.sort = e.target.value; state.index = 0; refresh(); });
    $('#stage-prev').addEventListener('click', () => go(state.index - 1));
    $('#stage-next').addEventListener('click', () => go(state.index + 1));
    $('#stage-open').addEventListener('click', openActive);
    stage.addEventListener('keydown', (e) => {
      if (e.target !== stage) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(state.index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(state.index - 1); }
      if (e.key === 'Enter') openActive();
    });
    // drag / swipe
    let drag = null, moved = false;
    stage.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.stage__nav') || e.button > 0) return;
      drag = { x: e.clientX, y: e.clientY }; moved = false;
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 8) { moved = true; stage.classList.add('is-dragging'); }
      if (motion && moved) G.to('#stage-live', { x: dx * 0.35, rotate: dx * 0.01, duration: 0.3, overwrite: 'auto' });
    }, { passive: true });
    window.addEventListener('pointerup', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag = null;
      stage.classList.remove('is-dragging');
      if (motion) G.to('#stage-live', { x: 0, rotate: 0, duration: 0.6, ease: 'elastic.out(1,.6)' });
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) go(state.index + (dx < 0 ? 1 : -1));
      else if (!moved) {
        const li = e.target.closest && e.target.closest('.stage__item');
        if (li && Number(li.dataset.i) !== state.index) go(Number(li.dataset.i));
        else if (e.target.closest && (e.target.closest('#stage-live') || e.target === stage || e.target.closest('.stage__track'))) {
          const r = $('#stage-live').getBoundingClientRect();
          if (e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) openActive();
        }
      }
    });
    window.addEventListener('pointercancel', () => { drag = null; stage.classList.remove('is-dragging'); });
    let wheelLock = 0;
    stage.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) < 30 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (Date.now() < wheelLock) return;
      wheelLock = Date.now() + 700;
      go(state.index + (e.deltaX > 0 ? 1 : -1));
    }, { passive: false });
    $('#grid').addEventListener('click', (e) => {
      const s = e.target.closest('[data-save]');
      if (s) { Wish.toggle(s.dataset.save); return; }
      const o = e.target.closest('[data-open]');
      if (o) Detail.open(o.dataset.open, { from: o.closest('.tile__wrap') ? $('.tile__media', o.closest('.tile__wrap')) : o });
    });
    let cols = columns();
    window.addEventListener('resize', () => { const c = columns(); if (c !== cols) { cols = c; if (state.view === 'grid') paintGrid(); } });

    return {
      refresh: () => refresh(true),
      setCategory(cat) { state.cat = CATEGORIES.some((c) => c[0] === cat) ? cat : 'all'; state.saved = false; state.index = 0; refresh(); },
      showProduct(id) { state.cat = 'all'; state.saved = false; compute(); const i = state.list.findIndex((p) => String(p.id) === String(id)); state.index = Math.max(0, i); refresh(); },
      live
    };
  })();

  // ════════════════════════════════════════════════════════
  // PRODUCT DETAIL (with live hair that answers your choices)
  // ════════════════════════════════════════════════════════
  const landmark = (inch) => { const g = STORE_DATA.lengthGuide || []; return (g.find((l) => inch <= l.upTo) || g[g.length - 1] || { label: '' }).label; };
  const fallsTo = (p, len) => {
    const i = inches(len), t = Strands.TEXTURES[p.texture] || Strands.TEXTURES.body;
    const sits = i * (1 - t.shrink * 0.9);
    return landmark(sits);
  };

  const Detail = (() => {
    const s = { p: null, qty: 1, len: null, ci: 0 };
    const hair = new Strands($('#detail-hair'), { layout: 'lock', ay: 0.15, lockW: 0.42, len: 0.6, interactive: true, texture: 'body' });

    function paintChoice(animate) {
      const p = s.p;
      $('#detail-length-out').textContent = s.len;
      $('#detail-shade-out').textContent = p.colorNames[s.ci];
      $$('#detail-lengths button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.len === s.len)));
      $$('#detail-shades button').forEach((b, i) => b.setAttribute('aria-pressed', String(i === s.ci)));
      $('#detail-qty').textContent = s.qty;
      const add = $('#detail-add'), out = p.stock === 0;
      add.disabled = out;
      add.textContent = out ? 'Sold out' : `Add to bag · ${money(p.price * s.qty)}`;
      $('#detail-falls').textContent = p.image ? '' : `At ${s.len}, it falls to your ${fallsTo(p, s.len)}`;
      $('#detail-ask').href = BS_CONFIG.waLink(`Hi Baddie Strands! I'm interested in the *${p.name}* (${s.len}, ${p.colorNames[s.ci]}). Can you help me?`);
      if (!p.image) hair.set(look(p, s.ci, s.len), animate ? 0.9 : 0, 'power3.inOut');
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
      s.p = p; s.qty = 1;
      s.len = o.length && p.lengths.includes(o.length) ? o.length : p.lengths[Math.floor(p.lengths.length / 2)];
      s.ci = clamp(o.colorIndex || 0, 0, p.colors.length - 1);
      const stageEl = $('#detail-stage'), article = $('.detail');
      stageEl.style.setProperty('--t', p.tone);
      article.style.background = `color-mix(in srgb, ${p.tone} 9%, #fff5ec)`;
      $('#detail-ghost').textContent = (p.type || p.category).split(' ')[0];
      const photo = $('#detail-photo');
      photo.hidden = !p.image; $('#detail-hair').hidden = !!p.image;
      if (p.image) { photo.src = p.image; photo.alt = p.name; }

      const status = [p.hot && 'Bestseller', p.new && 'New in', p.oldPrice && 'On sale', p.stock === 0 ? 'Sold out' : p.stock != null && p.stock <= 10 ? `Only ${p.stock} left` : ''].filter(Boolean);
      $('#detail-status').textContent = status.join(' · ');
      let k = 0;
      const name = $('#detail-name');
      name.setAttribute('aria-label', p.name);
      name.innerHTML = p.name.split(' ').map((w) => `<span class="wd" aria-hidden="true">${Array.from(w).map((ch) => `<span class="l" style="--i:${k++}">${esc(ch)}</span>`).join('')}</span>`).join(' ');
      const lens = p.lengths.length > 1 ? `${p.lengths[0]}–${p.lengths[p.lengths.length - 1]}` : p.lengths[0];
      const spec = [lens, `${p.colors.length} shade${p.colors.length === 1 ? '' : 's'}`];
      if (p.rating) spec.push(`${p.rating.toFixed(1)} from ${p.reviews} reviews`);
      $('#detail-spec').textContent = spec.join('  ·  ');
      $('#detail-price').innerHTML = `${money(p.price)}${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ''}`;
      $('#detail-desc').textContent = p.description;
      $('.detail__bill').hidden = !p.features.length;
      $('#detail-features').innerHTML = p.features.map((f) => `<li>${esc(f)}</li>`).join('');
      $('#detail-lengths').innerHTML = p.lengths.map((l) => `<button class="len-btn" type="button" data-len="${esc(l)}">${esc(l)}</button>`).join('');
      $('#detail-shades').innerHTML = p.colors.map((c, i) => `<button class="sw" type="button" style="--c:${esc(c)}" aria-label="${esc(p.colorNames[i])}" title="${esc(p.colorNames[i])}"></button>`).join('');
      $('#detail-stock').textContent = p.stock == null ? '' : p.stock === 0 ? 'Out of stock' : `${p.stock} in stock`;
      const also = PRODUCTS.filter((x) => x.id !== p.id && x.category === p.category).concat(PRODUCTS.filter((x) => x.id !== p.id && x.category !== p.category)).slice(0, 3);
      $('#detail-also').innerHTML = `<p>You might also love</p><div class="also">${also.map((x) => `<button type="button" data-open="${esc(x.id)}">${art(x, { w: 320, h: 400 })}<b>${esc(x.name)}</b><span>/ ${money(x.price)}</span></button>`).join('')}</div>`;
      paintChoice(false); syncSave();
      $('.detail__body').scrollTop = 0; article.scrollTop = 0;

      const already = Overlay.isOpen('detail');
      Overlay.show('detail');
      if (!p.image) hair.play();
      try { history.replaceState(null, '', '#p/' + encodeURIComponent(p.id)); } catch (e) { /* file:// */ }
      Stats.productView(p.id);
      if (!motion) return;

      // the piece grows from where you tapped it into the stage
      const from = o.from && !already ? o.from.getBoundingClientRect() : null;
      if (from && from.width > 10) {
        const to = stageEl.getBoundingClientRect();
        const ghost = document.createElement('div');
        ghost.className = 'flip art';
        ghost.style.cssText = `--tone:${p.tone};left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px`;
        ghost.innerHTML = `<img src="${esc(p.image || Pics.now(p, { w: 360, h: 450, ci: s.ci }))}" alt="">`;
        document.body.appendChild(ghost);
        G.set(['#detail-hair', '#detail-ghost', '#detail-falls'], { opacity: 0 });
        G.to(ghost, { left: to.left, top: to.top, width: to.width, height: to.height, borderRadius: narrow() ? 20 : 28, duration: 0.9, ease: 'power3.inOut',
          onComplete: () => { G.to(['#detail-hair', '#detail-ghost', '#detail-falls'], { opacity: 1, duration: 0.35 }); G.to(ghost, { opacity: 0, duration: 0.35, onComplete: () => ghost.remove() }); } });
      }
      G.from($$('.l', name), { yPercent: 90, opacity: 0, filter: 'blur(8px)', duration: 0.9, stagger: 0.018, ease: 'expo.out', delay: from ? 0.35 : 0.05 });
      G.from($$('.detail__body > *:not(.detail__name)'), { y: 24, opacity: 0, duration: 0.7, stagger: 0.04, ease: 'power3.out', delay: from ? 0.45 : 0.1, clearProps: 'transform,opacity' });
    }

    $('#detail-lengths').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { s.len = b.dataset.len; paintChoice(true); } });
    $('#detail-shades').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { s.ci = $$('#detail-shades button').indexOf(b); paintChoice(true); } });
    $('#detail-minus').addEventListener('click', () => { s.qty = Math.max(1, s.qty - 1); paintChoice(false); });
    $('#detail-plus').addEventListener('click', () => { const max = s.p.stock == null ? 99 : Math.max(1, s.p.stock); s.qty = Math.min(max, s.qty + 1); paintChoice(false); });
    $('#detail-add').addEventListener('click', (e) => {
      Cart.add(s.p, s.qty, s.len, s.p.colorNames[s.ci], { quiet: true, from: s.p.image ? $('#detail-photo') : $('#detail-stage') });
      Overlay.hide('detail');
      setTimeout(() => Overlay.show('cart'), reduced ? 0 : 900);
    });
    $('#detail-save').addEventListener('click', () => Wish.toggle(s.p.id));
    $('#detail-also').addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) open(b.dataset.open); });
    $('#detail').addEventListener('overlay:close', () => {
      hair.pause();
      if (/^#p\//.test(location.hash)) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ } }
    });
    return { open, syncSave };
  })();

  // ════════════════════════════════════════════════════════
  // THE STYLIST: four questions, the hair changes as you answer
  // ════════════════════════════════════════════════════════
  const Stylist = (() => {
    const cfg = STORE_DATA.stylist || { moves: [], kinds: [] };
    const box = $('#stylist-q'), log = $('#stylist-log'), sofar = $('#stylist-so-far');
    const hair = new Strands($('#stylist-hair'), { layout: 'lock', ay: 0.12, lockW: 0.46, len: 0.5, interactive: true, texture: 'straight', shade: '#1a1008' });
    const lum = (hex) => { const c = Strands.rgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
    const shades = (() => {
      const m = new Map();
      PRODUCTS.forEach((p) => p.colors.forEach((c, i) => { const k = c.toLowerCase(); if (!m.has(k)) m.set(k, { hex: k, name: p.colorNames[i] }); }));
      return Array.from(m.values()).sort((a, b) => lum(a.hex) - lum(b.hex));
    })();
    const dist = (a, b) => { const x = Strands.rgb(a), y = Strands.rgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
    const QUESTIONS = ['How do you want it to move?', 'How long are we going?', 'Now, the colour.', 'What are we shopping for?'];
    const a = { move: null, len: 18, shade: null, kind: null };
    let step = 0, played = false;

    function paintSoFar() {
      const bits = [];
      if (a.move) bits.push(cfg.moves.find((m) => m.id === a.move).label);
      if (step > 1 || a.len !== 18) bits.push(a.len + '″');
      if (a.shade) bits.push(a.shade.name);
      if (a.kind) bits.push(cfg.kinds.find((k) => k.id === a.kind).label);
      sofar.innerHTML = bits.map((b) => `<span>${esc(b)}</span>`).join('');
    }
    function paintLog() {
      const rows = [];
      if (step > 0 && a.move) rows.push([0, cfg.moves.find((m) => m.id === a.move).label]);
      if (step > 1) rows.push([1, a.len + '″, to your ' + landmark(a.len)]);
      if (step > 2 && a.shade) rows.push([2, a.shade.name]);
      if (step > 3 && a.kind) rows.push([3, cfg.kinds.find((k) => k.id === a.kind).label]);
      log.innerHTML = rows.map(([i, ans]) => `<li><span>${esc(QUESTIONS[i])}</span><b>${esc(ans)}<button type="button" data-redo="${i}">Change</button></b></li>`).join('');
    }
    function preview(dur) {
      const tex = a.move ? cfg.moves.find((m) => m.id === a.move).show : 'straight';
      const shape = a.kind === 'bundles' ? 'weft' : a.kind === 'extensions' ? 'clip' : 'dome';
      hair.set({ texture: tex, shade: a.shade ? a.shade.hex : '#1a1008', len: Strands.lenFor(a.len) * 0.92, shape }, dur == null ? 1 : dur, 'power3.inOut');
    }

    function render() {
      paintLog(); paintSoFar();
      const head = `<p class="q__step">${step < 4 ? `Question ${step + 1} of 4` : 'Your crown'}</p>`;
      if (step === 0) {
        box.innerHTML = `${head}<h3 class="q__title">${QUESTIONS[0]}</h3>
          <div class="opts" role="radiogroup" aria-label="${QUESTIONS[0]}">${cfg.moves.map((m) => `<button class="optile optile--pic" type="button" role="radio" aria-checked="${a.move === m.id}" data-move="${m.id}">${pic({ id: 'tx-' + m.show, texture: m.show, colors: ['#1a1008'], category: 'wigs', lengths: ['16"'], tone: '#6F0A3A' }, { w: 160, h: 200 })}<b>${esc(m.label)}</b></button>`).join('')}</div>`;
      } else if (step === 1) {
        const chips = [12, 16, 20, 24, 28];
        box.innerHTML = `${head}<h3 class="q__title">${QUESTIONS[1]}</h3>
          <div class="len">
            <div class="len__read"><span class="len__num" id="len-num">${a.len}″</span><span class="len__land" id="len-land">to your ${esc(landmark(a.len))}</span></div>
            <label class="visually-hidden" for="len-range">Length in inches</label>
            <input type="range" id="len-range" min="8" max="30" step="2" value="${a.len}" aria-valuetext="${a.len} inches, to your ${esc(landmark(a.len))}">
            <div class="len__chips">${chips.map((c) => `<button class="chipbtn" type="button" data-len="${c}" aria-pressed="${a.len === c}">${c}″</button>`).join('')}</div>
          </div>
          <button class="bar q__next" type="button" data-next>That's my length</button>`;
      } else if (step === 2) {
        box.innerHTML = `${head}<h3 class="q__title">${QUESTIONS[2]}</h3>
          <p class="q__help" id="shade-name">${a.shade ? esc(a.shade.name) : 'Tap a shade to try it on.'}</p>
          <div class="swatches" role="radiogroup" aria-label="Shade">${shades.map((sh, i) => `<button class="swatch" type="button" role="radio" style="--c:${esc(sh.hex)}" data-shade="${i}" aria-checked="${!!a.shade && a.shade.hex === sh.hex}" aria-label="${esc(sh.name)}" title="${esc(sh.name)}"></button>`).join('')}</div>`;
      } else if (step === 3) {
        box.innerHTML = `${head}<h3 class="q__title">${QUESTIONS[3]}</h3>
          <div class="opts" role="radiogroup" aria-label="${QUESTIONS[3]}">${cfg.kinds.map((k) => `<button class="optile" type="button" role="radio" aria-checked="${a.kind === k.id}" data-kind="${k.id}"><b>${esc(k.label)}</b></button>`).join('')}</div>`;
      } else {
        const res = match();
        box.innerHTML = `${head}<h3 class="q__title">${res.close ? 'Here\'s the closest we have' : 'Here\'s your crown'}</h3>
          <div class="results">${res.picks.map((r, i) => `<article class="result">
            ${art(r.p, { w: 240, h: 300, ci: r.ci, inches: inches(r.len), attrs: ` data-result="${i}"` })}
            <div class="result__body">
              <p class="result__tag">${i === 0 ? 'Best match' : 'Also lovely'}</p>
              <h4 class="result__name">${esc(r.p.name)}</h4>
              <p class="result__why">${esc(r.why)}</p>
              <div class="result__row"><b>${money(r.p.price)}</b><button class="result__add" type="button" data-add="${i}">Add ${esc(r.len)}, ${esc(r.p.colorNames[r.ci])}</button><button class="linkbtn" type="button" data-see="${i}">See details</button></div>
            </div></article>`).join('')}</div>
          <button class="linkbtn q__again" type="button" data-again>Start again</button>`;
        box.results = res.picks;
      }
      if (motion) G.fromTo(box.children, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.05, ease: 'expo.out' });
      const first = $('[aria-checked="true"]', box) || $('.optile, .swatch, #len-range', box);
      return first;
    }
    function go(n, focus) {
      const run = () => { step = n; const f = render(); if (focus && f) f.focus({ preventScroll: true }); };
      if (motion && box.children.length) G.to(box.children, { y: -18, opacity: 0, duration: 0.25, stagger: 0.02, ease: 'power2.in', onComplete: run });
      else run();
    }

    function match() {
      const mv = cfg.moves.find((m) => m.id === a.move) || cfg.moves[0];
      const scored = PRODUCTS.filter((p) => p.stock !== 0).map((p) => {
        let sc = p.rating / 10, why = [];
        if (mv.textures.includes(p.texture)) { sc += 6; why.push(mv.label.toLowerCase()); }
        if (a.kind && a.kind !== 'any' && p.category === a.kind) sc += 4;
        let ci = 0, best = 1e9;
        p.colors.forEach((c, i) => { const d = dist(c, a.shade ? a.shade.hex : '#1a1008'); if (d < best) { best = d; ci = i; } });
        if (best < 8) { sc += 3; why.push('comes in ' + p.colorNames[ci]); } else sc += Math.max(0, 2 - best / 60);
        const want = a.len, lens = p.lengths.map(inches);
        let li = 0, bd = 1e9;
        lens.forEach((v, i) => { if (Math.abs(v - want) < bd) { bd = Math.abs(v - want); li = i; } });
        if (bd === 0) { sc += 2; why.push(`offered at ${want}″`); } else sc -= bd * 0.15;
        return { p, sc, ci, len: p.lengths[li], why: why.length ? 'Matches: ' + why.join(', ') + '.' : 'Our closest piece to what you described.', hit: mv.textures.includes(p.texture) };
      }).sort((x, y) => y.sc - x.sc);
      return { picks: scored.slice(0, 3), close: !scored.length || !scored[0].hit };
    }

    box.addEventListener('click', (e) => {
      const mv = e.target.closest('[data-move]');
      if (mv) { a.move = mv.dataset.move; $$('[data-move]', box).forEach((b) => b.setAttribute('aria-checked', String(b === mv))); preview(); paintSoFar(); setTimeout(() => go(1, true), reduced ? 0 : 520); return; }
      const lc = e.target.closest('[data-len]');
      if (lc) { a.len = Number(lc.dataset.len); syncLen(); return; }
      if (e.target.closest('[data-next]')) { go(2, true); return; }
      const sh = e.target.closest('[data-shade]');
      if (sh) { a.shade = shades[Number(sh.dataset.shade)]; $$('[data-shade]', box).forEach((b) => b.setAttribute('aria-checked', String(b === sh))); $('#shade-name').textContent = a.shade.name; preview(); paintSoFar(); setTimeout(() => go(3, true), reduced ? 0 : 650); return; }
      const kd = e.target.closest('[data-kind]');
      if (kd) { a.kind = kd.dataset.kind; $$('[data-kind]', box).forEach((b) => b.setAttribute('aria-checked', String(b === kd))); preview(); setTimeout(() => go(4, true), reduced ? 0 : 450); return; }
      const add = e.target.closest('[data-add]');
      if (add) { const r = box.results[Number(add.dataset.add)]; Cart.add(r.p, 1, r.len, r.p.colorNames[r.ci], { from: add.closest('.result').querySelector('.art') }); return; }
      const see = e.target.closest('[data-see],[data-result]');
      if (see) { const i = Number(see.dataset.see != null ? see.dataset.see : see.dataset.result); const r = box.results[i]; Detail.open(r.p.id, { length: r.len, colorIndex: r.ci, from: see.closest('.result').querySelector('.art') }); return; }
      if (e.target.closest('[data-again]')) { a.move = null; a.len = 18; a.shade = null; a.kind = null; preview(); go(0, true); }
    });
    box.addEventListener('input', (e) => { if (e.target.id === 'len-range') { a.len = Number(e.target.value); syncLen(); } });
    box.addEventListener('keydown', (e) => {
      if (!/^Arrow/.test(e.key)) return;
      const group = e.target.closest('[role="radiogroup"]');
      if (!group) return;
      const items = $$('[role="radio"]', group), cur = items.indexOf(document.activeElement);
      if (cur < 0) return;
      e.preventDefault();
      items[(cur + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
    });
    function syncLen() {
      const r = $('#len-range');
      if (r) { r.value = a.len; r.setAttribute('aria-valuetext', `${a.len} inches, to your ${landmark(a.len)}`); }
      const nEl = $('#len-num'); if (nEl) nEl.textContent = a.len + '″';
      const lEl = $('#len-land'); if (lEl) lEl.textContent = 'to your ' + landmark(a.len);
      $$('[data-len]', box).forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.len) === a.len)));
      preview(0.6); paintSoFar();
    }
    log.addEventListener('click', (e) => { const b = e.target.closest('[data-redo]'); if (b) go(Number(b.dataset.redo), true); });

    render();
    if (ST && motion) ST.create({ trigger: '#stylist', start: 'top 70%', onEnter: () => { if (!played) { played = true; hair.set({ texture: 'body' }, 1.4); setTimeout(() => hair.set({ texture: 'straight' }, 1.2), 1500); } } });
    hair.play();
    return {};
  })();

  // ════════════════════════════════════════════════════════
  // STORY: the dot drops a single strand down the page
  // ════════════════════════════════════════════════════════
  function initStory() {
    $$('[data-founded]').forEach((n) => { n.textContent = BS_CONFIG.founded; });
    const word = $('#story-word'), dot = $('#story-dot'), svg = $('#story-strand'), path = $('#story-path'), story = $('#story');
    const blur = $$('[data-blur]');
    if (!motion) return;
    // characters of the wordmark come into focus
    const letters = [];
    Array.from(word.childNodes).forEach((nd) => {
      if (nd.nodeType === 3) { const span = document.createElement('span'); span.innerHTML = Array.from(nd.textContent).map((c) => `<span class="ch">${esc(c)}</span>`).join(''); word.replaceChild(span, nd); letters.push(...$$('.ch', span)); }
      else letters.push(nd);
    });
    G.fromTo(letters, { opacity: 0.08, filter: 'blur(14px)', yPercent: 12 }, { opacity: 1, filter: 'blur(0px)', yPercent: 0, stagger: 0.06, ease: 'none', scrollTrigger: { trigger: story, start: 'top 80%', end: 'top 15%', scrub: 0.6 } });
    blur.forEach((p) => {
      const ws = words(p);
      G.fromTo(ws, { opacity: 0.12, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)', stagger: 0.05, ease: 'none', scrollTrigger: { trigger: p, start: 'top 85%', end: 'bottom 55%', scrub: 0.5 } });
    });
    // the strand
    function draw() {
      if (narrow()) return;
      const r = story.getBoundingClientRect(), d = dot.getBoundingClientRect(), txt = $('.story__text').getBoundingClientRect();
      const W = r.width, H = r.height;
      svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const x = d.left + d.width / 2 - r.left, y = d.bottom - r.top - d.height * 0.15;
      const yEnd = txt.bottom - r.top + 40, span = yEnd - y, sway = W * 0.035;
      let dd = `M ${x} ${y}`;
      const segs = 6;
      for (let i = 1; i <= segs; i++) {
        const y1 = y + span * (i - 0.5) / segs, y2 = y + span * i / segs, sx = (i % 2 ? 1 : -1) * sway * (1 - i / (segs + 2));
        dd += ` Q ${x + sx} ${y1} ${x + sx * 0.15} ${y2}`;
      }
      path.setAttribute('d', dd);
      const len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      if (draw.st) draw.st.kill();
      draw.st = G.fromTo(path, { strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: story, start: 'top 30%', end: 'bottom 70%', scrub: 0.4 } });
    }
    draw.go = draw;
    window.addEventListener('resize', () => setTimeout(draw, 120));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw); else draw();
  }

  // ════════════════════════════════════════════════════════
  // REVIEWS
  // ════════════════════════════════════════════════════════
  function initVoices() {
    const list = STORE_DATA.testimonials || [], quote = $('#voice-quote'), picker = $('#voice-picker');
    if (!list.length) { $('#reviews').hidden = true; return; }
    let i = 0, timer = null, bar = null, inView = false, hover = false;
    function paint(n, user) {
      i = (n + list.length) % list.length;
      const t = list[i];
      const stars = Array.from({ length: clamp(t.stars || 0, 0, 5) }, () => icon('star')).join('');
      quote.innerHTML = `<p>“${esc(t.body)}”</p><footer>${stars ? `<span class="stars" role="img" aria-label="${t.stars} out of 5 stars">${stars}</span>` : ''}<b>${esc(t.name)}</b><span>${esc(t.location || '')}</span></footer>`;
      $$('button', picker).forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
      if (motion) {
        const ws = words($('p', quote));
        G.from(ws, { y: 18, opacity: 0, filter: 'blur(4px)', duration: 0.7, stagger: 0.012, ease: 'power3.out' });
      }
      run();
    }
    function run() {
      if (bar) bar.kill();
      $$('button i', picker).forEach((x) => { x.style.transform = 'scaleX(0)'; });
      if (!motion || !inView || hover) return;
      const el = $$('button i', picker)[i];
      bar = G.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 7, ease: 'none', onComplete: () => paint(i + 1) });
    }
    picker.innerHTML = list.map((t, k) => `<button type="button" aria-label="Review from ${esc(t.name)}">${esc(t.avatar || t.name.charAt(0))}<i aria-hidden="true"></i></button>`).join('');
    picker.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) paint($$('button', picker).indexOf(b), true); });
    const stageEl = $('.voices__stage');
    stageEl.addEventListener('pointerenter', () => { hover = true; run(); });
    stageEl.addEventListener('pointerleave', () => { hover = false; run(); });
    let sx = null;
    stageEl.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    stageEl.addEventListener('pointerup', (e) => { if (sx != null && Math.abs(e.clientX - sx) > 60) paint(i + (e.clientX < sx ? 1 : -1), true); sx = null; });
    if (ST && motion) ST.create({ trigger: '#reviews', start: 'top 70%', end: 'bottom 30%', onToggle: (self) => { inView = self.isActive; run(); } });
    paint(0);
  }

  // ════════════════════════════════════════════════════════
  // ANSWERS
  // ════════════════════════════════════════════════════════
  function initAnswers() {
    const faq = STORE_DATA.faq || [], box = $('#faq'), tabs = $('#faq-tabs');
    const table = (rows) => `<span class="faq__rows">${rows.map((z) => `${esc(z.zone)}: ${esc(z.time.toLowerCase())}, ${esc(z.price)}.`).join(' ')}</span>`;
    const answer = (a) => {
      if (a === '@delivery-local') return `${table(DELIVERY.local)} You'll see your exact fee at checkout once you pick your state.`;
      if (a === '@delivery-intl') return `Yes. ${table(DELIVERY.international)} It's tracked, packed discreetly, and we handle the customs paperwork.`;
      return esc(a);
    };
    const groups = ['All'].concat(Array.from(new Set(faq.map((f) => f.group))));
    let group = 'All';
    tabs.innerHTML = groups.map((g) => `<button type="button" data-group="${esc(g)}" aria-pressed="${g === group}">${esc(g)}</button>`).join('');
    function paint() {
      const list = faq.filter((f) => group === 'All' || f.group === group);
      box.innerHTML = list.map((f, i) => `<div class="faq__item">
        <h3><button class="faq__q" type="button" aria-expanded="false" aria-controls="faq-${i}"><span>${esc(f.q)}</span><span class="faq__box">${icon('plus')}</span></button></h3>
        <div class="faq__a" id="faq-${i}" role="region"><p>${answer(f.a)}</p></div></div>`).join('');
      if (motion) G.from($$('.faq__item', box), { y: 30, opacity: 0, duration: 0.7, stagger: 0.04, ease: 'expo.out' });
      if (ST) ST.refresh();
    }
    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('[data-group]');
      if (!b) return;
      group = b.dataset.group;
      $$('button', tabs).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      paint();
    });
    box.addEventListener('click', (e) => {
      const q = e.target.closest('.faq__q');
      if (!q) return;
      const item = q.closest('.faq__item'), panel = $('.faq__a', item), opening = !item.classList.contains('is-open');
      item.classList.toggle('is-open', opening);
      q.setAttribute('aria-expanded', String(opening));
      if (motion) G.to(panel, { height: opening ? 'auto' : 0, duration: 0.6, ease: 'power3.inOut', onComplete: () => ST.refresh() });
      else panel.style.height = opening ? 'auto' : '0px';
    });
    paint();
  }

  // ── Contact, ask, newsletter ─────────────────────────────
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
    $$('[data-wa-link]').forEach((x) => { x.href = c.waLink(); });
    $$('[data-mail-link]').forEach((x) => { x.href = 'mailto:' + c.email; });
    $$('[data-ig-link]').forEach((x) => { x.href = 'https://www.instagram.com/' + c.instagram; });
    $$('[data-wa-text]').forEach((n) => { n.textContent = c.whatsappDisplay; });
    $$('[data-mail-text]').forEach((n) => { n.textContent = c.email; });
    $$('[data-ig-text]').forEach((n) => { n.textContent = '@' + c.instagram; });
    $$('[data-year]').forEach((n) => { n.textContent = new Date().getFullYear(); });

    const input = $('#ask-input');
    const ideas = ['24″ bone straight in honey blonde', '13×6 frontal, deep wave, 22″', 'Kinky coily bundles, 16″', 'A blunt bob in jet black, 12″'];
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
      window.open(c.waLink(`Hi Baddie Strands! I'm looking for: ${want}\n\nCan you get this for me?`), '_blank', 'noopener');
      toast('Opening WhatsApp', 'Send the message there and we\'ll reply within 2 hours.');
      input.value = '';
    });
    $('#newsletter-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target, note = $('#newsletter-note'), res = subscribe(f.elements.email.value);
      note.className = 'foot__note ' + (res === 'bad' ? 'is-err' : 'is-ok');
      note.textContent = res === 'bad' ? 'That email doesn\'t look right. Check it and try again.' : res === 'dup' ? 'You\'re already in the inner circle.' : 'You\'re in. Welcome to the inner circle.';
      if (res !== 'bad') f.reset(); else f.elements.email.focus();
    });
  }

  function initClock() {
    const c = BS_CONFIG, tz = c.timeZone || 'Africa/Lagos';
    const hour = (h) => (h % 12 || 12) + (h < 12 ? 'am' : 'pm');
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
      let text = 'We\'re online now';
      if (!open) {
        let next = slot && hr < slot.open ? slot : null, when = 'today';
        for (let i = 1; !next && i <= 7; i++) { next = c.hours.find((h) => h.days.includes((day + i) % 7)); when = i === 1 ? 'tomorrow' : 'soon'; }
        text = next ? `We're back ${when} at ${hour(next.open)}, Abuja time` : 'We\'re offline right now';
      }
      $('#clock').textContent = timeFmt.format(now).replace(/\s?(am|pm)$/i, (m) => ' ' + m.trim().toUpperCase());
      $('#clock-state').textContent = text;
      const st = $('#hours-state');
      st.textContent = text;
      st.classList.toggle('is-open', open);
    }
    tick();
    setInterval(() => { if (!document.hidden) tick(); }, 1000);
  }

  // ── The footer's growing words ───────────────────────────
  function initGrow() {
    const grow = $('#foot-grow'), text = grow.textContent.trim(), letters = Array.from(text), last = letters.length - 1;
    grow.innerHTML = letters.map((ch, i) => `<span aria-hidden="true" style="--k:${(1 + (i / last) * 1.3).toFixed(3)}">${ch === ' ' ? ' ' : esc(ch)}</span>`).join('');
    if (!motion) return;
    const spans = $$('span', grow);
    G.fromTo(spans, { scaleY: 0.08 }, { scaleY: (i) => 1 + (i / last) * 1.3, ease: 'none', stagger: 0.04, scrollTrigger: { trigger: grow, start: 'top bottom', end: 'bottom bottom', scrub: 0.6 } });
  }

  // ── Search ───────────────────────────────────────────────
  function initSearch() {
    const input = $('#search-input'), out = $('#search-results');
    const hit = (p) => `<button class="hit" type="button" data-open="${esc(p.id)}">${art(p, { w: 128, h: 160 })}<span><b>${esc(p.name)}</b><small>${esc(p.type)} · ${money(p.price)}</small></span></button>`;
    function paint() {
      const q = input.value.trim().toLowerCase();
      if (!q) { out.innerHTML = `<p>Popular right now</p>${bestsellers().slice(0, 4).map(hit).join('')}`; return; }
      const found = PRODUCTS.filter((p) => [p.name, p.type, p.category, p.texture, p.colorNames.join(' '), p.features.join(' ')].join(' ').toLowerCase().includes(q));
      out.innerHTML = found.length ? found.map(hit).join('') : `<p>Nothing matches “${esc(input.value.trim())}”. Try a texture, a length or a shade, or ask us for it below.</p>`;
    }
    let t = 0;
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(paint, 140); });
    out.addEventListener('click', (e) => {
      const b = e.target.closest('[data-open]');
      if (!b) return;
      const from = $('.art', b);
      Overlay.hide('search');
      setTimeout(() => Detail.open(b.dataset.open, { from }), reduced ? 0 : 60);
    });
    const open = () => { input.value = ''; paint(); Overlay.show('search', '#search-input'); };
    $('#search-btn').addEventListener('click', open);
    document.addEventListener('keydown', (e) => {
      if (e.key !== '/' || Overlay.any() || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
      e.preventDefault(); open();
    });
  }

  // ── Navigation ───────────────────────────────────────────
  function initNav() {
    const nav = $('#nav'), btn = $('#menu-btn'), panel = $('#menu-panel');
    const set = (open) => {
      nav.classList.toggle('is-open', open);
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
      if (open) { nav.classList.remove('is-tucked'); if (motion) G.from(panel.children, { y: -12, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out' }); }
    };
    btn.addEventListener('click', () => set(panel.hidden));
    panel.addEventListener('click', (e) => { if (e.target.closest('a,button')) set(false); });
    document.addEventListener('click', (e) => { if (!panel.hidden && !nav.contains(e.target)) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden && !Overlay.any()) { set(false); btn.focus(); } });
    $('#bag-btn').addEventListener('click', () => { set(false); Overlay.show('cart'); });

    // tuck the pill away while scrolling down, bring it back on the way up
    let lastY = 0;
    const onScroll = (y) => {
      if (!panel.hidden) return;
      nav.classList.toggle('is-tucked', y > lastY + 2 && y > 240);
      if (y < lastY - 2 || y < 240) nav.classList.remove('is-tucked');
      lastY = y;
    };
    if (lenis) lenis.on('scroll', (l) => onScroll(l.scroll));
    else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
    nav.addEventListener('focusin', () => nav.classList.remove('is-tucked'));

    document.addEventListener('click', (e) => {
      const auth = e.target.closest('[data-open-auth]');
      if (auth && window.BSCheckout) { e.preventDefault(); window.BSCheckout.openAuth(); return; }
      const cat = e.target.closest('[data-shop-filter]');
      if (cat) Shop.setCategory(cat.dataset.shopFilter);
      const ch = e.target.closest('[data-chapter]');
      if (ch) { e.preventDefault(); Scene.toChapter(Number(ch.dataset.chapter)); return; }
      const a = e.target.closest('a[href^="#"]');
      if (a && !e.defaultPrevented) {
        const id = a.getAttribute('href');
        if (id.length > 1) {
          const el = document.querySelector(id);
          if (el) { e.preventDefault(); if (Overlay.any()) $$('.overlay.is-open').forEach((o) => Overlay.hide(o)); scrollToEl(el); }
        }
      }
    });
  }

  function initCart() {
    $('#cart-items').addEventListener('click', (e) => {
      const line = e.target.closest('.line');
      if (!line) return;
      const key = line.dataset.key, st = e.target.closest('[data-step]');
      if (st) { Cart.step(key, Number(st.dataset.step)); return; }
      if (e.target.closest('[data-remove]')) Cart.remove(key);
    });
    $('#checkout-btn').addEventListener('click', () => {
      if (!Cart.items.length) { toast('Your bag is empty', 'Add a piece before checking out.'); return; }
      if (window.BSCheckout) window.BSCheckout.start();
    });
    Cart.paint();
  }

  // ── Loader: a curtain of hair that parts ─────────────────
  function initLoader(done) {
    const el = $('#loader');
    let seen = false;
    try { seen = sessionStorage.getItem('bs_seen') === '1'; sessionStorage.setItem('bs_seen', '1'); } catch (e) { /* ignore */ }
    if (!el || seen || !motion) { if (el) el.remove(); done(); return; }
    if (lenis) lenis.stop();
    const hair = new Strands($('#loader-hair'), { layout: 'curtain', texture: 'straight', shade: '#1a1008', len: 0.02, auto: false, interactive: true });
    hair.play();
    const num = $('#loader-num'), st = { p: 0 };
    let opened = false;
    const count = G.to(st, { p: 100, duration: 2.1, ease: 'power2.inOut', onUpdate: () => { num.textContent = Math.round(st.p); hair.state.len = 0.02 + st.p / 100 * 0.74; }, onComplete: open });
    function open() {
      if (opened) return;
      opened = true;
      count.kill(); num.textContent = '100'; hair.state.len = Math.max(hair.state.len, 0.6);
      G.timeline({ onComplete: () => { hair.destroy(); el.remove(); if (lenis) lenis.start(); } })
        .to('.loader__count, .loader__line, .loader__brand, .loader__from, .loader__skip', { y: 40, opacity: 0, duration: 0.45, stagger: 0.04, ease: 'power2.in' })
        .to(hair.state, { gap: 1.05, duration: 1.35, ease: 'power3.inOut' }, 0.15)
        .to(el, { backgroundColor: 'rgba(246,226,211,0)', duration: 0.5 }, 0.55)
        .add(done, 0.6)
        .to(el, { opacity: 0, duration: 0.3 }, 1.25);
    }
    $('#loader-skip').addEventListener('click', open);
    el.addEventListener('click', (e) => { if (e.target === el || e.target.id === 'loader-hair') { /* let them comb */ } });
  }

  function initPreviewNotice() {
    if (!usingEdits) return;
    const chip = document.createElement('div');
    chip.className = 'previewchip';
    chip.innerHTML = '<span>Showing products edited in Admin on this device</span><button type="button">Use data.js</button>';
    $('button', chip).addEventListener('click', () => { store.del('bs_products_edited'); location.reload(); });
    document.body.appendChild(chip);
  }

  // ── Shared with checkout.js ──────────────────────────────
  window.BS = { $, $$, esc, money, store, toast, Overlay, Cart, validEmail, reduced, lenis, scene: Scene, openProduct: (id, o) => Detail.open(id, o) };
  window.showToast = toast;

  // ── Start ────────────────────────────────────────────────
  initNav();
  initCursor();
  initContact();
  initClock();
  initGrow();
  initStory();
  initVoices();
  initAnswers();
  initSearch();
  initCart();
  Shop.refresh();
  initPreviewNotice();
  fitAll();
  Scene.build();
  let w0 = window.innerWidth;
  window.addEventListener('resize', () => { fitAll(); if (Math.abs(window.innerWidth - w0) > 60) { w0 = window.innerWidth; if (ST) ST.refresh(); } });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitAll(); revealLines(); if (ST) ST.refresh(); }); else revealLines();
  initLoader(() => { Scene.intro(); setTimeout(Pics.start, motion ? 1400 : 0); });
  Stats.pageView();

  const deep = /^#p\/(.+)$/.exec(location.hash);
  if (deep) setTimeout(() => Detail.open(decodeURIComponent(deep[1])), 600);
})();
