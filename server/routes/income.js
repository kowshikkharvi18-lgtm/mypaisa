const express = require('express');
const db   = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let q = db('income').where({ user_id: req.userId }).orderBy('date','desc');
    if (req.query.month) q = q.where({ month: req.query.month });
    res.json(await q);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { amount, source = 'Salary', date, note } = req.body;
    if (!amount || !date) return res.status(400).json({ error: 'amount and date required' });
    const [id] = await db('income').insert({ user_id: req.userId, amount: parseFloat(amount), source, date, month: date.slice(0,7), note: note || null });
    res.status(201).json(await db('income').where({ id }).first());
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db('income').where({ id: req.params.id, user_id: req.userId }).delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
