const express = require('express');
const db   = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/dashboard?month=YYYY-MM
router.get('/', auth, async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month required' });

    const user = await db('users').where({ id: req.userId }).first();
    const [y, m] = month.split('-').map(Number);

    // ── Income ──────────────────────────────────────────────────────────────
    const [incTot] = await db('income')
      .where({ user_id: req.userId, month })
      .select(db.raw('COALESCE(SUM(amount),0) as total'), db.raw('COUNT(*) as count'));

    // ── Expenses ─────────────────────────────────────────────────────────────
    const [expTot] = await db('expenses')
      .where({ user_id: req.userId, month })
      .select(db.raw('COALESCE(SUM(amount),0) as total'), db.raw('COUNT(*) as count'));

    // ── Expenses by category ─────────────────────────────────────────────────
    const byCategory = await db('expenses as e')
      .join('categories as c', 'e.category_id', 'c.id')
      .where({ 'e.user_id': req.userId, 'e.month': month })
      .groupBy('c.id').orderBy('total', 'desc')
      .select(
        'c.id','c.name_en','c.name_kn','c.color','c.icon','c.type',
        db.raw('SUM(e.amount) as total')
      );

    // ── Daily expenses ────────────────────────────────────────────────────────
    const daily = await db('expenses')
      .where({ user_id: req.userId, month })
      .groupBy('date').orderBy('date')
      .select('date', db.raw('SUM(amount) as total'));

    // ── Last month ────────────────────────────────────────────────────────────
    const prev = new Date(y, m - 2, 1);
    const lastMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    const [lastInc] = await db('income').where({ user_id: req.userId, month: lastMonth }).select(db.raw('COALESCE(SUM(amount),0) as total'));
    const [lastExp] = await db('expenses').where({ user_id: req.userId, month: lastMonth }).select(db.raw('COALESCE(SUM(amount),0) as total'));

    // ── 6-month trend ─────────────────────────────────────────────────────────
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(y, m - 1 - i, 1);
      const mo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-IN', { month: 'short' });
      const [inc] = await db('income').where({ user_id: req.userId, month: mo }).select(db.raw('COALESCE(SUM(amount),0) as total'));
      const [exp] = await db('expenses').where({ user_id: req.userId, month: mo }).select(db.raw('COALESCE(SUM(amount),0) as total'));
      trend.push({ month: label, income: parseFloat(inc.total), expense: parseFloat(exp.total) });
    }

    // ── EMIs ──────────────────────────────────────────────────────────────────
    const emis = await db('emis').where({ user_id: req.userId, is_active: true });
    const emiTotal = emis.reduce((s, e) => s + parseFloat(e.monthly_emi), 0);

    // ── Savings goals ─────────────────────────────────────────────────────────
    const savingsGoals = await db('savings_goals').where({ user_id: req.userId });

    // ── Festival savings (upcoming) ───────────────────────────────────────────
    const festivals = await db('festival_savings')
      .where({ user_id: req.userId })
      .where('festival_date', '>=', `${month}-01`)
      .orderBy('festival_date')
      .limit(3);

    // ── Pending splits ────────────────────────────────────────────────────────
    const [splitTot] = await db('bill_splits')
      .where({ user_id: req.userId, status: 'pending' })
      .select(db.raw('COALESCE(SUM(your_share),0) as total'), db.raw('COUNT(*) as count'));

    // ── Recent transactions (last 8) ──────────────────────────────────────────
    const recent = await db('expenses as e')
      .join('categories as c', 'e.category_id', 'c.id')
      .where({ 'e.user_id': req.userId, 'e.month': month })
      .orderBy('e.date', 'desc')
      .orderBy('e.created_at', 'desc')
      .limit(8)
      .select(
        'e.id','e.amount','e.date','e.notes',
        'e.payment_method',
        'c.name_en','c.name_kn','c.color','c.icon'
      );

    // ── Payday countdown ──────────────────────────────────────────────────────
    const today = new Date();
    const salaryDay = parseInt(user.salary_date) || 1;
    let nextSalary = new Date(today.getFullYear(), today.getMonth(), salaryDay);
    if (nextSalary <= today) {
      nextSalary = new Date(today.getFullYear(), today.getMonth() + 1, salaryDay);
    }
    const daysToSalary = Math.ceil((nextSalary - today) / (1000 * 60 * 60 * 24));

    const totalIncome  = parseFloat(incTot.total);
    const totalExpense = parseFloat(expTot.total);
    const salary       = parseFloat(user.monthly_salary || 0);
    const effectiveIncome = totalIncome > 0 ? totalIncome : salary;
    const balance      = effectiveIncome - totalExpense;
    const savingsRate  = effectiveIncome > 0 ? Math.round((balance / effectiveIncome) * 100) : 0;

    res.json({
      salary,
      total_income:   totalIncome,
      total_expense:  totalExpense,
      balance,
      savings_rate:   savingsRate,
      income_count:   parseInt(incTot.count),
      expense_count:  parseInt(expTot.count),
      by_category:    byCategory,
      daily,
      trend,
      last_month: {
        income:  parseFloat(lastInc.total),
        expense: parseFloat(lastExp.total),
      },
      emis: emis.map(e => ({
        ...e,
        remaining_months: e.total_months - e.paid_months,
        progress_pct: Math.round((e.paid_months / e.total_months) * 100),
      })),
      emi_total:      emiTotal,
      savings_goals:  savingsGoals,
      festivals,
      pending_splits: {
        total: parseFloat(splitTot.total),
        count: parseInt(splitTot.count),
      },
      recent,
      days_to_salary: daysToSalary,
    });
  } catch (e) {
    console.error('Dashboard error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
