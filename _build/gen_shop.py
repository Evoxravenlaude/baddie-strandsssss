# Builds the shop's HTML pages from one shared header and footer.
import os
OUT = '/home/claude/bs5/shop'
V = '2'

ICONS = '''<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></symbol>
  <symbol id="i-bag" viewBox="0 0 24 24"><path d="M5 8h14l-1 12.5H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></symbol>
  <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
  <symbol id="i-left" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></symbol>
  <symbol id="i-right" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
  <symbol id="i-spark" viewBox="0 0 24 24"><path d="M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8z"/></symbol>
  <symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z"/></symbol>
  <symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/></symbol>
  <symbol id="i-gem" viewBox="0 0 24 24"><path d="M7 4h10l4 5-9 11L3 9z"/><path d="M3 9h18M9.5 4L8 9l4 11M14.5 4L16 9l-4 11"/></symbol>
  <symbol id="i-crown" viewBox="0 0 24 24"><path d="M4 18h16M4.5 16L3 7l5 4 4-6 4 6 5-4-1.5 9z"/></symbol>
  <symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></symbol>
  <symbol id="i-ig" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r=".6" fill="currentColor"/></symbol>
  <symbol id="i-note" viewBox="0 0 24 24"><path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.6 2.6 2.4 4.2 5 4.5"/></symbol>
  <symbol id="i-wa" viewBox="0 0 24 24"><path d="M4.5 19.5l1.1-3.9A8 8 0 1 1 8.6 18.4z"/><path d="M9.2 8.6c.3 2.7 2.4 4.9 5.1 5.3l.9-1.1 1.9.8-.3 1.5c-3.9.4-8.1-3.6-7.9-7.5l1.5-.4.9 1.8z"/></symbol>
  <symbol id="i-mail" viewBox="0 0 24 24"><path d="M3.5 6h17v12h-17z"/><path d="M3.5 6.5l8.5 7 8.5-7"/></symbol>
</svg>'''

NAV = [('shop.html', 'shop', 'Shop'), ('knowledge.html', 'knowledge', 'Hair Knowledge'), ('quiz.html', 'quiz', 'Hair Quiz'), ('delivery.html', 'delivery', 'Delivery'), ('contact.html', 'contact', 'Contact')]

def head(title, desc, page):
    nav = '\n'.join(f'      <a href="{h}" data-nav="{k}">{t}</a>' for h, k, t in NAV)
    return f'''<!doctype html>
<html lang="en-NG">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0a0a0a">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:image" content="assets/img/hero.jpg">
<link rel="icon" href="assets/img/icon.svg" type="image/svg+xml">
<link rel="preload" href="assets/fonts/cormorant-garamond-latin-300-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/jost-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css?v={V}">
</head>
<body data-page="{page}">
{ICONS}
<div class="cursor" aria-hidden="true"></div><div class="cursor-ring" aria-hidden="true"></div>
<a class="skip" href="#main">Skip to content</a>
<div class="demo" data-demo hidden>Demo mode: orders and messages stay in this browser until the shop is connected to its database.</div>
<div class="announce" data-announce hidden><p data-announce-text></p></div>
<header class="hd" data-hd>
  <div class="hd__in wrap">
    <a class="logo" href="index.html" aria-label="Baddie Strands, home"><span>Baddie</span><span>Strands</span></a>
    <nav class="hd__nav" aria-label="Main">
{nav}
    </nav>
    <div class="hd__tools">
      <span class="clock" data-clock></span>
      <button class="iconbtn" type="button" data-search-open aria-label="Search the shop"><svg class="ico"><use href="#i-search"/></svg></button>
      <button class="bagbtn" type="button" data-bag-open aria-label="Open your bag"><svg class="ico"><use href="#i-bag"/></svg><span>Bag</span><span class="bagbtn__n" data-bag-count>0</span></button>
      <button class="iconbtn hd__menu" type="button" data-menu-open aria-label="Menu" aria-expanded="false" aria-controls="menu"><svg class="ico"><use href="#i-menu"/></svg></button>
    </div>
  </div>
</header>
'''

