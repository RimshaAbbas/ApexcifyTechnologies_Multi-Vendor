const { Router } = require('express');
const { getDashboard, listVendors, updateVendorStatus, listUsers, deleteUser } = require('../controllers/admin.controller');
const { authenticate, checkRole } = require('../middleware/auth');

const router = Router();
const adminGuard = [authenticate, checkRole(['ADMIN'])];

router.get('/dashboard',             ...adminGuard, getDashboard);
router.get('/vendors',               ...adminGuard, listVendors);
router.patch('/vendors/:id/status',  ...adminGuard, updateVendorStatus);
router.get('/users',                 ...adminGuard, listUsers);
router.delete('/users/:id',          ...adminGuard, deleteUser);

module.exports = router;
