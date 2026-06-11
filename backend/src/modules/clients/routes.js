const express = require('express');
const router = express.Router();
const { getClients, getClientById, createClient, updateClient, deleteClient } = require('./controller');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.route('/')
  .get(protect, getClients)
  .post(protect, authorize('admin', 'manager', 'operator'), createClient);

router.route('/:id')
  .get(protect, getClientById)
  .put(protect, authorize('admin', 'manager'), updateClient)
  .delete(protect, authorize('admin'), deleteClient);

module.exports = router;