FOOT = '''
<section class="blush" aria-labelledby="circle-title">
  <div class="wrap circle">
    <div><p class="tag">Stay in the loop</p><h2 class="h2" id="circle-title">Join the <em>Inner Circle</em></h2><p class="lede" style="margin-top:12px">Exclusive drops, styling tips and members-only deals. No spam, ever.</p></div>
    <div>
      <form class="inline" data-newsletter novalidate>
        <label class="visually-hidden" for="join-email">Your email</label>
        <input class="input" id="join-email" name="email" type="email" autocomplete="email" placeholder="Enter your email address" required>
        <button class="btn" type="submit">Subscribe</button>
      </form>
      <p class="circle__note" data-newsletter-note role="status"></p>
    </div>
  </div>
</section>
<footer class="ft">
  <div class="wrap ft__top">
    <div class="ft__brand">
      <a class="logo" href="index.html"><span>Baddie</span><span>Strands</span></a>
      <p>Nigeria’s luxury hair brand. 100% virgin human hair. <em style="font-family:var(--italic);color:var(--gold)">Your Hair, Your Crown.</em> From Abuja to the world.</p>
      <div class="ft__social"><a href="#" data-ig target="_blank" rel="noopener" aria-label="Instagram"><svg><use href="#i-ig"/></svg></a><a href="#" data-tt target="_blank" rel="noopener" aria-label="TikTok"><svg><use href="#i-note"/></svg></a><a href="#" data-wa target="_blank" rel="noopener" aria-label="WhatsApp"><svg><use href="#i-wa"/></svg></a><a href="#" data-mail aria-label="Email"><svg><use href="#i-mail"/></svg></a></div>
    </div>
    <nav aria-label="Shop"><h3>Shop</h3><a href="shop.html">All hair</a><a href="shop.html?category=wigs">Wigs</a><a href="shop.html?category=bundles">Bundles</a><a href="shop.html?category=closures">Closures</a><a href="shop.html?category=extensions">Extensions</a></nav>
    <nav aria-label="Learn"><h3>Learn</h3><a href="knowledge.html">Hair knowledge</a><a href="knowledge.html#care">Care guide</a><a href="quiz.html">Hair quiz</a><a href="help.html">Questions</a></nav>
    <nav aria-label="Information"><h3>Info</h3><a href="delivery.html">Delivery</a><a href="track.html">Track an order</a><a href="about.html">Our story</a><a href="contact.html">Contact us</a><p data-open class="open">Checking hours</p></nav>
  </div>
  <div class="ft__word" aria-hidden="true"><p>Baddie Strands</p></div>
  <div class="wrap ft__base"><p>&copy; <span data-year>2026</span> Baddie Strands. All rights reserved.</p><p><span data-clock-foot>Abuja, Nigeria</span></p></div>
</footer>

<div class="menu" id="menu" data-menu hidden role="dialog" aria-modal="true" aria-label="Menu">
  <div class="menu__top">
    <a class="logo" href="index.html"><span>Baddie</span><span>Strands</span></a>
    <button class="iconbtn" type="button" data-menu-close aria-label="Close menu"><svg class="ico"><use href="#i-close"/></svg></button>
  </div>
  <nav class="menu__links" aria-label="Menu">
    <a href="shop.html">Shop</a><a href="knowledge.html">Hair Knowledge</a><a href="quiz.html">Hair Quiz</a><a href="delivery.html">Delivery</a><a href="about.html">Our Story</a><a href="contact.html">Contact</a><a href="track.html">Track an Order</a>
  </nav>
  <div class="menu__foot"><a href="#" data-wa target="_blank" rel="noopener">WhatsApp us</a><p data-open class="open">Checking hours</p></div>
</div>

<div class="overlay" id="bag" data-overlay hidden>
  <div class="scrim" data-close></div>
  <div class="drawer" role="dialog" aria-modal="true" aria-labelledby="bag-title" tabindex="-1">
    <div class="drawer__head"><h2 class="h3" id="bag-title">Your Bag <span class="muted" data-bag-n></span></h2><button class="iconbtn" type="button" data-close aria-label="Close bag"><svg class="ico"><use href="#i-close"/></svg></button></div>
    <div class="drawer__body" data-bag-lines></div>
    <div class="drawer__foot" data-bag-foot hidden>
      <div class="free" data-free hidden><span data-free-text></span><div class="free__bar"><i data-free-bar></i></div></div>
      <div class="sum"><div class="sum__total"><span>Subtotal</span><span class="price" data-bag-subtotal></span></div><div class="small muted"><span>Delivery is worked out at checkout from your state.</span></div></div>
      <a class="btn btn--pink btn--wide btn--go" href="checkout.html" style="justify-content:space-between;padding-left:30px">Checkout securely <i class="arw" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></i></a>
      <button class="btn btn--black btn--wide" type="button" data-close>Keep shopping</button>
    </div>
  </div>
</div>

<div class="overlay" id="search" data-overlay hidden>
  <div class="scrim" data-close></div>
  <div class="search" role="dialog" aria-modal="true" aria-label="Search the shop" tabindex="-1">
    <div class="wrap">
      <div class="search__bar">
        <svg class="ico" aria-hidden="true"><use href="#i-search"/></svg>
        <label class="visually-hidden" for="search-input">Search</label>
        <input id="search-input" type="search" placeholder="Search wigs, bundles, extensions" autocomplete="off">
        <button class="iconbtn" type="button" data-close aria-label="Close search"><svg class="ico"><use href="#i-close"/></svg></button>
      </div>
      <div data-search-results></div>
    </div>
  </div>
</div>

<div class="toast" data-toast role="status" aria-live="polite"><span data-toast-text></span><span data-toast-act></span></div>
'''

def tail():
    return f'''{FOOT}
<script src="config.js?v={V}"></script>
<script src="assets/js/seed.js?v={V}"></script>
<script src="assets/js/db.js?v={V}"></script>
<script src="assets/js/art.js?v={V}"></script>
<script src="assets/js/site.js?v={V}"></script>
<script src="assets/js/pages.js?v={V}"></script>
</body>
</html>
'''

