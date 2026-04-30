require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const compression = require('compression');
const path        = require('path');

const app = express();

app.use(compression());
app.use(express.json());

// CORS — allow all in dev, restrict in prod
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  }));
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

app.get('/api/health', (_, res) => res.json({ status: 'ok', app: 'MyPaisa', env: process.env.NODE_ENV }));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuild));
  // All non-API routes → React app
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
app.listen(PORT, () => {
  console.log(`\n🚀 MyPaisa → http://localhost:${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   DB:   ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'}\n`);
});
