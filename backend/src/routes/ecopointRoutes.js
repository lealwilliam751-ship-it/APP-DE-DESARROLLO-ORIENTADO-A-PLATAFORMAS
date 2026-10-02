const express = require('express');
const router = express.Router();
const ecopointController = require('../controllers/ecopointController');

// Public routes (no auth required to see map)
router.get('/', ecopointController.getAll);
router.get('/nearby', ecopointController.getNearby);

module.exports = router;
