const ecopointModel = require('../models/ecopointModel');

const ecopointController = {
  async getAll(req, res) {
    try {
      const city = req.query.city || 'Pamplona';
      const ecopoints = await ecopointModel.getAllEcoPoints(city);
      res.status(200).json({ ecopoints });
    } catch (error) {
      console.error('Error fetching ecopoints:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getNearby(req, res) {
    try {
      const { lat, lng, radius, city } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      const ecopoints = await ecopointModel.getNearbyEcoPoints(
        parseFloat(lat), 
        parseFloat(lng), 
        radius ? parseInt(radius) : 5000, 
        city || 'Pamplona'
      );
      
      res.status(200).json({ ecopoints });
    } catch (error) {
      console.error('Error fetching nearby ecopoints:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = ecopointController;
