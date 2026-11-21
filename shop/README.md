# Baddie Strands — shop

Static multi-page site. No build step: upload this folder to Vercel (it replaces the current baddie-strands.vercel.app files).

## Pages

| File | Page |
|---|---|
| `index.html` | Home — hero, the box, 4 bestsellers, 3 reviews |
| `shop.html` | Shop — swipeable bestsellers slider + all products (8 at a time, filter by type) |
| `care.html` | Hair care — six basics + care routine |
| `quiz.html` | Hair quiz |
| `delivery.html` | Nationwide delivery — fee lookup by state |
| `contact.html` | WhatsApp, email, Instagram, newsletter |

`css/styles.css` is the design, `js/app.js` runs everything, `js/data.js` holds the starter products, care guide, reviews, quiz and delivery fees, and `js/config.js` holds the settings.

The admin dashboard is **not** in this folder. It's a separate project (`baddie-strands-admin`) so it can be hosted at its own address.

## Go live

1. In Supabase → SQL Editor, run `supabase-schema.sql` (in the admin project). It's safe to re-run.
2. `js/config.js`: add the Supabase URL + anon key, Paystack live public key and the Access Bank account number.
3. Put the same Supabase values in the admin's `config.js`, sign in there, and tap **Load starter products** (or add your own with photos).

Until step 2 is done the shop runs in **demo mode**: it uses `js/data.js` products, skips sign-in, and keeps orders in the shopper's browser. A small pink notice shows bottom-left.

## Delivery

Nigeria only. Fees per state are in `DELIVERY_FEES` in `js/data.js`, delivery times by fee in `DELIVERY_TIMES`, and the regional summary on the Delivery page in `DELIVERY`.

## Speed notes

- No loading screen and no scripts blocking the first paint (all scripts are `defer`).
- The Supabase library only loads when someone signs in or checks out. Products load from a single lightweight request and are cached for 5 minutes.
- The packaging video (380 KB) only plays while it's on screen. Photos load lazily.
- Product photos uploaded in the admin are shrunk to 1200 px automatically.
