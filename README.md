# Baddie Strands

**Your Hair, Your Crown.** The shop site for Baddie Strands, a Nigerian-owned luxury hair brand born in Abuja.

This is a static site: plain HTML, CSS and JavaScript, no build step. Drop the folder on Vercel or Netlify to publish it. To replace what's live on `baddie-strands.vercel.app`, push these files to the repo the project deploys from (or drag the folder into a new Vercel deploy).

To preview on your computer, run `npx serve` inside this folder and open the address it prints. Double-clicking `index.html` also works, but Chrome won't load the fonts from files on disk, so headlines fall back to a system font.

## How the page works

The hair is the site. There are no stock photos: every piece of hair you see is drawn live in the browser by `strands.js`, in the texture, shade and length of the product. Visitors can run their cursor (or finger) through it.

1. **Opening.** A curtain of hair grows while the counter runs to 100%, then parts like a stage curtain. It plays once per visit; "Skip" ends it straight away.
2. **Hero.** "Your hair, your crown." with the hair sitting between the two lines. Two ways in: *Find my crown* (the stylist) or *Just let me shop*.
3. **The four textures.** The hero pins in place and scrolling turns the same hair into bone straight, body wave, deep wave and kinky coily. The background, the giant word behind it and the product to wear it as change with each one. Dots on the bottom jump between textures; *Skip to the shop* jumps past.
4. **Showroom.** One piece at a time, with the next two waiting on the right. Drag, swipe, use the arrows or the arrow keys. The centre piece is live and morphs into the next one. *Grid* switches to a staggered grid of every piece. Filters, sort and a *Saved* filter (after you heart something).
5. **Product detail.** Opens from wherever you tapped. Changing the length or shade changes the hair in front of you, and a note tells you where that length falls on the body.
6. **The stylist.** Four questions (how it moves, length, shade, what you're shopping for). The hair beside the questions changes with every answer; you can change any answer. It ends with up to three matching pieces you can add to the bag directly.
7. **Story, reviews, answers.** The wordmark sharpens into focus and a single strand draws down from its dot. Reviews rotate on their own. Answers are grouped in tabs; delivery answers are generated from the delivery table in `data.js`, so they never go out of date.
8. **Ask for it.** Type what you can't find and it opens WhatsApp with the message written.
9. **Footer.** Newsletter, live Abuja clock with open/closed status, and "Wear the crown" growing as you reach the bottom.

Motion uses GSAP, ScrollTrigger and Lenis (smooth scrolling), kept in `assets/vendor/`. With "reduce motion" switched on in the visitor's device settings there is no opening, no pinning and no smooth scrolling: the four textures become four cards and everything still works.

## What's in the folder

| File | What it does |
|---|---|
| `index.html` | The shop page |
| `styles.css` | All shop styling |
| `strands.js` | Draws the hair: textures, shades, length, wig/bundle/clip-in shapes, combing |
| `app.js` | Opening, the texture scene, showroom, product detail, stylist, bag, search, reviews, answers |
| `checkout.js` | Sign-in, delivery details, payment, order record |
| `config.js` | **Your settings**: contact details, Paystack key, bank account, EmailJS keys, hours |
| `data.js` | **Your content**: products, the four textures, stylist questions, reviews, answers, delivery zones and fees |
| `admin.html`, `admin.css`, `admin.js` | The admin dashboard |
| `assets/fonts/` | The three typefaces, hosted with the site |
| `assets/vendor/` | GSAP, ScrollTrigger, SplitText and Lenis, hosted with the site |

## Before you go live

Work through these in `config.js`. The admin dashboard shows the same checklist under **Setup**.

1. **Contact details.** Check the WhatsApp number, email and Instagram handle. The old site used two spellings of the email address (`baddiestrands@` and `baddiestrandss@`); this one uses `baddiestrands@gmail.com` everywhere. Change it in one place if that's wrong.
2. **Card payments.** Paste your Paystack public key into `paystackPublicKey`. Until you do, "Pay by card" is switched off at checkout.
3. **Bank transfer.** Replace `0000000000` with your real account number. Until you do, bank transfer is switched off so nobody can send money to a placeholder.
4. **Email.** Add your EmailJS keys so sign-in codes and new-order emails are sent. Until you do, the sign-in code is shown on screen so you can still test.
5. **Admin sign-in.** Change the username and password at the top of `admin.js`.
6. **Sample content.** The reviews, ratings and review counts came with the original template. Swap in your own before launch.

While card and bank transfer are both off, checkout still works: the customer places the order and sends it to you on WhatsApp with one tap.

## Changing things

**Products** live in `data.js`. Copy a product, give it a new `id`, and edit the fields:

- `texture` decides how the hair is drawn: `bone`, `straight`, `body`, `loose`, `water`, `deep`, `curly` or `coily`.
- `colors` and `colorNames` are the shades, in the same order. The first shade is the one shown by default. Add `ombre: true` to fade the tips lighter.
- `category` decides the shape: `wigs` are drawn as a wig, `bundles` as a weft, `extensions` as clip-ins (or a ponytail if the name says "pony").
- `tone` is the backdrop colour that piece gets in the showroom.
- `image` is optional. Leave it as `""` to show the drawn hair, or put a file name in this folder or a full `https://` link to show your own photo instead. Use real photos of your own units only; the drawn hair is better than a stock photo of someone else's.

You can also add and edit products in the admin dashboard, including texture and shades. Those edits stay in your browser until you press **Copy for data.js**, paste over the `products` list in `data.js`, and redeploy.

**The four textures** in the scrolling scene are `chapters` in `data.js`: the texture, the line of copy, the product to show, which shade, and the background and text colours.

**The stylist** questions and how answers map to textures are under `stylist` in `data.js`.

**Delivery** has two lists in `data.js`: `DELIVERY` is what the answers show, `DELIVERY_FEES` is what checkout charges. Keep them in step.

**Length guide.** The landmarks ("20 inches falls to your mid-back") are in `lengthGuide` in `data.js`. They are standard approximations; check them against your own units.

**Colours and type** are set at the top of `styles.css` under "Tokens".

## How orders reach you

- A customer adds pieces to the bag, signs in with an email code, enters delivery details and pays.
- The delivery fee comes from `DELIVERY_FEES` in `data.js`, by state.
- You are told about the order by **email** (once EmailJS is connected) and by the **WhatsApp** button on the confirmation screen. Card payments also appear in your Paystack dashboard.
- Card payments are confirmed in the customer's browser. Check the payment in Paystack before you ship.

### What the admin dashboard can and can't see

The site has no server or database. Everything it remembers is saved in the browser it is used in. That means:

- The dashboard shows visits, sign-ups and orders **made on that same device**, plus orders you record by hand with **Record an order**.
- An order a customer places on her own phone does **not** appear in your dashboard. It reaches you by email and WhatsApp.
- Newsletter sign-ups are stored on the visitor's device. To collect them centrally, connect a mailing-list service or a database.

Sign-in identifies a customer by email for that device. It is not a secure account system. Shared orders, subscribers and product edits across devices need a backend (your earlier `bs-upgrade` folder used Supabase for this).

## Where the design comes from

| Part | Borrowed from |
|---|---|
| One persistent object that changes as you scroll (the hair), ghost word behind it | brocksbushes.moonshiners.co.uk, lofliballs.com |
| Pinned chapters with Roman numerals, circular progress dots, colour change per chapter | arcteryx.com System 0 |
| Rounded window frame, glass pill menu that opens into tiles, showroom carousel with ghost word, counts in the filter pills, 01 / 12 counter | patike.ch |
| Opening counter, giant headline with the object through it, reviews picker, answers with big serif questions and square plus box | dialedcoffee.com |
| Stylist: big option tiles, full-width bar button, growing footer letters | carnilove.ashfall.studio |
| Shade swatches and length slider that change the product live | nettiesbees.com |
| Custom cursor in difference blend, labels on hover ("Drag", "Comb") | ruthgriffioen.art, enigmascult.com |
| Grid view: staggered columns, bar-bracketed names, marker under the chosen filter | pistacchioecaffe.it |
| Lowercase wordmark that sharpens into focus, thread drawn from the dot, live Abuja clock | concretaceramiche.it |
| "Ask for it" line input with typed suggestions, oval buttons, copper-to-black panel | enigmascult.com |

## Browser support

Current Chrome, Edge, Safari and Firefox, on desktop and phone. Every control works with a keyboard, and the site respects the "reduce motion" setting.

## Contact

- WhatsApp: +234 703 324 7980
- Email: baddiestrands@gmail.com
- Instagram: [@the_baddie_strands](https://instagram.com/the_baddie_strands)
