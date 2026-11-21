# Baddie Strands: shop and admin

Two websites that share one database:

| Folder | What it is | Who uses it |
|---|---|---|
| `shop/` | The online shop: home, shop, product pages, checkout, order tracking, about, help, contact | Customers |
| `admin/` | The dashboard: orders, products, customers, messages, discount codes, delivery fees, website text, settings | You and your team |
| `supabase/` | Two files that set up the database | Run once |

The admin dashboard is a separate website with its own address. The shop doesn't link to it, and search engines are told not to list it.

Both are plain HTML, CSS and JavaScript with no build step.

## Try it straight away (demo mode)

Until the database is connected, both sites run in **demo mode**:

- The shop works fully, with sample products. Orders, messages and newsletter sign-ups are saved in that visitor's browser only.
- The dashboard opens with any email and password and shows a month of sample orders, so you can try every button. Changes stay in that browser.

To preview on your computer, run `npx serve shop` and `npx serve admin` from this folder and open the addresses they print.

## Going live

You need a free Supabase account and your Vercel account. Allow about 20 minutes.

### 1. Make the database

1. Go to **supabase.com** and create a project. Choose the region closest to your customers (London or Frankfurt work well for Nigeria). Save the database password somewhere safe.
2. Open **SQL Editor** and press **New query**.
3. Open `supabase/1-setup.sql` in a text editor. Near the bottom, change `baddiestrands@gmail.com` on the line marked **YOUR ADMIN EMAIL** to the email you'll sign in with. Copy the whole file, paste it into Supabase and press **Run**. You should see "Success".
4. Optional: to start with the twelve products from the old site, do the same with `supabase/2-sample-products.sql`. You can edit or delete them in the dashboard afterwards.

### 2. Make your sign-in

1. In Supabase, open **Authentication**, then **Users**, then **Add user**, then **Create new user**. Use the same email as in step 1.3 and choose a password. Tick **Auto confirm user**.
2. Still in **Authentication**, open **Sign In / Providers** and switch off **Allow new users to sign up**. Only people you add can then get in.
3. Open **Authentication**, **URL Configuration**. Set **Site URL** to your dashboard's address (step 4), and add the same address under **Redirect URLs**. This is where "forgot password" emails send people back to.

### 3. Connect both sites

1. In Supabase, open **Project Settings**, then **API** (or **Data API**). Copy the **Project URL** and the **anon public** key.
2. Paste them into `shop/config.js` **and** `admin/config.js`:
   ```js
   supabaseUrl: 'https://abcdefgh.supabase.co',
   supabaseKey: 'eyJhbGciOi...'
   ```
   The anon key is meant to be public. The database's security rules decide what it can do. **Never** paste the `service_role` key anywhere in these files.
3. In `admin/config.js`, set `shopUrl` to your shop's address.

### 4. Publish on Vercel

Publish each folder as its own Vercel project.

