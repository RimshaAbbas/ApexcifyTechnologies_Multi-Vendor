const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const { sendEmail, templates } = require('../utils/email');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/v1/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password, role = 'CUSTOMER', storeName, description } = req.body;

    // Hard-block Admin creation via public signup
    if (role === 'ADMIN') return next(new AppError('Forbidden', 403));
    if (!['CUSTOMER', 'VENDOR'].includes(role)) return next(new AppError('Invalid role', 400));

    if (role === 'VENDOR' && !storeName?.trim()) {
      return next(new AppError('Store name is required for vendor accounts', 400));
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return next(new AppError('Email already in use', 409));

    if (role === 'VENDOR') {
      const storeExists = await prisma.vendor.findUnique({ where: { storeName } });
      if (storeExists) return next(new AppError('Store name already taken', 409));
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userData = {
      name, email, passwordHash, role,
      ...(role === 'VENDOR' && {
        vendor: { create: { storeName, description, status: 'PENDING' } },
      }),
    };

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        vendor: { select: { id: true, storeName: true, status: true } },
      },
    });

    sendEmail({ to: email, ...templates.welcome(name) }).catch(console.error);

    const token = signToken({ id: user.id, role: user.role });
    res.cookie('token', token, COOKIE_OPTS);
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    console.error("DETAILED_AUTH_ERROR:", err);
    next(err);
  }
}

// POST /api/v1/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { vendor: { select: { id: true, storeName: true, status: true } } },
    });
    if (!user) return next(new AppError('Invalid credentials', 401));

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return next(new AppError('Invalid credentials', 401));

    const { passwordHash: _, ...safeUser } = user;
    const token = signToken({ id: user.id, role: user.role });
    res.cookie('token', token, COOKIE_OPTS);
    res.json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error("DETAILED_AUTH_ERROR:", err);
    next(err);
  }
}

// POST /api/v1/auth/logout
function logout(_req, res) {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out' });
}

// GET /api/v1/auth/me
async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true, vendor: {
        select: { id: true, storeName: true, status: true },
      }},
    });
    if (!user) return next(new AppError('User not found', 404));
    res.json({ success: true, user });
  } catch (err) {
    console.error("DETAILED_AUTH_ERROR:", err);
    next(err);
  }
}

// POST /api/v1/auth/register-vendor
async function registerVendor(req, res, next) {
  try {
    const { name, email, password, storeName, description } = req.body;

    const [emailExists, storeExists] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.vendor.findUnique({ where: { storeName } }),
    ]);
    if (emailExists) return next(new AppError('Email already in use', 409));
    if (storeExists) return next(new AppError('Store name already taken', 409));

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name, email, passwordHash, role: 'VENDOR',
        // Schema relation is named 'vendor'
        vendor: { create: { storeName, description, status: 'PENDING' } },
      },
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        vendor: { select: { id: true, storeName: true, status: true } },
      },
    });

    const token = signToken({ id: user.id, role: user.role });
    res.cookie('token', token, COOKIE_OPTS);
    res.status(201).json({ success: true, token, user });  } catch (err) {
    console.error("DETAILED_AUTH_ERROR:", err);
    next(err);
  }
}

module.exports = { register, login, logout, me, registerVendor };