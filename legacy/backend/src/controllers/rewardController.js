const rewardModel = require('../models/rewardModel');

const rewardController = {
  async getAll(req, res) {
    try {
      const { category } = req.query;
      const rewards = await rewardModel.getAllRewards(category);
      res.status(200).json({ rewards });
    } catch (error) {
      console.error('Error fetching rewards:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async redeem(req, res) {
    try {
      const userId = req.user.id;
      const rewardId = parseInt(req.params.id);

      const redemption = await rewardModel.redeemReward(userId, rewardId);
      res.status(200).json({
        message: '¡Recompensa canjeada exitosamente!',
        redemption
      });
    } catch (error) {
      console.error('Redemption error:', error);
      if (['Reward not found', 'User not found', 'Reward out of stock'].includes(error.message) ||
          error.message.startsWith('Insufficient points')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const history = await rewardModel.getUserRedemptionHistory(userId);
      res.status(200).json({ history });
    } catch (error) {
      console.error('History error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = rewardController;
