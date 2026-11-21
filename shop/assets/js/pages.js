// ============================================================
// BADDIE STRANDS — shop: what each page does
// ============================================================
'use strict';

(function () {
  const S = window.Site, DB = window.BSDB;
  const { $, $$, esc, money, reduced, fine, toast, Overlay, Bag, art, pics, card, priceText, flags, texName, CATS } = S;
  const page = document.body.dataset.page;
  const params = new URLSearchParams(location.search);
  const ghosts = (n) => Array.from({ length: n }, () => '<div class="ghost-card"><div class="ghost"></div><div class="ghost"></div></div>').join('');
  const inches = (len) => { const m = /(\d+(?:\.\d+)?)/.exec(String(len || '')); return m ? Number(m[1]) : 0; };
  const GUIDE = [[9, 'chin'], [11, 'neck'], [13, 'shoulders'], [15, 'just past the shoulders'], [17, 'armpits'], [19, 'bra strap'], [21, 'mid-back'], [23, 'lower back'], [25, 'waist'], [27, 'hips'], [29, 'tailbone'], [999, 'below the hips']];
  const shrunk = (len, texture) => inches(len) * (1 - ({ curly: 0.25, coily: 0.4, deep: 0.15, water: 0.1 }[texture] || 0));
  const fallsTo = (len, texture) => { const i = shrunk(len, texture); return (GUIDE.find((g) => i <= g[0]) || GUIDE[GUIDE.length - 1])[1]; };
  // the ruler under the lengths runs from 8 to 30 inches (after lofliballs)
  const RULER = [[8, '8″'], [9, 'chin'], [13, 'shoulders'], [19, 'bra strap'], [25, 'waist'], [30, '30″']];
  const rulerAt = (i) => Math.max(0, Math.min(100, ((i - 8) / 22) * 100));
  const states = (s) => {
    const names = Object.keys((s.delivery && s.delivery.fees) || {});
    const fct = names.filter((n) => /FCT|Abuja/i.test(n));
    return fct.concat(names.filter((n) => !fct.includes(n)).sort());
  };
  const failLoad = (el) => { if (el) el.innerHTML = `<div class="empty"><p class="h3">We couldn’t load the hair just now.</p><p class="muted">Check your connection, then try again.</p><button class="btn" type="button" onclick="location.reload()">Try again</button></div>`; };

  // ══════════════════════════════════════════════════════
  // HOME
  // ══════════════════════════════════════════════════════
  async function home() {
    $('[data-best]').innerHTML = ghosts(4);
    $('[data-new]').innerHTML = ghosts(4);
    let data;
    try { data = await S.ready; } catch (e) { failLoad($('[data-best]')); return; }
    const all = data.products, s = data.settings;
    const featured = all.filter((p) => p.featured);
    const best = (featured.length ? featured : all).slice(0, 8);

    // stats panel and the gold ticker, both editable in the admin
    const stats = (s.stats || []).filter((x) => x && x.value);
    $('[data-stats]').innerHTML = stats.map((x) => `<div><b>${esc(x.value)}</b><span>${esc(x.label || '')}</span></div>`).join('');
    $('[data-corner]').hidden = !stats.length;
    const tick = (s.ticker || []).filter(Boolean);
    const run = $('[data-ticker]');
    if (tick.length) { const one = tick.map((t) => `<span>${esc(t)}</span>`).join(''); run.innerHTML = one + one; }
    else run.parentElement.hidden = true;

    // textures
    const tex = S.TEXTURES.map(([id, name]) => ({ id, name, list: all.filter((p) => p.texture === id) })).filter((t) => t.list.length);
    const nav = $('[data-textures]');
    nav.innerHTML = tex.map((t, i) => `<a href="shop.html?texture=${t.id}" data-tex="${t.id}"><span class="tex__i" aria-hidden="true">${['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'][i] || ''}.</span><span class="tex__thumb" aria-hidden="true"><span class="pic">${pics(t.list[0], { alt: '' })}</span></span><span class="tex__name">${esc(t.name)}</span><span class="tex__n">${t.list.length} piece${t.list.length === 1 ? '' : 's'}</span></a>`).join('');
    if (fine && !reduced) {
      const peek = $('[data-peek]'), pic = $('[data-peek-pic]');
      let tx = 0, ty = 0, x = 0, y = 0, raf = 0, on = false;
      const loop = () => { x += (tx - x) * 0.18; y += (ty - y) * 0.18; peek.style.left = x + 'px'; peek.style.top = y + 'px'; raf = on || Math.abs(tx - x) > 0.5 ? requestAnimationFrame(loop) : 0; };
      nav.addEventListener('pointermove', (e) => { tx = Math.min(window.innerWidth - 130, e.clientX + 170); ty = e.clientY; if (!raf) raf = requestAnimationFrame(loop); });
      nav.addEventListener('pointerover', (e) => {
        const a = e.target.closest('[data-tex]');
        if (!a) return;
        const t = tex.find((z) => z.id === a.dataset.tex);
        pic.innerHTML = pics(t.list[0], { alt: '' });
        if (!on) { x = tx; y = ty; }
        on = true; peek.classList.add('is-on');
      });
      nav.addEventListener('pointerleave', () => { on = false; peek.classList.remove('is-on'); });
    }

    // bestsellers row
    const row = $('[data-best]');
    row.innerHTML = best.map(card).join('');
    initRow(row, $('[data-row-prev]'), $('[data-row-next]'));

    // reviews, as a row of cards
    const reviews = (s.reviews || []).filter((r) => r && r.text);
    const vs = $('[data-voices]');
    if (!reviews.length) vs.hidden = true;
    else {
      const vt = $('[data-voice-track]');
      vt.innerHTML = reviews.map((r) => `<figure class="voice"><blockquote>${esc(r.text)}</blockquote><footer><i aria-hidden="true">${esc((r.name || '?').trim().charAt(0))}</i><span><b>${esc(r.name || '')}</b><span>${esc(r.place || '')}</span></span>${r.stars ? `<em style="margin-left:auto" aria-label="${r.stars} out of 5 stars">${'★'.repeat(Math.min(5, r.stars))}</em>` : ''}</footer></figure>`).join('');
      initRow(vt, $('[data-voice-prev]'), $('[data-voice-next]'));
    }

    // just in
    const fresh = all.filter((p) => p.is_new);
    $('[data-new]').innerHTML = (fresh.length ? fresh : all.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1))).slice(0, 4).map(card).join('');
    S.reveal();
  }

  // drag + arrow buttons for a horizontal row
  function initRow(track, prev, next) {
    const step = () => (track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width + 2 : 300) * (window.innerWidth < 700 ? 1 : 2);
    const sync = () => { prev.disabled = track.scrollLeft < 4; next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4; };
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: reduced ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: reduced ? 'auto' : 'smooth' }));
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
    let d = null;
    track.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button) return; d = { x: e.clientX, s: track.scrollLeft, moved: false }; });
    window.addEventListener('pointermove', (e) => {
      if (!d) return;
      const dx = e.clientX - d.x;
      if (Math.abs(dx) > 6) { d.moved = true; track.classList.add('is-drag'); }
      if (d.moved) track.scrollLeft = d.s - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!d) return;
      const moved = d.moved; d = null;
      if (moved) { setTimeout(() => track.classList.remove('is-drag'), 0); }
    });
    track.addEventListener('click', (e) => { if (track.classList.contains('is-drag')) e.preventDefault(); }, true);
  }

  // ══════════════════════════════════════════════════════
  // SHOP
  // ══════════════════════════════════════════════════════
  async function shop() {
    const grid = $('[data-grid]');
    grid.innerHTML = ghosts(8);
    let data;
    try { data = await S.ready; } catch (e) { failLoad(grid); return; }
    const all = data.products;
    const st = { cat: params.get('category') || 'all', tex: params.get('texture') || '', sort: params.get('sort') || 'featured' };
    if (!CATS[st.cat]) st.cat = 'all';
    $('[data-sort]').value = st.sort;

    function list() {
      let l = all.filter((p) => (st.cat === 'all' || p.category === st.cat) && (!st.tex || p.texture === st.tex));
      const lo = (p) => DB.priceRange(p)[0];
      if (st.sort === 'low') l.sort((a, b) => lo(a) - lo(b));
      else if (st.sort === 'high') l.sort((a, b) => lo(b) - lo(a));
      else if (st.sort === 'new') l.sort((a, b) => (b.is_new - a.is_new) || (a.created_at < b.created_at ? 1 : -1));
      else l.sort((a, b) => (b.featured - a.featured) || (a.sort - b.sort));
      // sold out at the end
      return l.filter((p) => p.stock !== 0).concat(l.filter((p) => p.stock === 0));
    }
    function paintFilters() {
      const inCat = all.filter((p) => st.cat === 'all' || p.category === st.cat);
      const cats = [['all', 'All']].concat(Object.entries(CATS).filter(([id]) => all.some((p) => p.category === id)));
      $('[data-cats]').innerHTML = cats.map(([id, name]) => `<button class="pill" type="button" data-cat="${id}" aria-pressed="${st.cat === id}">${name} <span>${id === 'all' ? all.length : all.filter((p) => p.category === id).length}</span></button>`).join('');
      const texs = S.TEXTURES.filter(([id]) => inCat.some((p) => p.texture === id) || st.tex === id);
      $('[data-texs]').innerHTML = texs.map(([id, name]) => `<button class="pill" type="button" data-tx="${id}" aria-pressed="${st.tex === id}">${name} <span>${inCat.filter((p) => p.texture === id).length}</span></button>`).join('');
    }
    function paint(animate) {
      const l = list();
      const title = st.tex ? `${texName(st.tex)}${st.cat !== 'all' ? ' ' + CATS[st.cat].toLowerCase() : ''}` : st.cat === 'all' ? 'All hair' : CATS[st.cat];
      $('[data-list-title]').textContent = title;
      document.title = `${title} | Baddie Strands`;
      $('[data-list-n]').textContent = `${l.length} piece${l.length === 1 ? '' : 's'}`;
      $('[data-empty]').hidden = l.length > 0;
      // slide cards from where they were to where they are now
      const before = new Map($$('[data-card]', grid).map((el) => [el.dataset.card, el.getBoundingClientRect()]));
      grid.innerHTML = l.map(card).join('');
      if (animate && !reduced) {
        $$('[data-card]', grid).forEach((el, k) => {
          const a = before.get(el.dataset.card), b = el.getBoundingClientRect();
          if (a) el.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` }, { transform: 'none' }], { duration: 550, easing: 'cubic-bezier(.2,.7,.1,1)' });
          else el.animate([{ opacity: 0, transform: 'translateY(20px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: Math.min(k, 8) * 30, easing: 'cubic-bezier(.2,.7,.1,1)', fill: 'backwards' });
        });
      }
      const q = new URLSearchParams();
      if (st.cat !== 'all') q.set('category', st.cat);
      if (st.tex) q.set('texture', st.tex);
      if (st.sort !== 'featured') q.set('sort', st.sort);
      history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
    }
    document.querySelector('.filters').addEventListener('click', (e) => {
      const c = e.target.closest('[data-cat]'), t = e.target.closest('[data-tx]');
      if (c) { st.cat = c.dataset.cat; if (st.tex && !all.some((p) => (st.cat === 'all' || p.category === st.cat) && p.texture === st.tex)) st.tex = ''; }
      else if (t) st.tex = st.tex === t.dataset.tx ? '' : t.dataset.tx;
      else return;
      paintFilters(); paint(true);
    });
    $('[data-sort]').addEventListener('change', (e) => { st.sort = e.target.value; paint(true); });
    $('[data-clear]').addEventListener('click', () => { st.cat = 'all'; st.tex = ''; paintFilters(); paint(true); });
    paintFilters(); paint(false);
  }

  // ══════════════════════════════════════════════════════
  // PRODUCT
  // ══════════════════════════════════════════════════════
  async function product() {
    const slug = params.get('p') || '';
    let cached = null;
    try { cached = JSON.parse(sessionStorage.getItem('bs_p_' + slug) || 'null'); } catch (e) { cached = null; }
    const st = { p: null, len: null, shade: 0, qty: 1, img: 0 };
    if (cached) { st.p = cached; render(); }
    let data;
    try { data = await S.ready; } catch (e) { if (!cached) failLoad($('[data-buy]')); return; }
    const p = data.products.find((x) => x.slug === slug || x.id === slug);
    if (!p) { $('[data-pdp]').hidden = true; $('[data-crumbs]').hidden = true; $('[data-missing]').hidden = false; document.title = 'Piece not found | Baddie Strands'; return; }
    const keepLen = st.len, keepShade = st.shade, keepQty = st.qty;
    st.p = p;
    render(keepLen, keepShade, keepQty);
    also(data.products, p);
    try { sessionStorage.removeItem('bs_p_' + slug); } catch (e) { /* ignore */ }

    function render(keepLen, keepShade, keepQty) {
      const p = st.p;
      const lens = p.lengths || [], shades = p.shades || [];
      st.len = keepLen && lens.some((l) => l.length === keepLen) ? keepLen : lens.length ? lens[0].length : null;
      st.shade = keepShade && keepShade < shades.length ? keepShade : 0;
      st.qty = keepQty || 1;
      document.title = `${p.name} | Baddie Strands`;
      const gw = $('[data-ghost]'); if (gw) gw.textContent = texName(p.texture);
      const md = $('meta[name="description"]'); if (md) md.content = p.description.slice(0, 155);
      $('[data-crumbs]').innerHTML = `<a href="shop.html">Shop</a><span aria-hidden="true">/</span><a href="shop.html?category=${esc(p.category)}">${esc(CATS[p.category] || p.category)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(p.name)}</span>`;
      const [lo, hi] = DB.priceRange(p);
      const out = p.stock === 0;
      $('[data-buy]').innerHTML = `
        ${flags(p).length ? `<div class="buy__flags">${flags(p).map((f) => `<span class="flag${f[1] ? ' flag--' + f[1] : ''}">${f[0]}</span>`).join('')}</div>` : ''}
        <div><h1 class="buy__name">${esc(p.name).split(' ').map((w, i) => `<span class="w" style="animation-delay:${i * 90}ms">${w}</span>`).join(' ')}</h1><p class="muted" style="margin-top:10px">${esc(texName(p.texture))}, ${esc((CATS[p.category] || '').toLowerCase())}</p></div>
        <p class="price buy__price" data-price></p>
        ${p.description ? `<p class="muted" style="max-width:52ch">${esc(p.description)}</p>` : ''}
        ${lens.length ? `<fieldset class="opt"><legend>Length <span data-len-out></span></legend><div class="chips" role="radiogroup" aria-label="Length">${lens.map((l) => { const pr = DB.priceFor(p, l.length); return `<button class="chip" type="button" role="radio" data-len="${esc(l.length)}" aria-checked="false">${esc(l.length)}${lo !== hi ? `<small>${money(pr).replace(',000', 'k')}</small>` : ''}</button>`; }).join('')}</div><div class="ruler" aria-hidden="true"><div class="ruler__track"><i class="ruler__fill" data-ruler-fill></i><i class="ruler__mark" data-ruler-mark></i></div><div class="ruler__labels">${RULER.map((r) => `<span style="left:${rulerAt(r[0])}%">${r[1]}</span>`).join('')}</div></div><p class="small muted" data-falls></p></fieldset>` : ''}
        ${shades.length ? `<fieldset class="opt"><legend>Shade <span data-shade-out></span></legend><div class="swatches" role="radiogroup" aria-label="Shade">${shades.map((s, i) => `<button class="swatch" type="button" role="radio" data-shade="${i}" style="--c:${esc(s.hex)}" aria-checked="false" aria-label="${esc(s.name)}" title="${esc(s.name)}"></button>`).join('')}</div></fieldset>` : ''}
        <div class="buy__act">
          <div class="qty"><button type="button" data-q="-1" aria-label="One fewer">−</button><output data-qty aria-label="Quantity">1</output><button type="button" data-q="1" aria-label="One more">+</button></div>
          <button class="btn" type="button" data-add ${out ? 'disabled' : ''}>${out ? 'Sold out' : 'Add to bag'}</button>
        </div>
        <div class="buy__alt"><a class="link" href="#" data-wa-order target="_blank" rel="noopener">Order this on WhatsApp</a>${p.stock && p.stock <= 5 ? `<span class="muted">Only ${p.stock} left</span>` : ''}</div>
        <div class="est">
          <label for="est-state">Delivery to</label>
          <select class="select" id="est-state" data-est><option value="">Choose your state</option>${states(S.settings || { delivery: {} }).map((n) => `<option>${esc(n)}</option>`).join('')}</select>
          <output data-est-out aria-live="polite"></output>
        </div>
        <div class="acc">
          ${p.details.length ? `<details open><summary>What you get</summary><div class="acc__body"><ul class="tags">${p.details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div></details>` : ''}
          <details><summary>Delivery and returns</summary><div class="acc__body"><p>Same day in Abuja, 1 to 2 days to Lagos and Port Harcourt, 2 to 4 days everywhere else in Nigeria. We ship abroad too: message us on WhatsApp.</p><p>Unworn hair with the lace uncut can be exchanged within 7 days. For hygiene, worn or cut units can’t be returned.</p></div></details>
          <details><summary>Caring for it</summary><div class="acc__body"><p>Wash every 7 to 10 wears with sulphate-free shampoo, deep condition, and air-dry on a stand. Use heat protectant and stay under 180°C. Sleep on silk or satin.</p><p><a class="link" href="help.html">More care answers</a></p></div></details>
        </div>`;
      const saved = S.store.get('bs_state', '');
      if (saved) { $('[data-est]').value = saved; }
      gallery(); choice(false);
    }

    function gallery() {
      const p = st.p, imgs = p.images || [];
      const thumbs = $('[data-thumbs]'), main = $('[data-main]');
      thumbs.innerHTML = imgs.length > 1 ? imgs.map((src, i) => `<button type="button" data-img="${i}" aria-label="Photo ${i + 1} of ${imgs.length}" aria-current="${i === st.img}"><span class="pic"><img src="${esc(src)}" alt="" loading="lazy"></span></button>`).join('') : '';
      thumbs.hidden = imgs.length < 2;
      main.parentElement.classList.toggle('is-single', imgs.length < 2);
      paintMain();
      main.onclick = (e) => {
        if (!fine) return;
        main.classList.toggle('is-zoom');
        zoomAt(e);
      };
      main.onpointermove = (e) => { if (main.classList.contains('is-zoom')) zoomAt(e); };
      main.onpointerleave = () => main.classList.remove('is-zoom');
      function zoomAt(e) { const r = main.getBoundingClientRect(); main.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100) + '%'); main.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100) + '%'); }
      thumbs.onclick = (e) => { const b = e.target.closest('[data-img]'); if (!b) return; st.img = Number(b.dataset.img); $$('[data-img]', thumbs).forEach((x) => x.setAttribute('aria-current', String(x === b))); paintMain(true); };
    }
    function paintMain(fade) {
      const p = st.p, imgs = p.images || [];
      const im = $('[data-main-img]');
      const src = imgs.length ? imgs[st.img] || imgs[0] : art(p, st.shade);
      if (im.getAttribute('src') === src) return;
      im.src = src;
      im.alt = imgs.length ? `${p.name}, photo ${st.img + 1}` : `${p.name}: drawing of the ${texName(p.texture).toLowerCase()} texture${p.shades[st.shade] ? ' in ' + p.shades[st.shade].name.toLowerCase() : ''}`;
      if (fade && !reduced) im.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 400 });
    }
    function choice(animate) {
      const p = st.p;
      const price = DB.priceFor(p, st.len);
      $('[data-price]').innerHTML = `${money(price)}${p.compare_at && p.compare_at > price ? `<del>${money(p.compare_at)}</del>` : ''}`;
      $$('[data-len]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.len === st.len)));
      $$('[data-shade]').forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.shade) === st.shade)));
      const lo = $('[data-len-out]'); if (lo) lo.textContent = st.len || '';
      const fl = $('[data-falls]'); if (fl && st.len) fl.textContent = `At ${st.len}, it falls to about your ${fallsTo(st.len, p.texture)}${shrunk(st.len, p.texture) < inches(st.len) ? ', because curls sit higher than they measure' : ''}.`;
      const mk = $('[data-ruler-mark]'); if (mk && st.len) { const at = rulerAt(shrunk(st.len, p.texture)); mk.style.left = at + '%'; $('[data-ruler-fill]').style.width = at + '%'; }
      const so = $('[data-shade-out]'); if (so) so.textContent = (p.shades[st.shade] || {}).name || '';
      $('[data-qty]').textContent = st.qty;
      const add = $('[data-add]');
      if (p.stock !== 0) add.textContent = `Add to bag, ${money(price * st.qty)}`;
      $('[data-mbar-name]').textContent = p.name;
      $('[data-mbar-price]').textContent = money(price * st.qty);
      const bits = [st.len, (p.shades[st.shade] || {}).name].filter(Boolean).join(', ');
      $('[data-wa-order]').href = S.waLink(`Hi Baddie Strands! I'd like to order the ${p.name}${bits ? ` (${bits})` : ''}, quantity ${st.qty}.`);
      if (!(p.images || []).length) paintMain(animate);
      estimate();
    }
    function estimate() {
      const sel = $('[data-est]'), out = $('[data-est-out]');
      if (!sel || !S.settings) return;
      if (!sel.value) { out.textContent = ''; return; }
      S.store.set('bs_state', sel.value);
      const price = DB.priceFor(st.p, st.len) * st.qty;
      const fee = DB.deliveryFee(S.settings, sel.value, price + Bag.subtotal());
      out.innerHTML = `<b>${fee ? money(fee) : 'Free'}</b>, arrives in <b>${esc(DB.deliveryDays(S.settings, sel.value).toLowerCase())}</b>.`;
    }
    const buy = $('[data-buy]');
    buy.addEventListener('click', (e) => {
      const l = e.target.closest('[data-len]'), sh = e.target.closest('[data-shade]'), q = e.target.closest('[data-q]');
      if (l) { st.len = l.dataset.len; choice(true); }
      else if (sh) { st.shade = Number(sh.dataset.shade); choice(true); }
      else if (q) { const max = st.p.stock == null ? 20 : Math.max(1, Math.min(20, st.p.stock)); st.qty = Math.min(max, Math.max(1, st.qty + Number(q.dataset.q))); choice(false); }
      else if (e.target.closest('[data-add]')) addToBag();
    });
    buy.addEventListener('change', (e) => { if (e.target.matches('[data-est]')) estimate(); });
    // arrow keys move between options inside a group
    buy.addEventListener('keydown', (e) => {
      if (!/^Arrow/.test(e.key)) return;
      const g = e.target.closest('[role="radiogroup"]');
      if (!g) return;
      const items = $$('[role="radio"]', g), i = items.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      const n = items[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
      n.focus(); n.click();
    });
    $('[data-mbar-add]').addEventListener('click', addToBag);
    function addToBag() {
      const p = st.p;
      if (p.stock === 0) return;
      const inBag = Bag.items.filter((i) => i.product_id === p.id).reduce((s, i) => s + i.qty, 0);
      if (p.stock != null && inBag + st.qty > p.stock) { toast(`Only ${p.stock} of this piece left, and ${inBag} ${inBag === 1 ? 'is' : 'are'} already in your bag.`); return; }
      Bag.add(p, st.len, (p.shades[st.shade] || {}).name || null, st.qty);
      Overlay.show($('#bag'));
    }
    // phones: keep an add button in reach once the main one has scrolled away
    const bar = $('[data-mbar]');
    let raf = 0;
    const syncBar = () => {
      raf = 0;
      const a = $('[data-add]');
      const on = !!a && a.getBoundingClientRect().bottom < 0 && st.p && st.p.stock !== 0;
      bar.classList.toggle('is-on', on);
      bar.setAttribute('aria-hidden', String(!on));
      $('[data-mbar-add]').tabIndex = on ? 0 : -1;
    };
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(syncBar); }, { passive: true });
    syncBar();
  }
  function also(all, p) {
    const list = all.filter((x) => x.id !== p.id && x.category === p.category).concat(all.filter((x) => x.id !== p.id && x.category !== p.category && x.texture === p.texture)).slice(0, 4);
    if (!list.length) return;
    $('[data-also]').innerHTML = list.map(card).join('');
    $('[data-also-wrap]').hidden = false;
  }

  // ══════════════════════════════════════════════════════
  // CHECKOUT
  // ══════════════════════════════════════════════════════
  async function checkout() {
    const form = $('[data-co-form]');
    const co = { step: 1, code: null, disc: 0, method: null };
    if (!Bag.items.length) { $('[data-co]').hidden = true; $('[data-co-empty]').hidden = false; return; }
    let data;
    try { data = await S.ready; } catch (e) { failLoad($('[data-co-lines]')); return; }
    const s = data.settings, pay = s.payments || {};
    // fill state list and remembered details
    $('[data-states]').innerHTML += states(s).map((n) => `<option>${esc(n)}</option>`).join('');
    const me = S.store.get('bs_customer', {}) || {};
    ['name', 'email', 'phone', 'address', 'city', 'state'].forEach((k) => { if (me[k] && form.elements[k]) form.elements[k].value = me[k]; });
    if (!form.elements.state.value) form.elements.state.value = S.store.get('bs_state', '') || '';

    // payment choices the shop has switched on
    const methods = [];
    if (pay.paystack_public_key) methods.push(['card', 'Pay by card', 'Visa, Mastercard or Verve, through Paystack. Safe and instant.']);
    if (pay.bank_account_number) methods.push(['transfer', 'Bank transfer', `Pay into our ${esc(pay.bank_name || 'bank')} account. We’ll show the details next.`]);
    if (pay.whatsapp_orders !== false || !methods.length) methods.push(['whatsapp', 'Finish on WhatsApp', 'We confirm your order and how to pay in a WhatsApp chat.']);
    $('[data-pay]').innerHTML += methods.map((m, i) => `<label${i === 0 ? ' class="is-on"' : ''}><input type="radio" name="pay" value="${m[0]}" ${i === 0 ? 'checked' : ''}><b>${m[1]}</b><small>${m[2]}</small></label>`).join('');
    $('[data-pay]').addEventListener('change', () => $$('[data-pay] label').forEach((l) => l.classList.toggle('is-on', $('input', l).checked)));

    function totals() {
      const items = Bag.items.filter((i) => !i.gone);
      $('[data-co-lines]').innerHTML = Bag.items.map((it) => `<div class="cosum__line"><span class="cosum__q"><span class="pic">${Bag.lineArt(it)}</span><i>${it.qty}</i></span><span><b>${esc(it.name)}</b><small>${[it.length, it.shade].filter(Boolean).map(esc).join(', ')}${it.gone ? ' (no longer available)' : ''}</small></span><span class="price">${money(it.price * it.qty)}</span></div>`).join('');
      const sub = items.reduce((a, i) => a + i.price * i.qty, 0);
      $('[data-co-sub]').textContent = money(sub);
      $('[data-co-disc-row]').hidden = !co.code;
      if (co.code) { $('[data-co-code]').textContent = co.code; $('[data-co-disc]').textContent = '−' + money(co.disc); }
      const stt = form.elements.state.value;
      const fee = stt ? DB.deliveryFee(s, stt, sub - co.disc) : null;
      $('[data-co-fee]').textContent = fee == null ? 'Choose your state' : fee ? money(fee) : 'Free';
      $('[data-co-total]').textContent = money(sub - co.disc + (fee || 0));
      const note = $('[data-fee-note]');
      if (stt) { note.hidden = false; note.innerHTML = `Delivery to ${esc(stt)}: <b>${fee ? money(fee) : 'free'}</b>, usually ${esc(DB.deliveryDays(s, stt).toLowerCase())}.`; } else note.hidden = true;
      return { sub, fee: fee || 0, total: sub - co.disc + (fee || 0) };
    }
    totals();
    document.addEventListener('bag:change', totals);
    form.elements.state.addEventListener('change', totals);

    // discount code
    const codeForm = $('[data-code-form]'), codeMsg = $('[data-code-msg]');
    codeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = codeForm.elements.code.value.trim();
      if (!code) return;
      const btn = $('button', codeForm); btn.classList.add('is-busy');
      try {
        const r = await DB.checkDiscount(code, totals().sub);
        if (r && r.ok) { co.code = r.code; co.disc = r.amount; codeMsg.className = 'small ok'; codeMsg.textContent = `${r.code} applied: ${r.message}.`; codeForm.elements.code.value = ''; }
        else { codeMsg.className = 'small err'; codeMsg.textContent = (r && r.message) || 'That code isn’t valid.'; }
      } catch (err) { codeMsg.className = 'small err'; codeMsg.textContent = err.message; }
      btn.classList.remove('is-busy');
      totals();
    });
    $('[data-code-remove]').addEventListener('click', () => { co.code = null; co.disc = 0; codeMsg.textContent = ''; totals(); });

    // steps
    const need = {
      1: () => {
        const f = form.elements;
        if (f.name.value.trim().length < 2) return [f.name, 'Please add your full name.'];
        if (!DB.validEmail(f.email.value)) return [f.email, 'Please check your email address.'];
        if (f.phone.value.replace(/\D/g, '').length < 7) return [f.phone, 'Please add a phone number the rider can call.'];
        return null;
      },
      2: () => {
        const f = form.elements;
        if (f.address.value.trim().length < 4) return [f.address, 'Please add your street address.'];
        if (!f.state.value) return [f.state, 'Please choose your state.'];
        return null;
      }
    };
    const summary = {
      1: () => { const f = form.elements; return `${f.name.value.trim()}, ${f.email.value.trim()}, ${f.phone.value.trim()}`; },
      2: () => { const f = form.elements; return [f.address.value.trim(), f.city.value.trim(), f.state.value].filter(Boolean).join(', '); }
    };
    function go(n) {
      co.step = n;
      [1, 2, 3].forEach((k) => {
        const sec = $(`[data-step="${k}"]`), body = $(`[data-body="${k}"]`), sum = $(`[data-sum="${k}"]`), edit = $(`[data-edit="${k}"]`);
        body.hidden = k !== n;
        sec.classList.toggle('is-locked', k > n);
        if (sum) { sum.hidden = !(k < n); if (k < n) sum.textContent = summary[k](); }
        if (edit) edit.hidden = !(k < n);
      });
      const body = $(`[data-body="${n}"]`);
      if (!reduced) body.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.7,.1,1)' });
      const first = $('input:not([type=radio]), select, input[type=radio]:checked', body);
      if (first && n > 1) setTimeout(() => first.focus({ preventScroll: true }), 50);
      const sec = $(`[data-step="${n}"]`);
      if (sec.getBoundingClientRect().top < 60) sec.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
    function check(n) {
      const err = $(`[data-err="${n}"]`);
      $$(`[data-body="${n}"] [aria-invalid]`).forEach((x) => x.removeAttribute('aria-invalid'));
      const bad = need[n] && need[n]();
      if (bad) { bad[0].setAttribute('aria-invalid', 'true'); err.textContent = bad[1]; bad[0].focus(); return false; }
      err.textContent = '';
      return true;
    }
    form.addEventListener('click', (e) => {
      const nx = e.target.closest('[data-next]'), ed = e.target.closest('[data-edit]');
      if (nx) { const n = Number(nx.dataset.next); if (check(n)) go(n + 1); }
      if (ed) go(Number(ed.dataset.edit));
    });
    form.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA' || e.target.type === 'radio') return;
      if (co.step < 3) { e.preventDefault(); if (check(co.step)) go(co.step + 1); }
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!check(1)) { go(1); return; }
      if (!check(2)) { go(2); return; }
      const f = form.elements, btn = $('[data-place]'), err = $('[data-err="3"]');
      const method = (form.querySelector('input[name="pay"]:checked') || {}).value;
      const items = Bag.items.filter((i) => !i.gone);
      if (!items.length) { err.textContent = 'Your bag is empty.'; return; }
      const payload = {
        name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(), address: f.address.value.trim(), city: f.city.value.trim(),
        state: f.state.value, note: f.note.value.trim(), payment_method: method, discount_code: co.code || '',
        items: items.map((i) => ({ product_id: i.product_id, length: i.length, shade: i.shade, qty: i.qty }))
      };
      S.store.set('bs_customer', { name: payload.name, email: payload.email, phone: payload.phone, address: payload.address, city: payload.city, state: payload.state });
      btn.classList.add('is-busy'); btn.disabled = true; err.textContent = '';
      let order;
      try { order = await DB.placeOrder(payload); }
      catch (x) { err.textContent = x.message; btn.classList.remove('is-busy'); btn.disabled = false; return; }
      const lines = items.map((i) => `${i.qty} × ${i.name}${i.length || i.shade ? ' (' + [i.length, i.shade].filter(Boolean).join(', ') + ')' : ''}`).join('\n');
      Bag.clear();
      if (method === 'card') payCard(order, payload, lines);
      else done(order, payload, method, lines);
    });

    function payCard(order, payload, lines) {
      const go = () => {
        try {
          const popup = new window.PaystackPop();
          popup.newTransaction({
            key: pay.paystack_public_key, email: order.email, amount: order.total * 100, currency: 'NGN',
            reference: `${order.number}-${Date.now().toString(36)}`,
            metadata: { order_number: order.number, custom_fields: [{ display_name: 'Order', variable_name: 'order_number', value: order.number }] },
            onSuccess: async (tx) => { try { await DB.reportPayment(order.number, order.email, tx.reference); } catch (e) { /* admin can still match it in Paystack */ } done(order, payload, 'card-paid', lines); },
            onCancel: () => done(order, payload, 'card-open', lines)
          });
        } catch (e) { done(order, payload, 'card-open', lines); }
      };
      if (window.PaystackPop) return go();
      const sc = document.createElement('script');
      sc.src = 'https://js.paystack.co/v2/inline.js';
      sc.onload = go;
      sc.onerror = () => done(order, payload, 'card-open', lines);
      document.head.appendChild(sc);
      done.retry = go;
    }

    function done(order, payload, how, lines) {
      $('[data-co]').hidden = true;
      $('[data-co-title]').hidden = true;
      const box = $('[data-done]');
      box.hidden = false;
      const first = payload.name.split(' ')[0];
      const msg = `Hi Baddie Strands! I just placed order ${order.number}.\n\n${lines}\n\nTotal: ${money(order.total)}\nDeliver to: ${payload.address}, ${payload.city ? payload.city + ', ' : ''}${payload.state}`;
      const track = `track.html?n=${encodeURIComponent(order.number)}&e=${encodeURIComponent(order.email)}`;
      let next = '';
      if (how === 'transfer') {
        next = `<p class="lede">Pay <b>${money(order.total)}</b> into the account below, with <b>${esc(order.number)}</b> as the reference. We start packing as soon as it lands.</p>
          <div class="bank">
            <div><span class="muted">Bank</span><b>${esc(pay.bank_name || '')}</b></div>
            <div><span class="muted">Account name</span><b>${esc(pay.bank_account_name || '')}</b></div>
            <div><span class="muted">Account number</span><span><b>${esc(pay.bank_account_number || '')}</b> <button class="copy" type="button" data-copy="${esc(pay.bank_account_number || '')}">Copy</button></span></div>
            <div><span class="muted">Amount</span><span><b>${money(order.total)}</b> <button class="copy" type="button" data-copy="${order.total}">Copy</button></span></div>
          </div>
          <div class="hero__go"><a class="btn" href="${S.waLink(msg + '\n\nI have paid by transfer. Here is my receipt:')}" target="_blank" rel="noopener">Send your receipt on WhatsApp</a></div>`;
      } else if (how === 'card-paid') {
        next = `<p class="lede">Your card payment went through. We’ll confirm it and start packing, and email you at <b>${esc(order.email)}</b>.</p>`;
      } else if (how === 'card-open') {
        next = `<p class="lede">Your order is saved, but the card payment wasn’t finished. You can try again, or finish on WhatsApp.</p>
          <div class="hero__go"><button class="btn" type="button" data-retry>Pay ${money(order.total)} by card</button><a class="btn btn--line" href="${S.waLink(msg)}" target="_blank" rel="noopener">Finish on WhatsApp</a></div>`;
      } else {
        next = `<p class="lede">Send us your order on WhatsApp and we’ll confirm it and how to pay.</p>
          <div class="hero__go"><a class="btn" href="${S.waLink(msg)}" target="_blank" rel="noopener">Send order on WhatsApp</a></div>`;
      }
      box.innerHTML = `<h1 class="display" style="font-size:clamp(44px,8vw,112px)">Thank you, ${esc(first)}.</h1>
        <p class="h3">Order <span class="done__num">${esc(order.number)}</span> is in.</p>
        ${next}
        <div class="sum" style="max-width:420px">
          <div><span>Subtotal</span><span class="price">${money(order.subtotal)}</span></div>
          ${order.discount ? `<div><span>Discount</span><span class="price">−${money(order.discount)}</span></div>` : ''}
          <div><span>Delivery</span><span class="price">${order.delivery_fee ? money(order.delivery_fee) : 'Free'}</span></div>
          <div class="sum__total"><span>Total</span><span class="price">${money(order.total)}</span></div>
        </div>
        <p>Keep your order number. You can <a class="link" href="${track}">track this order</a> any time.</p>
        <div><a class="btn btn--line" href="shop.html">Keep shopping</a></div>`;
      box.onclick = async (e) => {
        const c = e.target.closest('[data-copy]');
        if (c) { try { await navigator.clipboard.writeText(c.dataset.copy); c.textContent = 'Copied'; setTimeout(() => { c.textContent = 'Copy'; }, 1800); } catch (x) { toast('Copy didn’t work here. Select the number and copy it.'); } }
        if (e.target.closest('[data-retry]') && done.retry) done.retry();
      };
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      const h = $('h1', box); h.tabIndex = -1; h.focus({ preventScroll: true });
    }
  }

  // ══════════════════════════════════════════════════════
  // TRACK
  // ══════════════════════════════════════════════════════
  function track() {
    const form = $('[data-track-form]'), out = $('[data-track-out]'), err = $('[data-track-err]');
    const STEPS = [['new', 'Order placed', 'We have your order.'], ['confirmed', 'Confirmed', 'Payment checked and order confirmed.'], ['packing', 'Being packed', 'Your hair is being checked and packed.'], ['shipped', 'On its way', 'With the rider or courier.'], ['delivered', 'Delivered', 'Enjoy it, queen.']];
    const PAY = { unpaid: 'Not paid yet', to_check: 'Payment sent, we’re confirming it', paid: 'Paid', refunded: 'Refunded' };
    const fmt = (d) => new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    async function find(number, email) {
      err.textContent = '';
      const btn = $('button', form); btn.classList.add('is-busy'); btn.disabled = true;
      try {
        const o = await DB.trackOrder(number, email);
        if (!o) { err.textContent = 'We couldn’t find an order with that number and email. Check both, or message us.'; out.innerHTML = ''; }
        else paint(o);
      } catch (x) { err.textContent = x.message; }
      btn.classList.remove('is-busy'); btn.disabled = false;
    }
    function paint(o) {
      const idx = STEPS.findIndex((s) => s[0] === o.status);
      const steps = o.status === 'cancelled'
        ? `<p class="note" style="margin:24px 0"><b>This order was cancelled.</b> If that’s a surprise, please message us.</p>`
        : `<ol class="steps">${STEPS.map((s, i) => `<li class="${i < idx ? 'is-done' : i === idx ? 'is-done is-now' : ''}"><span><b>${s[1]}</b><small>${i === idx ? s[2] : ''}</small></span></li>`).join('')}</ol>`;
      out.innerHTML = `<p class="small muted">Placed ${fmt(o.created_at)}</p><h2 class="h2" style="margin:6px 0 4px">${esc(o.number)}</h2>
        <p><b>${PAY[o.payment_status] || ''}</b>${o.tracking ? `. ${esc(o.tracking)}` : ''}</p>
        ${steps}
        <div class="cosum" style="position:static"><div class="cosum__lines">${(o.items || []).map((it) => `<div class="cosum__line"><span class="cosum__q"><span class="pic"><img src="${esc(it.image || art({ texture: 'straight', category: 'wigs', shades: [{ hex: '#1a1008' }] }))}" alt=""></span><i>${it.qty}</i></span><span><b>${esc(it.name)}</b><small>${[it.length, it.shade].filter(Boolean).map(esc).join(', ')}</small></span><span class="price">${money(it.price * it.qty)}</span></div>`).join('')}</div>
        <div class="sum"><div><span>Delivery</span><span class="price">${o.delivery_fee ? money(o.delivery_fee) : 'Free'}</span></div>${o.discount ? `<div><span>Discount</span><span class="price">−${money(o.discount)}</span></div>` : ''}<div class="sum__total"><span>Total</span><span class="price">${money(o.total)}</span></div></div></div>
        <p style="margin-top:20px">Questions about this order? <a class="link" href="${S.waLink(`Hi! A question about order ${o.number}.`)}" target="_blank" rel="noopener">Message us on WhatsApp</a>.</p>`;
      if (!reduced) out.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.2,.7,.1,1)' });
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const n = form.elements.number.value.trim(), m = form.elements.email.value.trim();
      if (!n) { err.textContent = 'Please add your order number.'; form.elements.number.focus(); return; }
      if (!DB.validEmail(m)) { err.textContent = 'Please check the email address.'; form.elements.email.focus(); return; }
      history.replaceState(null, '', `?n=${encodeURIComponent(n.toUpperCase())}&e=${encodeURIComponent(m)}`);
      find(n, m);
    });
    if (params.get('n') && params.get('e')) { form.elements.number.value = params.get('n'); form.elements.email.value = params.get('e'); find(params.get('n'), params.get('e')); }
  }

  // ══════════════════════════════════════════════════════
  // HELP
  // ══════════════════════════════════════════════════════
  async function help() {
    let s;
    try { s = (await S.ready).settings; } catch (e) { return; }
    const faq = (s.faq || []).filter((f) => f && f.q);
    const groups = Array.from(new Set(faq.map((f) => f.group || 'Questions')));
    const slug = (g) => 'q-' + DB.slugify(g);
    $('[data-faq-nav]').innerHTML = groups.map((g) => `<a href="#${slug(g)}">${esc(g)}</a>`).join('') + '<a href="delivery.html">Delivery fees</a>';
    const box = $('[data-faq]'), qIn = $('[data-faq-q]');
    const mark = (text, words) => { let t = esc(text); words.forEach((w) => { if (w.length > 1) t = t.replace(new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>'); }); return t; };
    function paint() {
      const words = qIn.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let n = 0;
      box.innerHTML = groups.map((g) => {
        const items = faq.filter((f) => (f.group || 'Questions') === g && (!words.length || words.every((w) => (f.q + ' ' + f.a).toLowerCase().includes(w))));
        n += items.length;
        if (!items.length) return '';
        return `<section class="faqgroup" id="${slug(g)}"><h2 class="h2">${esc(g)}</h2>${items.map((f) => `<details class="qa"${words.length ? ' open' : ''}><summary><span>${mark(f.q, words)}</span></summary><p>${mark(f.a, words)}</p></details>`).join('')}</section>`;
      }).join('');
      $('[data-faq-none]').hidden = n > 0;
    }
    qIn.addEventListener('input', paint);
    paint();
    if (location.hash) { const t = document.querySelector(location.hash); if (t) setTimeout(() => t.scrollIntoView(), 50); }
  }

  // ══════════════════════════════════════════════════════
  // CONTACT
  // ══════════════════════════════════════════════════════
  function contact() {
    const form = $('[data-contact-form]'), err = $('[data-contact-err]');
    const want = params.get('about');
    if (want) form.elements.body.value = `I'm interested in ${want}. `;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = form.elements, m = { name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(), body: f.body.value.trim() };
      $$('[aria-invalid]', form).forEach((x) => x.removeAttribute('aria-invalid'));
      const bad = m.name.length < 2 ? [f.name, 'Please add your name.'] : !m.email && !m.phone ? [f.email, 'Add an email or a phone number so we can reply.'] : m.email && !DB.validEmail(m.email) ? [f.email, 'Please check your email address.'] : m.body.length < 2 ? [f.body, 'Please write your message.'] : null;
      if (bad) { bad[0].setAttribute('aria-invalid', 'true'); err.textContent = bad[1]; bad[0].focus(); return; }
      const btn = $('button[type=submit]', form); btn.classList.add('is-busy'); btn.disabled = true; err.textContent = '';
      try {
        await DB.sendMessage(m);
        form.innerHTML = `<div class="full" style="display:grid;gap:16px"><h2 class="h2">Thanks, ${esc(m.name.split(' ')[0])}.</h2><p class="lede">We’ve got your message and will reply ${m.phone ? 'on WhatsApp or by phone' : 'by email'}, usually within two hours in opening hours.</p><div><a class="btn btn--line" href="shop.html">Back to the shop</a></div></div>`;
      } catch (x) { err.textContent = x.message; btn.classList.remove('is-busy'); btn.disabled = false; }
    });
  }

  // ══════════════════════════════════════════════════════
  // HAIR KNOWLEDGE
  // ══════════════════════════════════════════════════════
  const CARE = {
    Washing: [
      ['Detangle before washing', 'Always detangle from the tips up to the roots with a wide-tooth comb or your fingers. Starting at the root causes breakage and matting.'],
      ['Use sulphate-free shampoo', 'Sulphates strip natural oils. Use a moisturising, sulphate-free shampoo, slightly diluted in warm water for an even, gentle cleanse.'],
      ['Wash in downward strokes', 'Work the shampoo gently downward, with the direction of the cuticle. Scrubbing in circles causes frizz and tangles.'],
      ['Deep condition every wash', 'Apply a rich conditioner from mid-length to ends and leave it 15 to 30 minutes under a plastic cap. A unit gets no natural oils from a scalp, so it needs this moisture.'],
      ['Rinse with cool water', 'Finish with a cool rinse. Cold water closes the cuticle, seals in moisture and brings back the shine.'],
      ['Air-dry or use low heat', 'Pat with a microfibre towel, never rub. Air-dry on a wig stand, or use the lowest heat with a diffuser.']
    ],
    Styling: [
      ['Always use heat protectant', 'Even on heat-friendly hair, spray a thermal protectant before any heat. It keeps the hair strong and makes it last much longer.'],
      ['Flat iron at the right heat', 'Fine or coloured hair: 150 to 180°C. Thick, coarse hair: up to 220°C. Never go above 230°C.'],
      ['Curl, then set with cool air', 'Let each curl cool in your hand before you let go, then hit it with cool air to lock it in for the day.'],
      ['Avoid alcohol-based products', 'Many sprays and gels contain drying alcohols. If ethanol or isopropyl alcohol is near the top of the label, leave it on the shelf.']
    ],
    Storage: [
      ['Keep it on a wig stand', 'A stand holds the shape of the cap and stops the hair being crushed or tangled.'],
      ['Silk or satin bags', 'For travel or long storage, use a silk or satin bag. Cotton pulls out moisture and causes frizz.'],
      ['Detangle before storing', 'Never put a unit away tangled. Tangles get worse with time and harder to remove.'],
      ['Keep out of direct sun', 'UV fades colour and weakens the hair. Store it away from windows, and use a UV-protect spray if you’ll be in the sun for long.']
    ],
    Maintenance: [
      ['Refresh with a water spray', 'Between washes, spritz lightly with water and scrunch to revive curls or waves. Add a little leave-in or serum for shine.'],
      ['Moisturise weekly', 'Use the LOC method: liquid (water), then oil (argan, jojoba or castor), then cream (shea butter or leave-in).'],
      ['Trim the ends every 3 months', 'Heat and handling cause split ends even on human hair. A small trim keeps the ends bouncy and tangle-free.'],
      ['Sleep on silk or satin', 'Cotton pillowcases cause friction and frizz. Use a silk or satin pillowcase, or a silk bonnet.']
    ]
  };
  function knowledge() {
    const tabs = $$('[data-ktab]');
    const setTab = (id, focus) => {
      tabs.forEach((t) => { const on = t.dataset.ktab === id; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
      $$('[data-kpanel]').forEach((p) => { p.hidden = p.dataset.kpanel !== id; });
    };
    tabs.forEach((t) => t.addEventListener('click', () => { setTab(t.dataset.ktab); history.replaceState(null, '', t.dataset.ktab === 'care' ? '#care' : location.pathname); }));
    $('[role="tablist"]').addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
      setTab(tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length].dataset.ktab, true);
    });
    // care guide: topics down the side, tips on the right
    const nav = $('[data-guide-nav]'), panel = $('[data-guide-panel]');
    const topics = Object.keys(CARE);
    nav.innerHTML = topics.map((t, i) => `<button type="button" role="tab" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-topic="${t}" aria-controls="guide-panel">${t}</button>`).join('');
    panel.id = 'guide-panel'; panel.setAttribute('role', 'tabpanel');
    const show = (t, focus) => {
      $$('[data-topic]', nav).forEach((b) => { const on = b.dataset.topic === t; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
      panel.setAttribute('aria-label', t);
      panel.innerHTML = CARE[t].map((x, i) => `<div class="guide__item"><span aria-hidden="true">${i + 1}</span><div><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></div></div>`).join('');
      if (!reduced) $$('.guide__item', panel).forEach((el, k) => el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 450, delay: k * 50, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
    };
    nav.addEventListener('click', (e) => { const b = e.target.closest('[data-topic]'); if (b) show(b.dataset.topic); });
    nav.addEventListener('keydown', (e) => {
      if (!/^Arrow(Up|Down|Left|Right)$/.test(e.key)) return;
      e.preventDefault();
      const i = topics.indexOf($('[aria-selected="true"]', nav).dataset.topic);
      show(topics[(i + (/Down|Right/.test(e.key) ? 1 : -1) + topics.length) % topics.length], true);
    });
    show(topics[0]);
    if (location.hash === '#care') setTab('care');
  }

  // ══════════════════════════════════════════════════════
  // HAIR QUIZ
  // ══════════════════════════════════════════════════════
  const QUIZ = [
    { q: 'What’s your lifestyle like?', o: ['Very active: gym, sports, outdoors', 'Office life: sleek and professional', 'Social butterfly: events and parties', 'Home first: comfort above all'] },
    { q: 'How much time do you have to style each day?', o: ['5 minutes, tops', '10 to 20 minutes', '30 minutes or more', 'I love styling, no limit'] },
    { q: 'Which texture are you drawn to?', o: ['Straight and sleek', 'Wavy and soft', 'Curly and bouncy', 'Coily and natural'] },
    { q: 'What matters most to you?', o: ['A lace nobody can see', 'Maximum volume', 'Lasting a long time', 'Easy upkeep'] },
    { q: 'Roughly what’s your budget?', o: ['Under ₦50,000', '₦50,000 to ₦80,000', '₦80,000 to ₦120,000', 'Price is no object'] }
  ];
  function quiz() {
    const box = $('[data-quiz]'), res = $('[data-quiz-results]');
    const ans = [];
    let step = 0;
    const L = ['a', 'b', 'c', 'd'];
    function paint(dir) {
      const Q = QUIZ[step];
      box.innerHTML = `<div class="quiz__bar" role="progressbar" aria-label="Quiz progress" aria-valuemin="0" aria-valuemax="${QUIZ.length}" aria-valuenow="${step + 1}"><i style="width:${(step / QUIZ.length) * 100}%"></i></div>
        <p class="quiz__step">Question ${step + 1} of ${QUIZ.length}</p>
        <h2 class="quiz__q" id="quiz-q" tabindex="-1">${esc(Q.q)}</h2>
        <div class="quiz__opts" role="radiogroup" aria-labelledby="quiz-q">${Q.o.map((o, i) => `<button class="quiz__opt" type="button" role="radio" aria-checked="${ans[step] === i}" tabindex="${(ans[step] ?? 0) === i ? 0 : -1}" data-a="${i}"><i aria-hidden="true">${L[i]}</i>${esc(o)}</button>`).join('')}</div>
        <div class="quiz__nav"><button class="btn btn--black btn--sm" type="button" data-back ${step ? '' : 'hidden'}>Back</button><span class="small muted">${ans[step] == null ? 'Pick one to continue' : ''}</span></div>`;
      requestAnimationFrame(() => { const bar = $('.quiz__bar i', box); if (bar) bar.style.width = ((step + (ans[step] != null ? 1 : 0)) / QUIZ.length) * 100 + '%'; });
      if (!reduced && dir) box.animate([{ opacity: 0, transform: `translateX(${dir * 24}px)` }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
      if (dir) $('#quiz-q').focus({ preventScroll: true });
    }
    box.addEventListener('click', (e) => {
      const o = e.target.closest('[data-a]');
      if (o) {
        ans[step] = Number(o.dataset.a);
        $$('[data-a]', box).forEach((b) => { b.setAttribute('aria-checked', String(b === o)); b.tabIndex = b === o ? 0 : -1; });
        $('.quiz__bar i', box).style.width = ((step + 1) / QUIZ.length) * 100 + '%';
        setTimeout(() => { if (step < QUIZ.length - 1) { step++; paint(1); } else finish(); }, reduced ? 0 : 320);
      }
      if (e.target.closest('[data-back]') && step) { step--; paint(-1); }
    });
    box.addEventListener('keydown', (e) => {
      if (!/^Arrow/.test(e.key) || !e.target.matches('[data-a]')) return;
      e.preventDefault();
      const items = $$('[data-a]', box), i = items.indexOf(e.target);
      items[(i + (/Down|Right/.test(e.key) ? 1 : -1) + items.length) % items.length].focus();
    });
    async function finish() {
      let data;
      try { data = await S.ready; } catch (err) { return; }
      const picks = recommend(data.products, ans);
      res.hidden = false;
      $('[data-results]').innerHTML = picks.map((x) => `<div style="display:grid;background:var(--surface)">${card(x.p)}<p class="result__why">${esc(x.why)}</p></div>`).join('');
      box.innerHTML = `<div class="quiz__bar"><i style="width:100%"></i></div><p class="quiz__step">All done</p><h2 class="quiz__q">We found <em style="color:var(--gold)">${picks.length} piece${picks.length === 1 ? '' : 's'}</em> for you.</h2><p class="lede">Picked from your answers on lifestyle, texture and budget. Not quite right? Message us and we’ll help you choose.</p><div class="hero__go" style="margin-top:8px"><a class="btn" href="#res-title">See your match</a><a class="btn btn--line" href="#" data-wa-quiz target="_blank" rel="noopener">Ask us on WhatsApp</a></div>`;
      $('[data-wa-quiz]').href = S.waLink(`Hi Baddie Strands! I took the hair quiz: ${QUIZ.map((q, i) => q.o[ans[i]]).join('; ')}. Can you help me choose?`);
      S.store.set('bs_quiz', ans);
      res.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      $('#res-title').focus({ preventScroll: true });
    }
    $('[data-quiz-again]').addEventListener('click', () => { ans.length = 0; step = 0; res.hidden = true; paint(-1); box.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); });
    paint(0);
  }
  // score every piece against the answers; returns the top three with a reason
  function recommend(products, a) {
    const TEX = [['bone', 'straight'], ['body', 'loose', 'water'], ['deep', 'curly'], ['coily']];
    const BUDGET = [[0, 50000], [50000, 80000], [80000, 120000], [0, Infinity]];
    const easyTex = ['bone', 'straight', 'body'];
    const has = (p, re) => re.test([p.name, p.description, (p.details || []).join(' ')].join(' '));
    const scored = products.filter((p) => p.stock !== 0).map((p) => {
      let sc = 0; const why = [];
      const lo = DB.priceRange(p)[0];
      if (TEX[a[2]].includes(p.texture)) { sc += 6; why.push(`${texName(p.texture).toLowerCase()}, the texture you picked`); }
      const [min, max] = BUDGET[a[4]];
      if (lo <= max && lo >= min) { sc += 3; why.push('in your budget'); } else if (lo > max) sc -= Math.min(4, Math.ceil((lo - max) / 15000)); else sc += 1;
      if (p.category === 'wigs') sc += 1.5;
      if ((a[0] === 0 || a[0] === 3 || a[1] === 0) && (has(p, /glueless|beginner|easy|60-second|u-part/i) || easyTex.includes(p.texture))) { sc += 2; why.push('quick to wear'); }
      if ((a[0] === 2 || a[1] >= 2) && /deep|curly|body|loose|water/.test(p.texture)) { sc += 1; }
      if (a[3] === 0 && has(p, /\bHD\b/)) { sc += 2.5; why.push('HD lace that disappears'); }
      if (a[3] === 1 && (has(p, /200%|180%|double weft|volume/i) || p.category === 'bundles')) { sc += 2.5; why.push('full, high-density volume'); }
      if (a[3] === 2 && has(p, /virgin|reusable|12\+ months|durab/i)) { sc += 1.5; why.push('built to last'); }
      if (a[3] === 3 && (has(p, /easy|maintenance|frizz|glueless|beginner/i) || easyTex.includes(p.texture))) { sc += 2; why.push('easy to look after'); }
      if (p.featured) sc += 0.5;
      return { p, sc, why };
    }).sort((x, y) => y.sc - x.sc);
    return scored.slice(0, 3).map((x) => ({ p: x.p, why: x.why.length ? 'Why: ' + Array.from(new Set(x.why)).slice(0, 3).join(', ') + '.' : 'A versatile favourite that suits most styles.' }));
  }

  // ══════════════════════════════════════════════════════
  // DELIVERY
  // ══════════════════════════════════════════════════════
  async function delivery() {
    let s;
    try { s = (await S.ready).settings; } catch (e) { return; }
    const d = s.delivery || {};
    $('[data-fees-note]').textContent = `Nationwide delivery across all 36 states and the FCT. Anywhere not listed is ${money(d.default_fee || 3500)}, ${String(d.default_days || '2 to 4 days').toLowerCase()}.${Number(d.free_over) > 0 ? ` Free delivery on orders of ${money(d.free_over)} or more.` : ''} International shipping to the UK, Europe, North America and across Africa.`;
    const rows = states(s).map((n) => [n, (d.fees || {})[n], DB.deliveryDays(s, n)]);
    const tb = $('[data-fees]'), fq = $('[data-fee-q]');
    const mine = S.store.get('bs_state', '');
    const paintFees = () => { const q = fq.value.trim().toLowerCase(); tb.innerHTML = rows.filter((r) => !q || r[0].toLowerCase().includes(q)).map((r) => `<tr${r[0] === mine ? ' style="background:var(--gold-tint)"' : ''}><td>${esc(r[0])}</td><td>${money(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">No state matches that.</td></tr>'; };
    fq.addEventListener('input', paintFees);
    paintFees();
  }

  ({ home, shop, product, checkout, track, help, contact, knowledge, quiz, delivery })[page]?.();
})();
