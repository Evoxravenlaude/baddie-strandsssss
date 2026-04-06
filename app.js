// ============================================
// BADDIE STRANDS — Main Application Script
// ============================================

'use strict';

// ── STATE ──────────────────────────────────
const STATE = {
  cart: JSON.parse(localStorage.getItem('bs_cart') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('bs_wishlist') || '[]'),
  currentFilter: 'all',
  searchOpen: false,
  cartOpen: false,
  currentModal: null,
  quizStep: 0,
  quizAnswers: [],
  testSlide: 0,
  modalQty: 1,
  modalLength: null,
};

// ── INIT ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initNav();
  initProducts();
  initKnowledge();
  initQuiz();
  initTestimonials();
  initCart();
  initSearch();
  initReveal();
  initNewsletterForm();
  initContactForm();
  initDelivery();
  initTicker();
  updateCartUI();
  recordPageView();
});

// ── ANALYTICS ─────────────────────────────
function recordPageView() {
  const analytics = JSON.parse(localStorage.getItem('bs_analytics') || '{"views":0,"sessions":[],"products_viewed":{}}');
  analytics.views++;
  const today = new Date().toISOString().split('T')[0];
  const existing = analytics.sessions.find(s => s.date === today);
  if (existing) {
    existing.count++;
  } else {
    analytics.sessions.push({ date: today, count: 1 });
    if (analytics.sessions.length > 30) analytics.sessions.shift();
  }
  localStorage.setItem('bs_analytics', JSON.stringify(analytics));
}

// ── CUSTOM CURSOR ──────────────────────────
function initCursor() {
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!cursor || !ring) return;
  let cx = 0, cy = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => {
    cx = e.clientX; cy = e.clientY;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';
  });
  function animateRing() {
    rx += (cx - rx) * 0.12;
    ry += (cy - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();
  document.querySelectorAll('a, button, .product-card, .filter-btn, .k-tab, .quiz-opt').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(2)';
      ring.style.transform = 'translate(-50%,-50%) scale(0.6)';
      ring.style.borderColor = 'rgba(201,169,110,0.8)';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      ring.style.transform = 'translate(-50%,-50%) scale(1)';
      ring.style.borderColor = 'rgba(201,169,110,0.5)';
    });
  });
}

// ── NAVIGATION ────────────────────────────
function initNav() {
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('nav-hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileClose = document.getElementById('mobile-nav-close');
  const searchBtn = document.getElementById('search-btn');
  const cartBtn = document.getElementById('cart-btn');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });

  hamburger?.addEventListener('click', () => mobileNav.classList.add('open'));
  mobileClose?.addEventListener('click', () => mobileNav.classList.remove('open'));
  searchBtn?.addEventListener('click', openSearch);
  cartBtn?.addEventListener('click', openCart);

  document.querySelectorAll('.mobile-nav-link').forEach(a => {
    a.addEventListener('click', () => mobileNav.classList.remove('open'));
  });
}

// ── PRODUCTS ─────────────────────────────
function initProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  renderProducts('all');

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.currentFilter = btn.dataset.filter;
      renderProducts(STATE.currentFilter);
    });
  });

  document.getElementById('load-more-btn')?.addEventListener('click', () => {
    showToast('Full Catalogue', 'All products are now shown. Contact us for custom orders!');
  });
}

function renderProducts(filter) {
  const grid = document.getElementById('products-grid');
  let products = STORE_DATA.products;
  if (filter !== 'all') {
    products = products.filter(p => p.category === filter);
  }
  grid.innerHTML = products.map(p => productCard(p)).join('');
  grid.querySelectorAll('.product-card').forEach((card, i) => {
    card.style.animationDelay = (i * 0.05) + 's';
    card.classList.add('reveal', 'in-view');
  });
  attachProductEvents();
}

