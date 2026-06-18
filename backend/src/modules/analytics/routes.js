const express = require('express');
const router = express.Router();
const { getDashboardStats, getDetailedAnalytics, getAnalysis } = require('./controller');
const { protect } = require('../../middleware/authMiddleware');

router.get('/dashboard', protect, getDashboardStats);
router.get('/detailed', protect, getDetailedAnalytics);
router.get('/analysis', protect, getAnalysis);

module.exports = router;
