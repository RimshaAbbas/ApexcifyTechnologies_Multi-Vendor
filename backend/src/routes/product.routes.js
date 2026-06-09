const { Router } = require('express');
const { listProducts, getProduct, getVendorProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/product.controller');
const { authenticate, checkRole } = require('../middleware/auth');
const { validate, productCreateRules, productUpdateRules } = require('../middleware/validate');
const upload = require('../utils/upload');

const router = Router();
const vendorGuard = [authenticate, checkRole(['VENDOR'])];

// Public
router.get('/', listProducts);

// /vendor must be before /:id to prevent route conflict
router.get('/vendor', ...vendorGuard, getVendorProducts);

router.get('/:id', getProduct);

router.post('/',
  ...vendorGuard,
  upload.array('images', 5),
  productCreateRules, validate,
  createProduct,
);

router.put('/:id',
  ...vendorGuard,
  upload.array('images', 5),
  productUpdateRules, validate,
  updateProduct,
);

router.delete('/:id', ...vendorGuard, deleteProduct);

module.exports = router;
