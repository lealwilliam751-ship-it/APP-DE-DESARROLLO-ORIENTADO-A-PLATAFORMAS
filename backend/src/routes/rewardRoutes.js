const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const authMiddleware = require('../middleware/authMiddleware');

// Public: view rewards catalog
router.get('/', rewardController.getAll);

// Protected: redeem and history
router.post('/:id/redeem', authMiddleware.authenticate, rewardController.redeem);
router.get('/history', authMiddleware.authenticate, rewardController.getHistory);

module.exports = router;
