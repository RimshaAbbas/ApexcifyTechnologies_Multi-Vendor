import { api } from './api.js';

export const auth = {
  getUser()   { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; },
  getToken()  { return localStorage.getItem('token'); },
  isLoggedIn(){ return !!this.getToken(); },
  hasRole(r)  { return this.getUser()?.role === r; },

  save(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  clear() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Fetch fresh user profile (includes vendor) and update localStorage
  async refresh() {
    try {
      const { user } = await api.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch { return null; }
  },

  require(role = null) {
    if (!this.isLoggedIn()) {
      // Relative redirect that works regardless of static server port
      const base = location.pathname.includes('/pages/') ? '../pages/login.html' : 'pages/login.html';
      location.href = base;
      return false;
    }
    if (role && !this.hasRole(role)) {
      location.href = location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
      return false;
    }
    return true;
  },

  async logout() {
    await api.post('/auth/logout').catch(() => {});
    this.clear();
    location.href = location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
  },
};
