const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db/database');
const auth    = require('../middleware/auth');
const router  = express.Router();

const DEFAULTS = [
  // NEEDS
  { name_en:'Rent / PG',         name_kn:'ಬಾಡಿಗೆ / ಪಿಜಿ',          type:'need',   icon:'home',          color:'#ef4444' },
  { name_en:'Food & Groceries',  name_kn:'ಆಹಾರ & ದಿನಸಿ',           type:'need',   icon:'shopping-cart', color:'#f97316' },
  { name_en:'Transport',         name_kn:'ಸಾರಿಗೆ',                  type:'need',   icon:'car',           color:'#eab308' },
  { name_en:'Mobile Recharge',   name_kn:'ಮೊಬೈಲ್ ರೀಚಾರ್ಜ್',        type:'need',   icon:'smartphone',    color:'#06b6d4' },
  { name_en:'Electricity/Water', name_kn:'ವಿದ್ಯುತ್/ನೀರು',          type:'need',   icon:'zap',           color:'#8b5cf6' },
  { name_en:'Internet/WiFi',     name_kn:'ಇಂಟರ್ನೆಟ್/ವೈಫೈ',         type:'need',   icon:'wifi',          color:'#3b82f6' },
  { name_en:'Hospital/Medical',  name_kn:'ಆಸ್ಪತ್ರೆ/ವೈದ್ಯಕೀಯ',      type:'need',   icon:'heart',         color:'#ec4899' },
  { name_en:'Loan / EMI',        name_kn:'ಸಾಲ / ಇಎಂಐ',             type:'need',   icon:'credit-card',   color:'#dc2626' },
  // WANTS
  { name_en:'Dining Out',        name_kn:'ಹೊರಗೆ ತಿನ್ನುವುದು',       type:'want',   icon:'utensils',      color:'#f43f5e' },
  { name_en:'Entertainment',     name_kn:'ಮನರಂಜನೆ',                 type:'want',   icon:'film',          color:'#a855f7' },
  { name_en:'Shopping',          name_kn:'ಶಾಪಿಂಗ್',                 type:'want',   icon:'shopping-bag',  color:'#ec4899' },
  { name_en:'Travel / Trip',     name_kn:'ಪ್ರಯಾಣ / ಟ್ರಿಪ್',         type:'want',   icon:'map-pin',       color:'#06b6d4' },
  { name_en:'Skin Care',         name_kn:'ಚರ್ಮ ಆರೈಕೆ',              type:'want',   icon:'sparkles',      color:'#f472b6' },
  { name_en:'Gym / Fitness',     name_kn:'ಜಿಮ್/ಫಿಟ್ನೆಸ್',           type:'want',   icon:'dumbbell',      color:'#10b981' },
  { name_en:'Subscriptions',     name_kn:'ಚಂದಾದಾರಿಕೆ',              type:'want',   icon:'repeat',        color:'#7c3aed' },
  { name_en:'Clothes',           name_kn:'ಬಟ್ಟೆ',                    type:'want',   icon:'shirt',         color:'#14b8a6' },
  { name_en:'Gifts',             name_kn:'ಉಡುಗೊರೆ',                 type:'want',   icon:'gift',          color:'#f59e0b' },
  { name_en:'Personal Dev',      name_kn:'ವ್ಯಕ್ತಿ ಅಭಿವೃದ್ಧಿ',       type:'want',   icon:'book',          color:'#6366f1' },
  // SAVINGS
  { name_en:'SIP / Mutual Fund', name_kn:'ಎಸ್ಐಪಿ / ಮ್ಯೂಚುಯಲ್ ಫಂಡ್', type:'saving', icon:'trending-up',  color:'#10b981' },
  { name_en:'Gold Savings',      name_kn:'ಚಿನ್ನದ ಉಳಿತಾಯ',           type:'saving', icon:'coins',         color:'#f59e0b' },
  { name_en:'Emergency Fund',    name_kn:'ತುರ್ತು ನಿಧಿ',             type:'saving', icon:'shield',        color:'#3b82f6' },
  { name_en:'Fixed Deposit',     name_kn:'ಸ್ಥಿರ ಠೇವಣಿ',              type:'saving', icon:'landmark',      color:'#8b5cf6' },
  // INCOME
  { name_en:'Salary',            name_kn:'ಸಂಬಳ',                     type:'income', icon:'briefcase',     color:'#10b981' },
  { name_en:'Freelance',         name_kn:'ಫ್ರೀಲ್ಯಾನ್ಸ್',             type:'income', icon:'laptop',        color:'#06b6d4' },
  { name_en:'Other Income',      name_kn:'ಇತರ ಆದಾಯ',                type:'income', icon:'plus-circle',   color:'#84cc16' },
  { name_en:'Business',          name_kn:'ವ್ಯಾಪಾರ',                  type:'income', icon:'trending-up',   color:'#f59e0b' },
  { name_en:'Investment Return', name_kn:'ಹೂಡಿಕೆ ಆದಾಯ',             type:'income', icon:'bar-chart-2',   color:'#8b5cf6' },
];

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, monthly_salary = 0, salary_date = 1, language = 'en', city = '' } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (await db('users').where({ email }).first())
      return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const [userId] = await db('users').insert({
      name, email, password: hashed,
      monthly_salary: parseFloat(monthly_salary) || 0,
      salary_date: parseInt(salary_date) || 1,
      language, city,
    });

    // Seed all default categories
    const cats = DEFAULTS.map(c => ({
      ...c,
      user_id: userId,
      is_default: true,
      monthly_budget: 0,
    }));
    await db('categories').insert(cats);

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const user  = await db('users')
      .select('id','name','email','monthly_salary','salary_date','language','city','savings_pct','setup_done','company')
      .where({ id: userId }).first();

    res.status(201).json({ token, user: { ...user, setup_done: !!user.setup_done } });
  } catch (e) {
    console.error('Register error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = await db('users').where({ email }).first();
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        monthly_salary: user.monthly_salary, salary_date: user.salary_date,
        language: user.language, city: user.city, savings_pct: user.savings_pct,
        setup_done: !!user.setup_done, company: user.company,
      },
    });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await db('users').where({ email }).first();
    if (!user) return res.json({ message: 'If this email exists, a reset link was sent.' });
    const token = jwt.sign({ userId: user.id, type: 'reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ message: 'Reset token generated.', resetToken: token });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword || newPassword.length < 6)
      return res.status(400).json({ error: 'Token and password (min 6 chars) required' });
    let decoded;
    try { decoded = jwt.verify(resetToken, process.env.JWT_SECRET); }
    catch { return res.status(400).json({ error: 'Invalid or expired token' }); }
    if (decoded.type !== 'reset') return res.status(400).json({ error: 'Wrong token type' });
    await db('users').where({ id: decoded.userId }).update({ password: await bcrypt.hash(newPassword, 10) });
    res.json({ message: 'Password reset! Please login.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const u = await db('users')
      .select('id','name','email','monthly_salary','salary_date','language','city','savings_pct','setup_done','company','created_at')
      .where({ id: req.userId }).first();
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json({ ...u, setup_done: !!u.setup_done });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/auth/profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const allowed = ['name','monthly_salary','salary_date','language','city','savings_pct','setup_done','company'];
    const updates = {};
    allowed.forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    if (Object.keys(updates).length === 0)
      return res.status(400).json({ error: 'No fields to update' });

    await db('users').where({ id: req.userId }).update(updates);
    const u = await db('users')
      .select('id','name','email','monthly_salary','salary_date','language','city','savings_pct','setup_done','company')
      .where({ id: req.userId }).first();
    res.json({ ...u, setup_done: !!u.setup_done });
  } catch (e) {
    console.error('Profile update error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/seed — add missing default categories for existing users
router.post('/seed', auth, async (req, res) => {
  try {
    const existing = await db('categories').where({ user_id: req.userId }).select('name_en');
    const existingNames = new Set(existing.map(c => c.name_en));
    const missing = DEFAULTS.filter(d => !existingNames.has(d.name_en));
    if (missing.length > 0) {
      await db('categories').insert(
        missing.map(c => ({ ...c, user_id: req.userId, is_default: true, monthly_budget: 0 }))
      );
    }
    res.json({ added: missing.length, message: `Added ${missing.length} new categories` });
  } catch (e) {
    console.error('Seed error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
