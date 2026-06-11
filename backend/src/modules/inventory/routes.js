const express = require('express');
const router = express.Router();
const {
  createInventory,
  getInventories,
  getInventoryById,
  updateInventory,
  deleteInventory,
  generateChallan,
  getChallan,
  updateChallan
} = require('./controller');
const { protect } = require('../../middleware/authMiddleware');

router.route('/')
  .post(protect, createInventory)
  .get(protect, getInventories);

router.route('/:id')
  .get(protect, getInventoryById)
  .put(protect, updateInventory)
  .delete(protect, deleteInventory);

router.route('/:id/challan')
  .post(protect, generateChallan)
  .get(protect, getChallan)
  .put(protect, updateChallan);

module.exports = router;
