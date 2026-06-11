const express = require('express');
const router = express.Router();
const { 
  getVehicles, 
  getVehicleById, 
  createVehicle, 
  updateVehicle, 
  updateStatus, 
  deleteVehicle 
} = require('./controller');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.route('/')
  .get(protect, getVehicles)
  .post(protect, authorize('admin', 'manager'), createVehicle);

router.route('/:id')
  .get(protect, getVehicleById)
  .patch(protect, authorize('admin', 'manager', 'operator'), updateVehicle)
  .delete(protect, authorize('admin'), deleteVehicle);

router.route('/:id/status')
  .patch(protect, authorize('admin', 'manager', 'operator'), updateStatus);

module.exports = router;
