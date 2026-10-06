const QRCode = require('qrcode');
const userModel = require('../models/userModel');

const qrController = {
  async generateQR(req, res) {
    try {
      const userId = req.user.id;
      // The QR encodes the user's unique ID in a structured way
      const payload = JSON.stringify({ id: userId, app: 'ecopuntos-pamplona' });
      // Generate QR as base64 Data URL (ready to use in <img src="...">)
      const qrDataUrl = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 256
      });
      res.status(200).json({ qr: qrDataUrl, userId });
    } catch (error) {
      console.error('QR generation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async scanQR(req, res) {
    try {
      const { payload } = req.body;
      if (!payload) return res.status(400).json({ error: 'QR payload is required' });

      let parsed;
      try {
        parsed = JSON.parse(payload);
      } catch {
        return res.status(400).json({ error: 'Invalid QR payload format' });
      }

      if (!parsed.id || parsed.app !== 'ecopuntos-pamplona') {
        return res.status(400).json({ error: 'QR does not belong to EcoPuntos Pamplona' });
      }

      const citizen = await userModel.getUserById(parsed.id);
      if (!citizen) return res.status(404).json({ error: 'Citizen not found' });

      res.status(200).json({
        citizen: {
          id: citizen.id,
          name: citizen.name,
          email: citizen.email,
          total_points: citizen.total_points,
          level: citizen.level
        }
      });
    } catch (error) {
      console.error('QR scan error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = qrController;
