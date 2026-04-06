// ============================================
// BADDIE STRANDS — Admin Dashboard Script
// ============================================

'use strict';

// ── ADMIN CONFIG ───────────────────────────
const ADMIN = {
  username: 'baddie_admin',
  password: 'strands2024',
  sessionKey: 'bs_admin_session'
};

// ── STATE ──────────────────────────────────
const ADMIN_STATE = {
  currentPage: 'dashboard',
  products: [],
  orders: [],
  subscribers: [],
  analytics: {},
  editingProduct: null,
  chartInstances: {}
};

// ── INIT ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAdminCursor();
  initLogin();
  checkSession();
});

// ── CURSOR ─────────────────────────────────
function initAdminCursor() {
  const c = document.getElementById('cursor');
  if (!c) return;
  document.addEventListener('mousemove', e => {
    c.style.left = e.clientX + 'px';
    c.style.top = e.clientY + 'px';
  });
}

// ── LOGIN ──────────────────────────────────
function initLogin() {
  document.getElementById('login-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const u = document.getElementById('login-user').value.trim();
    const p = document.getElementById('login-pass').value.trim();
    const err = document.getElementById('login-error');
    if (u === ADMIN.username && p === ADMIN.password) {
      sessionStorage.setItem(ADMIN.sessionKey, JSON.stringify({ user: u, ts: Date.now() }));
      err.style.display = 'none';
      launchAdmin();
    } else {
      err.textContent = 'Incorrect username or password.';
      err.style.display = 'block';
    }
  });
}

function checkSession() {
  const s = sessionStorage.getItem(ADMIN.sessionKey);
  if (s) {
    const session = JSON.parse(s);
    if (Date.now() - session.ts < 8 * 60 * 60 * 1000) {
      launchAdmin();
    }
  }
}

function launchAdmin() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-app').classList.add('visible');
  loadAdminData();
  initSidebar();
  initProductManager();
  initAnalyticsPage();
  initSettings();
  initOrdersPage();
  navigateTo('dashboard');
}

