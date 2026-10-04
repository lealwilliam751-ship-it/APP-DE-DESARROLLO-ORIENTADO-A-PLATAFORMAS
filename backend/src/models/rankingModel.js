const { query } = require('../config/db');

// Level thresholds
function calculateLevel(totalPoints) {
  if (totalPoints >= 1200) return 'Héroe Ambiental';
  if (totalPoints >= 800) return 'Guardián del Planeta';
  if (totalPoints >= 500) return 'Eco Guerrero';
  if (totalPoints >= 200) return 'Brote Verde';
  return 'Semilla Verde';
}

const rankingModel = {
  async getTopRanking(limit = 10, city = 'Pamplona') {
    const result = await query(
      `SELECT 
         u.id, 
         u.name, 
         u.total_points, 
         u.level, 
         u.default_city,
         ROUND(COALESCE(SUM(di.weight_kg), (u.total_points / 40.0)), 1)::float AS total_kg
       FROM users u
       LEFT JOIN deliveries d ON d.user_id = u.id AND d.status = 'approved'
       LEFT JOIN delivery_items di ON di.delivery_id = d.id
       WHERE u.role = 'Ciudadano' AND u.default_city = $1
       GROUP BY u.id, u.name, u.total_points, u.level, u.default_city
       ORDER BY u.total_points DESC
       LIMIT $2`,
      [city, limit]
    );
    // Add ranking position and fresh level
    return result.rows.map((user, idx) => ({
      position: idx + 1,
      ...user,
      total_kg: parseFloat(user.total_kg || 0),
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
