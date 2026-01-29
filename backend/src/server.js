const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const runMigrations = require('./runMigrations');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes (to be created)
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', authenticateToken, require('./routes/users.routes'));
app.use('/api/posts', require('./routes/posts.routes'));
app.use('/api/engagement', authenticateToken, require('./routes/engagement.routes'));
app.use('/api/trending', require('./routes/trending.routes'));
app.use('/api/shaxe-points', authenticateToken, require('./routes/shaxePoints.routes'));
app.use('/api/reports', authenticateToken, require('./routes/reports.routes'));

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Run migrations before starting server
runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`Shaxe backend running on port ${PORT}`);
  });
});