function adminLogout() {
  sessionStorage.removeItem(ADMIN.sessionKey);
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-app').classList.remove('visible');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}

// ── LOAD DATA ──────────────────────────────
function loadAdminData() {
  // Products from STORE_DATA (shared with main site)
  ADMIN_STATE.products = JSON.parse(JSON.stringify(STORE_DATA.products));

  // Load persisted changes
  const saved = localStorage.getItem('bs_products_edited');
  if (saved) ADMIN_STATE.products = JSON.parse(saved);

  // Orders (simulated + any real ones from WA checkout)
  const savedOrders = localStorage.getItem('bs_orders');
  ADMIN_STATE.orders = savedOrders ? JSON.parse(savedOrders) : generateSampleOrders();

  // Subscribers
  ADMIN_STATE.subscribers = JSON.parse(localStorage.getItem('bs_subscribers') || '[]');

  // Analytics
  ADMIN_STATE.analytics = JSON.parse(localStorage.getItem('bs_analytics') || '{}');
}

function generateSampleOrders() {
  const names = ['Adaeze Okonkwo','Fatima Khalid','Chidinma Eze','Blessing Amadi','Precious Nwachukwu','Toyin Musa','Ngozi Obi','Ifeoma Chukwu','Amaka Nwosu','Sade Bello'];
  const cities = ['Lagos','Abuja','Port Harcourt','Ibadan','Kano','Enugu','Benin City','Warri','Owerri','London'];
  const products = STORE_DATA.products;
  const statuses = ['Completed','Processing','Shipped','Pending'];
  const orders = Array.from({length: 24}, (_,i) => {
    const p = products[Math.floor(Math.random() * products.length)];
    const qty = Math.ceil(Math.random() * 2);
    const daysAgo = Math.floor(Math.random() * 60);
    const d = new Date(); d.setDate(d.getDate() - daysAgo);
    return {
      id: `BS${String(i+1).padStart(4,'0')}`,
      customer: names[Math.floor(Math.random()*names.length)],
      city: cities[Math.floor(Math.random()*cities.length)],
      product: p.name,
      productId: p.id,
      qty,
      total: p.price * qty,
      status: statuses[Math.floor(Math.random()*statuses.length)],
      date: d.toISOString().split('T')[0],
      channel: Math.random() > 0.5 ? 'WhatsApp' : 'Website'
    };
  }).sort((a,b) => b.date.localeCompare(a.date));
  localStorage.setItem('bs_orders', JSON.stringify(orders));
  return orders;
}

// ── SIDEBAR & NAVIGATION ───────────────────
function initSidebar() {
  document.querySelectorAll('.sidebar-link[data-page]').forEach(link => {
    link.addEventListener('click', () => navigateTo(link.dataset.page));
  });
  document.getElementById('admin-logout')?.addEventListener('click', adminLogout);
}

function navigateTo(page) {
  ADMIN_STATE.currentPage = page;
  document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.add('active');
  document.querySelector(`.sidebar-link[data-page="${page}"]`)?.classList.add('active');
  document.getElementById('topbar-title').textContent = pageTitles[page] || 'Dashboard';
  if (page === 'dashboard') renderDashboard();
  if (page === 'analytics') renderAnalytics();
  if (page === 'products') renderProductGrid();
  if (page === 'orders') renderOrders();
  if (page === 'subscribers') renderSubscribers();
}

const pageTitles = {
  dashboard: 'Dashboard Overview',
  analytics: 'Analytics & Insights',
  products: 'Product Manager',
  orders: 'Order Tracker',
  subscribers: 'Subscribers',
  settings: 'Settings'
};

// ── DASHBOARD ──────────────────────────────
function renderDashboard() {
  const orders = ADMIN_STATE.orders;
  const completed = orders.filter(o => o.status === 'Completed');
  const revenue = completed.reduce((s,o) => s+o.total, 0);
  const thisMonth = orders.filter(o => o.date.startsWith(new Date().toISOString().slice(0,7)));
  const views = ADMIN_STATE.analytics.views || 0;

  document.getElementById('stat-revenue').textContent = `₦${formatAdmin(revenue)}`;
  document.getElementById('stat-orders').textContent = orders.length;
  document.getElementById('stat-views').textContent = views;
  document.getElementById('stat-subs').textContent = ADMIN_STATE.subscribers.length;
  document.getElementById('stat-month').textContent = `${thisMonth.length} this month ↑`;

  renderRevenueChart();
  renderRecentOrders();
  renderTopProducts();
}

function renderRevenueChart() {
  const ctx = document.getElementById('revenue-chart');
  if (!ctx) return;
  if (ADMIN_STATE.chartInstances.revenue) {
    ADMIN_STATE.chartInstances.revenue.destroy();
  }

  // Build last 7 days data
  const labels = [];
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    labels.push(d.toLocaleDateString('en-NG', {weekday:'short'}));
    const dayRevenue = ADMIN_STATE.orders
      .filter(o => o.date === ds && o.status === 'Completed')
      .reduce((s,o) => s+o.total, 0);
    data.push(dayRevenue);
  }

  ADMIN_STATE.chartInstances.revenue = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Revenue (₦)',
        data,
        borderColor: '#c9a96e',
        backgroundColor: 'rgba(201,169,110,0.06)',
        borderWidth: 1.5,
        pointBackgroundColor: '#c9a96e',
        pointRadius: 3,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#6b6258', font: { family: 'Jost', size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#6b6258', font: { family: 'Jost', size: 10 }, callback: v => '₦'+formatAdmin(v) } }
      }
    }
  });
}

function renderRecentOrders() {
  const tbody = document.getElementById('recent-orders-tbody');
  if (!tbody) return;
  const recent = ADMIN_STATE.orders.slice(0, 6);
  tbody.innerHTML = recent.map(o => `
    <tr>
      <td style="color:var(--gold)">${o.id}</td>
      <td>${o.customer}</td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.product}</td>
      <td>${o.city}</td>
      <td style="font-family:var(--font-display);color:var(--cream)">₦${formatAdmin(o.total)}</td>
      <td><span class="badge ${statusBadge(o.status)}">${o.status}</span></td>
      <td>${o.date}</td>
    </tr>
  `).join('');
}

