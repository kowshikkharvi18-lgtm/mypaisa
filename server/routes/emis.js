const express = require('express');
const db   = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const emis = await db('emis').where({ user_id: req.userId, is_active: true }).orderBy('due_date');
    res.json(emis.map(e => ({
      ...e,
      remaining_months: e.total_months - e.paid_months,
      remaining_amount: (e.total_months - e.paid_months) * e.monthly_emi,
      progress_pct: Math.round((e.paid_months / e.total_months) * 100),
    })));
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, total_amount, monthly_emi, total_months, due_date = 5, bank, color = '#6366f1' } = req.body;
    if (!name || !monthly_emi || !total_months) return res.status(400).json({ error: 'name, monthly_emi, total_months required' });
    const [id] = await db('emis').insert({ user_id: req.userId, name, total_amount: parseFloat(total_amount || monthly_emi * total_months), monthly_emi: parseFloat(monthly_emi), total_months: parseInt(total_months), due_date: parseInt(due_date), bank: bank || null, color });
    res.status(201).json(await db('emis').where({ id }).first());
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.patch('/:id/pay', auth, async (req, res) => {
  try {
    const emi = await db('emis').where({ id: req.params.id, user_id: req.userId }).first();
    if (!emi) return res.status(404).json({ error: 'Not found' });
    const paid = Math.min(emi.paid_months + 1, emi.total_months);
    const done = paid >= emi.total_months;
    await db('emis').where({ id: req.params.id }).update({ paid_months: paid, is_active: done ? 0 : 1 });
    res.json({ success: true, paid_months: paid, completed: done });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db('emis').where({ id: req.params.id, user_id: req.userId }).delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