function productCard(p) {
  const stars = '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating));
  const swatches = p.colors.map((c, i) =>
    `<div class="swatch" style="background:${c}" title="${p.colorNames[i]}"></div>`
  ).join('');
  return `
  <div class="product-card" data-id="${p.id}">
    <div class="product-image-wrap">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
      <div class="product-badges">
        ${p.hot ? '<span class="product-badge hot">Bestseller</span>' : ''}
        ${p.new ? '<span class="product-badge">New In</span>' : ''}
        ${p.oldPrice ? '<span class="product-badge">Sale</span>' : ''}
      </div>
      <div class="product-actions">
        <button class="product-action-btn" onclick="toggleWishlist(${p.id})">♡ Wish</button>
        <button class="product-action-btn cart-btn" onclick="quickAddToCart(${p.id})">Add to Cart</button>
        <button class="product-action-btn" onclick="openProductModal(${p.id})">View</button>
      </div>
    </div>
    <div class="product-info">
      <div class="product-type">${p.type}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-meta">
        <div>
          <span class="product-price">${p.currency}${formatNum(p.price)}</span>
          ${p.oldPrice ? `<span class="product-price-old">${p.currency}${formatNum(p.oldPrice)}</span>` : ''}
        </div>
        <div class="product-rating">${stars}</div>
      </div>
      <div class="product-swatches">${swatches}</div>
    </div>
  </div>`;
}

function attachProductEvents() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', e => {
      if (!e.target.closest('button')) {
        openProductModal(+card.dataset.id);
      }
    });
  });
}

