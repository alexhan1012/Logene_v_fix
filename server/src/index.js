require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const initDatabase = require('./db/init');
const { apiLimiter, writeLimiter } = require('./middleware/rateLimiter');

const knowledgeRoutes = require('./routes/knowledge');
const searchRoutes = require('./routes/search');
const settingsRoutes = require('./routes/settings');

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Static files
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Routes
app.use('/api/knowledge', apiLimiter, knowledgeRoutes);
app.use('/api/search', writeLimiter, searchRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);
app.use('/api/models', (req, res) => {
  // Convenience alias so GET /api/models also works
  const volcEngine = require('./services/volcEngine');
  res.json({ success: true, data: volcEngine.getAvailableModels() });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

// Start server
async function start() {
  try {
    await initDatabase();
    console.log('Database initialized');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    console.warn('Server will start without database – some features may not work');
  }

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

start();