STORY = '''
    <div class="story">
      <div class="story__media rv">
        <span class="pic"><img src="assets/img/about.jpg" alt="A long body wave wig in a rich ginger shade" loading="lazy"></span>
        <div class="story__badge"><b>2020</b><span>Founded in Abuja, Nigeria</span></div>
      </div>
      <div class="story__text rv">
        <p class="tag">Our story</p>
        <h2 class="h2">Born in Abuja. <em>Built for Every Queen.</em></h2>
        <div class="divider"></div>
        <p class="body">Baddie Strands began with one mission: give Nigerian women access to the quality of hair they deserve, without compromise. Every strand is 100% virgin, ethically handled, and built to last.</p>
        <p class="body">We are a proudly Nigerian business with a worldwide reach. Whether you’re in Wuse or Wimbledon, we bring the same quality to your door, and every package carries a piece of that Abuja excellence.</p>
        <div class="places"><span>Nigeria</span><span>United Kingdom</span><span>USA</span><span>Ghana</span><span>And more</span></div>
        <a class="btn btn--line btn--go" href="contact.html">Connect with us <i class="arw" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></i></a>
      </div>
    </div>'''

FEATURES = [('spark', '100% Virgin Human Hair'), ('globe', 'Worldwide Shipping'), ('bolt', 'Same-Day Abuja Delivery'), ('gem', 'HD Undetectable Lace'), ('crown', 'Nigerian-Owned &amp; Proud'), ('lock', 'Secure Card Checkout')]
feat = ''.join(f'<span class="feature"><i><svg><use href="#i-{i}"/></svg></i>{t}</span>' for i, t in FEATURES)

PAGES = {}

