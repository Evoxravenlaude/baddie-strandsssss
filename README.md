# Baddie Strands — minimal pink & black rebuild

Static site (no build step). Upload this whole folder to Vercel, or open `index.html` locally.

## Files

```
index.html          ← the shop (one page, all sections)
styles.css          ← design: colours, type, layout (pink + black only)
app.js              ← cart, quiz, search, checkout, sign-in, Paystack
data.js             ← products, prices, care guide, reviews, quiz, delivery fees
supabase-setup.js   ← paste your Supabase URL + anon key here
supabase-schema.sql ← run once in Supabase → SQL Editor
admin.html/.css     ← order dashboard (unchanged)
assets/             ← logo, banner, packaging photos + video
```

## Brand assets (assets/)

| File | Used for |
|---|---|
| `logo-pink.png` / `logo.png` | Nav, loader, footer wordmark (traced from the box lettering) |
| `logo-black.png` | Footer wordmark in Pink mode |
| `banner.jpg` | Hero banner (body-wave unit on pink) |
| `packaging.mp4` + `packaging-poster.jpg` | "The Baddie experience" section (silent loop) |
| `packaging-1/2/3.jpg` | Footer tiles |

To swap the banner or logo, replace the file with the same name. A missing logo falls back to a script wordmark; a missing banner falls back to a pink typographic panel.

## Product photos

Each product's `image` in `data.js` can be a filename (e.g. `"assets/products/bone-straight.jpg"`) or a full URL. Until a photo exists the card shows a branded logo tile. Several products still point at Unsplash stock photos from the original build — replace them with real product shots before launch.

## Go-live checklist

1. `supabase-setup.js` — add Project URL + anon key (until then the site runs in **demo mode**: no sign-in, orders saved only in the visitor's browser, a small pink notice bottom-left).
2. `app.js` → `BS_CONFIG` — Paystack live public key and the real Access Bank account number.
3. Replace stock product photos in `data.js`.

## Design references used

- Patike — floating pill nav with grid menu tiles; product stage with ghost type, category chips with counts, `01 / 12` counter
- Concreta Ceramiche — giant full-width wordmark, split labels, thin centre rule, large rounded image
- Dialed — percentage loader with huge grotesk type; flush product grid with name + size + price
- Brocksbushes — scroll-lit statement text; giant ghost word behind the product
- Nettie's Bees — overline rules, italic serif marquee, sticky numbered steps with progress bars, mode toggle (Pink mode)
- Arc'teryx System Ø — black cinematic quiz with chapter index and top progress line
- Enigma — wide italic display caps, oval outline buttons sitting on a full-width rule, circle arcs
- Carnilove — huge condensed caps, boxed tag, flag-shaped labels
- Ruth Griffioen — footer with corner image tiles, centred wordmark, diamond bullet, round social buttons
- LoFli — single accent on dark, rounded image frames
- Pistacchio e Caffè — pill category filters
