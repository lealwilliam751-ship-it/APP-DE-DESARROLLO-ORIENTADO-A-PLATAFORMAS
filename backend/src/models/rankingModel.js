const { query } = require('../config/db');

// Level thresholds
function calculateLevel(totalPoints) {
  if (totalPoints >= 10000) return 'Héroe Ecológico';
  if (totalPoints >= 5000) return 'Reciclador Oro';
  if (totalPoints >= 2000) return 'Reciclador Plata';
  if (totalPoints >= 500) return 'Reciclador Bronce';
  return 'Semilla Verde';
}

const rankingModel = {
  async getTopRanking(limit = 10, city = 'Pamplona') {
    const result = await query(
      `SELECT id, name, total_points, level, default_city
       FROM users
       WHERE role = 'Ciudadano' AND default_city = $1
       ORDER BY total_points DESC
       LIMIT $2`,
      [city, limit]
    );
    // Add ranking position and fresh level
    return result.rows.map((user, idx) => ({
      position: idx + 1,
      ...user,
      level: calculateLevel(user.total_points)
    }));
  },

  async getUserRank(userId) {
    const result = await query(
      `SELECT COUNT(*) + 1 AS rank
       FROM users
       WHERE total_points > (SELECT total_points FROM users WHERE id = $1)
         AND role = 'Ciudadano'`,
      [userId]
    );
    return parseInt(result.rows[0].rank);
  },

  // Call this after approving deliveries to update level
  async updateUserLevel(userId) {
    const userRes = await query(`SELECT total_points FROM users WHERE id = $1`, [userId]);
    if (!userRes.rows[0]) return;
    const newLevel = calculateLevel(userRes.rows[0].total_points);
    await query(`UPDATE users SET level = $1 WHERE id = $2`, [newLevel, userId]);
    return newLevel;
  }
};

module.exports = { rankingModel, calculateLevel };