// ── PRODUCT MODAL ─────────────────────────
function openProductModal(id) {
  const p = STORE_DATA.products.find(x => x.id === id);
  if (!p) return;
  STATE.currentModal = p;
  STATE.modalQty = 1;
  STATE.modalLength = p.lengths[0];

  const modal = document.getElementById('product-modal');
  modal.querySelector('#modal-img').src = p.image;
  modal.querySelector('#modal-tag').textContent = p.type;
  modal.querySelector('#modal-name').textContent = p.name;
  modal.querySelector('#modal-price').textContent = `${p.currency}${formatNum(p.price)}`;
  modal.querySelector('#modal-desc').textContent = p.description;
  modal.querySelector('#modal-qty-val').textContent = STATE.modalQty;

  // Lengths
  const lengthsWrap = modal.querySelector('#modal-lengths');
  lengthsWrap.innerHTML = p.lengths.map(l =>
    `<button class="length-opt${l === STATE.modalLength ? ' active' : ''}" data-length="${l}">${l}</button>`
  ).join('');
  lengthsWrap.querySelectorAll('.length-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      lengthsWrap.querySelectorAll('.length-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.modalLength = btn.dataset.length;
    });
  });

  // Features
  modal.querySelector('#modal-features').innerHTML = p.features.map(f =>
    `<div class="modal-feature">${f}</div>`
  ).join('');

  // Qty controls
  modal.querySelector('#modal-qty-minus').onclick = () => {
    if (STATE.modalQty > 1) {
      STATE.modalQty--;
      modal.querySelector('#modal-qty-val').textContent = STATE.modalQty;
    }
  };
  modal.querySelector('#modal-qty-plus').onclick = () => {
    STATE.modalQty++;
    modal.querySelector('#modal-qty-val').textContent = STATE.modalQty;
  };
  modal.querySelector('#modal-add-cart').onclick = () => {
    addToCart(p, STATE.modalQty, STATE.modalLength);
    closeProductModal();
    openCart();
  };
  modal.querySelector('#modal-whatsapp').onclick = () => {
    const msg = `Hi Baddie Strands! I'm interested in the *${p.name}* (${STATE.modalLength}). Can you help me?`;
    window.open(`https://wa.me/2347033247980?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Analytics
  const analytics = JSON.parse(localStorage.getItem('bs_analytics') || '{"views":0,"sessions":[],"products_viewed":{}}');
  analytics.products_viewed[p.id] = (analytics.products_viewed[p.id] || 0) + 1;
  localStorage.setItem('bs_analytics', JSON.stringify(analytics));

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  document.getElementById('product-modal')?.classList.remove('open');
  document.body.style.overflow = '';
}

window.openProductModal = openProductModal;

// ── CART ──────────────────────────────────
function initCart() {
  document.getElementById('cart-close')?.addEventListener('click', closeCart);
  document.getElementById('cart-overlay')?.addEventListener('click', closeCart);
  document.getElementById('modal-overlay')?.addEventListener('click', closeProductModal);
  document.getElementById('modal-close')?.addEventListener('click', closeProductModal);
  document.getElementById('checkout-btn')?.addEventListener('click', initiateCheckout);
}

function openCart() {
  document.getElementById('cart-drawer')?.classList.add('open');
  document.getElementById('cart-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  STATE.cartOpen = true;
  renderCartItems();
}

function closeCart() {
  document.getElementById('cart-drawer')?.classList.remove('open');
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
  STATE.cartOpen = false;
}

function addToCart(product, qty = 1, length = null) {
  const key = `${product.id}_${length}`;
  const existing = STATE.cart.find(i => i.key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    STATE.cart.push({
      key, id: product.id, name: product.name,
      type: product.type, price: product.price,
      currency: product.currency, image: product.image,
      length: length || product.lengths[0], qty
    });
  }
  saveCart();
  updateCartUI();
  showToast('Added to Cart', `${product.name} ${length ? `(${length})` : ''} is in your bag.`);
}

function quickAddToCart(id) {
  const p = STORE_DATA.products.find(x => x.id === id);
  if (p) addToCart(p, 1, p.lengths[0]);
}

window.quickAddToCart = quickAddToCart;

function removeFromCart(key) {
  STATE.cart = STATE.cart.filter(i => i.key !== key);
  saveCart(); updateCartUI(); renderCartItems();
}
window.removeFromCart = removeFromCart;

function updateCartQty(key, delta) {
  const item = STATE.cart.find(i => i.key === key);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(); updateCartUI(); renderCartItems();
}
window.updateCartQty = updateCartQty;

function saveCart() {
  localStorage.setItem('bs_cart', JSON.stringify(STATE.cart));
}

function updateCartUI() {
  const total = STATE.cart.reduce((s, i) => s + i.qty, 0);
  const counter = document.getElementById('cart-count');
  if (counter) {
    counter.textContent = total;
    counter.classList.toggle('visible', total > 0);
  }
}

function renderCartItems() {
  const container = document.getElementById('cart-items');
  if (!container) return;
  if (STATE.cart.length === 0) {
    container.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛍</div><div>Your bag is empty</div><div>Explore our collection and treat yourself.</div></div>`;
    document.getElementById('cart-subtotal').textContent = '₦0';
    document.getElementById('cart-total').textContent = '₦0';
    return;
  }
  container.innerHTML = STATE.cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img"><img src="${item.image}" alt="${item.name}"></div>
      <div>
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-type">${item.type} · ${item.length}</div>
        <div class="cart-item-price">${item.currency}${formatNum(item.price)}</div>
        <div class="cart-qty">
          <button class="qty-btn" onclick="updateCartQty('${item.key}',-1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="updateCartQty('${item.key}',1)">+</button>
        </div>
      </div>
      <button class="cart-remove" onclick="removeFromCart('${item.key}')">×</button>
    </div>
  `).join('');

  const subtotal = STATE.cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('cart-subtotal').textContent = `₦${formatNum(subtotal)}`;
  document.getElementById('cart-total').textContent = `₦${formatNum(subtotal)}`;
}

function initiateCheckout() {
  if (STATE.cart.length === 0) {
    showToast('Empty Cart', 'Please add items before checking out.');
    return;
  }
  const items = STATE.cart.map(i => `• ${i.name} (${i.length}) x${i.qty} - ₦${formatNum(i.price * i.qty)}`).join('\n');
  const total = STATE.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const msg = `Hi Baddie Strands! I'd like to order:\n\n${items}\n\n*Total: ₦${formatNum(total)}*\n\nPlease confirm availability and delivery details. Thank you! 🖤`;
  window.open(`https://wa.me/2347033247980?text=${encodeURIComponent(msg)}`, '_blank');
}

// ── WISHLIST ──────────────────────────────
function toggleWishlist(id) {
  const idx = STATE.wishlist.indexOf(id);
  if (idx === -1) {
    STATE.wishlist.push(id);
    showToast('Saved to Wishlist', 'Item added to your wishlist.');
  } else {
    STATE.wishlist.splice(idx, 1);
    showToast('Removed', 'Item removed from wishlist.');
  }
  localStorage.setItem('bs_wishlist', JSON.stringify(STATE.wishlist));
}
window.toggleWishlist = toggleWishlist;

