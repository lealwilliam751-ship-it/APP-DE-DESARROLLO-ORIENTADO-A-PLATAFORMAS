const { query } = require('../config/db');
const userModel = require('../models/userModel');

const adminController = {
  async getMetrics(req, res) {
    try {
      const usersRes = await query('SELECT COUNT(*) FROM users');
      const deliveriesRes = await query(`SELECT COUNT(*) as total_deliveries, COALESCE(SUM(total_points), 0) as total_points, COALESCE(SUM(total_co2), 0) as total_co2 FROM deliveries WHERE status = 'approved'`);
      const pendingRes = await query(`SELECT COUNT(*) FROM deliveries WHERE status = 'pending'`);
      const ecopointsRes = await query('SELECT COUNT(*) FROM ecopoints');

      res.status(200).json({
        metrics: {
          totalUsers: parseInt(usersRes.rows[0].count, 10),
          totalDeliveries: parseInt(deliveriesRes.rows[0].total_deliveries, 10),
          totalPoints: parseInt(deliveriesRes.rows[0].total_points, 10),
          totalCo2SavedKg: parseFloat(deliveriesRes.rows[0].total_co2),
          pendingDeliveries: parseInt(pendingRes.rows[0].count, 10),
          totalEcopoints: parseInt(ecopointsRes.rows[0].count, 10)
        }
      });
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async createGestor(req, res) {
    try {
      const { name, email, password, defaultCity } = req.body;
      const safeName = (name || '').trim();
      const safeEmail = (email || '').trim().toLowerCase();

      if (!safeName || !safeEmail || !password) {
        return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
      }

      const existingUser = await userModel.getUserByEmail(safeEmail);
      if (existingUser) {
        if (existingUser.role === 'Administrador') {
          return res.status(400).json({ error: 'No se puede cambiar el rol de un Administrador a Gestor' });
        }
        await query(`UPDATE users SET role = 'Gestor_de_Punto' WHERE id = $1`, [existingUser.id]);
        return res.status(200).json({ message: 'Usuario promovido a Gestor de Punto exitosamente' });
      }


      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(password, 10);

      const user = await userModel.createUser(safeName, safeEmail, passwordHash, 'Gestor_de_Punto', defaultCity || 'Pamplona');
      const { password_hash, ...userWithoutPass } = user;

      res.status(201).json({ message: 'Gestor de Punto creado exitosamente', user: userWithoutPass });
    } catch (error) {
      console.error('Error al crear gestor:', error);
      res.status(500).json({ error: 'Error interno al crear gestor' });
    }
  },

  async getGestores(req, res) {
    try {
      const result = await query(`SELECT id, name, email, role, default_city, created_at FROM users WHERE role = 'Gestor_de_Punto' ORDER BY id DESC`);
      res.status(200).json({ gestores: result.rows });
    } catch (error) {
      console.error('Error al obtener gestores:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }
};

module.exports = adminController;
