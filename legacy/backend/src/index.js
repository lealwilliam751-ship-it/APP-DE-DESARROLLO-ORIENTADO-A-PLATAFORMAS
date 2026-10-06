const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env regardless of CWD
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
const ecopointRoutes = require('./routes/ecopointRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const qrRoutes = require('./routes/qrRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const rankingRoutes = require('./routes/rankingRoutes');
const materialRoutes = require('./routes/materialRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'EcoPuntos API is running' });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/ecopoints', ecopointRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/admin', adminRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
