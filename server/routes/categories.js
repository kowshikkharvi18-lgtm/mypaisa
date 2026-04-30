const express = require('express');
const db   = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let q = db('categories').where({ user_id: req.userId }).orderBy('is_default','desc').orderBy('name_en');
    if (req.query.type) q = q.where({ type: req.query.type });
    res.json(await q);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name_en, name_kn, type, icon = 'circle', color = '#FF9933', monthly_budget = 0 } = req.body;
    if (!name_en || !type) return res.status(400).json({ error: 'name_en and type required' });
    const [id] = await db('categories').insert({ user_id: req.userId, name_en, name_kn: name_kn || name_en, type, icon, color, monthly_budget });
    res.status(201).json(await db('categories').where({ id }).first());
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const cat = await db('categories').where({ id: req.params.id, user_id: req.userId }).first();
    if (!cat) return res.status(404).json({ error: 'Not found' });
    const { name_en, name_kn, color, monthly_budget } = req.body;
    const u = {};
    if (name_en !== undefined)        u.name_en        = name_en;
    if (name_kn !== undefined)        u.name_kn        = name_kn;
    if (color !== undefined)          u.color          = color;
    if (monthly_budget !== undefined) u.monthly_budget = monthly_budget;
    await db('categories').where({ id: req.params.id }).update(u);
    res.json(await db('categories').where({ id: req.params.id }).first());
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const cat = await db('categories').where({ id: req.params.id, user_id: req.userId }).first();
    if (!cat) return res.status(404).json({ error: 'Not found' });
    if (cat.is_default) return res.status(400).json({ error: 'Cannot delete default categories' });
    const [{ c }] = await db('expenses').where({ category_id: req.params.id }).count('id as c');
    if (c > 0) return res.status(400).json({ error: `${c} expenses linked` });
    await db('categories').where({ id: req.params.id }).delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
