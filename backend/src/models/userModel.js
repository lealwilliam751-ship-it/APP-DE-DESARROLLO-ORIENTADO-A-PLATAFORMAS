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
    const cleanInput = (emailOrDoc || '').trim().toLowerCase();
    const docMap = {
      '9001': 'admin@ecopuntos.com',
      '2002': 'gestor@ecopuntos.com',
      '1001': '1001@ecopuntos.com'
    };
    const mappedEmail = docMap[cleanInput];
    const emailWithDomain = cleanInput.includes('@') ? cleanInput : `${cleanInput}@ecopuntos.com`;

    let queryText = `
      SELECT * FROM users 
      WHERE LOWER(email) = LOWER($1) 
         OR LOWER(email) = LOWER($2)
    `;
    const params = [cleanInput, emailWithDomain];

    if (mappedEmail) {
      queryText += ` OR LOWER(email) = LOWER($${params.length + 1})`;
      params.push(mappedEmail);
    }

    if (/^\d+$/.test(cleanInput)) {
      queryText += ` OR id = $${params.length + 1}`;
      params.push(parseInt(cleanInput, 10));
    }

    const result = await query(queryText + ` LIMIT 1`, params);
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