// ── SEARCH ────────────────────────────────
function initSearch() {
  const overlay = document.getElementById('search-overlay');
  const input = document.getElementById('search-input');
  const closeBtn = document.getElementById('search-close');

  closeBtn?.addEventListener('click', closeSearch);
  overlay?.addEventListener('click', e => {
    if (e.target === overlay) closeSearch();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSearch(); closeProductModal(); }
    if (e.key === '/' && !STATE.searchOpen) { e.preventDefault(); openSearch(); }
  });

  input?.addEventListener('input', debounce(handleSearch, 300));
}

function openSearch() {
  document.getElementById('search-overlay')?.classList.add('open');
  setTimeout(() => document.getElementById('search-input')?.focus(), 100);
  STATE.searchOpen = true;
  document.body.style.overflow = 'hidden';
}

function closeSearch() {
  document.getElementById('search-overlay')?.classList.remove('open');
  STATE.searchOpen = false;
  document.body.style.overflow = '';
}

function handleSearch(e) {
  const q = e.target.value.toLowerCase().trim();
  const container = document.getElementById('search-results');
  if (!container) return;
  if (!q) { container.innerHTML = ''; return; }

  const results = STORE_DATA.products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.type.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  );

  if (results.length === 0) {
    container.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:20px 0;">No products found. Try another search.</div>';
    return;
  }

  container.innerHTML = results.map(p => `
    <div class="search-result-item" onclick="closeSearch();openProductModal(${p.id})">
      <div class="search-result-img"><img src="${p.image}" alt="${p.name}"></div>
      <div>
        <div class="search-result-name">${p.name}</div>
        <div class="search-result-price">${p.currency}${formatNum(p.price)}</div>
      </div>
    </div>
  `).join('');
}

// ── KNOWLEDGE HUB ─────────────────────────
function initKnowledge() {
  // Basics tab
  const basicsGrid = document.getElementById('knowledge-basics');
  if (basicsGrid) {
    basicsGrid.innerHTML = STORE_DATA.knowledge.basics.map(card => `
      <div class="knowledge-card reveal">
        <div class="k-card-num">${card.num}</div>
        <div class="k-card-title">${card.title}</div>
        <div class="k-card-body">${card.body}</div>
        <div class="k-card-link">${card.link} →</div>
      </div>
    `).join('');
  }

  // Care guide
  const care = STORE_DATA.knowledge.care;
  const guideNav = document.getElementById('guide-nav');
  const guidePanels = document.getElementById('guide-panels');

  if (guideNav && guidePanels) {
    const steps = Object.keys(care);
    guideNav.innerHTML = steps.map((step, i) => `
      <div class="guide-nav-item${i === 0 ? ' active' : ''}" data-step="${step}">${step}</div>
    `).join('');
    guidePanels.innerHTML = steps.map((step, i) => `
      <div class="guide-panel${i === 0 ? ' active' : ''}" data-panel="${step}">
        <div class="guide-steps">
          ${care[step].map(s => `
            <div class="guide-step">
              <div class="guide-step-num"></div>
              <div>
                <div class="guide-step-title">${s.title}</div>
                <div class="guide-step-body">${s.body}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
    guideNav.querySelectorAll('.guide-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        guideNav.querySelectorAll('.guide-nav-item').forEach(x => x.classList.remove('active'));
        guidePanels.querySelectorAll('.guide-panel').forEach(x => x.classList.remove('active'));
        item.classList.add('active');
        guidePanels.querySelector(`[data-panel="${item.dataset.step}"]`)?.classList.add('active');
      });
    });
  }

  // Tabs
  document.querySelectorAll('.k-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.k-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.knowledge-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`k-${tab.dataset.tab}`)?.classList.add('active');
    });
  });
}

