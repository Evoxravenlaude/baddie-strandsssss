# Baddie Strands — Website Documentation

## 🖤 Overview
A full luxury e-commerce website for Baddie Strands, a Nigerian-owned hair brand. Dark, minimal, and high-end aesthetic with a complete admin dashboard.

---

## 📁 File Structure

```
baddie-strands/
├── index.html       ← Main public website
├── styles.css       ← Complete design system & all styles
├── app.js           ← All site interactivity (cart, quiz, search, etc.)
├── data.js          ← Product catalogue & content data
├── admin.html       ← Admin dashboard (password protected)
├── admin.css        ← Admin dashboard styles
├── admin.js         ← Admin dashboard logic
└── README.md        ← This file
```

---

## 🚀 How to Launch

### Option A — Open Locally
Just open `index.html` in any modern browser. No server needed.

### Option B — Host on Netlify (Recommended, Free)
1. Go to [netlify.com](https://netlify.com) and sign up
2. Click **"Add new site" → "Deploy manually"**
3. Drag and drop the entire `baddie-strands/` folder
4. Your site goes live instantly with a free URL
5. Optionally connect a custom domain (e.g. baddiestrands.com)

### Option C — Host on Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Upload the folder or connect a GitHub repo
3. Deploy

---

## 🛍 Public Website Features

| Feature | Description |
|---|---|
| **Hero Section** | Full-screen split layout with animated title, stats, and rolling ticker |
| **Feature Strip** | Animated marquee of key selling points |
| **About Section** | Brand story with Nigerian roots + worldwide reach |
| **Shop** | 12 products with filter (All / Wigs / Bundles / Extensions) |
| **Product Cards** | Hover to reveal quick-add, wishlist, and view buttons |
| **Product Modal** | Full product detail — length selector, quantity, add to cart |
| **Cart Drawer** | Slide-out cart with quantity controls, totals, WhatsApp checkout |
| **Search Overlay** | Live search with instant results (press `/` key to open) |
| **Knowledge Hub** | Hair basics (6 cards) + interactive care guide (4 tabs: Washing, Styling, Storage, Maintenance) |
| **Hair Quiz** | 5-question personalised recommendation engine |
| **Testimonials** | Auto-advancing carousel with 6 verified reviews |
| **Delivery Section** | Nigeria + International zones with prices and ETAs |
| **Contact** | 3 channels (WhatsApp, Email, Instagram) + message form |
| **Newsletter** | Email capture with localStorage persistence |
| **Custom Cursor** | Gold dot + trailing ring cursor |
| **Scroll Reveal** | Smooth entrance animations on all sections |
| **Noise Texture** | Subtle grain overlay for luxury depth |
| **Ticker Banner** | Gold banner with scrolling announcements |
| **Mobile Menu** | Full-screen overlay nav for mobile |
| **Toast Notifications** | Elegant cart/action feedback popups |

---

## 🔐 Admin Dashboard

### Access
URL: `/admin.html`

**Default Credentials:**
- Username: `baddie_admin`
- Password: `strands2024`

> ⚠️ Change the password in `admin.js` under `const ADMIN` before going live.

### Dashboard Pages

| Page | Features |
|---|---|
| **Dashboard** | Revenue stats, 7-day chart, recent orders, top products, quick actions, store health |
| **Analytics** | Page views, revenue, avg order value, conversion rate, sessions chart, category chart, product performance table |
| **Products** | Full grid of all products, add/edit/delete, search & filter |
| **Orders** | Full order table, status updater (dropdown), filter by status, CSV export |
| **Subscribers** | Newsletter subscriber list, count, CSV export |
| **Settings** | Store info, feature toggles, password change, delivery reference, data exports |

### How Orders Work
Orders are placed via WhatsApp checkout. When a customer clicks "Checkout via WhatsApp," a pre-filled message with all cart items is sent to your number (+234 703 324 7980). Manually add confirmed orders in the admin panel.

---

## 🎨 Customisation Guide

### Change Colours
Edit CSS variables at the top of `styles.css`:
```css
--gold: #c9a96e;      /* Main accent colour */
--cream: #f5efe6;     /* Text colour */
--black: #0a0a0a;     /* Background */
```

### Add Products
1. Go to `admin.html` → Products → **+ Add Product**
2. Fill in name, type, category, price, stock, image URL, description
3. Click Save — product appears live immediately

To add products permanently (survives browser refresh), also add them to the `products` array in `data.js`.

### Change WhatsApp Number
Search for `2347033247980` in `app.js` and `admin.js` and replace with your number (digits only, no spaces or +).

### Update Contact Info
- **index.html**: Update the contact section links
- **admin.js**: Update store info in settings
- **data.js**: No contact info stored here

### Change Admin Password
In `admin.js`, find:
```js
const ADMIN = {
  username: 'baddie_admin',
  password: 'strands2024',
  ...
};
```
Change to your preferred credentials.

---

## 📱 Responsive Breakpoints
- Desktop: Full two-column layouts, sidebar nav
- Tablet (≤1024px): Single-column sections, no admin sidebar
- Mobile (≤768px): Mobile menu, stacked layouts, 2-column product grid

---

## 🌍 Delivery Coverage
**Nigeria:** All 36 states + FCT Abuja
**International:** UK, Europe, USA, Canada, West Africa, Rest of Africa

---

## 📊 Analytics
The site tracks:
- Total page views (stored in localStorage as `bs_analytics`)
- Daily sessions (last 30 days)
- Product views (per product ID)

All analytics are visible in the Admin → Analytics page.

For production analytics, consider connecting **Google Analytics** or **Plausible Analytics** by adding their script tag to `index.html`.

---

## 💡 Next Steps (Recommended)
1. **Connect a domain** — Purchase baddiestrands.com or similar
2. **Add Google Analytics** — For real traffic data
3. **Add Paystack** — For direct card payments (Nigerian payment gateway)
4. **SEO** — Add your actual Instagram images to replace Unsplash photos
5. **WhatsApp Business API** — For automated order confirmations

---

## 🇳🇬 Contact
- WhatsApp: +234 703 324 7980
- Email: baddiestrandss@gmail.com
- Instagram: [@the_baddie_strands](https://instagram.com/the_baddie_strands)
