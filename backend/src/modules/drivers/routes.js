const express = require('express');
const router = express.Router();
const { getDrivers, getDriverById, createDriver, createDriverEntry, getDriverEntries } = require('./controller');
const { protect } = require('../../middleware/authMiddleware');
const { requirePermission } = require('../../middleware/permissionMiddleware');

router.route('/')
  .get(protect, getDrivers)
  .post(protect, requirePermission('drivers', 'create'), createDriver);

router.route('/entry')
  .post(protect, createDriverEntry)
  .get(protect, getDriverEntries);

router.get('/:id', protect, getDriverById);

module.exports = router;
