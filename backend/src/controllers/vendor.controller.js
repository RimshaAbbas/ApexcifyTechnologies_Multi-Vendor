const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// POST /api/v1/vendors/register
// Authenticated CUSTOMER registers as a vendor (status starts PENDING)
async function registerVendor(req, res, next) {
  try {
    const { storeName, description } = req.body;
    const userId = req.user.id;

    const existing = await prisma.vendor.findUnique({ where: { userId } });
    if (existing) return next(new AppError('Vendor profile already exists', 409));

    // Upgrade user role to VENDOR atomically with vendor creation
    const [vendor] = await prisma.$transaction([
      prisma.vendor.create({
        data: { userId, storeName, description },
        select: { id: true, storeName: true, description: true, status: true },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { role: 'VENDOR' },
      }),
    ]);

    res.status(201).json({ success: true, vendor });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/vendors/me
async function getMyVendorProfile(req, res, next) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.id },
      include: { _count: { select: { products: true, orderItems: true } } },
    });
    if (!vendor) return next(new AppError('Vendor profile not found', 404));
    res.json({ success: true, vendor });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/vendors/me
async function updateMyVendorProfile(req, res, next) {
  try {
    const { storeName, description } = req.body;
    const vendor = await prisma.vendor.update({
      where: { userId: req.user.id },
      data: { storeName, description },
      select: { id: true, storeName: true, description: true, logo: true, status: true },
    });
    res.json({ success: true, vendor });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerVendor, getMyVendorProfile, updateMyVendorProfile };
