const express = require('express');
const router = express.Router();
const { getInvoices, createInvoice } = require('./controller');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.route('/')
  .get(protect, getInvoices)
  .post(protect, authorize('admin', 'manager', 'operator'), createInvoice);

module.exports = router;
