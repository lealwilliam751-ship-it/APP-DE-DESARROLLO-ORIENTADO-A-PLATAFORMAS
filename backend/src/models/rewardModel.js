const { query } = require('../config/db');
const crypto = require('crypto');

const rewardModel = {
  async getAllRewards(category) {
    let sql = `SELECT id, name, description, category, point_cost, stock FROM rewards WHERE stock <> 0`;
    const params = [];
    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }
    sql += ` ORDER BY point_cost ASC`;
    const result = await query(sql, params);
    return result.rows;
  },

  async redeemReward(userId, rewardId) {
    const client = await require('../config/db').pool.connect();
    try {
      await client.query('BEGIN');

      // Get reward
      const rewardRes = await client.query(
        `SELECT * FROM rewards WHERE id = $1 FOR UPDATE`,
        [rewardId]
      );
      const reward = rewardRes.rows[0];
      if (!reward) throw new Error('Reward not found');
      if (reward.stock === 0) throw new Error('Reward out of stock');

      // Get user points
      const userRes = await client.query(
        `SELECT total_points FROM users WHERE id = $1 FOR UPDATE`,
        [userId]
      );
      const user = userRes.rows[0];
      if (!user) throw new Error('User not found');
      if (user.total_points < reward.point_cost) {
        throw new Error(`Insufficient points. You need ${reward.point_cost} but have ${user.total_points}`);
      }

      // Deduct points
      await client.query(
        `UPDATE users SET total_points = total_points - $1 WHERE id = $2`,
        [reward.point_cost, userId]
      );

      // Reduce stock if not infinite (-1)
      if (reward.stock > 0) {
        await client.query(
          `UPDATE rewards SET stock = stock - 1 WHERE id = $1`,
          [rewardId]
        );
      }

      // Generate unique redemption code
      const redemptionCode = `ECO-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      // Insert redemption record
      const redeemedRes = await client.query(
        `INSERT INTO redeemed_rewards (user_id, reward_id, points_spent, redemption_code)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userId, rewardId, reward.point_cost, redemptionCode]
      );

      // Notify the user
      await client.query(
        `INSERT INTO notifications (user_id, title, message)
         VALUES ($1, ' Recompensa Canjeada', 'Canjeaste "${reward.name}" por ${reward.point_cost} puntos. Código: ${redemptionCode}')`,
        [userId]
      );

      await client.query('COMMIT');
      return redeemedRes.rows[0];

    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  async getUserRedemptionHistory(userId) {
    const result = await query(
      `SELECT rr.id, r.name AS reward_name, rr.points_spent, rr.redemption_code, rr.redeemed_at
       FROM redeemed_rewards rr
       JOIN rewards r ON rr.reward_id = r.id
       WHERE rr.user_id = $1
       ORDER BY rr.redeemed_at DESC`,
      [userId]
    );
    return result.rows;
  }
};

module.exports = rewardModel;
