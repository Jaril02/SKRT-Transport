const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { protect } = require('../../middleware/authMiddleware');

router.get('/', protect, controller.getNotifications);
router.patch('/:id/read', protect, controller.markAsRead);
router.post('/', protect, controller.createNotification);

module.exports = router;