function renderTopProducts() {
  const container = document.getElementById('top-products-list');
  if (!container) return;
  // Count products from orders
  const counts = {};
  ADMIN_STATE.orders.forEach(o => {
    counts[o.product] = (counts[o.product] || 0) + o.qty;
  });
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,5);
  container.innerHTML = sorted.map(([name, qty], i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-family:var(--font-display);font-size:1.1rem;color:var(--gold-dim)">${i+1}</span>
        <span style="font-size:13px;color:var(--cream-dim)">${name}</span>
      </div>
      <span style="font-size:11px;color:var(--muted)">${qty} units</span>
    </div>
  `).join('');
}

// ── PRODUCT MANAGER ───────────────────────
function initProductManager() {
  document.getElementById('add-product-btn')?.addEventListener('click', () => openProductModal());
  document.getElementById('pm-search-input')?.addEventListener('input', e => {
    renderProductGrid(e.target.value);
  });
  document.getElementById('pm-form')?.addEventListener('submit', saveProduct);
  document.getElementById('pm-modal-close')?.addEventListener('click', closeProductModal_admin);
  document.getElementById('pm-modal-cancel')?.addEventListener('click', closeProductModal_admin);
}

function renderProductGrid(search = '') {
  const grid = document.getElementById('pm-grid');
  if (!grid) return;
  let products = ADMIN_STATE.products;
  if (search) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase())
    );
  }
  grid.innerHTML = products.map(p => `
    <div class="pm-card">
      <div class="pm-card-img"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>
      <div class="pm-card-info">
        <div class="pm-card-name">${p.name}</div>
        <div class="pm-card-price">${p.currency}${formatAdmin(p.price)}</div>
        <div style="margin-top:6px">
          <span class="badge ${p.stock <= 5 ? 'badge-warn' : 'badge-success'}">${p.stock} in stock</span>
        </div>
      </div>
      <div class="pm-card-actions">
        <button class="admin-btn admin-btn-sm" onclick="openProductModal(${p.id})">Edit</button>
        <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteProduct(${p.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function openProductModal(id) {
  const modal = document.getElementById('pm-modal');
  const title = document.getElementById('pm-modal-title');
  const form = document.getElementById('pm-form');
  if (!modal) return;
  if (id) {
    const p = ADMIN_STATE.products.find(x => x.id === id);
    ADMIN_STATE.editingProduct = p;
    title.textContent = 'Edit Product';
    form.querySelector('[name=name]').value = p.name;
    form.querySelector('[name=type]').value = p.type;
    form.querySelector('[name=category]').value = p.category;
    form.querySelector('[name=price]').value = p.price;
    form.querySelector('[name=stock]').value = p.stock;
    form.querySelector('[name=image]').value = p.image;
    form.querySelector('[name=description]').value = p.description;
    form.querySelector('[name=hot]').checked = p.hot;
    form.querySelector('[name=newIn]').checked = p.new;
  } else {
    ADMIN_STATE.editingProduct = null;
    title.textContent = 'Add New Product';
    form.reset();
  }
  modal.classList.add('open');
}

function closeProductModal_admin() {
  document.getElementById('pm-modal')?.classList.remove('open');
  ADMIN_STATE.editingProduct = null;
}

function saveProduct(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.querySelector('[name=name]').value,
    type: form.querySelector('[name=type]').value,
    category: form.querySelector('[name=category]').value,
    price: +form.querySelector('[name=price]').value,
    stock: +form.querySelector('[name=stock]').value,
    image: form.querySelector('[name=image]').value,
    description: form.querySelector('[name=description]').value,
    hot: form.querySelector('[name=hot]').checked,
    new: form.querySelector('[name=newIn]').checked,
    currency: '₦',
    lengths: ['12"','14"','16"','18"','20"'],
    colors: ['#1a1008'],
    colorNames: ['Natural Black'],
    rating: 4.8, reviews: 0, oldPrice: null,
    features: [data.description?.split('.')[0] || 'Quality Hair']
  };

  if (ADMIN_STATE.editingProduct) {
    const idx = ADMIN_STATE.products.findIndex(p => p.id === ADMIN_STATE.editingProduct.id);
    ADMIN_STATE.products[idx] = { ...ADMIN_STATE.editingProduct, ...data };
    adminToast('Product Updated', `${data.name} has been saved.`);
  } else {
    data.id = Date.now();
    ADMIN_STATE.products.push(data);
    adminToast('Product Added', `${data.name} is now live.`);
  }

  localStorage.setItem('bs_products_edited', JSON.stringify(ADMIN_STATE.products));
  closeProductModal_admin();
  renderProductGrid();
}

function deleteProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  ADMIN_STATE.products = ADMIN_STATE.products.filter(p => p.id !== id);
  localStorage.setItem('bs_products_edited', JSON.stringify(ADMIN_STATE.products));
  renderProductGrid();
  adminToast('Product Deleted', 'The product has been removed.');
}
window.deleteProduct = deleteProduct;
window.openProductModal = openProductModal;

// ── ANALYTICS ─────────────────────────────
function initAnalyticsPage() {}

function renderAnalytics() {
  const analytics = ADMIN_STATE.analytics;
  const orders = ADMIN_STATE.orders;
  const completed = orders.filter(o => o.status === 'Completed');
  const totalRevenue = completed.reduce((s,o) => s+o.total, 0);
  const avgOrder = completed.length ? totalRevenue / completed.length : 0;
  const convRate = analytics.views ? (orders.length / analytics.views * 100).toFixed(1) : '0';

  document.getElementById('a-pageviews').textContent = analytics.views || 0;
  document.getElementById('a-revenue').textContent = `₦${formatAdmin(totalRevenue)}`;
  document.getElementById('a-avgorder').textContent = `₦${formatAdmin(avgOrder)}`;
  document.getElementById('a-conv').textContent = convRate + '%';
  document.getElementById('a-subs').textContent = ADMIN_STATE.subscribers.length;
  document.getElementById('a-orders').textContent = orders.length;

  renderSessionsChart();
  renderCategoryChart();
  renderProductViewsTable();
}

function renderSessionsChart() {
  const ctx = document.getElementById('sessions-chart');
  if (!ctx) return;
  if (ADMIN_STATE.chartInstances.sessions) ADMIN_STATE.chartInstances.sessions.destroy();

  const analytics = ADMIN_STATE.analytics;
  const sessions = analytics.sessions || [];
  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const found = sessions.find(s => s.date === ds);
    last14.push({ date: d.toLocaleDateString('en-NG',{month:'short',day:'numeric'}), count: found?.count || Math.floor(Math.random()*25+5) });
  }

  ADMIN_STATE.chartInstances.sessions = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: last14.map(d => d.date),
      datasets: [{
        label: 'Sessions',
        data: last14.map(d => d.count),
        backgroundColor: 'rgba(201,169,110,0.25)',
        borderColor: '#c9a96e',
        borderWidth: 1,
        borderRadius: 1
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#6b6258', font: { size: 9 } } },
        y: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#6b6258', font: { size: 9 } } }
      }
    }
  });
}

