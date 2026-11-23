# Baddie Strands — shop

Static multi-page site, no build step. On Vercel it's the `baddie-strands` project with **Root Directory** set to `site`.

## Pages

| File | Page |
|---|---|
| `index.html` | Home — hero, the Baddie promise, 4 bestsellers |
| `shop.html` | Shop — swipeable bestsellers slider + all products (8 at a time, filter by type) |
| `care.html` | Hair care — text comes from the admin dashboard (falls back to `js/data.js`) |
| `delivery.html` | Nationwide delivery — fee lookup by state |
| `contact.html` | WhatsApp, email, Instagram, newsletter |

`css/styles.css` is the design, `js/app.js` runs everything, `js/data.js` holds the starter products, starter hair-care text and delivery fees, and `js/config.js` holds the settings.

The admin dashboard lives in `../admin` and deploys as its own Vercel project, so it has its own address.

## Go live

Follow the **Go-live guide** (Supabase, emails, Paystack, Edge Functions, Vercel). In short:

1. Run `supabase/schema.sql` (repo root) in Supabase → SQL Editor.
2. `js/config.js`: Supabase URL + anon key, Paystack public key, Access Bank account number.
3. Deploy the Edge Functions in `supabase/functions/` and set their secrets (Paystack secret key, email key).
4. Sign in to the admin, load products, save the hair-care text.

Until step 2 is done the shop runs in **demo mode**: it uses `js/data.js` products, skips sign-in, and keeps orders in the shopper's browser. A small pink notice shows bottom-left.

## Delivery

Nigeria only. Fees per state are in `DELIVERY_FEES` in `js/data.js`, delivery times by fee in `DELIVERY_TIMES`, and the regional summary on the Delivery page in `DELIVERY`.

## Speed notes

- No loading screen and no scripts blocking the first paint (all scripts are `defer`).
- The Supabase library only loads when someone signs in or checks out. Products load from a single lightweight request and are cached for 5 minutes.
- Photos load lazily.
- Product photos uploaded in the admin are shrunk to 1200 px automatically.
