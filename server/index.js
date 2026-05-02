// Load .env from server directory
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// Suppress deprecation warnings in production
if (process.env.NODE_ENV === 'production') {
  process.removeAllListeners('warning');
}

const express     = require('express');
const cors        = require('cors');
const compression = require('compression');
const path        = require('path');

const app = express();

app.use(compression());
app.use(express.json());

// CORS — allow all origins in production (same-server setup), restrict in dev
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  }));
} else {
  app.use(cors());
}

// API Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/expenses',   require('./routes/expenses'));
app.use('/api/income',     require('./routes/income'));
app.use('/api/emis',       require('./routes/emis'));
app.use('/api/splits',     require('./routes/splits'));
app.use('/api/savings',    require('./routes/savings'));
app.use('/api/dashboard',  require('./routes/dashboard'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', app: 'VelvetLedger', env: process.env.NODE_ENV }));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  // __dirname is /app/server, so client/dist is one level up
  const clientBuild = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientBuild, 'index.html'));
    }
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 VelvetLedger → http://0.0.0.0:${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   DB:   ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'}\n`);
});
