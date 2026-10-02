const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/rankingController');
const authMiddleware = require('../middleware/authMiddleware');

// Public: Top ranking
router.get('/', rankingController.getTopRanking);

// Protected: My position
router.get('/me', authMiddleware.authenticate, rankingController.getMyRank);

module.exports = router;
