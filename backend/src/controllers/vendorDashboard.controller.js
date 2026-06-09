const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

const LOW_STOCK_THRESHOLD = 5;

// GET /api/v1/vendors/dashboard
async function getVendorDashboard(req, res, next) {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
    if (!vendor) return next(new AppError('Vendor profile not found', 404));

    const [salesAgg, pendingItems, lowStock, recentItems] = await Promise.all([
      // Total revenue: sum(priceAtPurchase * quantity) for this vendor
      prisma.orderItem.aggregate({
        where: { vendorId: vendor.id, order: { paymentStatus: 'PAID' } },
        _sum: { priceAtPurchase: true },
        _count: { id: true },
      }),

      // Pending fulfillment: PROCESSING orders with this vendor's items
      prisma.orderItem.count({
        where: { vendorId: vendor.id, order: { status: 'PROCESSING' } },
      }),

      // Low-stock products
      prisma.product.findMany({
        where: { vendorId: vendor.id, stockQty: { lte: LOW_STOCK_THRESHOLD } },
        select: { id: true, title: true, stockQty: true },
        orderBy: { stockQty: 'asc' },
      }),

      // Recent 10 order items
      prisma.orderItem.findMany({
        where: { vendorId: vendor.id },
        orderBy: { order: { createdAt: 'desc' } },
        take: 10,
        select: {
          id: true, quantity: true, priceAtPurchase: true,
          product: { select: { title: true } },
          order: { select: { id: true, status: true, createdAt: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue:    salesAgg._sum.priceAtPurchase ?? 0,
        totalOrders:     salesAgg._count.id,
        pendingItems,
        lowStock,
        recentItems,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getVendorDashboard };