// ── QUIZ ──────────────────────────────────
function initQuiz() {
  STATE.quizStep = 0;
  STATE.quizAnswers = [];
  renderQuizStep();

  document.getElementById('quiz-next')?.addEventListener('click', () => {
    if (STATE.quizAnswers[STATE.quizStep] === undefined) {
      showToast('Select an Option', 'Please pick an answer to continue.');
      return;
    }
    if (STATE.quizStep < STORE_DATA.quiz.length - 1) {
      STATE.quizStep++;
      renderQuizStep();
    } else {
      showQuizResult();
    }
  });

  document.getElementById('quiz-back')?.addEventListener('click', () => {
    if (STATE.quizStep > 0) {
      STATE.quizStep--;
      renderQuizStep();
    }
  });

  document.getElementById('quiz-restart')?.addEventListener('click', () => {
    STATE.quizStep = 0;
    STATE.quizAnswers = [];
    document.getElementById('quiz-form').style.display = 'block';
    document.getElementById('quiz-result').classList.remove('visible');
    renderQuizStep();
  });
}

function renderQuizStep() {
  const q = STORE_DATA.quiz[STATE.quizStep];
  document.getElementById('quiz-question').textContent = q.q;

  const opts = document.getElementById('quiz-options');
  opts.innerHTML = q.options.map((opt, i) => `
    <button class="quiz-opt${STATE.quizAnswers[STATE.quizStep] === i ? ' selected' : ''}" data-i="${i}">${opt}</button>
  `).join('');
  opts.querySelectorAll('.quiz-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      opts.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      STATE.quizAnswers[STATE.quizStep] = +btn.dataset.i;
    });
  });

  // Progress
  const bars = document.querySelectorAll('.quiz-progress-bar');
  bars.forEach((bar, i) => bar.classList.toggle('done', i <= STATE.quizStep));

  document.getElementById('quiz-step-label').textContent = `${STATE.quizStep + 1} / ${STORE_DATA.quiz.length}`;
  document.getElementById('quiz-back').style.visibility = STATE.quizStep === 0 ? 'hidden' : 'visible';
  const nextBtn = document.getElementById('quiz-next');
  nextBtn.textContent = STATE.quizStep === STORE_DATA.quiz.length - 1 ? 'See My Matches →' : 'Next →';
}

function showQuizResult() {
  // Simple matching logic based on answers
  const budget = STATE.quizAnswers[4]; // 0=cheapest, 3=no limit
  const lifestyle = STATE.quizAnswers[0];
  const texture = STATE.quizAnswers[2];

  let recommended = [];
  if (texture === 0) recommended = [5, 9]; // straight
  else if (texture === 1) recommended = [2, 8]; // wavy
  else if (texture === 2) recommended = [3, 7]; // curly
  else recommended = [4, 11]; // coily

  // Filter by budget
  const budgetCap = [50000, 80000, 120000, Infinity][budget];
  const matches = STORE_DATA.products.filter(p => p.price <= budgetCap)
    .sort(() => Math.random() - 0.5).slice(0, 2);

  const result = document.getElementById('quiz-result');
  result.querySelector('#quiz-result-desc').textContent = getQuizDesc(lifestyle, texture);
  result.querySelector('#quiz-result-products').innerHTML = matches.map(p => `
    <div class="quiz-result-card" onclick="openProductModal(${p.id})" style="cursor:pointer">
      <div class="quiz-result-card-name">${p.name}</div>
      <div class="quiz-result-card-price">${p.currency}${formatNum(p.price)}</div>
    </div>
  `).join('');

  document.getElementById('quiz-form').style.display = 'none';
  result.classList.add('visible');
}

function getQuizDesc(lifestyle, texture) {
  const ls = ['active', 'professional', 'social', 'relaxed'][lifestyle] || 'versatile';
  const tx = ['sleek straight', 'natural wavy', 'bouncy curly', 'authentic coily'][texture] || 'beautiful';
  return `Based on your ${ls} lifestyle, here are your perfect ${tx} matches — curated just for you.`;
}

