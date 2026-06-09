const { Router } = require('express');
const { registerVendor, getMyVendorProfile, updateMyVendorProfile } = require('../controllers/vendor.controller');
const { getVendorDashboard } = require('../controllers/vendorDashboard.controller');
const { authenticate, checkRole } = require('../middleware/auth');
const { validate, vendorRegisterRules } = require('../middleware/validate');

const router = Router();
const vendorGuard = [authenticate, checkRole(['VENDOR'])];

router.post('/register',  authenticate, checkRole(['CUSTOMER']), vendorRegisterRules, validate, registerVendor);
router.get('/me',         authenticate, checkRole(['VENDOR', 'ADMIN']), getMyVendorProfile);
router.put('/me',         ...vendorGuard, updateMyVendorProfile);
router.get('/dashboard',  ...vendorGuard, getVendorDashboard);

module.exports = router;
