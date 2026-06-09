require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const { errorHandler } = require('./middleware/errorHandler');

// Route imports (wired up incrementally per phase)
const authRoutes    = require('./routes/auth.routes');
const userRoutes    = require('./routes/user.routes');
const vendorRoutes  = require('./routes/vendor.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes    = require('./routes/cart.routes');
const orderRoutes   = require('./routes/order.routes');
const reviewRoutes  = require('./routes/review.routes');
const adminRoutes   = require('./routes/admin.routes');

const app = express();

// ── Core middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    // Allow any localhost origin in dev; restrict to CLIENT_URL in production
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || origin === process.env.CLIENT_URL) {
      cb(null, true);
    } else {
      cb(new Error('CORS: origin not allowed'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── API routes ─────────────────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`,     authRoutes);
app.use(`${API}/users`,    userRoutes);
app.use(`${API}/vendors`,  vendorRoutes);
app.use(`${API}/products`, productRoutes);
app.use(`${API}/cart`,     cartRoutes);
app.use(`${API}/orders`,   orderRoutes);
app.use(`${API}/reviews`,  reviewRoutes);
app.use(`${API}/admin`,    adminRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`));

module.exports = app;