PAGES['index.html'] = (
  'Baddie Strands | Luxury virgin human hair, from Abuja to the world',
  'Luxury 100% virgin human hair wigs, bundles, closures and extensions. Same-day delivery in Abuja, nationwide and worldwide shipping.',
  'home', f'''
<main id="main">
  <section class="hero" aria-labelledby="hero-title">
    <h1 class="visually-hidden" id="hero-title">Hair that speaks before you do</h1>
    <div class="hero__stage">
      <span class="hero__line hero__line--1" aria-hidden="true">Hair That Speaks</span>
      <span class="hero__photo"><img src="assets/img/hero.jpg" alt="A long, glossy bone-straight wig in deep burgundy" fetchpriority="high"></span>
      <span class="hero__line hero__line--2" aria-hidden="true">Before You Do</span>
      <span class="badge-ring" aria-hidden="true"><span>Virgin<br>Human<br>Hair<br>100%</span></span>
    </div>
    <div class="hero__intro">
      <p class="lede">100% virgin human hair, with HD lace that vanishes on your skin. <em style="font-family:var(--italic);color:var(--cream)">Your Hair, Your Crown</em>, from Abuja to the world.</p>
      <div class="hero__go"><a class="btn btn--go" href="shop.html">Shop the collection <i class="arw" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></i></a><a class="btn btn--line" href="quiz.html">Find your match</a></div>
    </div>
    <div class="hero__corner" data-corner><p class="tag">Nigerian-owned since 2020</p><div class="stats" data-stats></div></div>
    <div class="ticker" aria-hidden="true"><div class="ticker__run" data-ticker></div></div>
  </section>

  <section class="wall" aria-label="Your hair, your crown">
    <div class="wall__run" aria-hidden="true"><img src="assets/img/hero.jpg" alt="" loading="lazy"><img src="assets/img/about.jpg" alt="" loading="lazy"><img src="assets/img/bob.jpg" alt="" loading="lazy"><img src="assets/img/quiz.jpg" alt="" loading="lazy"><img src="assets/img/hero.jpg" alt="" loading="lazy"><img src="assets/img/about.jpg" alt="" loading="lazy"><img src="assets/img/bob.jpg" alt="" loading="lazy"><img src="assets/img/quiz.jpg" alt="" loading="lazy"><img src="assets/img/hero.jpg" alt="" loading="lazy"><img src="assets/img/about.jpg" alt="" loading="lazy"><img src="assets/img/bob.jpg" alt="" loading="lazy"><img src="assets/img/quiz.jpg" alt="" loading="lazy"><img src="assets/img/hero.jpg" alt="" loading="lazy"><img src="assets/img/about.jpg" alt="" loading="lazy"><img src="assets/img/bob.jpg" alt="" loading="lazy"><img src="assets/img/quiz.jpg" alt="" loading="lazy"></div>
    <p class="wall__motto">Your Hair, Your Crown</p>
  </section>

  <section class="sec" aria-label="Our story"><div class="wrap">{STORY}</div></section>

  <section class="sec sec--deep" id="textures" aria-labelledby="tex-title">
    <div class="wrap">
      <div class="sec__head"><div><p class="tag">The collection</p><h2 class="h2" id="tex-title">Shop by <em>Texture</em></h2></div><p class="lede">From mirror-straight to 4C. Hover to see it, tap to shop it.</p></div>
      <nav class="tex" data-textures aria-label="Textures"></nav>
    </div>
    <div class="tex__peek" data-peek aria-hidden="true"><span class="pic" data-peek-pic></span></div>
  </section>

  <section class="sec" aria-labelledby="best-title">
    <div class="wrap">
      <div class="sec__head"><div><p class="tag">Most loved</p><h2 class="h2" id="best-title">The <em>Bestsellers</em></h2></div><div class="row__nav"><button type="button" data-row-prev aria-label="Previous"><svg class="ico"><use href="#i-left"/></svg></button><button type="button" data-row-next aria-label="Next"><svg class="ico"><use href="#i-right"/></svg></button></div></div>
      <div class="row__track" data-row data-best></div>
    </div>
  </section>

  <section class="sec sec--tight" aria-labelledby="match-title">
    <div class="wrap">
      <div class="match rv">
        <div class="match__text blush">
          <p class="tag">Personalised recommendation</p>
          <h2 class="h2" id="match-title">Find Your Perfect <em>Match</em></h2>
          <p class="lede">Answer five quick questions about your lifestyle, texture and budget, and we’ll pick the pieces made for you.</p>
          <div><a class="btn btn--go" href="quiz.html">Take the hair quiz <i class="arw" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></i></a></div>
        </div>
        <div class="match__media"><span class="pic"><img src="assets/img/quiz.jpg" alt="A long deep wave wig in natural black" loading="lazy"></span></div>
      </div>
    </div>
  </section>

  <section class="sec sec--deep" aria-labelledby="voices-title" data-voices>
    <div class="wrap">
      <div class="sec__head"><div><p class="tag">What queens say</p><h2 class="h2" id="voices-title">Real Women. <em>Real Results.</em></h2></div><div class="row__nav"><button type="button" data-voice-prev aria-label="Previous reviews"><svg class="ico"><use href="#i-left"/></svg></button><button type="button" data-voice-next aria-label="More reviews"><svg class="ico"><use href="#i-right"/></svg></button></div></div>
      <div class="voices__track" data-voice-track tabindex="0" role="region" aria-label="Customer reviews, scroll sideways for more"></div>
    </div>
  </section>

  <section class="sec" aria-labelledby="k-title">
    <div class="wrap">
      <div class="sec__head"><div><p class="tag">The knowledge hub</p><h2 class="h2" id="k-title">Everything You Need to <em>Know</em></h2></div><a class="btn btn--line btn--go" href="knowledge.html">Read the guide <i class="arw" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></i></a></div>
      <div class="kgrid">
        <article class="kcard rv"><p class="kcard__n">01</p><h3>Virgin vs Remy Hair</h3><p>Virgin hair has never been chemically processed. Remy means the cuticles all run one way, so it doesn’t tangle. Everything we sell is both.</p></article>
        <article class="kcard rv"><p class="kcard__n">02</p><h3>Lace Types Explained</h3><p>HD lace is the thinnest and disappears on every skin tone. A 13×4 frontal covers ear to ear; 13×6 gives you more room to part.</p></article>
        <article class="kcard rv"><p class="kcard__n">03</p><h3>Reading Hair Length</h3><p>Length is measured straight. A 20″ straight wig reaches mid-back; a 20″ curly one sits higher because of shrinkage.</p></article>
      </div>
    </div>
  </section>

  <section class="sec sec--tight" aria-labelledby="new-title">
    <div class="wrap">
      <div class="sec__head"><div><p class="tag">Just landed</p><h2 class="h2" id="new-title">New <em>In</em></h2></div><a class="btn btn--line btn--go" href="shop.html?sort=new">See everything new <i class="arw" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></i></a></div>
      <div class="grid" data-new style="padding:0"></div>
    </div>
  </section>
</main>''')

PAGES['shop.html'] = (
  'Shop all hair | Baddie Strands', 'Wigs, bundles, closures and extensions in every texture, from bone straight to kinky coily.',
  'shop', '''
<main id="main">
  <div class="wrap listhead">
    <p class="tag">The collection</p>
    <div class="listhead__row"><h1 class="h1" data-list-title>All Hair</h1><span class="listhead__n" data-list-n></span>
      <label class="visually-hidden" for="sort">Sort by</label>
      <select class="select" id="sort" data-sort>
        <option value="featured">Featured</option><option value="new">Newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option>
      </select>
    </div>
  </div>
  <div class="filters">
    <div class="wrap filters__in" role="toolbar" aria-label="Filter">
      <div style="display:contents" data-cats></div>
      <span class="filters__sep" aria-hidden="true"></span>
      <div style="display:contents" data-texs></div>
    </div>
  </div>
  <div class="wrap">
    <div class="grid" data-grid aria-live="polite"></div>
    <div class="empty" data-empty hidden><h2 class="h3">Nothing matches those filters.</h2><p class="muted">Try another texture, or tell us what you’re after and we’ll find it for you.</p><div class="hero__go" style="margin:0"><button class="btn btn--line" type="button" data-clear>Clear filters</button><a class="btn" href="contact.html">Ask us for it</a></div></div>
  </div>
</main>''')

