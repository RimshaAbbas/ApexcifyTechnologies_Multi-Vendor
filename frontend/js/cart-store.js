import { api } from './api.js';
import { auth } from './auth.js';

// Guest cart lives in localStorage; logged-in cart lives in backend (merged on login)
const GUEST_KEY = 'guest_cart';

export const cartStore = {
  // ── Guest helpers ──────────────────────────────────────────────────────────
  getGuest() {
    return JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
  },
  saveGuest(items) {
    localStorage.setItem(GUEST_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('cart:updated'));
  },

  // ── Unified add ───────────────────────────────────────────────────────────
  async add(productId, quantity = 1) {
    if (auth.isLoggedIn()) {
      await api.put('/cart/items', { productId, quantity });
      window.dispatchEvent(new Event('cart:updated'));
    } else {
      const items = this.getGuest();
      const idx   = items.findIndex((i) => i.productId === productId);
      idx >= 0 ? (items[idx].quantity = quantity) : items.push({ productId, quantity });
      this.saveGuest(items);
    }
  },

  async remove(productId) {
    if (auth.isLoggedIn()) {
      await api.del(`/cart/items/${productId}`);
      window.dispatchEvent(new Event('cart:updated'));
    } else {
      this.saveGuest(this.getGuest().filter((i) => i.productId !== productId));
    }
  },

  // ── Merge guest → backend on login ────────────────────────────────────────
  async mergeOnLogin() {
    const items = this.getGuest();
    if (items.length) {
      await api.post('/cart/merge', { items }).catch(console.error);
      localStorage.removeItem(GUEST_KEY);
    }
  },

  // ── Count badge ───────────────────────────────────────────────────────────
  async count() {
    if (!auth.isLoggedIn()) return this.getGuest().length;
    const { data } = await api.get('/cart').catch(() => ({ data: { items: [] } }));
    return data?.items?.length ?? 0;
  },
};
