const express = require('express');
const db   = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const splits = await db('bill_splits').where({ user_id: req.userId }).orderBy('date','desc');
    res.json(splits.map(s => ({ ...s, split_with: JSON.parse(s.split_with || '[]') })));
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, total_amount, your_share, split_with = [], date, notes } = req.body;
    if (!title || !total_amount || !your_share)
      return res.status(400).json({ error: 'title, total_amount, your_share required' });
    const id = await db.getInsertId('bill_splits', {
      user_id: req.userId,
      title,
      total_amount: parseFloat(total_amount),
      your_share: parseFloat(your_share),
      split_with: JSON.stringify(split_with),
      date: date || new Date().toISOString().split('T')[0],
      notes: notes || null,
    });
    const row = await db('bill_splits').where({ id }).first();
    res.status(201).json({ ...row, split_with: JSON.parse(row.split_with || '[]') });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.patch('/:id/settle', auth, async (req, res) => {
  try {
    await db('bill_splits').where({ id: req.params.id, user_id: req.userId }).update({ status: 'settled' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db('bill_splits').where({ id: req.params.id, user_id: req.userId }).delete();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
