const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/metrics', authMiddleware.authenticate, authMiddleware.requireRole(['Administrador']), adminController.getMetrics);
router.post('/create-gestor', authMiddleware.authenticate, authMiddleware.requireRole(['Administrador']), adminController.createGestor);
router.get('/gestores', authMiddleware.authenticate, authMiddleware.requireRole(['Administrador']), adminController.getGestores);

module.exports = router;
