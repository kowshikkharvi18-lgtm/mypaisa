import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Trash2, Pencil, TrendingDown, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import useStore from '../store/useStore';
import AddExpenseSheet from '../components/AddExpenseSheet';
import { fmtINR, fmtFull, fmtDate, monthOptions, PAYMENT_METHODS } from '../lib/utils';
import { useT } from '../i18n/translations';
import toast from 'react-hot-toast';

export default function Expenses() {
  const { lang, selectedMonth, setSelectedMonth } = useStore();
  const t = useT(lang);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [payFilter, setPayFilter] = useState('');
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const opts = monthOptions(12);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month: selectedMonth });
      if (catFilter) params.set('category_id', catFilter);
      if (search)    params.set('search', search);
      const [expRes, sumRes, [catRes1, catRes2]] = await Promise.all([
        api.get(`/expenses?${params}`),
        api.get(`/expenses/summary?month=${selectedMonth}`),
        Promise.all([api.get('/categories?type=need'), api.get('/categories?type=want')]),
      ]);
      setExpenses(expRes.data);
      setSummary(sumRes.data);
      setCategories([...catRes1.data, ...catRes2.data]);
    } catch (err) {
      console.error('Expenses load error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, catFilter, search]);

  useEffect(() => { load(); }, [load]);

  const filtered = payFilter ? expenses.filter(e => e.payment_method === payFilter) : expenses;

  const handleDelete = async () => {
    try {
      await api.delete(`/expenses/${deleteId}`);
      toast.success('Deleted!');
      setDeleteId(null);
      load();
    } catch { toast.error('Failed'); }
  };

  // Group by date
  const grouped = filtered.reduce((acc, exp) => {
    const d = exp.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(exp);
    return acc;
  }, {});

  const vsLast = summary?.last_month_total > 0
    ? Math.round(((summary.total - summary.last_month_total) / summary.last_month_total) * 100)
    : null;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('expenses')}</h1>
          <p className="page-sub">{opts.find(o => o.value === selectedMonth)?.label}</p>
        </div>
        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
          className="input w-auto text-xs py-2 font-bold">
          {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Spent', value: fmtINR(summary?.total), color: 'text-red-500' },
          { label: 'Transactions', value: summary?.count || 0, color: 'text-slate-900 dark:text-white' },
          { label: 'vs Last Month', value: vsLast !== null ? `${vsLast > 0 ? '+' : ''}${vsLast}%` : '—', color: vsLast === null ? 'text-slate-400' : vsLast > 0 ? 'text-red-500' : 'text-emerald-500' },
        ].map((s, i) => (
          <div key={i} className="card p-3 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by note..."
              className="input pl-9 py-2.5 text-sm" />
          </div>
          <button onClick={() => setShowFilters(v => !v)} className={`btn-icon border ${showFilters ? 'border-orange-400 text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-white/10'}`}>
            <Filter size={16} />
          </button>
        </div>
        {showFilters && (
          <div className="flex gap-2">
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input py-2 text-xs flex-1">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{lang === 'kn' ? c.name_kn : c.name_en}</option>)}
            </select>
            <select value={payFilter} onChange={e => setPayFilter(e.target.value)} className="input py-2 text-xs flex-1">
              <option value="">All Payments</option>
              {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Category breakdown */}
      {summary?.by_category?.length > 0 && (
        <div className="card p-4">
          <p className="section-title mb-3">By Category</p>
          <div className="space-y-2">
            {summary.by_category.slice(0, 6).map((cat, i) => {
              const pct = summary.total > 0 ? Math.round((cat.total / summary.total) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: cat.color }}>{cat.name_en[0]}</div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{lang === 'kn' ? cat.name_kn : cat.name_en}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{fmtINR(cat.total)}</span>
                    </div>
                    <div className="progress-bar h-1.5">
                      <div className="progress-fill h-1.5" style={{ width: `${pct}%`, background: cat.color }} />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 w-7 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions grouped by date */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 shimmer rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">🧾</div>
          <p className="font-extrabold text-slate-900 dark:text-white">No expenses found</p>
          <p className="text-slate-400 text-sm mt-1">Tap + to add your first expense</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">{fmtDate(date)}</p>
              <p className="text-xs font-bold text-red-500">-{fmtINR(items.reduce((s, e) => s + parseFloat(e.amount), 0))}</p>
            </div>
            <div className="space-y-2">
              {items.map(exp => {
                const pm = PAYMENT_METHODS.find(m => m.value === exp.payment_method);
                return (
                  <motion.div key={exp.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="card p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: exp.category_color || '#FF9933' }}>
                      {exp.category_name_en?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{lang === 'kn' ? exp.category_name_kn : exp.category_name_en}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">{pm?.emoji} {pm?.label}</span>
                        {exp.notes && <span className="text-[10px] text-slate-400 truncate">{exp.notes}</span>}
                        {exp.is_split ? <span className="text-[10px] font-bold text-blue-500">🤝 Split</span> : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-red-500">-{fmtINR(exp.amount)}</p>
                      <button onClick={() => setEditData(exp)} className="btn-icon p-1.5"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteId(exp.id)} className="btn-icon p-1.5 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Edit sheet */}
      <AddExpenseSheet open={!!editData} onClose={() => setEditData(null)} onSaved={() => { setEditData(null); load(); }} editData={editData} />

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative card p-6 max-w-xs w-full z-10 text-center">
              <div className="text-4xl mb-3">🗑️</div>
              <h3 className="font-extrabold text-slate-900 dark:text-white mb-1">Delete expense?</h3>
              <p className="text-sm text-slate-400 mb-5">This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
