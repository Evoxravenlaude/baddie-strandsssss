-- ============================================================
-- BADDIE STRANDS — Supabase Database Schema
-- How to use:
--   1. Go to supabase.com → your project → SQL Editor → New Query
--   2. Paste this entire file and click Run
--   3. All 4 tables will be created with security rules applied
-- ============================================================


-- ── PROFILES ─────────────────────────────────────────────────
-- Stores customer name and email, linked to Supabase Auth users.
-- Auto-populated when a customer creates their account.

create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  full_name   text,
  email       text,
  phone       text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- ── ORDERS ───────────────────────────────────────────────────
-- One row per order. delivery_address stores the full address
-- as JSON (name, phone, email, address, city, state, notes).

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users on delete set null,
  status           text not null default 'Pending',
  total_amount     numeric not null,
  payment_method   text,
  payment_ref      text,
  delivery_state   text,
  delivery_address jsonb,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.orders enable row level security;

-- Customers can see only their own orders
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Customers can create orders
create policy "Users can insert orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- Admin (service role) can read and update all orders —
-- the service role bypasses RLS automatically, so no extra
-- policy is needed for the admin dashboard.


-- ── ORDER ITEMS ───────────────────────────────────────────────
-- One row per line item within an order.
-- product_id matches the id field in STORE_DATA.products in index.html.

create table if not exists public.order_items (
  id          bigserial primary key,
  order_id    uuid references public.orders on delete cascade not null,
  product_id  integer not null,
  quantity    integer not null default 1,
  unit_price  numeric not null,
  created_at  timestamptz default now()
);

alter table public.order_items enable row level security;

-- Allow customers to read their own order items (via order ownership)
create policy "Users can view own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

-- Allow customers to insert order items
create policy "Users can insert order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );


-- ── SUBSCRIBERS ───────────────────────────────────────────────
-- Newsletter sign-ups. Anyone can subscribe (no auth required).

create table if not exists public.subscribers (
  id          bigserial primary key,
  email       text unique not null,
  created_at  timestamptz default now()
);

alter table public.subscribers enable row level security;

-- Anyone (even unauthenticated visitors) can subscribe
create policy "Anyone can subscribe"
  on public.subscribers for insert
  with check (true);

-- Only authenticated admin (via service role) can read subscriber list
-- The admin dashboard uses the service role key, so this is handled.


-- ── PERFORMANCE INDEXES ───────────────────────────────────────

create index if not exists orders_user_id_idx   on public.orders(user_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_idx     on public.orders(status);
create index if not exists order_items_order_idx on public.order_items(order_id);


-- ── DONE ─────────────────────────────────────────────────────
-- After running this:
--   1. Fill in supabase-setup.js with your Project URL + anon key
--   2. Deploy the bs-upgrade folder to Vercel
--   3. Add your Paystack live key to BS_CONFIG in index.html
--   4. Add your Access Bank account number to BS_CONFIG in index.html
-- ============================================================
