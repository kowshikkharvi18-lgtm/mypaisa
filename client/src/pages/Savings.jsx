import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import api from '../lib/api';
import useStore from '../store/useStore';
import Ring from '../components/Ring';
import { fmtINR, SAVINGS_TYPES, FESTIVALS, COLORS } from '../lib/utils';
import { useT } from '../i18n/translations';
import toast from 'react-hot-toast';

const GOAL_COLORS = ['#10b981','#f59e0b','#3b82f6','#8b5cf6','#ef4444','#06b6d4','#ec4899'];

export default function Savings() {
  const { lang } = useStore();
  const t = useT(lang);
  const [goals, setGoals] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [tab, setTab] = useState('goals'); // goals | festivals
  const [modal, setModal] = useState(null); // null | 'goal' | 'festival'
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [g, f] = await Promise.all([api.get('/savings/goals'), api.get('/savings/festivals')]);
    setGoals(g.data); setFestivals(f.data);
  };
  useEffect(() => { load(); }, []);

  const openGoal = (item = null) => {
    setEditItem(item);
    setForm(item ? { name: item.name, type: item.type, target_amount: String(item.target_amount), saved_amount: String(item.saved_amount), deadline: item.deadline || '', color: item.color } : { name: '', type: 'emergency', target_amount: '', saved_amount: '0', deadline: '', color: '#10b981' });
    setModal('goal');
  };

  const openFestival = (item = null) => {
    setEditItem(item);
    setForm(item ? { festival_name: item.festival_name, festival_name_kn: item.festival_name_kn, target_amount: String(item.target_amount), saved_amount: String(item.saved_amount), festival_date: item.festival_date, color: item.color } : { festival_name: '', festival_name_kn: '', target_amount: '', saved_amount: '0', festival_date: '', color: '#FF9933' });
    setModal('festival');
  };

  const saveGoal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) await api.patch(`/savings/goals/${editItem.id}`, form);
      else await api.post('/savings/goals', form);
      toast.success(editItem ? 'Updated!' : 'Goal created! 🎯');
      setModal(null); load();
    } catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  const saveFestival = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) await api.patch(`/savings/festivals/${editItem.id}`, form);
      else await api.post('/savings/festivals', form);
      toast.success(editItem ? 'Updated!' : 'Festival added! 🎉');
      setModal(null); load();
    } catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  const deleteGoal = async (id) => {
    await api.delete(`/savings/goals/${id}`); toast.success('Deleted'); load();
  };
  const deleteFestival = async (id) => {
    await api.delete(`/savings/festivals/${id}`); toast.success('Deleted'); load();
  };

  const totalTarget = goals.reduce((s, g) => s + parseFloat(g.target_amount), 0);
  const totalSaved  = goals.reduce((s, g) => s + parseFloat(g.saved_amount), 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('savings')}</h1>
          <p className="page-sub">Goals, SIPs & Festival savings</p>
        </div>
        <button onClick={() => tab === 'goals' ? openGoal() : openFestival()} className="btn-primary py-2 px-4 text-sm">
          <Plus size={15} /> Add
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/[0.06] rounded-2xl">
        {[{ v: 'goals', l: '🎯 Goals' }, { v: 'festivals', l: '🎉 Festivals' }].map(tb => (
          <button key={tb.v} onClick={() => setTab(tb.v)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === tb.v ? 'bg-white dark:bg-[#12121F] text-orange-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
            {tb.l}
          </button>
        ))}
      </div>

      {tab === 'goals' && (
        <>
          {/* Summary */}
          {goals.length > 0 && (
            <div className="card p-4 flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <Ring pct={totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0} size={80} stroke={8} color="#10b981" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-black text-emerald-600">{totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%</span>
                </div>
              </div>
              <div>
                <p className="section-title">Overall Progress</p>
                <p className="text-xl font-extrabold text-emerald-600">{fmtINR(totalSaved)}</p>
                <p className="text-xs text-slate-400">of {fmtINR(totalTarget)} goal</p>
              </div>
            </div>
          )}

          {goals.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-5xl mb-3">🐷</div>
              <p className="font-extrabold text-slate-900 dark:text-white">No savings goals yet</p>
              <p className="text-slate-400 text-sm mt-1">Create your first goal — SIP, Emergency Fund, Gold...</p>
              <button onClick={() => openGoal()} className="btn-primary mt-4 mx-auto">+ Create Goal</button>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal, i) => {
                const pct = goal.target_amount > 0 ? Math.min(Math.round((goal.saved_amount / goal.target_amount) * 100), 100) : 0;
                const st = SAVINGS_TYPES.find(s => s.value === goal.type);
                const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / 86400000) : null;
                return (
                  <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: goal.color + '20' }}>
                          {st?.emoji || '💰'}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">{goal.name}</p>
                          <p className="text-xs text-slate-400">{st?.label}{daysLeft !== null ? ` · ${daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed!'}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openGoal(goal)} className="btn-icon p-1.5"><Pencil size={13} /></button>
                        <button onClick={() => deleteGoal(goal.id)} className="btn-icon p-1.5 text-red-400"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div className="progress-bar h-2.5 mb-2">
                      <motion.div className="progress-fill h-2.5" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: i * 0.1 }} style={{ background: goal.color }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-emerald-600">{fmtINR(goal.saved_amount)} saved</span>
                      <span className="font-bold" style={{ color: goal.color }}>{pct}%</span>
                      <span className="text-slate-400">Goal: {fmtINR(goal.target_amount)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'festivals' && (
        <>
          {festivals.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-5xl mb-3">🪔</div>
              <p className="font-extrabold text-slate-900 dark:text-white">No festival savings</p>
              <p className="text-slate-400 text-sm mt-1">Plan for Diwali, Holi, Onam, Pongal...</p>
              <button onClick={() => openFestival()} className="btn-primary mt-4 mx-auto">+ Add Festival</button>
            </div>
          ) : (
            <div className="space-y-3">
              {festivals.map((f, i) => {
                const pct = f.target_amount > 0 ? Math.min(Math.round((f.saved_amount / f.target_amount) * 100), 100) : 0;
                const days = Math.ceil((new Date(f.festival_date) - new Date()) / 86400000);
                const fest = FESTIVALS.find(ff => ff.name === f.festival_name);
                return (
                  <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="festival-card" style={{ background: f.color + '12', border: `1px solid ${f.color}25` }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{fest?.emoji || '🎉'}</span>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">{lang === 'kn' ? f.festival_name_kn : f.festival_name}</p>
                          <p className="text-xs" style={{ color: f.color }}>{days > 0 ? `${days} days away` : days === 0 ? 'Today! 🎉' : 'Passed'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openFestival(f)} className="btn-icon p-1.5"><Pencil size={13} /></button>
                        <button onClick={() => deleteFestival(f.id)} className="btn-icon p-1.5 text-red-400"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div className="progress-bar h-2.5 mb-2">
                      <motion.div className="progress-fill h-2.5" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} style={{ background: f.color }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-emerald-600">{fmtINR(f.saved_amount)} saved</span>
                      <span className="font-bold" style={{ color: f.color }}>{pct}%</span>
                      <span className="text-slate-400">Goal: {fmtINR(f.target_amount)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Goal Modal */}
      <AnimatePresence>
        {modal === 'goal' && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="bottom-sheet z-50 w-full max-w-lg">
              <div className="bottom-sheet-handle" />
              <div className="px-5 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{editItem ? 'Edit Goal' : 'New Savings Goal'}</h3>
                  <button onClick={() => setModal(null)} className="btn-icon"><X size={17} /></button>
                </div>
                <form onSubmit={saveGoal} className="space-y-4">
                  <div>
                    <label className="label">Goal Name</label>
                    <input type="text" required value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="e.g. Emergency Fund, Bike, Laptop" />
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {SAVINGS_TYPES.map(st => (
                        <button key={st.value} type="button" onClick={() => setForm(f => ({ ...f, type: st.value, color: st.color }))}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-bold transition-all ${form.type === st.value ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'border-slate-200 dark:border-white/10 text-slate-500'}`}>
                          <span className="text-xl">{st.emoji}</span>{st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Target (₹)</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input type="number" required value={form.target_amount || ''} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} className="input pl-7" placeholder="100000" /></div>
                    </div>
                    <div>
                      <label className="label">Saved So Far (₹)</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input type="number" value={form.saved_amount || '0'} onChange={e => setForm(f => ({ ...f, saved_amount: e.target.value }))} className="input pl-7" placeholder="0" /></div>
                    </div>
                  </div>
                  <div>
                    <label className="label">Target Date (optional)</label>
                    <input type="date" value={form.deadline || ''} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="input" />
                  </div>
                  <button type="submit" disabled={saving} className="btn-primary w-full py-4">{saving ? 'Saving...' : editItem ? 'Update Goal' : 'Create Goal 🎯'}</button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Festival Modal */}
      <AnimatePresence>
        {modal === 'festival' && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="bottom-sheet z-50 w-full max-w-lg">
              <div className="bottom-sheet-handle" />
              <div className="px-5 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{editItem ? 'Edit Festival' : 'Add Festival Savings'}</h3>
                  <button onClick={() => setModal(null)} className="btn-icon"><X size={17} /></button>
                </div>
                <form onSubmit={saveFestival} className="space-y-4">
                  <div>
                    <label className="label">Quick Select</label>
                    <div className="grid grid-cols-3 gap-2">
                      {FESTIVALS.map(f => (
                        <button key={f.name} type="button" onClick={() => setForm(ff => ({ ...ff, festival_name: f.name, festival_name_kn: f.name_kn, color: f.color }))}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-bold transition-all ${form.festival_name === f.name ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-white/10 text-slate-500'}`}>
                          <span className="text-xl">{f.emoji}</span>
                          <span className="text-[10px]">{lang === 'kn' ? f.name_kn : f.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Target (₹)</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input type="number" required value={form.target_amount || ''} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} className="input pl-7" placeholder="5000" /></div>
                    </div>
                    <div>
                      <label className="label">Saved (₹)</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input type="number" value={form.saved_amount || '0'} onChange={e => setForm(f => ({ ...f, saved_amount: e.target.value }))} className="input pl-7" placeholder="0" /></div>
                    </div>
                  </div>
                  <div>
                    <label className="label">Festival Date</label>
                    <input type="date" required value={form.festival_date || ''} onChange={e => setForm(f => ({ ...f, festival_date: e.target.value }))} className="input" />
                  </div>
                  <button type="submit" disabled={saving} className="btn-primary w-full py-4">{saving ? 'Saving...' : editItem ? 'Update' : 'Add Festival 🎉'}</button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