// ── TESTIMONIALS ──────────────────────────
function initTestimonials() {
  const track = document.getElementById('testimonials-track');
  if (!track) return;

  track.innerHTML = STORE_DATA.testimonials.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-quote">"</div>
      <div class="testimonial-body">${t.body}</div>
      <div class="testimonial-author">
        <div class="testimonial-avatar">${t.avatar}</div>
        <div>
          <div class="testimonial-name">${t.name}</div>
          <div class="testimonial-location">${t.location}</div>
          <div class="testimonial-stars">${'★'.repeat(t.stars)}</div>
        </div>
      </div>
    </div>
  `).join('');

  let idx = 0;
  const cards = track.children;
  const total = cards.length;

  function goTo(n) {
    idx = Math.max(0, Math.min(n, total - 1));
    const offset = idx * (cards[0].offsetWidth + 2);
    track.style.transform = `translateX(-${offset}px)`;
    STATE.testSlide = idx;
  }

  document.getElementById('t-prev')?.addEventListener('click', () => goTo(idx - 1));
  document.getElementById('t-next')?.addEventListener('click', () => goTo(idx + 1));

  // Auto-advance
  setInterval(() => {
    idx = (idx + 1) % total;
    const offset = idx * (cards[0].offsetWidth + 2);
    track.style.transform = `translateX(-${offset}px)`;
  }, 5000);
}

// ── DELIVERY ─────────────────────────────
function initDelivery() {
  const localEl = document.getElementById('delivery-local');
  const intlEl = document.getElementById('delivery-intl');

  if (localEl) {
    localEl.innerHTML = DELIVERY.local.map(z => `
      <div class="delivery-zone">
        <span class="zone-name">${z.zone}</span>
        <span class="zone-time">${z.time}</span>
        <span class="zone-price">${z.price}</span>
      </div>
    `).join('');
  }
  if (intlEl) {
    intlEl.innerHTML = DELIVERY.international.map(z => `
      <div class="delivery-zone">
        <span class="zone-name">${z.zone}</span>
        <span class="zone-time">${z.time}</span>
        <span class="zone-price">${z.price}</span>
      </div>
    `).join('');
  }
}

// ── TICKER ───────────────────────────────
function initTicker() {
  const ticker = document.getElementById('hero-ticker-inner');
  if (!ticker) return;
  const items = [
    'Free delivery on Lagos orders above ₦100k',
    'Worldwide shipping now available',
    '100% Virgin Human Hair',
    'HD Lace — Undetectable on all skin tones',
    'Pay on delivery available in Lagos',
    'Baddie Strands — Where Queens Are Made',
  ];
  // Duplicate for seamless loop
  const doubled = [...items, ...items].map(t =>
    `<span class="ticker-item"><span class="ticker-dot"></span>${t}</span>`
  ).join('');
  ticker.innerHTML = doubled;
}

// ── REVEAL ON SCROLL ─────────────────────
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in-view'); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ── NEWSLETTER ───────────────────────────
function initNewsletterForm() {
  document.getElementById('newsletter-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const email = e.target.querySelector('input').value;
    if (!email) return;
    // Save to local storage
    const subs = JSON.parse(localStorage.getItem('bs_subscribers') || '[]');
    if (!subs.includes(email)) subs.push(email);
    localStorage.setItem('bs_subscribers', JSON.stringify(subs));
    showToast('Subscribed! 🖤', 'Welcome to the Baddie Strands inner circle.');
    e.target.reset();
  });
}

// ── CONTACT FORM ─────────────────────────
function initContactForm() {
  document.getElementById('contact-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(e.target);
    const name = data.get('name') || '';
    const email = data.get('email') || '';
    const msg = data.get('message') || '';
    const wa = `Hi Baddie Strands!\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${msg}`;
    window.open(`https://wa.me/2347033247980?text=${encodeURIComponent(wa)}`, '_blank');
    showToast('Message Sent!', 'We\'ll respond within 24 hours via WhatsApp or email.');
    e.target.reset();
  });
}

// ── TOAST ─────────────────────────────────
function showToast(title, body) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.querySelector('.toast-title').textContent = title;
  toast.querySelector('.toast-body').textContent = body;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ── UTILS ─────────────────────────────────
function formatNum(n) {
  return n.toLocaleString('en-NG');
}

function debounce(fn, ms) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}
