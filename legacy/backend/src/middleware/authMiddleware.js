const jwt = require('jsonwebtoken');

const authMiddleware = {
  // Validate standard user token
  authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required. Missing Bearer token' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Inject user info into request
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  },

  // Role-based authorization
  requireRole(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden. Insufficient permissions' });
      }
      
      next();
    };
  }
};

module.exports = authMiddleware;
