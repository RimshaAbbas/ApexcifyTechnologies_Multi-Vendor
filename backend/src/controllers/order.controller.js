const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const { sendEmail, templates } = require('../utils/email');

// POST /api/v1/orders/checkout
async function checkout(req, res, next) {
  try {
    const customerId = req.user.id;
    const { shippingAddress } = req.body; // { street, city, state, zip, country }

    // 1. Load cart
    const cart = await prisma.cart.findUnique({
      where: { customerId },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0)
      return next(new AppError('Cart is empty', 400));

    // 2. Stock validation — fail fast before touching anything
    const stockErrors = cart.items
      .filter((item) => item.product.stockQty < item.quantity)
      .map((item) => `"${item.product.title}": only ${item.product.stockQty} left (requested ${item.quantity})`);

    if (stockErrors.length)
      return next(new AppError(`Insufficient stock:\n${stockErrors.join('\n')}`, 400));

    // 3. Mock payment — always succeeds in dev; swap for real gateway here
    const paymentSucceeded = true;
    if (!paymentSucceeded) return next(new AppError('Payment failed', 402));

    // 4. Atomic transaction: create order + order items + decrement stock + clear cart
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
      0
    );

    const order = await prisma.$transaction(async (tx) => {
      // Create master order
      const newOrder = await tx.order.create({
        data: {
          customerId,
          totalAmount,
          shippingAddress,
          paymentStatus: 'PAID',
          status: 'PROCESSING',
          // Split-order: one OrderItem per product, each tagged with vendorId
          items: {
            create: cart.items.map((item) => ({
              productId:       item.productId,
              vendorId:        item.product.vendorId,
              quantity:        item.quantity,
              priceAtPurchase: item.product.price,
            })),
          },
        },
        include: { items: true },
      });

      // Decrement stock for each product
      await Promise.all(
        cart.items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stockQty: { decrement: item.quantity } },
          })
        )
      );

      // Clear the cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    // 5. Fire-and-forget confirmation email
    const user = await prisma.user.findUnique({ where: { id: customerId }, select: { email: true } });
    sendEmail({ to: user.email, ...templates.orderConfirmed(order.id) }).catch(console.error);

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/orders  — customer sees own orders
async function listMyOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: { select: { id: true, title: true, imageUrls: true } } },
        },
      },
    });
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/orders/:id
async function getOrder(req, res, next) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: { select: { id: true, title: true, imageUrls: true } } } },
      },
    });
    if (!order) return next(new AppError('Order not found', 404));

    // Customers can only see their own; vendors see orders containing their items
    const { id: userId, role } = req.user;
    if (role === 'CUSTOMER' && order.customerId !== userId)
      return next(new AppError('Forbidden', 403));

    if (role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({ where: { userId } });
      const hasItem = order.items.some((i) => i.vendorId === vendor?.id);
      if (!hasItem) return next(new AppError('Forbidden', 403));
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/orders/vendor  — vendor sees only their order items
async function listVendorOrders(req, res, next) {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
    if (!vendor) return next(new AppError('Vendor profile not found', 404));

    const items = await prisma.orderItem.findMany({
      where: { vendorId: vendor.id },
      include: {
        order: { select: { id: true, status: true, paymentStatus: true, createdAt: true, shippingAddress: true } },
        product: { select: { id: true, title: true } },
      },
      orderBy: { order: { createdAt: 'desc' } },
    });
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkout, listMyOrders, getOrder, listVendorOrders };
