const { query } = require('../config/db');

const userModel = {
  async createUser(name, email, passwordHash, role = 'Ciudadano', defaultCity = 'Pamplona') {
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, default_city, total_points, level) 
       VALUES ($1, $2, $3, $4, $5, 0, 'Semilla Verde') 
       RETURNING id, name, email, role, default_city, total_points, level, created_at`,
      [name, email, passwordHash, role, defaultCity]
    );
    return result.rows[0];
  },

  async getUserByEmail(emailOrDoc) {
    const cleanInput = (emailOrDoc || '').trim();
    const emailWithDomain = cleanInput.includes('@') ? cleanInput : `${cleanInput}@ecopuntos.com`;
    const result = await query(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(email) = LOWER($2)`,
      [cleanInput, emailWithDomain]
    );
    return result.rows[0];
  },

  async getUserById(id) {
    const result = await query(
      `SELECT id, name, email, role, default_city, total_points, level, created_at 
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }
};

module.exports = userModel;
