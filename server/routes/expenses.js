const express = require('express');
const db   = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/expenses
router.get('/', auth, async (req, res) => {
  try {
    const { month, category_id, search, limit = 200 } = req.query;
    let q = db('expenses as e')
      .join('categories as c', 'e.category_id', 'c.id')
      .where('e.user_id', req.userId)
      .orderBy('e.date', 'desc')
      .orderBy('e.created_at', 'desc')
      .limit(parseInt(limit))
      .select(
        'e.id','e.amount','e.date','e.month','e.payment_method',
        'e.notes','e.is_split','e.recurring','e.created_at',
        'e.category_id',
        'c.name_en as category_name_en',
        'c.name_kn as category_name_kn',
        'c.color as category_color',
        'c.icon as category_icon',
        'c.type as category_type'
      );
    if (month)       q = q.where('e.month', month);
    if (category_id) q = q.where('e.category_id', category_id);
    if (search)      q = q.where('e.notes', 'like', `%${search}%`);
    res.json(await q);
  } catch (e) {
    console.error('GET /expenses error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/expenses/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month required' });

    const [tot] = await db('expenses')
      .where({ user_id: req.userId, month })
      .select(
        db.raw('COALESCE(SUM(amount),0) as total'),
        db.raw('COUNT(*) as count')
      );

    const byCategory = await db('expenses as e')
      .join('categories as c', 'e.category_id', 'c.id')
      .where({ 'e.user_id': req.userId, 'e.month': month })
      .groupBy('c.id').orderBy('total', 'desc')
      .select(
        'c.id','c.name_en','c.name_kn','c.color','c.icon','c.type','c.monthly_budget',
        db.raw('SUM(e.amount) as total'),
        db.raw('COUNT(e.id) as count')
      );

    const byPayment = await db('expenses')
      .where({ user_id: req.userId, month })
      .groupBy('payment_method')
      .select('payment_method', db.raw('SUM(amount) as total'), db.raw('COUNT(*) as count'));

    const daily = await db('expenses')
      .where({ user_id: req.userId, month })
      .groupBy('date').orderBy('date')
      .select('date', db.raw('SUM(amount) as total'));

    const [y, m] = month.split('-').map(Number);
    const prev = new Date(y, m - 2, 1);
    const lastMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    const [last] = await db('expenses')
      .where({ user_id: req.userId, month: lastMonth })
      .select(db.raw('COALESCE(SUM(amount),0) as total'));

    res.json({
      total: parseFloat(tot.total),
      count: parseInt(tot.count),
      by_category: byCategory,
      by_payment: byPayment,
      daily,
      last_month_total: parseFloat(last?.total || 0),
    });
  } catch (e) {
    console.error('GET /expenses/summary error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/expenses
router.post('/', auth, async (req, res) => {
  try {
    const { category_id, amount, date, payment_method = 'upi', notes, recurring = false, is_split = false } = req.body;
    if (!category_id || !amount || !date)
      return res.status(400).json({ error: 'category_id, amount, date required' });
    if (parseFloat(amount) <= 0)
      return res.status(400).json({ error: 'Amount must be positive' });

    const cat = await db('categories').where({ id: category_id, user_id: req.userId }).first();
    if (!cat) return res.status(400).json({ error: 'Invalid category' });

    const month = date.slice(0, 7);
    const [id] = await db('expenses').insert({
      user_id: req.userId,
      category_id,
      amount: parseFloat(amount),
      date,
      month,
      payment_method,
      notes: notes || null,
      recurring: recurring ? 1 : 0,
      is_split: is_split ? 1 : 0,
    });

    const row = await db('expenses as e')
      .join('categories as c', 'e.category_id', 'c.id')
      .where('e.id', id)
      .select(
        'e.id','e.amount','e.date','e.month','e.payment_method',
        'e.notes','e.is_split','e.recurring','e.category_id',
        'c.name_en as category_name_en',
        'c.name_kn as category_name_kn',
        'c.color as category_color',
        'c.icon as category_icon'
      ).first();
    res.status(201).json(row);
  } catch (e) {
    console.error('POST /expenses error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/expenses/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    const row = await db('expenses').where({ id: req.params.id, user_id: req.userId }).first();
    if (!row) return res.status(404).json({ error: 'Not found' });

    const { category_id, amount, date, payment_method, notes, recurring } = req.body;
    const u = {};
    if (category_id !== undefined)    u.category_id    = category_id;
    if (amount !== undefined)         u.amount         = parseFloat(amount);
    if (date !== undefined)           { u.date = date; u.month = date.slice(0, 7); }
    if (payment_method !== undefined) u.payment_method = payment_method;
    if (notes !== undefined)          u.notes          = notes;
    if (recurring !== undefined)      u.recurring      = recurring ? 1 : 0;

    await db('expenses').where({ id: req.params.id }).update(u);
    const updated = await db('expenses as e')
      .join('categories as c', 'e.category_id', 'c.id')
      .where('e.id', req.params.id)
      .select(
        'e.id','e.amount','e.date','e.month','e.payment_method',
        'e.notes','e.is_split','e.recurring','e.category_id',
        'c.name_en as category_name_en',
        'c.name_kn as category_name_kn',
        'c.color as category_color',
        'c.icon as category_icon'
      ).first();
    res.json(updated);
  } catch (e) {
    console.error('PATCH /expenses error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const row = await db('expenses').where({ id: req.params.id, user_id: req.userId }).first();
    if (!row) return res.status(404).json({ error: 'Not found' });
    await db('expenses').where({ id: req.params.id }).delete();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