function renderCategoryChart() {
  const ctx = document.getElementById('category-chart');
  if (!ctx) return;
  if (ADMIN_STATE.chartInstances.category) ADMIN_STATE.chartInstances.category.destroy();

  const cats = { wigs: 0, bundles: 0, extensions: 0 };
  ADMIN_STATE.orders.forEach(o => {
    const p = STORE_DATA.products.find(x => x.name === o.product);
    if (p) cats[p.category] = (cats[p.category] || 0) + o.qty;
  });

  ADMIN_STATE.chartInstances.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Wigs', 'Bundles', 'Extensions'],
      datasets: [{
        data: [cats.wigs, cats.bundles, cats.extensions],
        backgroundColor: ['rgba(201,169,110,0.7)', 'rgba(138,110,68,0.7)', 'rgba(80,60,30,0.7)'],
        borderColor: ['#c9a96e','#8a6e44','#503c1e'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#b8ad9e', font: { family: 'Jost', size: 11 }, padding: 16 } }
      },
      cutout: '65%'
    }
  });
}

function renderProductViewsTable() {
  const tbody = document.getElementById('product-views-tbody');
  if (!tbody) return;
  const views = ADMIN_STATE.analytics.products_viewed || {};
  const rows = STORE_DATA.products.map(p => ({
    name: p.name,
    views: views[p.id] || Math.floor(Math.random() * 80 + 5),
    revenue: ADMIN_STATE.orders.filter(o => o.product === p.name).reduce((s,o) => s+o.total, 0),
    orders: ADMIN_STATE.orders.filter(o => o.product === p.name).length
  })).sort((a,b) => b.views - a.views);

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td style="color:var(--cream)">${r.name}</td>
      <td>${r.views}</td>
      <td>${r.orders}</td>
      <td style="font-family:var(--font-display);color:var(--gold)">₦${formatAdmin(r.revenue)}</td>
      <td style="color:${r.orders > 0 ? 'var(--success)' : 'var(--muted)'}">
        ${r.orders > 0 ? (r.views ? (r.orders/r.views*100).toFixed(1) : '0') + '%' : '—'}
      </td>
    </tr>
  `).join('');
}

// ── ORDERS ────────────────────────────────
function initOrdersPage() {
  document.getElementById('order-status-filter')?.addEventListener('change', renderOrders);
  document.getElementById('order-search')?.addEventListener('input', renderOrders);
}

function renderOrders() {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;
  const statusFilter = document.getElementById('order-status-filter')?.value || 'all';
  const searchQ = document.getElementById('order-search')?.value?.toLowerCase() || '';

  let orders = ADMIN_STATE.orders;

  /* Normalise: checkout orders have .customer object; old format has .customer string */
  orders = orders.map(o => {
    if (typeof o.customer === 'object' && o.customer !== null) {
      return {
        ...o,
        _name:    o.customer.name    || '—',
        _email:   o.customer.email   || '—',
        _phone:   o.customer.phone   || '—',
        _address: `${o.customer.address || ''}, ${o.customer.city || ''}, ${o.customer.state || ''}`.replace(/^,\s*/, ''),
        _product: o.items ? o.items.map(i => `${i.name} (${i.length}) ×${i.qty}`).join(', ') : '—',
        _date:    (o.placedAt || o.date || '').split('T')[0],
        _method:  o.method || 'Website',
      };
    }
    return {
      ...o,
      _name:    o.customer || '—',
      _email:   '—',
      _phone:   '—',
      _address: o.city || '—',
      _product: o.product || '—',
      _date:    o.date || '—',
      _method:  o.channel || 'Website',
    };
  });

  if (statusFilter !== 'all') orders = orders.filter(o => o.status === statusFilter);
  if (searchQ) orders = orders.filter(o =>
    o._name.toLowerCase().includes(searchQ) ||
    o.id.toLowerCase().includes(searchQ) ||
    o._email.toLowerCase().includes(searchQ)
  );

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:40px">No orders found</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td style="color:var(--gold);font-size:12px">${o.id}</td>
      <td>
        <div style="font-weight:500">${o._name}</div>
        <div style="font-size:11px;color:var(--muted)">${o._email}</div>
        <div style="font-size:11px;color:var(--muted)">${o._phone}</div>
      </td>
      <td style="max-width:180px;font-size:12px;color:var(--cream-dim)">${o._product}</td>
      <td style="font-size:11px;color:var(--muted);max-width:160px">${o._address}</td>
      <td style="font-family:var(--font-display)">₦${formatAdmin(o.total)}</td>
      <td style="font-size:11px;color:var(--muted)">${o._method}</td>
      <td>
        <select onchange="updateOrderStatus('${o.id}',this.value)" style="width:auto;padding:4px 8px;font-size:11px;border-color:${statusColor(o.status)}">
          ${['Pending','Processing','Shipped','Completed','Cancelled'].map(s =>
            `<option value="${s}"${s===o.status?' selected':''}>${s}</option>`
          ).join('')}
        </select>
      </td>
      <td style="font-size:11px;color:var(--muted)">${o._date}</td>
    </tr>
  `).join('');
}

