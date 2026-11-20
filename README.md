# Baddie Strands

**Your Hair, Your Crown.** The shop site for Baddie Strands, a Nigerian-owned luxury hair brand born in Abuja.

This is a static site: plain HTML, CSS and JavaScript, no build step. Drop the folder on Netlify or Vercel to publish it.

To preview on your computer, run `npx serve` inside this folder and open the address it prints. Double-clicking `index.html` also works, but Chrome won't load the site's fonts from files on disk, so the headlines fall back to a system font.

## What's in the folder

| File | What it does |
|---|---|
| `index.html` | The shop page |
| `styles.css` | All shop styling |
| `app.js` | Showroom, grid, product detail, bag, search, quiz, guides |
| `checkout.js` | Sign-in, delivery details, payment, order record |
| `config.js` | **Your settings**: contact details, Paystack key, bank account, EmailJS keys, hours |
| `data.js` | **Your content**: products, knowledge hub, reviews, quiz, delivery zones and fees |
| `admin.html`, `admin.css`, `admin.js` | The admin dashboard |
| `assets/fonts/` | The three typefaces, hosted with the site |

## Before you go live

Work through these in `config.js`. The admin dashboard shows the same checklist under **Setup**.

1. **Contact details.** Check the WhatsApp number, email and Instagram handle. The old site used two spellings of the email address (`baddiestrands@` and `baddiestrandss@`); this one uses `baddiestrands@gmail.com` everywhere. Change it in one place if that's wrong.
2. **Card payments.** Paste your Paystack public key into `paystackPublicKey`. Until you do, "Pay by card" is switched off at checkout.
3. **Bank transfer.** Replace `0000000000` with your real account number. Until you do, bank transfer is switched off so nobody can send money to a placeholder.
4. **Email.** Add your EmailJS keys so sign-in codes and new-order emails are sent. Until you do, the sign-in code is shown on screen so you can still test.
5. **Admin sign-in.** Change the username and password at the top of `admin.js`.
6. **Replace the sample content.** The product photos are stock images, and the reviews, ratings, review counts and the "500+ happy queens" figures came with the original template. Swap in your own before launch.

While card and bank transfer are both off, checkout still works: the customer places the order and sends it to you on WhatsApp with one tap.

## How orders reach you

- A customer adds pieces to the bag, signs in with an email code, enters delivery details and pays.
- The delivery fee comes from `DELIVERY_FEES` in `data.js`, by state.
- You are told about the order by **email** (once EmailJS is connected) and by the **WhatsApp** button on the confirmation screen. Card payments also appear in your Paystack dashboard.
- Card payments are confirmed in the customer's browser. Check the payment in Paystack before you ship.

### What the admin dashboard can and can't see

The site has no server or database. Everything it remembers is saved in the browser it is used in. That means:

- The dashboard shows visits, sign-ups and orders **made on that same device**, plus orders you record by hand with **Record an order**.
- An order a customer places on her own phone does **not** appear in your dashboard. It reaches you by email and WhatsApp.
- Product edits made in the dashboard are saved in your browser only. To publish them, press **Copy for data.js**, paste over the `products` list in `data.js`, and redeploy.
- Newsletter sign-ups are stored on the visitor's device. To collect them centrally, connect a mailing-list service or a database.

Sign-in works the same way: it identifies a customer by email for that device. It is not a secure account system.

If you want orders, subscribers and product edits shared across devices, the site needs a backend. Your earlier `bs-upgrade` folder used Supabase for this; that version has not been rebuilt in this design.

## Changing things

**Products** live in `data.js`. Copy a product, give it a new `id`, and edit the fields. `tone` is the backdrop colour that piece gets in the showroom. For `image`, use a file name in this folder or a full `https://` link.

**Delivery** has two lists in `data.js`: `DELIVERY` is what the shop shows, `DELIVERY_FEES` is what checkout charges. Keep them in step.

**Colours and type** are set at the top of `styles.css` under "Tokens".

**Length guide.** The landmarks ("20 inches is mid-back") and how much shorter wavy and curly textures sit are in `lengthGuide` in `data.js`. They are standard approximations. Check them against your own units.

## Where the design comes from

Each part of the site borrows a pattern from one of the reference sites.

| Part | Borrowed from |
|---|---|
| Rounded window frame, floating pill menu that opens into tiles, showroom with one piece at a time | patike.ch |
| Opening counter, giant headline with the photo rising through it, corner card, reviews layout | dialedcoffee.com |
| Product detail: ghost word behind the piece, status line, feature tags, letters that sharpen in | brocksbushes.moonshiners.co.uk |
| Length guide with texture toggle and ruler, pill buttons with a circled arrow | lofliballs.com |
| Shade scale, care steps with outlined numerals, delivery timeline, newsletter panel | nettiesbees.com |
| Drifting photo wall with the motto blended over it | ruthgriffioen.art |
| Grid view: staggered columns, bar-bracketed names, marker under the chosen filter | pistacchioecaffe.it |
| Wine manifesto block, quiz card with big option tiles and a full-width bar, growing footer type | carnilove.ashfall.studio |
| Story section: lowercase wordmark, thread line from the dot, parenthesised labels, live Abuja clock | concretaceramiche.it |
| Hair basics as numbered chapters with a plus to expand, stacked section index | arcteryx.com System 0 |
| Bestsellers ranking with ticked frame and outlined numeral, oval buttons, "ask for it" line, toasts | enigmascult.com |

## Browser support

Current Chrome, Edge, Safari and Firefox. The site respects the "reduce motion" setting and every control can be reached with a keyboard.

## Contact

- WhatsApp: +234 703 324 7980
- Email: baddiestrands@gmail.com
- Instagram: [@the_baddie_strands](https://instagram.com/the_baddie_strands)
