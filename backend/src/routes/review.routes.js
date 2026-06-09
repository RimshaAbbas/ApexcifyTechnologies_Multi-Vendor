const { Router } = require('express');
const { getProductReviews, createReview, updateReview, deleteReview } = require('../controllers/review.controller');
const { authenticate, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { body } = require('express-validator');

const router = Router();

const reviewRules = [
  body('productId').notEmpty().withMessage('productId required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
  body('comment').optional().trim(),
];

router.get('/',     getProductReviews);
router.post('/',    authenticate, checkRole(['CUSTOMER']), reviewRules, validate, createReview);
router.put('/:id',  authenticate, checkRole(['CUSTOMER']),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  validate, updateReview,
);
router.delete('/:id', authenticate, checkRole(['CUSTOMER', 'ADMIN']), deleteReview);

module.exports = router;