PAGES['product.html'] = (
  'Baddie Strands', 'Luxury virgin human hair from Baddie Strands, Abuja.', 'product', '''
<main id="main">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb" data-crumbs><a href="shop.html">Shop</a></nav>
    <div class="pdp" data-pdp>
      <div class="gallery">
        <div class="gallery__thumbs" data-thumbs></div>
        <div class="gallery__main" data-main><span class="ghostword" data-ghost aria-hidden="true"></span><span class="pic"><img data-main-img alt=""></span></div>
      </div>
      <div class="buy" data-buy>
        <div class="ghost" style="height:56px;width:80%"></div><div class="ghost" style="height:24px;width:30%"></div><div class="ghost" style="height:140px"></div>
      </div>
    </div>
    <section class="sec sec--tight" aria-labelledby="also-title" data-also-wrap hidden>
      <div class="sec__head"><div><p class="tag">Complete the look</p><h2 class="h2" id="also-title">You May Also <em>Love</em></h2></div></div>
      <div class="grid" data-also style="padding:0 0 32px"></div>
    </section>
  </div>
  <div class="mbar" data-mbar aria-hidden="true"><div><b data-mbar-name></b><span class="price" data-mbar-price></span></div><button class="btn" type="button" data-mbar-add tabindex="-1">Add to bag</button></div>
  <div class="wrap" data-missing hidden><div class="empty"><h1 class="h2">We couldn’t find that piece.</h1><p class="muted">It may have sold out or been renamed.</p><a class="btn btn--go" href="shop.html">See all hair <i class="arw" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></i></a></div></div>
</main>''')

PAGES['knowledge.html'] = (
  'Hair knowledge and care guide | Baddie Strands', 'Virgin vs Remy, lace types, density, length, caps, and how to wash, style, store and maintain human hair.', 'knowledge', '''
<main id="main">
  <div class="wrap pagehead"><p class="tag">The knowledge hub</p><h1 class="h1">Everything You Need to <em>Know</em></h1><p class="lede">An educated woman makes better choices. From understanding your hair type to mastering installation, we’ve got you covered.</p></div>
  <div class="wrap" style="padding-bottom:clamp(64px,8vw,120px)">
    <div class="tabs" role="tablist" aria-label="Guides">
      <button type="button" role="tab" id="tab-basics" aria-controls="panel-basics" aria-selected="true" data-ktab="basics">Hair basics</button>
      <button type="button" role="tab" id="tab-care" aria-controls="panel-care" aria-selected="false" data-ktab="care">Care guide</button>
    </div>
    <div id="panel-basics" role="tabpanel" aria-labelledby="tab-basics" data-kpanel="basics">
      <h2 class="visually-hidden">Hair basics</h2>
      <div class="chapters">
        <details class="chapter" open><summary><span class="chapter__n">01</span><h3 class="chapter__t">Know Your Hair Type</h3><span class="chapter__plus" aria-hidden="true"></span></summary><p class="chapter__body">From 1A to 4C, understanding your curl pattern, porosity and density is the first step. High-porosity hair absorbs moisture fast but loses it just as quickly. Low porosity needs warmth to open the cuticle.</p></details>
        <details class="chapter"><summary><span class="chapter__n">02</span><h3 class="chapter__t">Virgin vs Remy Hair</h3><span class="chapter__plus" aria-hidden="true"></span></summary><p class="chapter__body">Virgin hair has never been chemically processed: it’s the purest form. Remy hair has all its cuticles aligned in one direction, which prevents tangling. All Baddie Strands hair is virgin and Remy.</p></details>
        <details class="chapter"><summary><span class="chapter__n">03</span><h3 class="chapter__t">Lace Types Explained</h3><span class="chapter__plus" aria-hidden="true"></span></summary><p class="chapter__body">HD lace is the thinnest and most transparent, and disappears on every skin tone. Regular lace is thicker but more durable. 13×4 covers ear to ear, 13×6 adds depth for parting, and 360 lace covers the full perimeter.</p></details>
        <details class="chapter"><summary><span class="chapter__n">04</span><h3 class="chapter__t">Density Guide</h3><span class="chapter__plus" aria-hidden="true"></span></summary><p class="chapter__body">Density is how full the wig looks. 150% is natural and light. 180% is full and glamorous. 200% is the maximum: dramatic, show-stopping volume. Choose for your lifestyle and the look you want.</p></details>
        <details class="chapter"><summary><span class="chapter__n">05</span><h3 class="chapter__t">Reading Hair Length</h3><span class="chapter__plus" aria-hidden="true"></span></summary><p class="chapter__body">Hair is measured straightened. A 20″ straight wig reaches mid-back; a 20″ curly wig may look much shorter because of shrinkage. Always allow for your texture when choosing length.</p></details>
        <details class="chapter"><summary><span class="chapter__n">06</span><h3 class="chapter__t">Cap Construction</h3><span class="chapter__plus" aria-hidden="true"></span></summary><p class="chapter__body">The cap is the foundation. Machine-made caps cost less but breathe less. Hand-tied caps move more naturally. Glueless caps have adjustable bands. Choose for comfort, lifestyle and activity level.</p></details>
      </div>
    </div>
    <div id="panel-care" role="tabpanel" aria-labelledby="tab-care" data-kpanel="care" hidden>
      <h2 class="visually-hidden">Care guide</h2>
      <div class="guide">
        <div class="guide__nav" role="tablist" aria-label="Care topics" data-guide-nav></div>
        <div class="guide__panel" data-guide-panel aria-live="polite"></div>
      </div>
    </div>
  </div>
</main>''')

