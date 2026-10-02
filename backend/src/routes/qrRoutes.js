const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const authMiddleware = require('../middleware/authMiddleware');

// Generate QR for the authenticated citizen
router.get('/generate', authMiddleware.authenticate, qrController.generateQR);

// Scan a QR (Point Managers only)
router.post('/scan', authMiddleware.authenticate, authMiddleware.requireRole(['Gestor_de_Punto', 'Administrador']), qrController.scanQR);

module.exports = router;
