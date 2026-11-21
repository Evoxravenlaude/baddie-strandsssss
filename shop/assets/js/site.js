// ============================================================
// BADDIE STRANDS — shop: shared on every page
// Header, bag, search, menu, footer, product pictures and cards.
// ============================================================
'use strict';

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DB = window.BSDB;
  const money = DB.naira;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* full or blocked */ } }
  };
  const CATS = { wigs: 'Wigs', bundles: 'Bundles', closures: 'Closures', extensions: 'Extensions' };
  const TEXTURES = [
    ['bone', 'Bone straight'], ['straight', 'Straight'], ['body', 'Body wave'], ['loose', 'Loose wave'],
    ['water', 'Water wave'], ['deep', 'Deep wave'], ['curly', 'Curly'], ['coily', 'Kinky coily']
  ];
  const texName = (t) => (TEXTURES.find((x) => x[0] === t) || [t, t])[1];

  const art = window.BSArt;
  // <img> markup for a product: its photo, or the drawn placeholder
  function pics(p, o) {
    o = o || {};
    const imgs = p.images || [];
    const alt = esc(o.alt != null ? o.alt : p.name);
    const lazy = o.eager ? 'fetchpriority="high"' : 'loading="lazy"';
    if (!imgs.length) return `<img src="${art(p, o.shade || 0)}" alt="${alt}" ${lazy}>`;
    return `<img src="${esc(imgs[0])}" alt="${alt}" ${lazy} decoding="async">` + (o.second && imgs[1] ? `<img src="${esc(imgs[1])}" alt="" loading="lazy" decoding="async">` : '');
  }

  function priceText(p) {
    const [lo, hi] = DB.priceRange(p);
    const from = lo !== hi ? 'From ' : '';
    return `${from}${money(lo)}${p.compare_at && p.compare_at > lo ? `<del>${money(p.compare_at)}</del>` : ''}`;
  }
  function flags(p) {
    const f = [];
    if (p.stock === 0) f.push(['Sold out', 'black']);
    else if (p.compare_at && p.compare_at > p.price) f.push(['Sale', 'pink']);
    if (p.is_new) f.push(['New', '']);
    if (p.stock && p.stock <= 5) f.push([`Only ${p.stock} left`, '']);
    return f;
  }
  function card(p) {
    const sh = p.shades || [];
    return `<a class="card${p.stock === 0 ? ' is-out' : ''}" href="product.html?p=${encodeURIComponent(p.slug)}" data-card="${esc(p.slug)}">
      <span class="pic">${pics(p, { second: true, alt: '' })}</span>
      <span class="card__flags">${flags(p).map((f) => `<span class="flag${f[1] ? ' flag--' + f[1] : ''}">${f[0]}</span>`).join('')}</span>
      <span class="card__body">
        <span class="card__meta">${esc(texName(p.texture))} ${esc((CATS[p.category] || p.category).toLowerCase().replace(/s$/, ''))}</span>
        <span class="card__name">${esc(p.name)}</span>
        <span class="card__row"><span class="price">${priceText(p)}</span>${sh.length ? `<span class="dots" aria-label="${sh.length} shade${sh.length === 1 ? '' : 's'}">${sh.slice(0, 4).map((s) => `<i style="--c:${esc(s.hex)}"></i>`).join('')}${sh.length > 4 ? `<b>+${sh.length - 4}</b>` : ''}</span>` : ''}</span>
      </span>
    </a>`;
  }
  // remember the piece so its page can show it instantly, and let the picture glide across
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-card]');
    if (!a) return;
    const p = (Site.products || []).find((x) => x.slug === a.dataset.card);
    if (p) { try { sessionStorage.setItem('bs_p_' + p.slug, JSON.stringify(p)); } catch (err) { /* ignore */ } }
    $$('.pic[style*="view-transition-name"]').forEach((el) => { el.style.viewTransitionName = ''; });
    const pic = $('.pic', a);
    if (pic && !reduced) pic.style.viewTransitionName = 'piece';
  });
  window.addEventListener('pageshow', () => $$('.pic').forEach((el) => { if (el.style.viewTransitionName) el.style.viewTransitionName = ''; }));

  // ── Toast ────────────────────────────────────────────────
  function toast(text, act) {
    const t = $('[data-toast]');
    $('[data-toast-text]', t).textContent = text;
    $('[data-toast-act]', t).innerHTML = act || '';
    t.classList.add('is-on');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('is-on'), 4200);
  }

  // ── Overlays (bag, search, menu) ─────────────────────────
  const Overlay = (() => {
    let open = null, back = null;
    const FOC = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
    function show(el, focusSel) {
      if (open) hide(true);
      back = document.activeElement;
      el.hidden = false;
      void el.offsetWidth;
      el.classList.add('is-open');
      document.body.classList.add('is-locked');
      open = el;
      const f = (focusSel && $(focusSel, el)) || $('[role="dialog"]', el) || el;
      setTimeout(() => f.focus({ preventScroll: true }), 60);
    }
    function hide(quick) {
      const el = open;
      if (!el) return;
      open = null;
      el.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      const done = () => { if (!el.classList.contains('is-open')) el.hidden = true; };
      if (quick || reduced) done(); else setTimeout(done, 450);
      if (el.id === 'menu') $('[data-menu-open]').setAttribute('aria-expanded', 'false');
      if (back && document.contains(back) && !quick) back.focus({ preventScroll: true });
    }
    document.addEventListener('click', (e) => { if (open && e.target.closest('[data-close], [data-menu-close]')) hide(); });
    document.addEventListener('keydown', (e) => {
      if (!open) return;
      if (e.key === 'Escape') { e.preventDefault(); hide(); return; }
      if (e.key !== 'Tab') return;
      const items = $$(FOC, open).filter((n) => n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !open.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    return { show, hide, get open() { return open; } };
  })();

  // ── Bag ──────────────────────────────────────────────────
  const Bag = {
    items: (store.get('bs_bag', []) || []).filter((i) => i && i.product_id && i.qty > 0),
    count() { return this.items.reduce((s, i) => s + i.qty, 0); },
    subtotal() { return this.items.filter((i) => !i.gone).reduce((s, i) => s + i.price * i.qty, 0); },
    save() { store.set('bs_bag', this.items.map(({ gone, ...rest }) => rest)); this.paint(); }, // eslint-disable-line no-unused-vars
    add(p, length, shade, qty) {
      const key = [p.id, length || '', shade || ''].join('|');
      const found = this.items.find((i) => i.key === key);
      const si = Math.max(0, (p.shades || []).findIndex((s) => s.name === shade));
      if (found) found.qty = Math.min(20, found.qty + qty);
      else this.items.push({ key, product_id: p.id, slug: p.slug, name: p.name, length: length || null, shade: shade || null, price: DB.priceFor(p, length), qty, image: (p.images || [])[0] || '', texture: p.texture, category: p.category, hex: ((p.shades || [])[si] || {}).hex || '' });
      this.save();
      const b = $('[data-bag-open]');
      b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump');
    },
    step(key, by) { const it = this.items.find((i) => i.key === key); if (!it) return; it.qty = Math.min(20, Math.max(1, it.qty + by)); this.save(); },
    remove(key) {
      const i = this.items.findIndex((x) => x.key === key);
      if (i < 0) return;
      const [gone] = this.items.splice(i, 1);
      this.save();
      toast(`Removed ${gone.name}.`, '<button type="button" data-undo>Undo</button>');
      Bag.lastRemoved = { item: gone, at: i };
    },
    clear() { this.items = []; this.save(); },
    // keep prices and availability in step with the shop
    sync(products) {
      let changed = false;
      this.items.forEach((it) => {
        const p = products.find((x) => x.id === it.product_id);
        if (!p) { if (!it.gone) { it.gone = true; changed = true; } return; }
        it.gone = false;
        const price = DB.priceFor(p, it.length);
        if (price !== it.price || p.name !== it.name || ((p.images || [])[0] || '') !== it.image) {
          it.price = price; it.name = p.name; it.image = (p.images || [])[0] || ''; changed = true;
        }
      });
      if (changed) this.save(); else this.paint();
    },
    lineArt(it) {
      if (it.image) return `<img src="${esc(it.image)}" alt="" loading="lazy">`;
      return `<img src="${art({ texture: it.texture, category: it.category, shades: [{ hex: it.hex || '#1a1008' }] }, 0)}" alt="">`;
    },
    paint() {
      const n = this.count();
      $$('[data-bag-count]').forEach((el) => { el.textContent = n; });
      $('[data-bag-open]').setAttribute('aria-label', n ? `Open your bag, ${n} item${n === 1 ? '' : 's'}` : 'Open your bag');
      const nEl = $('[data-bag-n]'); if (nEl) nEl.textContent = n ? `(${n})` : '';
      const body = $('[data-bag-lines]'), foot = $('[data-bag-foot]');
      if (!this.items.length) {
        body.innerHTML = `<div class="empty" style="padding:40px 0"><p class="h3">Your bag is empty.</p><p class="muted">Find a piece you love and it will wait for you here.</p><a class="btn" href="shop.html">Shop all hair</a></div>`;
        foot.hidden = true;
        document.dispatchEvent(new CustomEvent('bag:change'));
        return;
      }
      foot.hidden = false;
      body.innerHTML = this.items.map((it) => `<div class="line${it.gone ? ' is-gone' : ''}" data-key="${esc(it.key)}">
          <a href="product.html?p=${encodeURIComponent(it.slug)}" class="pic" tabindex="-1" aria-hidden="true">${this.lineArt(it)}</a>
          <div><a class="line__name" href="product.html?p=${encodeURIComponent(it.slug)}">${esc(it.name)}</a>
            <p class="line__opts">${[it.length, it.shade].filter(Boolean).map(esc).join(', ')}${it.gone ? '<br><b>No longer available</b>' : ''}</p>
            ${it.gone ? '' : `<div class="qty"><button type="button" data-step="-1" aria-label="One fewer">−</button><output aria-label="Quantity">${it.qty}</output><button type="button" data-step="1" aria-label="One more">+</button></div>`}
          </div>
          <div class="line__end"><span class="price">${money(it.price * it.qty)}</span><button class="linkbtn" type="button" data-remove>Remove</button></div>
        </div>`).join('');
      const sub = this.subtotal();
      $('[data-bag-subtotal]').textContent = money(sub);
      const s = Site.settings, free = s && s.delivery && Number(s.delivery.free_over);
      const fr = $('[data-free]');
      if (free > 0) {
        fr.hidden = false;
        const left = free - sub;
        $('[data-free-text]').textContent = left > 0 ? `Spend ${money(left)} more for free delivery.` : 'Your delivery is free.';
        requestAnimationFrame(() => { $('[data-free-bar]').style.width = Math.min(100, (sub / free) * 100) + '%'; });
      } else fr.hidden = true;
      document.dispatchEvent(new CustomEvent('bag:change'));
    }
  };
  document.addEventListener('click', (e) => {
    const line = e.target.closest('[data-bag-lines] .line');
    if (line) {
      const st = e.target.closest('[data-step]');
      if (st) Bag.step(line.dataset.key, Number(st.dataset.step));
      if (e.target.closest('[data-remove]')) Bag.remove(line.dataset.key);
    }
    if (e.target.closest('[data-undo]') && Bag.lastRemoved) {
      Bag.items.splice(Bag.lastRemoved.at, 0, Bag.lastRemoved.item);
      Bag.lastRemoved = null; Bag.save();
      $('[data-toast]').classList.remove('is-on');
    }
  });

  // ── Search ───────────────────────────────────────────────
  function initSearch() {
    const ov = $('#search'), input = $('#search-input'), out = $('[data-search-results]');
    const paint = () => {
      const q = input.value.trim().toLowerCase();
      const all = Site.products || [];
      let list;
      if (!q) list = all.filter((p) => p.featured).slice(0, 6);
      else {
        const words = q.split(/\s+/);
        list = all.filter((p) => {
          const hay = [p.name, p.category, texName(p.texture), p.description, (p.shades || []).map((s) => s.name).join(' '), (p.lengths || []).map((l) => l.length).join(' ')].join(' ').toLowerCase();
          return words.every((w) => hay.includes(w));
        });
      }
      out.innerHTML = list.length
        ? `<p class="small muted" style="padding-top:20px">${q ? `${list.length} result${list.length === 1 ? '' : 's'}` : 'Popular right now'}</p><div class="search__res">${list.slice(0, 12).map(card).join('')}</div>`
        : `<p class="search__none">Nothing matches “${esc(input.value.trim())}”. Try a texture like “deep wave”, a length like “24”, or <a class="link" href="contact.html">ask us for it</a>.</p>`;
    };
    let t = 0;
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(paint, 120); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const first = $('.card', out); if (first) first.click(); } });
    const open = () => { paint(); Overlay.show(ov, '#search-input'); input.select(); };
    $$('[data-search-open]').forEach((b) => b.addEventListener('click', open));
    document.addEventListener('keydown', (e) => {
      if (e.key !== '/' || Overlay.open || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
      e.preventDefault(); open();
    });
  }

  // ── Header ───────────────────────────────────────────────
  function initHeader() {
    const hd = $('[data-hd]');
    let last = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      hd.classList.toggle('is-scrolled', y > 4);
      if (!Overlay.open) hd.classList.toggle('is-hidden', y > last + 4 && y > 320);
      if (y < last - 4) hd.classList.remove('is-hidden');
      last = y;
    }, { passive: true });
    hd.addEventListener('focusin', () => hd.classList.remove('is-hidden'));
    // current page in the nav
    const page = document.body.dataset.page;
    const cur = page === 'product' ? 'shop' : page;
    $$('[data-nav]').forEach((a) => { if (a.dataset.nav === cur) a.setAttribute('aria-current', 'page'); });
    $$('[data-bag-open]').forEach((b) => b.addEventListener('click', () => Overlay.show($('#bag'))));
    const menuBtn = $('[data-menu-open]');
    menuBtn.addEventListener('click', () => { menuBtn.setAttribute('aria-expanded', 'true'); Overlay.show($('#menu'), '.menu__links a'); });
  }

  // ── Opening hours ────────────────────────────────────────
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hr = (h) => { const n = Number(h); const m = Math.round((n % 1) * 60); return (n % 12 || 12) + (m ? ':' + String(m).padStart(2, '0') : '') + (n % 24 < 12 ? 'am' : 'pm'); };
  function hoursText(hours) {
    if (!Array.isArray(hours)) return '';
    const groups = [];
    const order = [1, 2, 3, 4, 5, 6, 0];
    order.forEach((d) => {
      const h = hours[d], label = h ? `${hr(h[0])} to ${hr(h[1])}` : 'closed';
      const g = groups[groups.length - 1];
      if (g && g.label === label) g.to = d; else groups.push({ from: d, to: d, label });
    });
    return groups.map((g) => `${DAYS[g.from]}${g.to !== g.from ? ' to ' + DAYS[g.to] : ''}: ${g.label}`).join('. ');
  }
  function openState(hours) {
    if (!Array.isArray(hours)) return null;
    let parts;
    try { parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()); } catch (e) { return null; }
    const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[parts.find((x) => x.type === 'weekday').value];
    const h = Number(parts.find((x) => x.type === 'hour').value) % 24 + Number(parts.find((x) => x.type === 'minute').value) / 60;
    const today = hours[wd];
    if (today && h >= today[0] && h < today[1]) return { open: true, text: `Open now, until ${hr(today[1])}` };
    if (today && h < today[0]) return { open: false, text: `Closed, opens today at ${hr(today[0])}` };
    for (let i = 1; i <= 7; i++) {
      const d = (wd + i) % 7, x = hours[d];
      if (x) return { open: false, text: `Closed, opens ${i === 1 ? 'tomorrow' : DAYS[d]} at ${hr(x[0])}` };
    }
    return { open: false, text: 'Closed' };
  }

  // ── Fill in contact details and settings ─────────────────
  function waLink(text) {
    const n = (Site.settings && Site.settings.store.whatsapp) || '';
    return `https://wa.me/${n.replace(/\D/g, '')}${text ? '?text=' + encodeURIComponent(text) : ''}`;
  }
  function applySettings(s) {
    const st = s.store || {};
    $$('[data-wa]').forEach((a) => { a.href = waLink('Hi Baddie Strands!'); });
    $$('[data-mail]').forEach((a) => { a.href = 'mailto:' + (st.email || ''); });
    $$('[data-ig]').forEach((a) => { a.href = 'https://www.instagram.com/' + String(st.instagram || '').replace(/^@/, ''); });
    const tt = String(st.tiktok || '').replace(/^@/, '');
    $$('[data-tt]').forEach((a) => { a.href = 'https://www.tiktok.com/@' + tt; a.hidden = !tt; });
    $$('[data-tt-text]').forEach((n) => { n.textContent = tt ? '@' + tt : ''; });
    $$('[data-wa-text]').forEach((n) => { n.textContent = st.phone_display || st.whatsapp || ''; });
    $$('[data-mail-text]').forEach((n) => { n.textContent = st.email || ''; });
    $$('[data-ig-text]').forEach((n) => { n.textContent = '@' + String(st.instagram || '').replace(/^@/, ''); });
    $$('[data-hours-text]').forEach((n) => { n.textContent = hoursText(st.hours); });
    const tick = () => {
      const o = openState(st.hours);
      $$('[data-open]').forEach((n) => { n.hidden = !o; if (o) { n.textContent = o.text; n.classList.toggle('is-open', o.open); } });
    };
    tick(); setInterval(tick, 60000);
    const an = $('[data-announce]');
    if (s.announcement && String(s.announcement).trim()) { $('[data-announce-text]').textContent = s.announcement; an.hidden = false; }
  }

  // ── Newsletter ───────────────────────────────────────────
  function initNewsletter() {
    $$('[data-newsletter]').forEach((f) => f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const note = $('[data-newsletter-note]'), btn = $('button', f), email = f.elements.email.value;
      if (!DB.validEmail(email)) { note.textContent = 'That email doesn’t look right. Check it and try again.'; f.elements.email.focus(); return; }
      btn.classList.add('is-busy'); btn.disabled = true;
      try {
        const r = await DB.subscribe(email);
        note.textContent = r === 'dup' ? 'You’re already on the list.' : r === 'bad' ? 'That email doesn’t look right.' : 'You’re in. Watch your inbox for the next drop.';
        if (r !== 'bad') f.reset();
      } catch (err) { note.textContent = err.message; }
      btn.classList.remove('is-busy'); btn.disabled = false;
    }));
  }

  // ── Gold cursor (mice only) ───────────────────────────
  function initCursor() {
    if (!fine || reduced) return;
    const dot = $('.cursor'), ring = $('.cursor-ring');
    if (!dot || !ring) return;
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0;
    const loop = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    document.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      document.documentElement.classList.add('has-cursor');
      document.documentElement.classList.toggle('is-pointing', !!e.target.closest('a, button, label, summary, select, [role="tab"], .swatch, .chip'));
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', () => document.documentElement.classList.remove('has-cursor'));
    document.documentElement.addEventListener('mouseleave', () => document.documentElement.classList.remove('has-cursor'));
  }

  // ── Reveal on scroll ─────────────────────────────────────
  function reveal(root) {
    const els = $$('.rv:not(.is-in)', root || document);
    if (reduced || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((e) => io.observe(e));
  }

  // ── Start ────────────────────────────────────────────────
  const Site = {
    $, $$, esc, money, reduced, fine, store, toast, Overlay, Bag, art, pics, card, priceText, flags, texName, TEXTURES, CATS, waLink, reveal, hoursText,
    products: null, settings: null,
    ready: null
  };
  window.Site = Site;
  if (DB.mode === 'demo') $('[data-demo]').hidden = false;
  $$('[data-year]').forEach((n) => { n.textContent = new Date().getFullYear(); });
  initHeader(); initSearch(); initNewsletter(); initCursor(); Bag.paint();
  Site.ready = Promise.all([DB.settings(), DB.products()]).then(([s, products]) => {
    Site.settings = s; Site.products = products;
    applySettings(s);
    Bag.sync(products);
    return { settings: s, products };
  }).catch((err) => {
    console.error(err);
    toast(err.message || 'We couldn’t load the shop. Refresh to try again.');
    throw err;
  });
  window.addEventListener('load', () => reveal());
})();
