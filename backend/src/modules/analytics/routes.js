const express = require('express');
const router = express.Router();
const { getDashboardStats, getDetailedAnalytics } = require('./controller');
const { protect } = require('../../middleware/authMiddleware');

router.get('/dashboard', protect, getDashboardStats);
router.get('/detailed', protect, getDetailedAnalytics);

module.exports = router;