PAGES['quiz.html'] = (
  'Hair quiz: find your perfect match | Baddie Strands', 'Answer five quick questions and get wig and bundle recommendations picked for your lifestyle, texture and budget.', 'quiz', '''
<main id="main">
  <div class="wrap pagehead"><p class="tag">Personalised recommendation</p><h1 class="h1">Find Your Perfect <em>Match</em></h1><p class="lede">Answer five quick questions and we’ll pick the pieces made for you.</p></div>
  <div class="wrap">
    <section class="quiz" aria-label="Hair quiz">
      <div class="quiz__media"><span class="pic"><img src="assets/img/quiz.jpg" alt="A long deep wave wig in natural black"></span></div>
      <div class="quiz__box" data-quiz aria-live="polite"></div>
    </section>
    <section data-quiz-results hidden aria-labelledby="res-title" style="padding-bottom:clamp(64px,8vw,120px)">
      <div class="sec__head"><div><p class="tag">Your match</p><h2 class="h2" id="res-title" tabindex="-1">Picked <em>for You</em></h2></div><button class="btn btn--line" type="button" data-quiz-again>Retake the quiz</button></div>
      <div class="results" data-results></div>
    </section>
  </div>
</main>''')

PAGES['delivery.html'] = (
  'Delivery | Baddie Strands', 'Same-day delivery in Abuja, 1 to 4 days across Nigeria, and worldwide shipping to the UK, Europe, North America and Africa.', 'delivery', '''
<main id="main">
  <div class="wrap pagehead"><p class="tag">Delivery</p><h1 class="h1">We Deliver <em>Everywhere</em></h1><p class="lede" data-fees-note>Nationwide delivery across all 36 states and the FCT. International shipping to the UK, Europe, North America and across Africa.</p></div>
  <div class="wrap" style="padding-bottom:clamp(64px,8vw,120px)">
    <div class="zones">
      <section aria-labelledby="ng-title">
        <h2 class="h3" id="ng-title">Across Nigeria</h2>
        <p class="small muted" style="margin-bottom:18px">You’ll see your exact fee at checkout when you choose your state.</p>
        <label class="field" style="margin-bottom:8px"><span>Find your state</span><input class="input" type="search" data-fee-q placeholder="Type a state"></label>
        <div style="max-height:520px;overflow:auto" tabindex="0" role="region" aria-label="Delivery fees by state"><table class="fees"><thead><tr><th scope="col">State</th><th scope="col">Fee</th><th scope="col">Arrives in</th></tr></thead><tbody data-fees></tbody></table></div>
      </section>
      <section aria-labelledby="intl-title">
        <h2 class="h3" id="intl-title">Worldwide</h2>
        <p class="small muted" style="margin-bottom:8px">Tracked, packed discreetly, customs paperwork handled. Message us on WhatsApp to order from abroad.</p>
        <div class="zone"><div><b>UK &amp; Europe</b><br><span>5 to 10 business days</span></div><span class="price">From $35</span></div>
        <div class="zone"><div><b>USA &amp; Canada</b><br><span>7 to 14 business days</span></div><span class="price">From $40</span></div>
        <div class="zone"><div><b>West Africa</b><br><span>5 to 10 business days</span></div><span class="price">From ₦15,000</span></div>
        <div class="zone"><div><b>Rest of Africa</b><br><span>7 to 14 business days</span></div><span class="price">From $30</span></div>
        <div style="margin-top:28px"><a class="btn btn--line" href="#" data-wa target="_blank" rel="noopener">Order from abroad on WhatsApp</a></div>
      </section>
    </div>
    <div class="howto">
      <div><span>i.</span><h3>You order</h3><p>Pay by card, bank transfer, or finish your order with us on WhatsApp.</p></div>
      <div><span>ii.</span><h3>We confirm</h3><p>We check your payment and confirm your order, usually within the hour in opening hours.</p></div>
      <div><span>iii.</span><h3>We pack and send</h3><p>Your hair is checked by hand, packed with care and handed to the rider or courier.</p></div>
      <div><span>iv.</span><h3>You track it</h3><p>Follow every step with your order number. <a class="link" href="track.html">Track an order</a></p></div>
    </div>
  </div>
</main>''')

