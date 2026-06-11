const express = require('express');
const router = express.Router();
const { getExpenses, createExpense } = require('./controller');
const { protect } = require('../../middleware/authMiddleware');

router.route('/')
  .get(protect, getExpenses)
  .post(protect, createExpense);

module.exports = router;
