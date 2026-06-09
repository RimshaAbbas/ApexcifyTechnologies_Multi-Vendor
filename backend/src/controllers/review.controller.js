const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// Recompute and persist ratings_avg + ratings_count on a product
async function recalcRatings(tx, productId) {
  const agg = await tx.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await tx.product.update({
    where: { id: productId },
    data: {
      ratingsAvg:   agg._avg.rating  ?? 0,
      ratingsCount: agg._count.rating ?? 0,
    },
  });
}

// GET /api/v1/reviews?productId=
async function getProductReviews(req, res, next) {
  try {
    const { productId } = req.query;
    if (!productId) return next(new AppError('productId required', 400));
    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, rating: true, comment: true, createdAt: true,
        customer: { select: { name: true } } },
    });
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
}

// POST /api/v1/reviews
async function createReview(req, res, next) {
  try {
    const customerId = req.user.id;
    const { productId, rating, comment } = req.body;

    const review = await prisma.$transaction(async (tx) => {
      const r = await tx.review.create({
        data: { productId, customerId, rating: parseInt(rating), comment },
        include: { customer: { select: { name: true } } },
      });
      await recalcRatings(tx, productId);
      return r;
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/reviews/:id
async function updateReview(req, res, next) {
  try {
    const existing = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!existing)                          return next(new AppError('Review not found', 404));
    if (existing.customerId !== req.user.id) return next(new AppError('Forbidden', 403));

    const { rating, comment } = req.body;
    const review = await prisma.$transaction(async (tx) => {
      const r = await tx.review.update({
        where: { id: req.params.id },
        data: {
          ...(rating  !== undefined && { rating: parseInt(rating) }),
          ...(comment !== undefined && { comment }),
        },
      });
      await recalcRatings(tx, existing.productId);
      return r;
    });

    res.json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/reviews/:id
async function deleteReview(req, res, next) {
  try {
    const existing = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(new AppError('Review not found', 404));

    const isOwner = existing.customerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) return next(new AppError('Forbidden', 403));

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: req.params.id } });
      await recalcRatings(tx, existing.productId);
    });

    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProductReviews, createReview, updateReview, deleteReview };
