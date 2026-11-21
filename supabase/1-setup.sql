-- ============================================================
-- BADDIE STRANDS: database setup
--
-- Run this once in Supabase: your project, SQL Editor, New query,
-- paste this whole file, then Run.
--
-- BEFORE YOU RUN IT: change the email on the line marked
-- "YOUR ADMIN EMAIL" (near the bottom) to the email you will
-- use to sign in to the admin dashboard.
--
-- It is safe to run again later: it keeps your data.
-- ============================================================


-- ── Who can use the admin dashboard ─────────────────────────
create table if not exists public.admins (
  email      text primary key,
  added_at   timestamptz not null default now()
);

-- true when the signed-in person's email is on the admins list
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- keeps updated_at current on every edit
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ── Products ────────────────────────────────────────────────
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null check (length(name) between 1 and 120),
  category    text not null default 'wigs' check (category in ('wigs', 'bundles', 'closures', 'extensions')),
  texture     text not null default 'straight',
  description text not null default '',
  details     text[] not null default '{}',
  price       integer not null check (price >= 0),
  compare_at  integer check (compare_at is null or compare_at >= 0),
  -- [{"length": "16\"", "price": null}]  a price here overrides the main price for that length
  lengths     jsonb not null default '[]'::jsonb,
  -- [{"name": "Jet black", "hex": "#1a1008"}]
  shades      jsonb not null default '[]'::jsonb,
  images      text[] not null default '{}',
  stock       integer check (stock is null or stock >= 0),
  featured    boolean not null default false,
  is_new      boolean not null default false,
  active      boolean not null default true,
  sort        integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ── Orders ──────────────────────────────────────────────────
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  number         text not null unique default ('BS-' || nextval('public.order_number_seq')),
  status         text not null default 'new'
                 check (status in ('new', 'confirmed', 'packing', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null default 'transfer'
                 check (payment_method in ('card', 'transfer', 'whatsapp', 'cash', 'other')),
  payment_status text not null default 'unpaid'
                 check (payment_status in ('unpaid', 'to_check', 'paid', 'refunded')),
  payment_ref    text,
  customer_name  text not null,
  email          text not null,
  phone          text not null default '',
  address        text not null default '',
  city           text not null default '',
  state          text not null default '',
  country        text not null default 'Nigeria',
  note           text not null default '',
  -- [{"product_id", "name", "length", "shade", "price", "qty", "image"}]
  items          jsonb not null default '[]'::jsonb,
  subtotal       integer not null default 0,
  discount_code  text,
  discount       integer not null default 0,
  delivery_fee   integer not null default 0,
  total          integer not null default 0,
  source         text not null default 'website',
  tracking       text not null default '',
  admin_note     text not null default '',
  -- [{"at": "...", "text": "..."}]  what happened to the order, shown on the tracking page
  history        jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_email_idx on public.orders (lower(email));
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- Cancelling an order puts its pieces back in stock; un-cancelling takes them out again.
create or replace function public.orders_restock() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  it jsonb;
  dir integer := 0;
begin
  if old.status <> 'cancelled' and new.status = 'cancelled' then dir := 1; end if;
  if old.status = 'cancelled' and new.status <> 'cancelled' then dir := -1; end if;
  if dir = 0 then return new; end if;
  for it in select * from jsonb_array_elements(new.items) loop
    if (it ->> 'product_id') is not null then
      update public.products
        set stock = greatest(0, stock + dir * coalesce((it ->> 'qty')::int, 0))
        where id = (it ->> 'product_id')::uuid and stock is not null;
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists orders_restock on public.orders;
create trigger orders_restock after update of status on public.orders
  for each row execute function public.orders_restock();

-- ── Discount codes ──────────────────────────────────────────
create table if not exists public.discounts (
  code        text primary key check (code = upper(code) and length(code) between 3 and 30),
  kind        text not null default 'percent' check (kind in ('percent', 'amount')),
  value       integer not null check (value > 0),
  min_spend   integer not null default 0,
  max_uses    integer check (max_uses is null or max_uses > 0),
  uses        integer not null default 0,
  expires_on  date,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── Messages from the contact form ──────────────────────────
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null default '',
  phone       text not null default '',
  body        text not null,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ── Newsletter ──────────────────────────────────────────────
create table if not exists public.subscribers (
  email       text primary key,
  created_at  timestamptz not null default now()
);

-- ── Shop settings (one row) ─────────────────────────────────
-- store.hours: opening and closing hour for each day, Sunday first; null = closed.
create table if not exists public.settings (
  id          integer primary key default 1 check (id = 1),
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Security rules
-- Shoppers can read products and settings, and nothing else.
-- Everything they send (orders, messages, sign-ups) goes through
-- the functions further down, which check it first.
-- Admins can read and change everything.
-- ============================================================
alter table public.admins      enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.discounts   enable row level security;
alter table public.messages    enable row level security;
alter table public.subscribers enable row level security;
alter table public.settings    enable row level security;

drop policy if exists "admins: admins read"     on public.admins;
drop policy if exists "admins: admins manage"   on public.admins;
create policy "admins: admins read"   on public.admins for select using (public.is_admin());
create policy "admins: admins manage" on public.admins for all    using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products: everyone reads live" on public.products;
drop policy if exists "products: admins manage"       on public.products;
create policy "products: everyone reads live" on public.products for select using (active or public.is_admin());
create policy "products: admins manage"       on public.products for all    using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings: everyone reads"   on public.settings;
drop policy if exists "settings: admins manage"    on public.settings;
create policy "settings: everyone reads" on public.settings for select using (true);
create policy "settings: admins manage"  on public.settings for all    using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders: admins manage"      on public.orders;
drop policy if exists "discounts: admins manage"   on public.discounts;
drop policy if exists "messages: admins manage"    on public.messages;
drop policy if exists "subscribers: admins manage" on public.subscribers;
create policy "orders: admins manage"      on public.orders      for all using (public.is_admin()) with check (public.is_admin());
create policy "discounts: admins manage"   on public.discounts   for all using (public.is_admin()) with check (public.is_admin());
create policy "messages: admins manage"    on public.messages    for all using (public.is_admin()) with check (public.is_admin());
create policy "subscribers: admins manage" on public.subscribers for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- What the shop can ask the database to do
-- ============================================================

-- Works out a discount without revealing the list of codes.
create or replace function public.discount_for(p_code text, p_subtotal integer)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  d public.discounts%rowtype;
  amount integer;
begin
  select * into d from public.discounts where code = upper(trim(coalesce(p_code, '')));
  if not found or not d.active then
    return jsonb_build_object('ok', false, 'message', 'That code isn''t valid.');
  end if;
  if d.expires_on is not null and d.expires_on < (now() at time zone 'Africa/Lagos')::date then
    return jsonb_build_object('ok', false, 'message', 'That code has expired.');
  end if;
  if d.max_uses is not null and d.uses >= d.max_uses then
    return jsonb_build_object('ok', false, 'message', 'That code has been fully used.');
  end if;
  if p_subtotal < d.min_spend then
    return jsonb_build_object('ok', false, 'message', 'Spend ₦' || to_char(d.min_spend, 'FM999,999,999') || ' or more to use this code.');
  end if;
  amount := case when d.kind = 'percent' then round(p_subtotal * least(d.value, 100) / 100.0)::int else d.value end;
  amount := least(amount, p_subtotal);
  return jsonb_build_object('ok', true, 'code', d.code, 'amount', amount,
    'message', case when d.kind = 'percent' then d.value || '% off' else '₦' || to_char(d.value, 'FM999,999,999') || ' off' end);
end $$;

create or replace function public.check_discount(p_code text, p_subtotal integer)
returns jsonb language sql stable security definer set search_path = public as $$
  select public.discount_for(p_code, p_subtotal);
$$;

-- Delivery fee for a state, from the settings the admin keeps.
create or replace function public.delivery_fee_for(p_state text, p_after_discount integer)
returns integer language plpgsql stable security definer set search_path = public as $$
declare
  s jsonb;
  fee integer;
  free_over integer;
begin
  select coalesce(data -> 'delivery', '{}'::jsonb) into s from public.settings where id = 1;
  s := coalesce(s, '{}'::jsonb);
  free_over := nullif(s ->> 'free_over', '')::int;
  if free_over is not null and free_over > 0 and p_after_discount >= free_over then
    return 0;
  end if;
  fee := nullif(s -> 'fees' ->> p_state, '')::int;
  if fee is null then fee := coalesce(nullif(s ->> 'default_fee', '')::int, 3500); end if;
  return fee;
end $$;

-- Places an order. Prices, stock, discount and delivery are all
-- worked out here from the database, never trusted from the browser.
create or replace function public.place_order(payload jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  it jsonb;
  p public.products%rowtype;
  qty integer;
  len text;
  shade text;
  unit integer;
  lines jsonb := '[]'::jsonb;
  subtotal integer := 0;
  disc jsonb;
  disc_amount integer := 0;
  disc_code text := null;
  fee integer;
  method text := coalesce(payload ->> 'payment_method', 'transfer');
  st text := trim(coalesce(payload ->> 'state', ''));
  o public.orders%rowtype;
begin
  if length(trim(coalesce(payload ->> 'name', ''))) < 2 then raise exception 'Please add your name.'; end if;
  if coalesce(payload ->> 'email', '') !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Please check your email address.'; end if;
  if length(regexp_replace(coalesce(payload ->> 'phone', ''), '\D', '', 'g')) < 7 then raise exception 'Please add a phone number we can reach you on.'; end if;
  if length(trim(coalesce(payload ->> 'address', ''))) < 4 then raise exception 'Please add your delivery address.'; end if;
  if st = '' then raise exception 'Please choose your state.'; end if;
  if method not in ('card', 'transfer', 'whatsapp') then raise exception 'Please choose how you''ll pay.'; end if;
  if coalesce(jsonb_typeof(payload -> 'items'), '') <> 'array' or jsonb_array_length(payload -> 'items') = 0 then
    raise exception 'Your bag is empty.';
  end if;
  if jsonb_array_length(payload -> 'items') > 30 then raise exception 'That''s a lot of pieces. Please message us to order in bulk.'; end if;

  for it in select * from jsonb_array_elements(payload -> 'items') loop
    if coalesce(it ->> 'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'One of the pieces in your bag is no longer available.';
    end if;
    select * into p from public.products where id = (it ->> 'product_id')::uuid and active for update;
    if not found then raise exception 'One of the pieces in your bag is no longer available.'; end if;
    qty := coalesce((it ->> 'qty')::int, 1);
    if qty < 1 or qty > 20 then raise exception 'Please choose between 1 and 20 of each piece.'; end if;
    len := nullif(it ->> 'length', '');
    shade := nullif(it ->> 'shade', '');
    unit := p.price;
    if jsonb_array_length(p.lengths) > 0 then
      if len is null or not exists (select 1 from jsonb_array_elements(p.lengths) l where l ->> 'length' = len) then
        raise exception 'Please choose a length for %.', p.name;
      end if;
      select coalesce(nullif(l ->> 'price', '')::int, p.price) into unit
        from jsonb_array_elements(p.lengths) l where l ->> 'length' = len limit 1;
    end if;
    if jsonb_array_length(p.shades) > 0 and (shade is null or not exists (select 1 from jsonb_array_elements(p.shades) s where s ->> 'name' = shade)) then
      raise exception 'Please choose a shade for %.', p.name;
    end if;
    if p.stock is not null then
      if p.stock < qty then
        raise exception 'Only % of % left. Please lower the quantity.', p.stock, p.name;
      end if;
      update public.products set stock = stock - qty where id = p.id;
    end if;
    subtotal := subtotal + unit * qty;
    lines := lines || jsonb_build_array(jsonb_build_object(
      'product_id', p.id, 'name', p.name, 'length', len, 'shade', shade,
      'price', unit, 'qty', qty, 'image', coalesce(p.images[1], '')));
  end loop;

  if coalesce(trim(payload ->> 'discount_code'), '') <> '' then
    disc := public.discount_for(payload ->> 'discount_code', subtotal);
    if not (disc ->> 'ok')::boolean then raise exception '%', disc ->> 'message'; end if;
    disc_amount := (disc ->> 'amount')::int;
    disc_code := disc ->> 'code';
    update public.discounts set uses = uses + 1 where code = disc_code;
  end if;

  fee := public.delivery_fee_for(st, subtotal - disc_amount);

  insert into public.orders (customer_name, email, phone, address, city, state, note,
      items, subtotal, discount_code, discount, delivery_fee, total, payment_method, history)
    values (trim(payload ->> 'name'), lower(trim(payload ->> 'email')), trim(payload ->> 'phone'),
      trim(payload ->> 'address'), trim(coalesce(payload ->> 'city', '')), st,
      left(trim(coalesce(payload ->> 'note', '')), 1000),
      lines, subtotal, disc_code, disc_amount, fee, subtotal - disc_amount + fee, method,
      jsonb_build_array(jsonb_build_object('at', now(), 'text', 'Order placed')))
    returning * into o;

  return jsonb_build_object('id', o.id, 'number', o.number, 'subtotal', o.subtotal,
    'discount', o.discount, 'delivery_fee', o.delivery_fee, 'total', o.total, 'email', o.email);
end $$;

-- After a card payment, the shop says so. An admin still confirms
-- it against Paystack before it counts as paid.
create or replace function public.report_payment(p_number text, p_email text, p_ref text)
returns boolean language plpgsql volatile security definer set search_path = public as $$
begin
  update public.orders
    set payment_status = 'to_check', payment_ref = left(p_ref, 120),
        history = history || jsonb_build_array(jsonb_build_object('at', now(), 'text', 'Card payment sent'))
    where number = upper(trim(p_number)) and email = lower(trim(p_email)) and payment_status = 'unpaid';
  return found;
end $$;

-- Order tracking: needs both the order number and the email.
create or replace function public.track_order(p_number text, p_email text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('number', number, 'status', status, 'payment_status', payment_status,
      'payment_method', payment_method, 'items', items, 'subtotal', subtotal, 'discount', discount,
      'delivery_fee', delivery_fee, 'total', total, 'state', state, 'tracking', tracking,
      'history', history, 'created_at', created_at)
    from public.orders
    where number = upper(trim(p_number)) and email = lower(trim(p_email));
$$;

create or replace function public.subscribe(p_email text)
returns text language plpgsql volatile security definer set search_path = public as $$
begin
  if coalesce(p_email, '') !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return 'bad'; end if;
  insert into public.subscribers (email) values (lower(trim(p_email))) on conflict do nothing;
  if found then return 'ok'; end if;
  return 'dup';
end $$;

create or replace function public.send_message(p_name text, p_email text, p_phone text, p_body text)
returns boolean language plpgsql volatile security definer set search_path = public as $$
begin
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Please add your name.'; end if;
  if length(trim(coalesce(p_body, ''))) < 2 then raise exception 'Please write your message.'; end if;
  if coalesce(trim(p_email), '') = '' and coalesce(trim(p_phone), '') = '' then
    raise exception 'Please add an email or phone number so we can reply.';
  end if;
  insert into public.messages (name, email, phone, body)
    values (left(trim(p_name), 120), left(lower(trim(coalesce(p_email, ''))), 200),
            left(trim(coalesce(p_phone, '')), 40), left(trim(p_body), 4000));
  return true;
end $$;

-- Only these functions are open to shoppers.
revoke all on function public.discount_for(text, integer) from public, anon, authenticated;
revoke all on function public.delivery_fee_for(text, integer) from public, anon, authenticated;
revoke all on function public.orders_restock() from public, anon, authenticated;
grant execute on function public.check_discount(text, integer) to anon, authenticated;
grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.report_payment(text, text, text) to anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;
grant execute on function public.subscribe(text) to anon, authenticated;
grant execute on function public.send_message(text, text, text, text) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ============================================================
-- Product photos
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('product-photos', 'product-photos', true)
  on conflict (id) do nothing;

drop policy if exists "product photos: everyone sees" on storage.objects;
drop policy if exists "product photos: admins upload" on storage.objects;
drop policy if exists "product photos: admins change" on storage.objects;
drop policy if exists "product photos: admins delete" on storage.objects;
create policy "product photos: everyone sees" on storage.objects for select
  using (bucket_id = 'product-photos');
create policy "product photos: admins upload" on storage.objects for insert
  with check (bucket_id = 'product-photos' and public.is_admin());
create policy "product photos: admins change" on storage.objects for update
  using (bucket_id = 'product-photos' and public.is_admin());
create policy "product photos: admins delete" on storage.objects for delete
  using (bucket_id = 'product-photos' and public.is_admin());

-- ============================================================
-- First settings and your admin email
-- ============================================================
insert into public.settings (id, data) values (1, '{
  "store": {
    "name": "Baddie Strands",
    "whatsapp": "2347033247980",
    "phone_display": "+234 703 324 7980",
    "email": "baddiestrands@gmail.com",
    "instagram": "the_baddie_strands",
    "city": "Abuja",
    "hours": [[12, 18], [9, 21], [9, 21], [9, 21], [9, 21], [9, 21], [9, 21]]
  },
  "announcement": "Same-day delivery in Abuja. Nationwide in 1 to 4 days.",
  "faq": [{"group": "Delivery", "q": "How fast can I get it?", "a": "Abuja: same day, usually within 3 to 6 hours, for ₦1,500. Nasarawa: same day. Lagos and Port Harcourt: 1 to 2 days. Every other state: 2 to 4 days. You''ll see your exact fee at checkout when you pick your state."}, {"group": "Delivery", "q": "Do you ship outside Nigeria?", "a": "Yes. UK and Europe from $35 (5 to 10 business days), USA and Canada from $40 (7 to 14 business days), West Africa from ₦15,000 (5 to 10 business days), rest of Africa from $30 (7 to 14 business days). It''s tracked, packed discreetly, and we handle the customs paperwork. Message us on WhatsApp to order."}, {"group": "The hair", "q": "Virgin or Remy, what''s the difference?", "a": "Virgin hair has never been chemically processed. Remy means the cuticles all run the same way, so it doesn''t tangle. Everything we sell is both."}, {"group": "The hair", "q": "Which lace should I go for?", "a": "HD lace is the thinnest and disappears on every skin tone. Regular lace is a little thicker and lasts longer. A 13×4 frontal covers ear to ear, 13×6 gives you more room to part, and 360 lace goes all the way round."}, {"group": "The hair", "q": "How full should it be?", "a": "That''s density. 150% looks natural and light, 180% is full and glamorous, and 200% is maximum volume. Pick for the look you want and how much weight you''re happy to carry."}, {"group": "The hair", "q": "Why does my curly unit look shorter?", "a": "Length is measured with the hair pulled straight. A 20″ straight unit reaches mid-back; a 20″ curly one sits higher because of shrinkage. The length guide on each product shows where it lands."}, {"group": "The hair", "q": "Which cap is right for me?", "a": "Machine-made caps cost less but breathe less. Hand-tied caps move more naturally. Glueless caps have an adjustable band and combs, so you can put them on in about a minute."}, {"group": "Care", "q": "How do I wash it?", "a": "Detangle from the ends up first. Use a sulphate-free shampoo in downward strokes, never circles. Deep condition for 15 to 30 minutes, rinse with cool water to seal the cuticle, then pat dry and let it air-dry on a stand."}, {"group": "Care", "q": "Can I use heat on it?", "a": "Yes. Always use a heat protectant. Keep fine or coloured hair at 150–180°C and never go above 230°C. Let curls cool in your hand before you let go, then set them with cool air."}, {"group": "Care", "q": "How do I keep it soft between washes?", "a": "Spritz with water and a little leave-in. Once a week, layer water, then oil, then cream. Trim the ends every three months, and sleep on silk or satin."}, {"group": "Care", "q": "How should I store it?", "a": "On a wig stand, detangled, out of direct sun. When you travel, use a silk or satin bag. Cotton pulls moisture out."}, {"group": "Ordering", "q": "How do I pay?", "a": "By card through Paystack, or by bank transfer. If neither suits you, place the order and finish it with us on WhatsApp."}, {"group": "Ordering", "q": "Can you get something you don''t list?", "a": "Often, yes. Tell us the length, texture and shade on the contact page and we''ll reply within two hours."}],
  "payments": {
    "paystack_public_key": "",
    "bank_name": "",
    "bank_account_name": "",
    "bank_account_number": "",
    "whatsapp_orders": true
  },
  "delivery": {
    "default_fee": 3500,
    "default_days": "2 to 4 days",
    "days": {"FCT – Abuja": "Same day", "Nasarawa": "Same day", "Lagos": "1 to 2 days", "Rivers": "1 to 2 days"},
    "free_over": 0,
    "fees": {"FCT – Abuja": 1500, "Nasarawa": 2000, "Niger": 2500, "Lagos": 2500, "Ogun": 2500, "Oyo": 2500, "Osun": 2500, "Ondo": 2500, "Ekiti": 2500, "Kwara": 2500, "Delta": 3000, "Edo": 3000, "Rivers": 3000, "Cross River": 3000, "Akwa Ibom": 3000, "Bayelsa": 3000, "Anambra": 3000, "Imo": 3000, "Abia": 3000, "Enugu": 3000, "Ebonyi": 3000, "Benue": 3000, "Kogi": 3000, "Kaduna": 3500, "Kano": 3500, "Katsina": 3500, "Sokoto": 3500, "Zamfara": 3500, "Kebbi": 3500, "Jigawa": 3500, "Gombe": 3500, "Bauchi": 3500, "Borno": 3500, "Yobe": 3500, "Taraba": 3500, "Adamawa": 3500, "Plateau": 3500}
  }
}'::jsonb) on conflict (id) do nothing;

-- YOUR ADMIN EMAIL: change this before you run the file.
insert into public.admins (email) values ('baddiestrands@gmail.com') on conflict do nothing;
