const express = require('express');
const db   = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Savings Goals
router.get('/goals', auth, async (req, res) => {
  try { res.json(await db('savings_goals').where({ user_id: req.userId }).orderBy('created_at','desc')); }
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/goals', auth, async (req, res) => {
  try {
    const { name, type = 'other', target_amount, saved_amount = 0, deadline, color = '#10b981', icon = 'piggy-bank' } = req.body;
    if (!name || !target_amount) return res.status(400).json({ error: 'name and target_amount required' });
    const [id] = await db('savings_goals').insert({ user_id: req.userId, name, type, target_amount: parseFloat(target_amount), saved_amount: parseFloat(saved_amount), deadline: deadline || null, color, icon });
    res.status(201).json(await db('savings_goals').where({ id }).first());
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.patch('/goals/:id', auth, async (req, res) => {
  try {
    const g = await db('savings_goals').where({ id: req.params.id, user_id: req.userId }).first();
    if (!g) return res.status(404).json({ error: 'Not found' });
    const { name, target_amount, saved_amount, deadline, color } = req.body;
    const u = {};
    if (name !== undefined)          u.name          = name;
    if (target_amount !== undefined) u.target_amount = parseFloat(target_amount);
    if (saved_amount !== undefined)  u.saved_amount  = parseFloat(saved_amount);
    if (deadline !== undefined)      u.deadline      = deadline;
    if (color !== undefined)         u.color         = color;
    await db('savings_goals').where({ id: req.params.id }).update(u);
    res.json(await db('savings_goals').where({ id: req.params.id }).first());
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/goals/:id', auth, async (req, res) => {
  try {
    await db('savings_goals').where({ id: req.params.id, user_id: req.userId }).delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Festival Savings
router.get('/festivals', auth, async (req, res) => {
  try { res.json(await db('festival_savings').where({ user_id: req.userId }).orderBy('festival_date')); }
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/festivals', auth, async (req, res) => {
  try {
    const { festival_name, festival_name_kn, target_amount, saved_amount = 0, festival_date, color = '#FF9933' } = req.body;
    if (!festival_name || !target_amount || !festival_date) return res.status(400).json({ error: 'festival_name, target_amount, festival_date required' });
    const [id] = await db('festival_savings').insert({ user_id: req.userId, festival_name, festival_name_kn: festival_name_kn || festival_name, target_amount: parseFloat(target_amount), saved_amount: parseFloat(saved_amount), festival_date, color });
    res.status(201).json(await db('festival_savings').where({ id }).first());
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.patch('/festivals/:id', auth, async (req, res) => {
  try {
    const { saved_amount, target_amount } = req.body;
    const u = {};
    if (saved_amount !== undefined)  u.saved_amount  = parseFloat(saved_amount);
    if (target_amount !== undefined) u.target_amount = parseFloat(target_amount);
    await db('festival_savings').where({ id: req.params.id, user_id: req.userId }).update(u);
    res.json(await db('festival_savings').where({ id: req.params.id }).first());
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/festivals/:id', auth, async (req, res) => {
  try {
    await db('festival_savings').where({ id: req.params.id, user_id: req.userId }).delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
