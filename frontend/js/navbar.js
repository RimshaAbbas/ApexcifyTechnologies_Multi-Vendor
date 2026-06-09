import { auth } from './auth.js';
import { cartStore } from './cart-store.js';

export async function renderNavbar(containerId = 'navbar') {
  const user     = auth.getUser();
  const isAdmin  = user?.role === 'ADMIN';
  const isVendor = user?.role === 'VENDOR';

  // Detect if we're inside /pages/ or at root
  const inPages = location.pathname.includes('/pages/');
  const root    = inPages ? '../' : '';
  const pages   = inPages ? ''    : 'pages/';

  const dashLink = isAdmin
    ? `<a href="${pages}admin-dashboard.html">Admin Console</a>`
    : isVendor
    ? `<a href="${pages}vendor-dashboard.html">Dashboard</a>`
    : user
    ? `<a href="${pages}orders.html">My Orders</a>`
    : '';

  const authLinks = user
    ? `<span style="font-size:.85rem;color:var(--text-muted);">${user.name}</span>
       <button id="logoutBtn" class="btn btn-ghost" style="padding:.35rem .9rem;font-size:.8rem;">Logout</button>`
    : `<a href="${pages}login.html" style="color:var(--text-muted);font-size:.875rem;">Login</a>
       <a href="${pages}register.html" class="btn btn-gold" style="padding:.35rem .9rem;font-size:.8rem;text-decoration:none;">Register</a>`;

  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <nav class="navbar">
      <a href="${root}index.html" class="navbar-brand">MultiVendor</a>
      <div class="navbar-links">
        <a href="${root}index.html">Shop</a>
        ${dashLink}
      </div>
      <div style="display:flex;align-items:center;gap:1rem;">
        <button id="themeToggle" title="Toggle theme" style="background:none;border:none;cursor:pointer;color:var(--text-muted);display:flex;align-items:center;padding:.25rem;font-size:1.25rem;" aria-label="Toggle theme">🌙</button>
        ${user?.role === 'CUSTOMER' ? `
        <a href="${pages}cart.html" style="position:relative;color:var(--text-muted);display:flex;align-items:center;" title="Cart">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          <span id="cartBadge" style="position:absolute;top:-6px;right:-8px;background:var(--gold);color:#0a0512;font-size:.65rem;font-weight:700;border-radius:999px;width:16px;height:16px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px var(--gold);">0</span>
        </a>` : ''}
        ${authLinks}
      </div>
    </nav>`;

  document.getElementById('logoutBtn')?.addEventListener('click', () => auth.logout());

  // Theme toggle
  const themeBtn = document.getElementById('themeToggle');
  const applyTheme = (light) => {
    document.documentElement.classList.toggle('light-theme', light);
    themeBtn.textContent = light ? '☀️' : '🌙';
  };
  applyTheme(localStorage.getItem('theme') === 'light');
  themeBtn.addEventListener('click', () => {
    const next = !document.documentElement.classList.contains('light-theme');
    localStorage.setItem('theme', next ? 'light' : 'dark');
    applyTheme(next);
  });

  await updateCartBadge();
  window.addEventListener('cart:updated', updateCartBadge);
}

async function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = await cartStore.count();
}
