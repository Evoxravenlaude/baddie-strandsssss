// ============================================================
// BADDIE STRANDS — drawn placeholder for products without photos:
// strands in the product's first shade, waved by its texture,
// falling from a crown (wigs) or a weft (bundles, extensions).
// Shared by the shop and the admin.
// ============================================================
'use strict';
(function () {
  const WAVE = { bone: [0.6, 999], straight: [1.2, 420], body: [9, 150], loose: [8, 105], water: [6.5, 64], deep: [7, 42], curly: [7, 26], coily: [5.5, 13] };
  const artCache = new Map();
  function art(p, shadeIndex) {
    const shades = (p && p.shades) || [];
    const hex = (shades[shadeIndex || 0] || shades[0] || {}).hex || '#1a1008';
    const tex = WAVE[p && p.texture] ? p.texture : 'straight';
    const key = tex + hex + (p && p.category);
    if (artCache.has(key)) return artCache.get(key);
    let seed = 0;
    for (const c of key) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const [amp, per] = WAVE[tex];
    const W = 400, H = 500, N = 78, cat = p && p.category;
    const wig = cat === 'wigs' || cat === 'closures';
    const top = cat === 'bundles' ? 70 : cat === 'extensions' ? 92 : 64;
    let paths = '';
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const x0 = 34 + (W - 68) * u + (rnd() - 0.5) * 5;
      // wigs fall from a crown: strands start near a centre parting and spread out
      const cx = W / 2, xs = wig ? cx + (x0 - cx) * 0.42 : x0;
      const ys = wig ? top + Math.pow(Math.abs(u * 2 - 1), 1.6) * 34 + rnd() * 4 : top + rnd() * 4;
      const end = H - 34 - rnd() * 64 - (wig ? Math.pow(Math.abs(u * 2 - 1), 3) * 30 : 0);
      const ph = rnd() * Math.PI * 2, a = amp * (0.75 + rnd() * 0.5), pp = per * (0.9 + rnd() * 0.2);
      let d = `M${xs.toFixed(1)} ${ys.toFixed(1)}`;
      const steps = Math.max(10, Math.ceil((end - ys) / Math.min(12, pp / 4)));
      for (let k = 1; k <= steps; k++) {
        const t = k / steps, y = ys + (end - ys) * t;
        const spread = wig ? Math.min(1, t / 0.32) : 1;
        const ease = 1 - Math.pow(1 - spread, 2);
        const grow = Math.min(1, (y - ys) / 70);
        const x = xs + (x0 - xs) * ease + Math.sin(ph + (y / pp) * Math.PI * 2) * a * grow + (tex === 'coily' ? Math.cos(ph * 2 + y / 5) * 2.2 * grow : 0);
        d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      const w = (0.9 + rnd() * 1.5).toFixed(2), o = (0.45 + rnd() * 0.55).toFixed(2);
      paths += `<path d="${d}" stroke-width="${w}" stroke-opacity="${o}"/>`;
    }
    const band = p && (p.category === 'bundles' || p.category === 'extensions')
      ? `<rect x="22" y="${top - 16}" width="356" height="18" rx="3" fill="#000"/>` : p && p.category === 'closures'
      ? `<rect x="80" y="${top - 22}" width="240" height="26" rx="4" fill="#F4C9B4"/>` : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><rect width="${W}" height="${H}" fill="#FFE3EF"/><g fill="none" stroke="${hex}" stroke-linecap="round" stroke-linejoin="round">${paths}</g>${band}</svg>`;
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    artCache.set(key, url);
    return url;
  }
  window.BSArt = art;
})();
