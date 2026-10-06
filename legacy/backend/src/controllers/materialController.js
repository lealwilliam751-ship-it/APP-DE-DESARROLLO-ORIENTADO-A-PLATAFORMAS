const materialModel = require('../models/materialModel');

const materialController = {
  async getAll(req, res) {
    try {
      const materials = await materialModel.getAll();
      res.status(200).json({ materials });
    } catch (error) {
      console.error('Error fetching materials:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = materialController;