PAGES['help.html'] = (
  'Questions | Baddie Strands', 'Answers about delivery, payment, lace, density, length and caring for human hair.', 'help', '''
<main id="main">
  <div class="wrap pagehead"><p class="tag">Help</p><h1 class="h1">Questions, <em>Answered</em></h1>
    <div class="faqsearch"><svg class="ico" aria-hidden="true"><use href="#i-search"/></svg><label class="visually-hidden" for="faq-q">Search questions</label><input class="input" id="faq-q" type="search" placeholder="Search: lace, delivery, washing" data-faq-q></div>
  </div>
  <div class="wrap help">
    <nav class="help__side" aria-label="Topics" data-faq-nav></nav>
    <div>
      <div data-faq></div>
      <p class="muted" data-faq-none hidden style="padding-top:32px">No answers match that. <a class="link" href="contact.html">Ask us directly</a>.</p>
      <p class="muted" style="padding-top:40px">Delivery fees for every state are on the <a class="link" href="delivery.html">delivery page</a>.</p>
    </div>
  </div>
</main>''')

PAGES['checkout.html'] = (
  'Checkout | Baddie Strands', 'Checkout', 'checkout', '''
<main id="main">
  <div class="wrap">
    <div class="pagehead" style="padding-bottom:0" data-co-title><p class="tag">Secure checkout</p><h1 class="h1">Your <em>Order</em></h1></div>
    <div data-co-empty hidden class="empty"><p class="lede">Your bag is empty.</p><a class="btn btn--go" href="shop.html">Find something you love <i class="arw" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></i></a></div>
    <div class="co" data-co>
      <form data-co-form novalidate>
        <section class="step" data-step="1">
          <div class="step__head"><h2><i>i.</i>Your details</h2><button class="linkbtn" type="button" data-edit="1" hidden>Change</button></div>
          <p class="step__sum" data-sum="1" hidden></p>
          <div class="step__body" data-body="1">
            <div class="fgrid">
              <label class="field full"><span>Full name</span><input class="input" name="name" autocomplete="name" required></label>
              <label class="field"><span>Email</span><input class="input" name="email" type="email" autocomplete="email" required><small>For your receipt and order updates.</small></label>
              <label class="field"><span>Phone (WhatsApp if you have it)</span><input class="input" name="phone" type="tel" autocomplete="tel" required><small>The rider calls this number.</small></label>
            </div>
            <p class="err" data-err="1" role="alert"></p>
            <div><button class="btn" type="button" data-next="1">Continue to delivery</button></div>
          </div>
        </section>
        <section class="step is-locked" data-step="2">
          <div class="step__head"><h2><i>ii.</i>Delivery</h2><button class="linkbtn" type="button" data-edit="2" hidden>Change</button></div>
          <p class="step__sum" data-sum="2" hidden></p>
          <div class="step__body" data-body="2" hidden>
            <div class="fgrid">
              <label class="field full"><span>Street address</span><input class="input" name="address" autocomplete="street-address" required></label>
              <label class="field"><span>Area or town</span><input class="input" name="city" autocomplete="address-level2"></label>
              <label class="field"><span>State</span><select class="input" name="state" data-states required><option value="">Choose your state</option></select></label>
              <label class="field full"><span>Anything we should know? (optional)</span><input class="input" name="note" placeholder="Landmark, best time to deliver"></label>
            </div>
            <p class="note" data-fee-note hidden></p>
            <p class="err" data-err="2" role="alert"></p>
            <div><button class="btn" type="button" data-next="2">Continue to payment</button></div>
          </div>
        </section>
        <section class="step is-locked" data-step="3">
          <div class="step__head"><h2><i>iii.</i>Payment</h2></div>
          <div class="step__body" data-body="3" hidden>
            <fieldset class="pay" data-pay style="border:0;padding:0;margin:0"><legend class="visually-hidden">How would you like to pay?</legend></fieldset>
            <p class="err" data-err="3" role="alert"></p>
            <div><button class="btn btn--pink" type="submit" data-place>Place order</button></div>
            <p class="small muted">By placing your order you agree to our delivery and returns terms on the <a class="link" href="help.html">Questions</a> page.</p>
          </div>
        </section>
      </form>
      <aside class="cosum" aria-label="Order summary">
        <h2 class="h3">Order Summary</h2>
        <div class="cosum__lines" data-co-lines></div>
        <form class="inline" data-code-form novalidate>
          <label class="visually-hidden" for="code">Discount code</label>
          <input class="input" id="code" name="code" placeholder="Discount code" autocomplete="off" style="height:46px;text-transform:uppercase">
          <button class="btn btn--black btn--sm" type="submit" style="min-height:46px">Apply</button>
        </form>
        <p class="small" data-code-msg role="status"></p>
        <div class="sum">
          <div><span>Subtotal</span><span class="price" data-co-sub></span></div>
          <div data-co-disc-row hidden><span>Discount <span data-co-code></span> <button class="linkbtn" type="button" data-code-remove>Remove</button></span><span class="price" data-co-disc></span></div>
          <div><span>Delivery</span><span data-co-fee>Choose your state</span></div>
          <div class="sum__total"><span>Total</span><span class="price" data-co-total></span></div>
        </div>
      </aside>
    </div>
    <div class="done" data-done hidden></div>
  </div>
</main>''')