- **Shop:** in your existing `baddie-strands` project, replace the files with the contents of `shop/` (or set the project's **Root Directory** to `shop` if this whole folder is in your GitHub repo). It stays at `baddie-strands.vercel.app`.
- **Dashboard:** create a new Vercel project from the same repo with **Root Directory** set to `admin`, and name it something like `baddie-strands-admin`. Its address becomes `baddie-strands-admin.vercel.app`. You can give it a private name if you'd rather not have it guessed; sign-in protects it either way.

### 5. Switch on payments

Sign in to the dashboard and open **Settings**:

- **Card payments:** paste your Paystack **public** key (`pk_live_...`). Card payments then appear at checkout.
- **Bank transfer:** enter the bank, account name and 10-digit account number. Transfer then appears at checkout, with the details shown after the order.
- **WhatsApp:** leave "Let customers finish on WhatsApp" on if you want that option too.

Then check your phone number, email, Instagram and opening hours on the same page. **Delivery fees** and **Website text** have their own pages.

## Running the shop day to day

Everything is in the dashboard. The **How to** page inside it covers the common jobs in plain words. In short:

- **Today** lists what needs you (orders to confirm, payments to check, low stock, unread messages), your sales, and your best sellers.
- **Orders**: open an order and the box at the top tells you the next step, with one button for it: mark as paid, confirm, start packing, mark as sent, mark as delivered. Each step is recorded and shown to the customer on her tracking page. There are buttons to WhatsApp her a ready-written update, copy the address for your rider, and print a packing slip. **Record a sale** adds orders from Instagram, WhatsApp or in person so your figures and stock stay right.
- **Products**: add and edit pieces, upload photos (they're resized for you), set a different price per length, add shades, count stock, and hide or show pieces. Stock can be changed straight from the list with − and +.
- **Customers**: everyone who has ordered, what they've spent, and your newsletter list. Both can be downloaded as spreadsheets.
- **Messages** from the contact page, with reply buttons.
- **Discount codes**: percent or naira off, with optional minimum spend, use limit and end date. The form says in a sentence what the code will do.
- Press **Ctrl K** (or tap the search bar) to jump to any order, product or page.
- In **Settings**, **Turn on alerts** gives you a pop-up on your computer when an order comes in while the dashboard is open.

### Card payments are confirmed by you

When a customer pays by card, the order shows **Check payment**. Open it, press **Open Paystack**, find the reference, and press **It's there: mark as paid**. The website can't see inside your Paystack account, so this short check is what stops a fake "I paid" from getting through. Automatic confirmation needs a small server function on Supabase; it's a good next step once the shop is busy.

### Photos

Until a product has a photo, the shop shows a clean drawing of its texture in its first shade. Add real photos in **Products**. Portrait or square photos on a plain background look best. Use photos of your own units: the drawings are better than a stock photo of someone else's hair.

## Good to know

- **Prices can't be tampered with.** The database works out every order's prices, discounts, delivery fee and stock itself. What the browser sends is only which pieces, lengths and shades.
- **Who can see what.** Shoppers can read products and settings, place orders, look up their own order with its number and email, send messages and join the newsletter. Only emails on your admin list can see orders, customers, messages and codes. Add or remove team members in **Settings**, **Team**, and create their sign-in in Supabase.
- **Order emails aren't sent yet.** Customers see their order number and a tracking link on screen, and WhatsApp orders open a chat with you. New orders appear on the dashboard (with alerts if you turn them on). Sending emails automatically needs an email service connected to Supabase.
- **Sample content.** The reviews on the home page came from the old template. Replace them with real ones in **Website text**.
- **Demo data never mixes with real data.** Once the keys are in `config.js`, the sites use only the database.

## What's in each folder

```
shop/
  index.html        Home
  shop.html         All products, with filters and sorting
  product.html      One product (product.html?p=its-web-address)
  checkout.html     Three-step checkout and the thank-you screen
  track.html        Order tracking
  about.html, help.html, contact.html, 404.html
  config.js         Your two Supabase values
  assets/css/site.css
  assets/js/site.js     Header, bag, search, footer, product cards
  assets/js/pages.js    What each page does
  assets/js/db.js       Reading and saving (shared with the admin)
  assets/js/art.js      The texture drawings (shared with the admin)
  assets/js/seed.js     Demo-mode sample data
  assets/fonts/         Archivo, hosted with the site
  assets/vendor/supabase.js
admin/
  index.html, config.js
  assets/css/admin.css
  assets/js/admin.js    The whole dashboard
  (plus copies of db.js, art.js, seed.js, fonts and supabase.js)
supabase/
  1-setup.sql            Tables, security rules and order functions
  2-sample-products.sql  Optional starting products and reviews
```

`db.js`, `art.js` and `seed.js` are identical in both sites. If you change one, copy it to the other.

## Design notes

Pink (#FF1F8E) and black on white, with one typeface, Archivo, whose letters can stretch wider and narrower. That stretch is the shop's one signature: the headline widens near the cursor, product names stretch on hover, and the footer wordmark stretches as it scrolls in, the way extensions add length. Everything else is kept quiet so the hair leads. Pages fade into each other in browsers that support it, and a product's picture glides from the grid into its page. With "reduce motion" switched on, all of that is turned off.

The dashboard uses the same typeface and colours more calmly, and always pairs a status colour with a word so nothing depends on colour alone.

Fonts: Archivo by Omnibus-Type, SIL Open Font License. Supabase JS library: MIT License.
