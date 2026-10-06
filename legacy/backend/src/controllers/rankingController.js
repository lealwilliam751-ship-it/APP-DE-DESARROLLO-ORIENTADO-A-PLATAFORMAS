const { rankingModel } = require('../models/rankingModel');

const rankingController = {
  async getTopRanking(req, res) {
    try {
      const { city, limit } = req.query;
      const ranking = await rankingModel.getTopRanking(
        limit ? parseInt(limit) : 10,
        city || 'Pamplona'
      );
      res.status(200).json({ ranking });
    } catch (error) {
      console.error('Ranking error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getMyRank(req, res) {
    try {
      const userId = req.user.id;
      const rank = await rankingModel.getUserRank(userId);
      const userRes = await require('../models/userModel').getUserById(userId);
      res.status(200).json({
        rank,
        user: {
          id: userRes.id,
          name: userRes.name,
          total_points: userRes.total_points,
          level: userRes.level
        }
      });
    } catch (error) {
      console.error('My rank error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = rankingController;