PAGES['track.html'] = (
  'Track your order | Baddie Strands', 'Check where your Baddie Strands order is.', 'track', '''
<main id="main">
  <div class="wrap track">
    <div>
      <p class="tag">Order tracking</p>
      <h1 class="h1">Where’s My <em>Crown?</em></h1>
      <p class="lede" style="margin:18px 0 30px">Use the order number from your confirmation and the email you ordered with.</p>
      <form class="fgrid" data-track-form novalidate style="grid-template-columns:1fr">
        <label class="field"><span>Order number</span><input class="input" name="number" placeholder="BS-1001" required autocomplete="off" style="text-transform:uppercase"></label>
        <label class="field"><span>Email</span><input class="input" name="email" type="email" autocomplete="email" required></label>
        <p class="err" data-track-err role="alert"></p>
        <div><button class="btn" type="submit">Find my order</button></div>
      </form>
    </div>
    <div data-track-out aria-live="polite"></div>
  </div>
</main>''')

PAGES['about.html'] = (
  'Our story | Baddie Strands', 'Baddie Strands is a Nigerian-owned luxury hair brand from Abuja, selling 100% virgin human hair since 2020.', 'about', f'''
<main id="main">
  <div class="wrap pagehead"><p class="tag">About us</p><h1 class="h1">Your Hair, <em>Your Crown</em></h1></div>
  <div class="wrap" style="padding-bottom:clamp(64px,8vw,120px)">{STORY.replace('<h2 class="h2">', '<h2 class="h2" style="font-size:clamp(30px,3vw,44px)">')}
    <div class="kgrid" style="margin-top:clamp(64px,8vw,110px)">
      <article class="kcard"><p class="kcard__n">i.</p><h3>Only hair we’d wear</h3><p>Every wig, bundle and closure is 100% virgin human hair, checked by hand in Abuja before it leaves us.</p></article>
      <article class="kcard"><p class="kcard__n">ii.</p><h3>Honest and clear</h3><p>Real lengths, real texture names, clear prices, and a person on WhatsApp who answers.</p></article>
      <article class="kcard"><p class="kcard__n">iii.</p><h3>For every queen</h3><p>For stylists and first-time wig wearers alike, in Nigeria and wherever you are in the world.</p></article>
    </div>
  </div>
</main>''')

PAGES['contact.html'] = (
  'Contact us | Baddie Strands', 'Message Baddie Strands on WhatsApp, Instagram, TikTok or email.', 'contact', '''
<main id="main">
  <div class="wrap pagehead"><p class="tag">Get in touch</p><h1 class="h1">Talk to <em>Us</em></h1><p class="lede">Questions about a unit, a custom order, or where your hair is. We usually reply within two hours in opening hours.</p></div>
  <div class="wrap contact">
    <form class="fgrid" data-contact-form novalidate>
      <label class="field"><span>Your name</span><input class="input" name="name" autocomplete="name" required></label>
      <label class="field"><span>Phone or WhatsApp</span><input class="input" name="phone" type="tel" autocomplete="tel"></label>
      <label class="field full"><span>Email</span><input class="input" name="email" type="email" autocomplete="email"><small>Add an email or a phone number so we can reply.</small></label>
      <label class="field full"><span>Message</span><textarea class="input" name="body" required placeholder="For a custom order: the length, texture and shade you want"></textarea></label>
      <p class="err full" data-contact-err role="alert"></p>
      <div class="full"><button class="btn" type="submit">Send message</button></div>
    </form>
    <div>
      <div class="reach">
        <a href="#" data-wa target="_blank" rel="noopener"><b>WhatsApp</b><span data-wa-text></span></a>
        <a href="#" data-ig target="_blank" rel="noopener"><b>Instagram</b><span data-ig-text></span></a>
        <a href="#" data-tt target="_blank" rel="noopener"><b>TikTok</b><span data-tt-text></span></a>
        <a href="#" data-mail><b>Email</b><span data-mail-text></span></a>
        <div><b>Hours</b><span data-hours-text></span></div>
      </div>
      <p style="margin-top:20px" class="open" data-open>Checking hours</p>
    </div>
  </div>
</main>''')

PAGES['404.html'] = (
  'Page not found | Baddie Strands', 'Page not found', 'missing', '''
<main id="main">
  <div class="wrap"><div class="empty" style="padding-top:clamp(56px,8vw,120px);max-width:none">
    <p class="tag">Error 404</p>
    <h1 class="display">This Page Has <em>Moved On</em></h1>
    <p class="lede">The page you’re looking for doesn’t exist, or it moved. The hair is still here.</p>
    <div class="hero__go"><a class="btn btn--go" href="shop.html">Shop the collection <i class="arw" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></i></a><a class="btn btn--line" href="index.html">Home</a></div>
  </div></div>
</main>''')

for fn, (title, desc, page, main) in PAGES.items():
    html = head(title, desc, page) + main + tail()
    if fn == '404.html':
        html = html.replace('href="assets/', 'href="/assets/').replace('src="assets/', 'src="/assets/').replace('src="config.js', 'src="/config.js').replace('content="assets/', 'content="/assets/')
    with open(os.path.join(OUT, fn), 'w', encoding='utf-8') as f:
        f.write(html)
print('pages', len(PAGES))
