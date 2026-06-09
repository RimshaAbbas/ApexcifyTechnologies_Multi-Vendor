const { body, validationResult } = require('express-validator');

/** Runs after validator chains — collects errors and passes them to errorHandler */
function validate(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('Validation failed');
    err.type = 'validation';
    err.errors = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(err);
  }
  next();
}

// ── Reusable chains ───────────────────────────────────────────────────────────

const authRegisterRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const authLoginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const vendorRegisterRules = [
  body('storeName').trim().notEmpty().withMessage('Store name is required'),
  body('description').optional().trim(),
];

const productCreateRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('stockQty').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

const productUpdateRules = [
  body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
  body('stockQty').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

module.exports = {
  validate,
  authRegisterRules,
  authLoginRules,
  vendorRegisterRules,
  productCreateRules,
  productUpdateRules,
};
