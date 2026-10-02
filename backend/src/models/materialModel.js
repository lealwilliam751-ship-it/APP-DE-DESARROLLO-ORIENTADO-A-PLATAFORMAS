const { query } = require('../config/db');

const materialModel = {
  async getAll() {
    const result = await query('SELECT id, name, points_per_kg, co2_kg_per_kg FROM materials ORDER BY id ASC');
    return result.rows;
  }
};

module.exports = materialModel;
