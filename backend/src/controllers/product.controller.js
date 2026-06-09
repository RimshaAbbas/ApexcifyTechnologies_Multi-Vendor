const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildImageUrls(files) {
  return (files || []).map((f) => `/uploads/${f.filename}`);
}

// ── Public ────────────────────────────────────────────────────────────────────

// GET /api/v1/products
async function listProducts(req, res, next) {
  try {
    const {
      page = '1', limit = '20',
      search, category, vendorId,
      minPrice, maxPrice, minRating,
      sortBy = 'createdAt', order = 'desc',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));

    const where = {
      ...(search && {
        OR: [
          { title:       { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(category  && { category: { equals: category, mode: 'insensitive' } }),
      ...(vendorId  && { vendorId }),
      ...((minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: parseFloat(minPrice) }),
          ...(maxPrice && { lte: parseFloat(maxPrice) }),
        },
      }),
      ...(minRating && { ratingsAvg: { gte: parseFloat(minRating) } }),
    };

    const allowedSort = ['createdAt', 'price', 'ratingsAvg', 'title'];
    const sortField   = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder   = order === 'asc' ? 'asc' : 'desc';

    const [total, products] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, title: true, price: true, imageUrls: true,
          category: true, ratingsAvg: true, stockQty: true,
          vendor: { select: { id: true, storeName: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: products,
      meta: { total, page: pageNum, limit: pageSize, pages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/products/:id
async function getProduct(req, res, next) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: { select: { id: true, storeName: true, logo: true } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, rating: true, comment: true, createdAt: true,
            customer: { select: { name: true } } },
        },
      },
    });
    if (!product) return next(new AppError('Product not found', 404));
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

// ── Vendor-scoped listing ─────────────────────────────────────────────────────

// GET /api/v1/products/vendor  (authenticated vendor sees only their own)
async function getVendorProducts(req, res, next) {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id }, select: { id: true } });
    if (!vendor) return next(new AppError('Vendor profile not found', 404));

    const products = await prisma.product.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, price: true, imageUrls: true,
        category: true, ratingsAvg: true, stockQty: true, description: true,
      },
    });
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
}

// ── Vendor-scoped mutations ───────────────────────────────────────────────────

// POST /api/v1/products
async function createProduct(req, res, next) {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
    if (!vendor)          return next(new AppError('Vendor profile not found', 404));
    if (vendor.status !== 'APPROVED') return next(new AppError('Vendor account is not approved', 403));

    const { title, description, price, stockQty, category } = req.body;
    const imageUrls = buildImageUrls(req.files);

    const product = await prisma.product.create({
      data: {
        vendorId: vendor.id,
        title, description, category,
        price:    parseFloat(price),
        stockQty: parseInt(stockQty) || 0,
        imageUrls,
      },
    });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/products/:id
async function updateProduct(req, res, next) {
  try {
    await assertOwnership(req.params.id, req.user.id);

    const { title, description, price, stockQty, category } = req.body;
    const newImages = buildImageUrls(req.files);

    let imageUrls;
    if (newImages.length) {
      const existing = await prisma.product.findUnique({ where: { id: req.params.id }, select: { imageUrls: true } });
      imageUrls = [...(existing?.imageUrls || []), ...newImages].slice(0, 5);
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(title       && { title }),
        ...(description !== undefined && { description }),
        ...(category    && { category }),
        ...(price       && { price: parseFloat(price) }),
        ...(stockQty    !== undefined && { stockQty: parseInt(stockQty) }),
        ...(imageUrls   && { imageUrls }),
      },
    });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/products/:id
async function deleteProduct(req, res, next) {
  try {
    await assertOwnership(req.params.id, req.user.id);
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
}

// ── Ownership guard ───────────────────────────────────────────────────────────

// Throws AppError so callers' try/catch properly halts execution on failure.
async function assertOwnership(productId, userId) {
  const [vendor, product] = await Promise.all([
    prisma.vendor.findUnique({ where: { userId } }),
    prisma.product.findUnique({ where: { id: productId } }),
  ]);

  if (!product) throw new AppError('Product not found', 404);
  if (!vendor || product.vendorId !== vendor.id)
    throw new AppError('Forbidden: not your product', 403);
}

module.exports = { listProducts, getProduct, getVendorProducts, createProduct, updateProduct, deleteProduct };
