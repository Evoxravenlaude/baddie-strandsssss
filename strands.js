// ============================================================
// BADDIE STRANDS — Strands
// Draws hair on a <canvas>: texture, length, shade, ombre and
// shape (wig, bundle, clip-ins, ponytail), with cursor combing.
// Every value in `state` can be tweened, so hair morphs live.
// ============================================================
(function (global) {
  'use strict';

  // amp/kink are fractions of the strand length; freq is waves per strand.
  const TEXTURES = {
    bone:     { amp: 0,     freq: .6, loop: 0,   kink: 0,     coher: 1,   shrink: 0,   puff: 0,   gloss: 1 },
    straight: { amp: .007,  freq: .9, loop: 0,   kink: 0,     coher: 1,   shrink: 0,   puff: .02, gloss: .92 },
    body:     { amp: .05,   freq: 1.55, loop: .15, kink: 0,   coher: .9,  shrink: .04, puff: .1,  gloss: .78 },
    loose:    { amp: .036,  freq: 2.4, loop: .2, kink: .001,  coher: .82, shrink: .07, puff: .14, gloss: .7 },
    water:    { amp: .03,   freq: 3.5, loop: .35, kink: .002, coher: .7,  shrink: .1,  puff: .2,  gloss: .62 },
    deep:     { amp: .027,  freq: 5,  loop: .55, kink: .003,  coher: .55, shrink: .13, puff: .26, gloss: .55 },
    curly:    { amp: .024,  freq: 7.5, loop: 1.05, kink: .004, coher: .38, shrink: .2, puff: .36, gloss: .45 },
    coily:    { amp: .012,  freq: 15, loop: 1.35, kink: .011, coher: .12, shrink: .3,  puff: .62, gloss: .22 }
  };
  const TEXTURE_KEYS = Object.keys(TEXTURES);

  const rgb = (h) => {
    const m = /^#?([\da-f]{6})$/i.exec(String(h || '').trim());
    const n = m ? parseInt(m[1], 16) : 0x1a1008;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
  const css = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  const tint = (c, f) => (f < 0 ? c.map((v) => v * (1 + f)) : c.map((v) => v + (255 - v) * f * 0.55));
  const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const VARIANTS = [-0.26, -0.1, 0.03, 0.15];

  const reduced = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // One animation loop for every live canvas on the page.
  const loop = {
    set: new Set(), raf: 0, last: 0,
    add(s) { this.set.add(s); if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); } },
    del(s) { this.set.delete(s); },
    tick(now) {
      const dt = Math.min(0.05, (now - loop.last) / 1000);
      loop.last = now;
      loop.set.forEach((s) => s.frame(dt));
      loop.raf = loop.set.size ? requestAnimationFrame(loop.tick) : 0;
    }
  };
  loop.tick = loop.tick.bind(loop);

  class Strands {
    constructor(canvas, opts) {
      const o = this.o = Object.assign({
        layout: 'lock', shape: 'dome', texture: 'body', shade: '#1a1008', tip: null,
        len: 0.62, ax: 0.5, ay: 0.13, lockW: 0.44, count: 0, density: 1,
        interactive: false, speed: 1, dprMax: 2, bg: null, auto: true, part: 0.5
      }, opts || {});
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      const base = rgb(o.shade), tip = o.tip ? rgb(o.tip) : base;
      this.state = Object.assign({
        layout: o.layout === 'curtain' ? 0 : 1, len: o.len,
        dome: o.shape === 'dome' ? 1 : 0, weft: o.shape === 'weft' || o.shape === 'clip' ? 1 : 0,
        pony: o.shape === 'pony' ? 1 : 0, clip: o.shape === 'clip' ? 1 : 0,
        r: base[0], g: base[1], b: base[2], r2: tip[0], g2: tip[1], b2: tip[2],
        ax: o.ax, ay: o.ay, lockW: o.lockW, part: o.part, alpha: 1, gap: 0, grow: 1
      }, TEXTURES[o.texture] || TEXTURES.body);
      this.time = 7 + Math.random() * 40;
      this.mouse = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, on: 0, ton: 0, vx: 0 };
      this.playing = false;
      this.visible = true;
      this.wanted = false;
      this.resize();
      if (typeof ResizeObserver !== 'undefined' && !o.fixed) {
        this.ro = new ResizeObserver(() => { this.resize(); if (!this.playing) this.render(); });
        this.ro.observe(canvas);
      }
      if (o.auto && typeof IntersectionObserver !== 'undefined') {
        this.io = new IntersectionObserver((es) => { this.visible = es[0].isIntersecting; this.sync(); }, { rootMargin: '120px' });
        this.io.observe(canvas);
      }
      if (o.interactive) this.bindPointer();
      this.render();
    }

    // ── size and strand layout ──────────────────────────────
    resize() {
      const o = this.o, r = this.c.getBoundingClientRect();
      const w = o.width || r.width || this.c.width || 300, h = o.height || r.height || this.c.height || 400;
      this.dpr = Math.min(o.dprMax, global.devicePixelRatio || 1);
      this.W = w; this.H = h;
      this.c.width = Math.round(w * this.dpr);
      this.c.height = Math.round(h * this.dpr);
      const want = o.count || Math.round(clamp((this.state.layout < 0.5 ? w / 3.1 : Math.min(w * this.state.lockW, h * 0.62) / 1.0) * o.density, 70, 440));
      if (want !== this.n) this.build(want);
    }
    build(n) {
      this.n = n;
      this.NP = 124;
      this.P = new Float32Array(n * this.NP * 2);
      this.off = new Float32Array(n * this.NP);
      this.vel = new Float32Array(n * this.NP);
      this.cnt = new Uint8Array(n);
      this.st = [];
      for (let i = 0; i < n; i++) {
        const cl = Math.floor(hash(i, 3) * 9);
        this.st.push({
          u: (i + 0.15 + hash(i, 1) * 0.7) / n,
          v: Math.floor(hash(i, 2) * VARIANTS.length),
          cph: cl * 0.71 + hash(cl, 9) * 6.28,
          oph: hash(i, 4) * 6.28,
          lj: 0.8 + Math.pow(hash(i, 5), 0.7) * 0.24,
          sw: hash(i, 6) * 6.28,
          fj: 0.975 + hash(i, 7) * 0.05
        });
      }
    }

    // ── pointer combing ─────────────────────────────────────
    bindPointer() {
      const m = this.mouse;
      this._pm = (e) => {
        const r = this.c.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        const inside = x > -40 && y > -40 && x < r.width + 40 && y < r.height + 40;
        if (m.tx > -1e3) m.vx = x - m.tx;
        m.tx = x; m.ty = y; m.ton = inside ? 1 : 0;
        if (m.x < -1e3) { m.x = x; m.y = y; }
      };
      this._pl = () => { this.mouse.ton = 0; };
      global.addEventListener('pointermove', this._pm, { passive: true });
      global.addEventListener('pointerdown', this._pm, { passive: true });
      document.addEventListener('pointerleave', this._pl);
      global.addEventListener('blur', this._pl);
    }

    // ── playback ────────────────────────────────────────────
    play() { this.wanted = true; this.sync(); return this; }
    pause() { this.wanted = false; this.sync(); return this; }
    sync() {
      const go = this.wanted && this.visible && !reduced && !document.hidden;
      if (go && !this.playing) { this.playing = true; loop.add(this); }
      if (!go && this.playing) { this.playing = false; loop.del(this); this.render(); }
    }
    frame(dt) { this.time += dt * this.o.speed; this.render(dt); }

    // Tween to new looks: set({ texture:'deep', shade:'#c8a96e', len:.7, shape:'weft' }, 1.1)
    set(p, dur, ease) {
      const s = this.state, to = {};
      if (p.texture && TEXTURES[p.texture]) Object.assign(to, TEXTURES[p.texture]);
      if (p.shade) { const c = rgb(p.shade); to.r = c[0]; to.g = c[1]; to.b = c[2]; const t = rgb(p.tip || p.shade); to.r2 = t[0]; to.g2 = t[1]; to.b2 = t[2]; }
      if (p.shape) { to.dome = p.shape === 'dome' ? 1 : 0; to.weft = p.shape === 'weft' || p.shape === 'clip' ? 1 : 0; to.pony = p.shape === 'pony' ? 1 : 0; to.clip = p.shape === 'clip' ? 1 : 0; }
      ['len', 'layout', 'ax', 'ay', 'lockW', 'part', 'alpha', 'gap'].forEach((k) => { if (p[k] != null) to[k] = p[k]; });
      if (global.gsap && dur !== 0 && !reduced) {
        global.gsap.to(s, Object.assign({ duration: dur == null ? 1.1 : dur, ease: ease || 'power3.inOut', overwrite: 'auto', onUpdate: () => { if (!this.playing) this.render(); } }, to));
      } else { Object.assign(s, to); this.render(); }
      return this;
    }

    // ── geometry + drawing ──────────────────────────────────
    render(dt) {
      const ctx = this.ctx, s = this.state, W = this.W, H = this.H, d = this.dpr, n = this.n, NP = this.NP;
      const m = this.mouse, t0 = this.time;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (this.o.bg) this.paintBg();
      if (s.alpha <= 0.002) return;

      // eased pointer
      const k = dt ? 1 - Math.pow(0.0008, dt) : 1;
      m.x += (m.tx - m.x) * k; m.y += (m.ty - m.y) * k; m.on += (m.ton - m.on) * (dt ? 1 - Math.pow(0.02, dt) : 1);
      m.vx *= 0.9;

      // lock frame
      const lw = Math.min(W * s.lockW, H * 0.62);
      const cx = W * s.ax, y0 = H * s.ay;
      const avail = H - y0 - H * 0.04;
      const L = avail * clamp(s.len, 0.05, 1.2) * (1 - s.shrink * 0.85) * clamp(s.grow, 0.02, 1);
      const Lc = H * clamp(s.len, 0.05, 1.4) * clamp(s.grow, 0.02, 1);
      const partX = W * s.part;
      const R = Math.max(70, Math.min(W, H) * 0.16) * m.on;
      const np = Math.min(NP, Math.max(22, Math.ceil(18 + s.freq * 6.4)));
      const lay = s.layout;

      for (let i = 0; i < n; i++) {
        const st = this.st[i], u = st.u;
        // lock root/tip
        const domeY = lw * 0.3 * (1 - Math.sqrt(Math.max(0, 1 - Math.pow(2 * u - 1, 2))));
        const rxL = cx + (u - 0.5) * lw * lerp(0.94, 0.12, s.pony);
        const ryL = y0 + domeY * s.dome * (1 - s.pony);
        const txL = cx + (u - 0.5) * lw * (1 + s.puff) * lerp(1, 1.05, s.pony);
        // curtain root/tip (parted)
        const rxC = -W * 0.04 + u * W * 1.08;
        const side = rxC < partX ? -1 : 1;
        const fromPart = Math.abs(rxC - partX) / W;
        const ryC = -H * 0.06 + Math.pow(Math.max(0, 0.2 - fromPart), 2) * H * 3;
        const txC = rxC + side * (0.02 + fromPart * 0.08) * W * (1 + s.puff);
        const rx = lerp(rxC, rxL, lay), ry = lerp(ryC, ryL, lay), tx = lerp(txC, txL, lay);
        const len = lerp(Lc, L, lay) * st.lj;
        const ampPx = s.amp * len, loopPx = ampPx * s.loop, kinkPx = s.kink * len;
        const ph = st.cph * s.coher + st.oph * (1 - s.coher);
        const fr = s.freq * st.fj;
        const sway = len * 0.014 * (reduced ? 0 : 1);
        const base = i * NP;
        this.cnt[i] = np;
        // which side this strand gets pushed to: decided once, from its centre line at the pointer's height
        const tm = clamp((m.y - ry) / Math.max(1, len), 0, 1);
        const side0 = lerp(rx, tx, 1 - (1 - tm) * (1 - tm)) - m.x >= 0 ? 1 : -1;
        for (let j = 0; j < np; j++) {
          const t = j / (np - 1);
          const env = smooth(0, 0.16, t);
          const a = 6.2832 * fr * t + ph + t0 * 0.5;
          let x = lerp(rx, tx, 1 - (1 - t) * (1 - t)) + Math.sin(a) * ampPx * env;
          let y = ry + t * len + Math.cos(a) * loopPx * env;
          if (kinkPx) x += (hash(i, j) - 0.5) * 2 * kinkPx * env;
          x += Math.sin(t0 * 0.9 + st.sw + t * 2.2) * sway * t * t;
          // combing: push strands aside around the pointer and let them spring back
          const idx = base + j;
          let target = 0;
          if (R > 1) {
            const dx = x - m.x, dy = y - m.y, dd = dx * dx + dy * dy;
            if (dd < R * R) {
              const f = 1 - Math.sqrt(dd) / R;
              target = f * f * R * 0.7 * side0 + m.vx * f * 0.5;
            }
          }
          if (dt) {
            this.vel[idx] = (this.vel[idx] + (target - this.off[idx]) * 0.16) * 0.78;
            this.off[idx] += this.vel[idx];
          }
          x += this.off[idx] * env;
          if (s.gap > 0.001 && lay < 0.5) {
            const edge = x < partX ? -W * 0.02 : W * 1.02;
            const g = s.gap * (0.8 + 0.2 * Math.sin(Math.PI * t));
            x = edge + (x - edge) * (1 - g);
          }
          this.P[idx * 2] = x;
          this.P[idx * 2 + 1] = y;
        }
      }
      this.draw(lw, cx, y0, L);
    }

    draw(lw, cx, y0, L) {
      const ctx = this.ctx, s = this.state, n = this.n, NP = this.NP, P = this.P;
      const root = [s.r, s.g, s.b], tipc = [s.r2, s.g2, s.b2];
      const ombre = Math.abs(s.r - s.r2) + Math.abs(s.g - s.g2) + Math.abs(s.b - s.b2) > 6;
      const bands = ombre ? 4 : 1;
      const width = clamp(Math.min(this.W, this.H) / 520, 0.6, 1.25) * (s.layout < 0.5 ? 1.2 : 1);
      const spacing = lerp(this.W * 1.08 / n, lw * (1 + s.puff * 0.5) / n, s.layout);
      const massW = clamp(spacing * 3.2, 2.2, 10) * (1 - s.puff * 0.35);
      ctx.globalAlpha = s.alpha;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const cutoff = 0.84;

      // body of each strand, batched by colour band and shade variant
      for (let b = 0; b < bands; b++) {
        const t0 = (b / bands) * cutoff, t1 = ((b + 1) / bands) * cutoff;
        const col = mixc(root, tipc, smooth(0.25, 0.9, (t0 + t1) / 2));
        // the mass: a dense dark under-layer so the hair reads as full, not stringy
        // tapers in three steps so the ends feather instead of stopping in a block
        ctx.strokeStyle = css(tint(col, -0.34));
        [[0, 0.56, 1, 0.96], [0.5, 0.7, 0.55, 0.8], [0.66, 0.8, 0.25, 0.55]].forEach(([a, z, wf, al]) => {
          const ta = Math.max(t0, a), tz = Math.min(t1, z);
          if (tz <= ta) return;
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            const jit = (hash(i, 8) - 0.5) * 0.16 * (a > 0 ? 1 : 0), jz = (hash(i, 8) - 0.5) * 0.16;
            const np = this.cnt[i], j0 = Math.floor(clamp(ta + jit, 0, 1) * (np - 1)), j1 = Math.ceil(clamp(tz + (z < 0.8 ? jz : 0), 0, 1) * (np - 1)), base = i * NP;
            ctx.moveTo(P[(base + j0) * 2], P[(base + j0) * 2 + 1]);
            for (let j = j0 + 1; j <= j1; j++) ctx.lineTo(P[(base + j) * 2], P[(base + j) * 2 + 1]);
          }
          ctx.globalAlpha = s.alpha * al;
          ctx.lineWidth = massW * wf;
          ctx.stroke();
        });
        ctx.globalAlpha = s.alpha;
        for (let v = 0; v < VARIANTS.length; v++) {
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            if (this.st[i].v !== v) continue;
            const np = this.cnt[i], j0 = Math.floor(t0 * (np - 1)), j1 = Math.ceil(t1 * (np - 1));
            const base = i * NP;
            ctx.moveTo(P[(base + j0) * 2], P[(base + j0) * 2 + 1]);
            for (let j = j0 + 1; j <= j1; j++) ctx.lineTo(P[(base + j) * 2], P[(base + j) * 2 + 1]);
          }
          ctx.strokeStyle = css(tint(col, VARIANTS[v]));
          ctx.lineWidth = width * (v === 0 ? 1.6 : v === 3 ? 0.8 : 1.05);
          ctx.stroke();
        }
      }
      // tapered ends
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const np = this.cnt[i], j0 = Math.floor(cutoff * (np - 1)), base = i * NP;
        ctx.moveTo(P[(base + j0) * 2], P[(base + j0) * 2 + 1]);
        for (let j = j0 + 1; j < np; j++) ctx.lineTo(P[(base + j) * 2], P[(base + j) * 2 + 1]);
      }
      ctx.globalAlpha = s.alpha * 0.62;
      ctx.strokeStyle = css(tint(tipc, 0.02));
      ctx.lineWidth = width * 0.6;
      ctx.stroke();

      // sheen: a soft band of light that follows the pointer a little
      if (s.gloss > 0.05) {
        const m = this.mouse;
        const top = lerp(-this.H * 0.02, y0, s.layout);
        const span = lerp(this.H * s.len, L, s.layout);
        let sy = top + span * 0.27;
        if (m.on > 0.01) sy = lerp(sy, clamp(m.y, top, top + span), 0.35 * m.on);
        const bh = Math.max(18, span * 0.1);
        const hi = mixc(mixc(root, tipc, 0.3), [255, 236, 205], 0.58);
        const sy2 = sy + span * 0.34, top2 = sy - bh, bot2 = sy2 + bh * 0.8;
        const g = ctx.createLinearGradient(0, top2, 0, bot2);
        const hs = hi.map((v) => v | 0).join(','), a1 = (0.7 * s.gloss).toFixed(3), a2 = (0.3 * s.gloss).toFixed(3);
        const at = (y) => clamp((y - top2) / (bot2 - top2), 0, 1);
        g.addColorStop(0, `rgba(${hs},0)`);
        g.addColorStop(at(sy), `rgba(${hs},${a1})`);
        g.addColorStop(at(sy + bh), `rgba(${hs},0)`);
        g.addColorStop(at(sy2 - bh * 0.8), `rgba(${hs},0)`);
        g.addColorStop(at(sy2), `rgba(${hs},${a2})`);
        g.addColorStop(1, `rgba(${hs},0)`);
        ctx.beginPath();
        for (let i = 0; i < n; i += 1) {
          const np = this.cnt[i], base = i * NP;
          let pen = false;
          for (let j = 0; j < np; j++) {
            const y = P[(base + j) * 2 + 1];
            if (y > top2 && y < bot2) {
              const x = P[(base + j) * 2];
              if (pen) ctx.lineTo(x, y); else { ctx.moveTo(x, y); pen = true; }
            } else pen = false;
          }
        }
        ctx.globalAlpha = s.alpha;
        ctx.strokeStyle = g;
        ctx.lineWidth = width * 0.9;
        ctx.stroke();
      }

      // the piece's construction: weft track, clips, ponytail wrap
      ctx.globalAlpha = s.alpha;
      if (s.weft > 0.02 && s.layout > 0.5) {
        const h = Math.max(6, lw * 0.035), w = lw * 1.02;
        ctx.globalAlpha = s.alpha * s.weft * s.layout;
        ctx.fillStyle = css(tint(root, -0.35));
        this.round(cx - w / 2, y0 - h * 0.8, w, h * 1.6, h * 0.8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,240,220,.28)';
        ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - w / 2 + h, y0); ctx.lineTo(cx + w / 2 - h, y0); ctx.stroke();
        ctx.setLineDash([]);
        if (s.clip > 0.02) {
          ctx.globalAlpha = s.alpha * s.clip * s.layout;
          ctx.fillStyle = '#d9d4cc';
          [-0.32, 0, 0.32].forEach((f) => { this.round(cx + f * w - h * 1.6, y0 - h * 1.5, h * 3.2, h * 2.2, h * 0.6); ctx.fill(); });
        }
      }
      if (s.pony > 0.02 && s.layout > 0.5) {
        ctx.globalAlpha = s.alpha * s.pony * s.layout;
        const r = Math.max(7, lw * 0.07);
        ctx.fillStyle = css(tint(root, -0.4));
        this.round(cx - r * 1.1, y0 - r * 1.2, r * 2.2, r * 2.4, r);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,240,220,.35)'; ctx.lineWidth = 1.2;
        for (let q = -1; q <= 1; q++) { ctx.beginPath(); ctx.moveTo(cx - r, y0 + q * r * 0.6); ctx.lineTo(cx + r, y0 + q * r * 0.6); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
    }

    round(x, y, w, h, r) {
      const c = this.ctx;
      c.beginPath();
      c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }

    paintBg() {
      const ctx = this.ctx, c = rgb(this.o.bg), W = this.W, H = this.H;
      const g = ctx.createRadialGradient(W / 2, H * 0.36, 0, W / 2, H * 0.5, Math.max(W, H) * 0.78);
      g.addColorStop(0, css(tint(c, 0.34)));
      g.addColorStop(0.5, css(c));
      g.addColorStop(1, css(tint(c, -0.42)));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    destroy() {
      this.pause();
      if (this.ro) this.ro.disconnect();
      if (this.io) this.io.disconnect();
      if (this._pm) { global.removeEventListener('pointermove', this._pm); global.removeEventListener('pointerdown', this._pm); }
    }
  }

  // ── Products → hair ───────────────────────────────────────
  Strands.TEXTURES = TEXTURES;
  Strands.rgb = rgb;
  Strands.reduced = reduced;
  Strands.KEYS = TEXTURE_KEYS;
  Strands.inches = (s) => parseFloat(String(s).replace(/[^\d.]/g, '')) || 18;
  Strands.lenFor = (inches) => clamp(0.2 + (inches - 8) / 22 * 0.78, 0.18, 1);
  Strands.shapeOf = (p) => {
    if (p.shape) return p.shape;
    if (p.category === 'bundles') return 'weft';
    if (p.category === 'extensions') return /pony/i.test(p.name + ' ' + p.type) ? 'pony' : 'clip';
    return 'dome';
  };
  Strands.lookOf = (p, shadeIndex, inches) => {
    const colors = p.colors && p.colors.length ? p.colors : ['#1a1008'];
    const shade = colors[clamp(shadeIndex || 0, 0, colors.length - 1)];
    const lens = (p.lengths || []).map(Strands.inches);
    const mid = lens.length ? lens[Math.floor(lens.length / 2)] : 18;
    return {
      texture: TEXTURES[p.texture] ? p.texture : 'body',
      shade: p.ombre ? '#2a1a10' : shade,
      tip: p.ombre ? shade : shade,
      shape: Strands.shapeOf(p),
      len: Strands.lenFor(inches || mid)
    };
  };

  // Still image of a product's hair, cached. Used for cards, bag lines, search.
  const cache = new Map();
  Strands.thumb = (p, o) => {
    o = o || {};
    const w = o.w || 480, h = o.h || 600, si = o.shade || 0;
    const key = [p.id, p.texture, p.tone, (p.colors || []).join(), si, o.inches || '', w, h, o.bg || ''].join('|');
    if (cache.has(key)) return cache.get(key);
    const c = document.createElement('canvas');
    const look = Strands.lookOf(p, si, o.inches);
    const s = new Strands(c, Object.assign({ width: w, height: h, dprMax: 1.5, auto: false, fixed: true, bg: o.bg === false ? null : (o.bg || p.tone || '#6F0A3A'), ay: 0.12, lockW: 0.5, layout: 'lock' }, look));
    s.time = 11 + (Number(p.id) || 1) * 1.7;
    s.render();
    let url = '';
    try { url = c.toDataURL('image/webp', 0.9); if (url.indexOf('image/webp') < 0) url = c.toDataURL('image/png'); } catch (e) { url = ''; }
    cache.set(key, url);
    return url;
  };

  global.Strands = Strands;
})(window);
