const { Router } = require('express');
const { register, login, logout, me, registerVendor } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate, authRegisterRules, authLoginRules, vendorRegisterRules } = require('../middleware/validate');

const router = Router();

router.post('/register',        authRegisterRules,                         validate, register);
router.post('/register-vendor', [...authRegisterRules, ...vendorRegisterRules], validate, registerVendor);
router.post('/login',           authLoginRules,                            validate, login);
router.post('/logout',          logout);
router.get('/me',               authenticate, me);

module.exports = router;
