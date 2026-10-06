const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const authMiddleware = require('../middleware/authMiddleware');

// User routes
router.post('/', authMiddleware.authenticate, deliveryController.create);
router.get('/my', authMiddleware.authenticate, deliveryController.getMyDeliveries);

// Point Manager & Admin routes
router.get('/pending', authMiddleware.authenticate, authMiddleware.requireRole(['Gestor_de_Punto', 'Administrador']), deliveryController.getPending);
router.patch('/:id/approve', authMiddleware.authenticate, authMiddleware.requireRole(['Gestor_de_Punto', 'Administrador']), deliveryController.approve);

module.exports = router;
