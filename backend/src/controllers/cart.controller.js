const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// Ensure a cart row exists for the customer, return it with items
async function getOrCreateCart(customerId) {
  return prisma.cart.upsert({
    where: { customerId },
    create: { customerId },
    update: {},
    include: {
      items: {
        include: { product: { select: { id: true, title: true, price: true, imageUrls: true, stockQty: true, vendorId: true } } },
      },
    },
  });
}

// GET /api/v1/cart
async function getCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user.id);
    res.json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/cart/items  — upsert: add or update quantity
async function upsertItem(req, res, next) {
  try {
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product)        return next(new AppError('Product not found', 404));
    if (product.stockQty < qty) return next(new AppError(`Only ${product.stockQty} units available`, 400));

    const cart = await getOrCreateCart(req.user.id);

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity: qty },
      update: { quantity: qty },
    });

    const updated = await getOrCreateCart(req.user.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/cart/items/:productId
async function removeItem(req, res, next) {
  try {
    const cart = await prisma.cart.findUnique({ where: { customerId: req.user.id } });
    if (!cart) return next(new AppError('Cart not found', 404));

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId: req.params.productId },
    });

    const updated = await getOrCreateCart(req.user.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/cart/merge  — called on login; body: { items: [{productId, quantity}] }
async function mergeGuestCart(req, res, next) {
  try {
    const { items } = req.body; // from localStorage
    if (!Array.isArray(items) || items.length === 0) {
      const cart = await getOrCreateCart(req.user.id);
      return res.json({ success: true, data: cart });
    }

    const cart = await getOrCreateCart(req.user.id);

    // Upsert each guest item; if item already exists, take the higher quantity
    await prisma.$transaction(
      items.map(({ productId, quantity }) =>
        prisma.cartItem.upsert({
          where: { cartId_productId: { cartId: cart.id, productId } },
          create: { cartId: cart.id, productId, quantity: parseInt(quantity) },
          update: { quantity: { set: parseInt(quantity) } },
        })
      )
    );

    const updated = await getOrCreateCart(req.user.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, upsertItem, removeItem, mergeGuestCart };
