const { Router } = require('express');
const { getCart, upsertItem, removeItem, mergeGuestCart } = require('../controllers/cart.controller');
const { authenticate, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { body } = require('express-validator');

const router = Router();
const customerGuard = [authenticate, checkRole(['CUSTOMER'])];

router.get('/',                  ...customerGuard, getCart);
router.put('/items',             ...customerGuard,
  body('productId').notEmpty().withMessage('productId required'),
  body('quantity').isInt({ min: 1 }).withMessage('quantity must be >= 1'),
  validate, upsertItem,
);
router.delete('/items/:productId', ...customerGuard, removeItem);
router.post('/merge',            ...customerGuard, mergeGuestCart);

module.exports = router;
