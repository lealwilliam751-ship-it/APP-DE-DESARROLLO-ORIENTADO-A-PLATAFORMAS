const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const authController = {
  async register(req, res) {
    try {
      const { name, email, password, role, defaultCity } = req.body;

      // Sanitize inputs
      const safeName = (name || '').trim().substring(0, 100);
      const safeEmail = (email || '').trim().toLowerCase();

      if (!safeName || !safeEmail || !password) {
        return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
      }

      // Check if user exists
      const existingUser = await userModel.getUserByEmail(safeEmail);
      if (existingUser) {
        return res.status(409).json({ error: 'El email ya está en uso' });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Public registration ALWAYS assigns 'Ciudadano' role for security
      const safeRole = 'Ciudadano';

      // Create user using sanitized values
      const user = await userModel.createUser(safeName, safeEmail, passwordHash, safeRole, defaultCity || 'Pamplona');

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'ecopuntos_jwt_secret_pamplona_2026',
        { expiresIn: '24h' }
      );

      res.status(201).json({ user, token });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user
      const user = await userModel.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Compare password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'ecopuntos_jwt_secret_pamplona_2026',
        { expiresIn: '24h' }
      );

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;

      res.status(200).json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getProfile(req, res) {
    try {
      // User id is injected by authMiddleware
      const userId = req.user.id;
      const user = await userModel.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(200).json({ user });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = authController;
