import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import useStore from '../store/useStore';
import Ring from '../components/Ring';
import { fmtINR, fmtFull, fmtDateShort, monthOptions, COLORS } from '../lib/utils';
import { useT } from '../i18n/translations';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const { user, lang, selectedMonth, setSelectedMonth } = useStore();
  const t = useT(lang);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const opts = monthOptions(6);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/dashboard?month=${selectedMonth}`);
      setData(r.data);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => { load(); }, [load]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? (lang === 'kn' ? t('good_morning') : 'Good Morning')
    : hour < 17 ? (lang === 'kn' ? t('good_afternoon') : 'Good Afternoon')
    : (lang === 'kn' ? t('good_evening') : 'Good Evening');

  const salary  = parseFloat(user?.monthly_salary || 0);
  const income  = parseFloat(data?.total_income  || 0);
  const expense = parseFloat(data?.total_expense || 0);
  const effectiveIncome = income > 0 ? income : salary;
  const balance  = effectiveIncome - expense;
  const spentPct = effectiveIncome > 0 ? Math.min(Math.round((expense / effectiveIncome) * 100), 100) : 0;
  const savedPct = effectiveIncome > 0 ? Math.max(Math.round((balance / effectiveIncome) * 100), 0) : 0;
  const ringColor = spentPct >= 100 ? '#ef4444' : spentPct >= 80 ? '#f59e0b' : '#FF9933';
  const alerts  = (data?.budget_limits || []).filter(l => l.alert);
  const expCats = (data?.by_category  || []).filter(c => c.type !== 'income');

  if (loading) return (
    <div className="p-4 space-y-4">
      <div className="h-8 shimmer rounded-xl w-48" />
      <div className="h-44 shimmer rounded-3xl" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-20 shimmer rounded-2xl" />)}
      </div>
      <div className="h-48 shimmer rounded-2xl" />
    </div>
  );

  return (
    <div className="p-4 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{greeting}</p>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {user?.name?.split(' ')[0]} 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="input w-auto text-xs py-2 font-bold"
          >
            {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={load} className="btn-icon"><RefreshCw size={16} /></button>
        </div>
      </div>

      {/* ── Payday Hero Card ── */}
      <div className="payday-card p-5 text-white relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-1">
              {data?.days_to_salary === 0
                ? '🎉 Payday Today!'
                : `${data?.days_to_salary ?? '—'} days to salary`}
            </p>
            <p className="text-4xl font-black amount-big leading-none">
              {fmtINR(balance)}
            </p>
            <p className="text-orange-100 text-xs mt-1.5">
              {balance >= 0 ? 'Balance remaining' : 'Over budget!'}
            </p>
          </div>
          <div className="relative flex-shrink-0">
            <Ring pct={spentPct} size={84} stroke={9} color="rgba(255,255,255,0.95)" bg="rgba(255,255,255,0.2)" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white font-black text-lg leading-none">{spentPct}%</span>
              <span className="text-orange-100 text-[9px] font-bold">spent</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-white/20">
          <div className="flex-1">
            <p className="text-orange-100 text-[10px] font-bold uppercase">Income</p>
            <p className="text-white font-extrabold text-sm">{fmtINR(effectiveIncome)}</p>
          </div>
          <div className="flex-1">
            <p className="text-orange-100 text-[10px] font-bold uppercase">Spent</p>
            <p className="text-white font-extrabold text-sm">{fmtINR(expense)}</p>
          </div>
          <div className="flex-1">
            <p className="text-orange-100 text-[10px] font-bold uppercase">Saved</p>
            <p className="text-white font-extrabold text-sm">{fmtINR(Math.max(balance, 0))}</p>
          </div>
          {(data?.emi_total || 0) > 0 && (
            <div className="flex-1">
              <p className="text-orange-100 text-[10px] font-bold uppercase">EMIs</p>
              <p className="text-white font-extrabold text-sm">{fmtINR(data.emi_total)}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Savings Rate', value: `${savedPct}%`, color: savedPct >= 20 ? 'text-emerald-600 dark:text-emerald-400' : savedPct >= 10 ? 'text-amber-500' : 'text-red-500', icon: '🎯' },
          { label: 'Transactions', value: data?.expense_count || 0, color: 'text-slate-900 dark:text-white', icon: '🧾' },
          { label: 'Categories', value: expCats.length, color: 'text-slate-900 dark:text-white', icon: '🏷️' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card p-3 text-center">
            <div className="text-xl mb-1">{s.icon}</div>
            <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Budget Alerts ── */}
      {alerts.map(lim => (
        <motion.div key={lim.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={lim.pct >= 100 ? 'alert-danger' : 'alert-warn'}>
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm font-bold">
            {lim.pct >= 100
              ? `🚨 ${lim.category_name || 'Budget'} exceeded! Spent ${fmtINR(lim.spent)}`
              : `⚠️ ${lim.category_name || 'Budget'} at ${lim.pct}% — only ${fmtINR(lim.remaining)} left`}
          </p>
        </motion.div>
      ))}

      {/* ── Spending Breakdown ── */}
      {expCats.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card p-4">
          <p className="section-title mb-3">Spending Breakdown</p>
          <div className="flex gap-3 items-center">
            <div className="flex-shrink-0">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={expCats} dataKey="total" cx="50%" cy="50%" outerRadius={50} innerRadius={28}>
                    {expCats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmtFull(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {expCats.slice(0, 5).map((cat, i) => {
                const pct = expense > 0 ? Math.round((cat.total / expense) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[90px]">
                        {lang === 'kn' ? cat.name_kn : cat.name_en}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white ml-1 flex-shrink-0">{fmtINR(cat.total)}</span>
                    </div>
                    <div className="progress-bar h-1.5">
                      <div className="progress-fill h-1.5" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── 6-Month Trend ── */}
      {(data?.trend || []).some(t => t.income > 0 || t.expense > 0) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="card p-4">
          <p className="section-title mb-3">6-Month Trend</p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={data.trend} barGap={2} barCategoryGap="30%">
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={v => fmtFull(v)} />
              <Bar dataKey="income"  name="Income"  fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="Expense" fill="#FF9933" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ── EMIs ── */}
      {(data?.emis || []).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">EMIs This Month</p>
            <Link to="/tools" className="text-xs text-orange-500 font-bold">View all →</Link>
          </div>
          <div className="space-y-2">
            {data.emis.slice(0, 3).map(emi => (
              <div key={emi.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: emi.color || '#6366f1' }}>
                    {emi.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{emi.name}</p>
                    <p className="text-[10px] text-slate-400">Due {emi.due_date}th · {emi.remaining_months} months left</p>
                  </div>
                </div>
                <p className="font-extrabold text-red-500 text-sm">{fmtINR(emi.monthly_emi)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Festival Savings ── */}
      {(data?.festivals || []).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">Upcoming Festivals 🎉</p>
            <Link to="/savings" className="text-xs text-orange-500 font-bold">View all →</Link>
          </div>
          <div className="space-y-2">
            {data.festivals.map(f => {
              const pct = f.target_amount > 0 ? Math.round((f.saved_amount / f.target_amount) * 100) : 0;
              const days = Math.ceil((new Date(f.festival_date) - new Date()) / 86400000);
              return (
                <div key={f.id} className="p-3 rounded-xl" style={{ background: f.color + '15', border: `1px solid ${f.color}30` }}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">
                      {lang === 'kn' ? f.festival_name_kn : f.festival_name}
                    </p>
                    <span className="text-xs font-bold" style={{ color: f.color }}>
                      {days > 0 ? `${days} days` : days === 0 ? 'Today! 🎉' : 'Passed'}
                    </span>
                  </div>
                  <div className="progress-bar h-2">
                    <div className="progress-fill h-2" style={{ width: `${pct}%`, background: f.color }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-400">{fmtINR(f.saved_amount)} saved</span>
                    <span className="text-[10px] text-slate-400">Goal: {fmtINR(f.target_amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Recent Expenses ── */}
      {(data?.recent || []).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">Recent Expenses</p>
            <Link to="/expenses" className="text-xs text-orange-500 font-bold">View all →</Link>
          </div>
          <div className="space-y-1">
            {data.recent.map(txn => (
              <div key={txn.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: txn.color || '#FF9933' }}>
                  {txn.name_en?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {lang === 'kn' ? txn.name_kn : txn.name_en}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {fmtDateShort(txn.date)}{txn.notes ? ` · ${txn.notes}` : ''}
                  </p>
                </div>
                <p className="font-extrabold text-sm text-red-500 flex-shrink-0">-{fmtINR(txn.amount)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Pending Splits ── */}
      {(data?.pending_splits?.count || 0) > 0 && (
        <div className="alert-info">
          <span className="text-lg">🤝</span>
          <div>
            <p className="font-bold text-sm">{data.pending_splits.count} pending bill splits</p>
            <p className="text-xs opacity-70">
              You're owed {fmtINR(data.pending_splits.total)} ·{' '}
              <Link to="/tools" className="underline font-bold">Settle now</Link>
            </p>
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && !data?.recent?.length && expCats.length === 0 && (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-3">💸</div>
          <h3 className="font-extrabold text-slate-900 dark:text-white mb-1">No expenses yet!</h3>
          <p className="text-slate-400 text-sm mb-4">Tap the orange + button to add your first expense</p>
          {salary === 0 && (
            <Link to="/profile" className="btn-primary inline-flex mx-auto text-sm py-2.5 px-5">
              Set your salary first →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
