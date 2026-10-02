const { query } = require('../config/db');

const deliveryModel = {
  // Get material configuration to calculate points and CO2
  async getMaterial(materialId) {
    const result = await query(
      `SELECT id, name, points_per_kg, co2_kg_per_kg FROM materials WHERE id = $1`,
      [materialId]
    );
    return result.rows[0];
  },

  // Citizen creates a pending delivery
  async createDelivery(userId, ecopointId, items) {
    const client = await require('../config/db').pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Calculate totals
      let totalPoints = 0;
      let totalCo2 = 0;
      
      // Create main delivery record
      const deliveryRes = await client.query(
        `INSERT INTO deliveries (user_id, ecopoint_id, status)
         VALUES ($1, $2, 'pending') RETURNING id`,
        [userId, ecopointId]
      );
      
      const deliveryId = deliveryRes.rows[0].id;
      
      // Insert items and calculate
      for (const item of items) {
        // Fetch material info
        const matRes = await client.query(
          `SELECT points_per_kg, co2_kg_per_kg FROM materials WHERE id = $1`,
          [item.material_id]
        );
        const material = matRes.rows[0];
        
        if (!material) throw new Error(`Material with id ${item.material_id} not found`);
        
        const pointsPerKg = parseFloat(material.points_per_kg);
        const co2PerKg = parseFloat(material.co2_kg_per_kg);
        const weightKg = parseFloat(item.weight_kg);

        const points = Math.floor(pointsPerKg * weightKg);
        const co2Saved = co2PerKg * weightKg;
        
        totalPoints += points;
        totalCo2 += co2Saved;
        
        await client.query(
          `INSERT INTO delivery_items (delivery_id, material_id, weight_kg, points, co2_saved)
           VALUES ($1, $2, $3, $4, $5)`,
          [deliveryId, item.material_id, weightKg, points, co2Saved]
        );
      }
      
      // Update delivery with calculated totals
      await client.query(
        `UPDATE deliveries SET total_points = $1, total_co2 = $2 WHERE id = $3`,
        [totalPoints, totalCo2, deliveryId]
      );
      
      await client.query('COMMIT');
      return { deliveryId, totalPoints, totalCo2, status: 'pending' };
      
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  // Point Manager or Admin approves the delivery
  async approveDelivery(deliveryId, approvedById) {
    const client = await require('../config/db').pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if delivery exists and is pending
      const deliveryRes = await client.query(
        `SELECT user_id, status, total_points FROM deliveries WHERE id = $1`,
        [deliveryId]
      );
      
      const delivery = deliveryRes.rows[0];
      
      if (!delivery) throw new Error('Delivery not found');
      if (delivery.status !== 'pending') throw new Error('Delivery is not pending');
      
      // Update delivery status
      await client.query(
        `UPDATE deliveries SET status = 'approved', updated_at = current_timestamp WHERE id = $1`,
        [deliveryId]
      );
      
      // Add points to citizen's balance
      await client.query(
        `UPDATE users SET total_points = total_points + $1 WHERE id = $2`,
        [delivery.total_points, delivery.user_id]
      );

      // Create notification for user
      await client.query(
        `INSERT INTO notifications (user_id, title, message)
         VALUES ($1, ' Entrega Aprobada', 'Tu entrega ha sido aprobada. Ganaste ' || $2 || ' puntos.')`,
        [delivery.user_id, delivery.total_points]
      );

      // Recalculate user level based on new total
      const { calculateLevel } = require('./rankingModel');
      const userPtsRes = await client.query(`SELECT total_points FROM users WHERE id = $1`, [delivery.user_id]);
      const newLevel = calculateLevel(userPtsRes.rows[0].total_points);
      await client.query(`UPDATE users SET level = $1 WHERE id = $2`, [newLevel, delivery.user_id]);
      
      await client.query('COMMIT');
      return { success: true, addedPoints: delivery.total_points, newLevel };
      
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  // Get pending deliveries for a specific ecopoint
  async getPendingByEcopoint(ecopointId) {
    const result = await query(
      `SELECT d.id, d.total_points, d.total_co2, d.created_at, u.name as citizen_name
       FROM deliveries d
       JOIN users u ON d.user_id = u.id
       WHERE d.ecopoint_id = $1 AND d.status = 'pending'
       ORDER BY d.created_at ASC`,
      [ecopointId]
    );
    return result.rows;
  },

  // Get deliveries for a specific citizen
  async getByUser(userId) {
    const result = await query(
      `SELECT d.id, d.status, d.total_points, d.total_co2, d.created_at, e.name as ecopoint_name
       FROM deliveries d
       JOIN ecopoints e ON d.ecopoint_id = e.id
       WHERE d.user_id = $1
       ORDER BY d.created_at DESC`,
      [userId]
    );
    return result.rows;
  }
};

module.exports = deliveryModel;
