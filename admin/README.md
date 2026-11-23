# Baddie Strands — admin dashboard

A separate site for running the shop: orders, products (with photo upload), newsletter subscribers. Deploy it as its own Vercel project (e.g. `baddie-strands-admin.vercel.app`) from the same repo, with **Root Directory** set to `admin`. It isn't linked from the shop, and search engines are told not to index it.

## Set up (once)

1. Supabase → SQL Editor → New query → paste `supabase/schema.sql` (in the repo root) → **Run**. It creates the products table and photo storage, and lets only the shop email read orders and customers.
2. Supabase → Authentication → Providers → Email: make sure it's on. Add both site addresses (shop and admin) under Authentication → URL Configuration.
3. Fill in `config.js` with the Supabase Project URL + anon key (same as the shop).
4. Open the dashboard, sign in with **baddiestrands@gmail.com** (6-digit email code), go to **Products** and tap **Load starter products**.

If the shop email changes, update it in `config.js` **and** in `is_admin()` at the top of `supabase/schema.sql`, then re-run the SQL.

Without Supabase details the dashboard opens with **sample data** so you can try everything. Nothing is saved.

## What's inside

- **Overview** — today's orders, transfers to check, paid orders to send, sales this month.
- **Orders** — filter by stage, search by name/phone/order number, one-tap stage updates (Waiting for payment → Paid · preparing → Out for delivery → Delivered), WhatsApp/call/email the customer, download as a spreadsheet.
- **Products** — add/edit with photo, price, sale price, lengths, colours, stock, Bestseller/New in label, and an **On shop** switch to hide sold-out items.
- **Hair care** — edit, add, reorder or remove the six basics and the care-routine sections shown on the shop's Hair care page.
- **Subscribers** — copy all emails or download the list.

Changing an order's stage emails the customer automatically once the Edge Functions in `supabase/functions/` are deployed (see the Go-live guide).
- **Help** — plain-language how-tos.
