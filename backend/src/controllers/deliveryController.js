const deliveryModel = require('../models/deliveryModel');

const deliveryController = {
  async create(req, res) {
    try {
      // req.user is injected by authMiddleware
      const userId = req.user.id;
      const { ecopointId, items } = req.body;

      if (!ecopointId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'ecopointId and valid items array are required' });
      }

      const delivery = await deliveryModel.createDelivery(userId, ecopointId, items);
      res.status(201).json({ message: 'Delivery registered successfully', delivery });
    } catch (error) {
      console.error('Error creating delivery:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async approve(req, res) {
    try {
      const deliveryId = req.params.id;
      const managerId = req.user.id; // Gestor de punto or Admin

      const result = await deliveryModel.approveDelivery(deliveryId, managerId);
      res.status(200).json({ message: 'Delivery approved successfully', result });
    } catch (error) {
      console.error('Error approving delivery:', error);
      if (error.message === 'Delivery not found' || error.message === 'Delivery is not pending') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getPending(req, res) {
    try {
      const ecopointId = req.query.ecopointId;
      
      if (!ecopointId) {
        return res.status(400).json({ error: 'ecopointId is required' });
      }

      const pending = await deliveryModel.getPendingByEcopoint(ecopointId);
      res.status(200).json({ pending });
    } catch (error) {
      console.error('Error fetching pending deliveries:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getMyDeliveries(req, res) {
    try {
      const userId = req.user.id;
      const deliveries = await deliveryModel.getByUser(userId);
      res.status(200).json({ deliveries });
    } catch (error) {
      console.error('Error fetching user deliveries:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = deliveryController;
