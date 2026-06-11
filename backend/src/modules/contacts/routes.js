const express = require('express');
const router = express.Router();
const { getContacts, createContact } = require('./controller');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.route('/')
  .get(protect, getContacts)
  .post(protect, authorize('admin', 'manager', 'operator'), createContact);

module.exports = router;
