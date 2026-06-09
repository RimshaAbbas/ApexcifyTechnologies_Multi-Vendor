const { Router } = require('express');
const { checkout, listMyOrders, getOrder, listVendorOrders } = require('../controllers/order.controller');
const { authenticate, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { body } = require('express-validator');

const router = Router();

const checkoutRules = [
  body('shippingAddress.street').notEmpty().withMessage('Street is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.country').notEmpty().withMessage('Country is required'),
];

// Customer routes
router.post('/checkout', authenticate, checkRole(['CUSTOMER']), checkoutRules, validate, checkout);
router.get('/',          authenticate, checkRole(['CUSTOMER']), listMyOrders);

// Vendor route — own order items only
router.get('/vendor',    authenticate, checkRole(['VENDOR']), listVendorOrders);

// Shared — controller enforces per-role visibility
router.get('/:id',       authenticate, checkRole(['CUSTOMER', 'VENDOR', 'ADMIN']), getOrder);

module.exports = router;