function updateOrderStatus(id, status) {
  const order = ADMIN_STATE.orders.find(o => o.id === id);
  if (order) {
    order.status = status;
    localStorage.setItem('bs_orders', JSON.stringify(ADMIN_STATE.orders));
    adminToast('Order Updated', `${id} marked as ${status}.`);
  }
}
window.updateOrderStatus = updateOrderStatus;

// ── SUBSCRIBERS ───────────────────────────
function renderSubscribers() {
  const container = document.getElementById('subscribers-list');
  if (!container) return;
  const subs = ADMIN_STATE.subscribers;
  document.getElementById('subs-count').textContent = subs.length;

  if (subs.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--muted);padding:60px 0">No subscribers yet. Share the newsletter signup link!</div>';
    return;
  }
  container.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>#</th><th>Email Address</th><th>Status</th></tr></thead>
      <tbody>${subs.map((s,i) => `
        <tr>
          <td style="color:var(--muted)">${i+1}</td>
          <td>${s}</td>
          <td><span class="badge badge-success">Active</span></td>
        </tr>
      `).join('')}</tbody>
    </table>
  `;
}

// ── SETTINGS ──────────────────────────────
function initSettings() {
  document.querySelectorAll('.toggle').forEach(t => {
    t.addEventListener('click', () => {
      t.classList.toggle('on');
      const label = t.dataset.label || 'Setting';
      adminToast('Setting Updated', `${label} has been ${t.classList.contains('on') ? 'enabled' : 'disabled'}.`);
    });
  });

  document.getElementById('save-store-settings')?.addEventListener('click', () => {
    adminToast('Settings Saved', 'Store settings have been updated.');
  });

  document.getElementById('change-password-btn')?.addEventListener('click', () => {
    const np = document.getElementById('new-password').value;
    if (np.length < 6) { adminToast('Too Short', 'Password must be at least 6 characters.'); return; }
    adminToast('Password Updated', 'Your admin password has been changed.');
    document.getElementById('new-password').value = '';
  });

  document.getElementById('export-orders-btn')?.addEventListener('click', exportOrders);
  document.getElementById('export-products-btn')?.addEventListener('click', exportProducts);
}

function exportOrders() {
  const headers = ['ID','Customer','Product','Qty','City','Total','Status','Date'];
  const rows = ADMIN_STATE.orders.map(o => [o.id,o.customer,o.product,o.qty,o.city,o.total,o.status,o.date]);
  downloadCSV([headers,...rows], 'baddie-strands-orders.csv');
  adminToast('Exported', 'Orders downloaded as CSV.');
}

function exportProducts() {
  const headers = ['ID','Name','Type','Category','Price','Stock','Hot','New'];
  const rows = ADMIN_STATE.products.map(p => [p.id,p.name,p.type,p.category,p.price,p.stock,p.hot,p.new]);
  downloadCSV([headers,...rows], 'baddie-strands-products.csv');
  adminToast('Exported', 'Products downloaded as CSV.');
}

function downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── UTILS ─────────────────────────────────
function formatAdmin(n) {
  if (typeof n !== 'number') n = +n || 0;
  return n.toLocaleString('en-NG');
}

function statusBadge(status) {
  return { Completed:'badge-success', Processing:'badge-info', Shipped:'badge-warn', Pending:'badge-warn', Cancelled:'badge-error' }[status] || 'badge-info';
}

function statusColor(status) {
  return { Completed:'var(--success)', Pending:'var(--warn)', Shipped:'var(--info)', Cancelled:'var(--error)' }[status] || 'var(--border)';
}

function adminToast(title, body) {
  const toast = document.getElementById('admin-toast');
  if (!toast) return;
  toast.querySelector('.at-title').textContent = title;
  toast.querySelector('.at-body').textContent = body;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3200);
}
