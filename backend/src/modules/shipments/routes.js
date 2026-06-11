const express = require('express');
const router = express.Router();
const { createShipment, getShipments, getShipmentById, updateShipment, deleteShipment, updateStatus, getNextNumber } = require('./controller');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('admin', 'manager', 'operator'), createShipment)
  .get(protect, getShipments);

router.route('/next-number')
  .get(protect, getNextNumber);

router.route('/:id')
  .get(protect, getShipmentById)
  .put(protect, authorize('admin', 'manager', 'operator'), updateShipment)
  .delete(protect, authorize('admin', 'manager', 'operator'), deleteShipment);

router.route('/:id/status')
  .patch(protect, authorize('admin', 'manager', 'operator'), updateStatus);

module.exports = router;
