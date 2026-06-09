const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const { sendEmail, templates } = require('../utils/email');

// GET /api/v1/admin/dashboard
async function getDashboard(req, res, next) {
  try {
    const [totalUsers, totalVendors, pendingVendors, revenueAgg, recentOrders] = await Promise.all([
      prisma.user.count(),
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: 'PENDING' } }),
      // Platform revenue = sum of all paid orders
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, totalAmount: true, status: true, paymentStatus: true, createdAt: true,
          customer: { select: { name: true, email: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalVendors,
        pendingVendors,
        platformRevenue: revenueAgg._sum.totalAmount ?? 0,
        totalOrders:     revenueAgg._count.id,
        recentOrders,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/vendors  — list all vendors with status filter
async function listVendors(req, res, next) {
  try {
    const { status } = req.query; // PENDING | APPROVED | SUSPENDED
    const vendors = await prisma.vendor.findMany({
      where: status ? { status } : undefined,
      include: { user: { select: { name: true, email: true } },
        _count: { select: { products: true } } },
      orderBy: { id: 'desc' },
    });
    res.json({ success: true, data: vendors });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/admin/vendors/:id/status
async function updateVendorStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ['APPROVED', 'SUSPENDED', 'PENDING'];
    if (!allowed.includes(status)) return next(new AppError('Invalid status', 400));

    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: { status },
      include: { user: { select: { email: true, name: true } } },
    });

    if (status === 'APPROVED') {
      sendEmail({ to: vendor.user.email, ...templates.vendorApproved(vendor.storeName) })
        .catch(console.error);
    }

    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/admin/users
async function listUsers(req, res, next) {
  try {
    const { role, page = '1', limit = '20' } = req.query;
    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));

    const where = role ? { role } : undefined;
    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, createdAt: true,
          vendor: { select: { id: true, storeName: true, status: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({ success: true, data: users,
      meta: { total, page: pageNum, limit: pageSize, pages: Math.ceil(total / pageSize) } });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/admin/users/:id
async function deleteUser(req, res, next) {
  try {
    if (req.params.id === req.user.id) return next(new AppError('Cannot delete your own account', 400));
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard, listVendors, updateVendorStatus, listUsers, deleteUser };
