import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Users } from 'lucide-react';
import api from '../lib/api';
import useStore from '../store/useStore';
import { fmtINR, fmtDate } from '../lib/utils';
import { useT } from '../i18n/translations';
import toast from 'react-hot-toast';

export default function Tools() {
  const { lang } = useStore();
  const t = useT(lang);
  const [tab, setTab] = useState('emi');
  const [emis, setEmis] = useState([]);
  const [splits, setSplits] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [e, s] = await Promise.all([api.get('/emis'), api.get('/splits')]);
      setEmis(e.data);
      setSplits(s.data);
    } catch {
      toast.error('Failed to load data');
    }
  };
  useEffect(() => { load(); }, []);

  const saveEmi = async (e) => {
    e.preventDefault();
    const due = parseInt(form.due_date || 5);
    if (due < 1 || due > 31) return toast.error('Due date must be between 1 and 31');
    if (parseFloat(form.monthly_emi) <= 0) return toast.error('EMI amount must be positive');
    if (parseInt(form.total_months) <= 0) return toast.error('Total months must be positive');
    setSaving(true);
    try {
      await api.post('/emis', {
        ...form,
        monthly_emi:  parseFloat(form.monthly_emi),
        total_months: parseInt(form.total_months),
        due_date:     due,
      });
      toast.success('EMI added! 📅');
      setModal(null);
      load();
    } catch { toast.error('Failed to add EMI'); }
    finally { setSaving(false); }
  };

  const payEmi = async (id) => {
    try {
      const { data } = await api.patch(`/emis/${id}/pay`);
      toast.success(data.completed ? 'EMI completed! 🎉' : 'Payment marked ✅');
      load();
    } catch { toast.error('Failed'); }
  };

  const deleteEmi = async (id) => {
    try {
      await api.delete(`/emis/${id}`);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const saveSplit = async (e) => {
    e.preventDefault();
    if (parseFloat(form.your_share) > parseFloat(form.total_amount)) return toast.error('Your share cannot exceed total amount');
    setSaving(true);
    try {
      const names = (form.split_with_text || '').split(',').map(s => s.trim()).filter(Boolean);
      await api.post('/splits', {
        ...form,
        total_amount: parseFloat(form.total_amount),
        your_share:   parseFloat(form.your_share),
        split_with:   names,
        notes:        form.note || null,
      });
      toast.success('Split added! 🤝');
      setModal(null);
      load();
    } catch { toast.error('Failed to add split'); }
    finally { setSaving(false); }
  };

  const settleSplit = async (id) => {
    try {
      await api.patch(`/splits/${id}/settle`);
      toast.success('Settled! ✅');
      load();
    } catch { toast.error('Failed'); }
  };

  const deleteSplit = async (id) => {
    try {
      await api.delete(`/splits/${id}`);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const totalEmiMonthly = emis.reduce((s, e) => s + parseFloat(e.monthly_emi || 0), 0);
  const pendingSplitAmt = splits.filter(s => s.status === 'pending').reduce((s, sp) => s + parseFloat(sp.your_share || 0), 0);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="page-title">{t('tools')}</h1>
        <p className="page-sub">EMI Tracker & Bill Splits</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/[0.06] rounded-2xl">
        {[{ v: 'emi', l: '📅 EMI Tracker' }, { v: 'split', l: '🤝 Bill Splits' }].map(tb => (
          <button key={tb.v} onClick={() => setTab(tb.v)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === tb.v ? 'bg-white dark:bg-[#12121F] text-orange-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
            {tb.l}
          </button>
        ))}
      </div>

      {tab === 'emi' && (
        <>
          {totalEmiMonthly > 0 && (
            <div className="card p-4 flex items-center justify-between">
              <div>
                <p className="section-title">Monthly EMI Outflow</p>
                <p className="text-2xl font-extrabold text-red-500">{fmtINR(totalEmiMonthly)}</p>
              </div>
              <div className="text-3xl">📅</div>
            </div>
          )}
          <button onClick={() => { setForm({ name: '', monthly_emi: '', total_months: '', due_date: '5', bank: '', color: '#6366f1' }); setModal('emi'); }}
            className="btn-primary w-full py-3"><Plus size={15} /> Add EMI</button>

          {emis.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-5xl mb-3">📱</div>
              <p className="font-extrabold text-slate-900 dark:text-white">No EMIs tracked</p>
              <p className="text-slate-400 text-sm mt-1">Track your phone, laptop, bike EMIs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emis.map((emi, i) => (
                <motion.div key={emi.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold" style={{ background: emi.color || '#6366f1' }}>
                        {emi.name[0]}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white">{emi.name}</p>
                        <p className="text-xs text-slate-400">{emi.bank || 'Bank'} · Due: {emi.due_date}th every month</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-red-500">{fmtINR(emi.monthly_emi)}/mo</p>
                      <p className="text-xs text-slate-400">{emi.remaining_months} months left</p>
                    </div>
                  </div>
                  <div className="progress-bar h-2 mb-2">
                    <div className="progress-fill h-2" style={{ width: `${emi.progress_pct}%`, background: emi.color || '#6366f1' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{emi.paid_months}/{emi.total_months} paid · {fmtINR(emi.remaining_amount)} remaining</span>
                    <div className="flex gap-2">
                      <button onClick={() => payEmi(emi.id)} className="btn-green py-1.5 px-3 text-xs">✓ Mark Paid</button>
                      <button onClick={() => deleteEmi(emi.id)} className="btn-danger py-1.5 px-2 text-xs"><Trash2 size={12} /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'split' && (
        <>
          {pendingSplitAmt > 0 && (
            <div className="alert-info">
              <Users size={18} className="flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">Pending splits: {fmtINR(pendingSplitAmt)}</p>
                <p className="text-xs opacity-70">Settle with your friends/roommates</p>
              </div>
            </div>
          )}
          <button onClick={() => { setForm({ title: '', total_amount: '', your_share: '', split_with_text: '', date: new Date().toISOString().split('T')[0], note: '' }); setModal('split'); }}
            className="btn-primary w-full py-3"><Plus size={15} /> Add Bill Split</button>

          {splits.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-5xl mb-3">🤝</div>
              <p className="font-extrabold text-slate-900 dark:text-white">No bill splits</p>
              <p className="text-slate-400 text-sm mt-1">Split rent, food, trips with roommates</p>
            </div>
          ) : (
            <div className="space-y-3">
              {splits.map((sp, i) => (
                <motion.div key={sp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`card p-4 ${sp.status === 'settled' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white">{sp.title}</p>
                      <p className="text-xs text-slate-400">{fmtDate(sp.date)} · with {Array.isArray(sp.split_with) ? sp.split_with.join(', ') : sp.split_with}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-orange-500">{fmtINR(sp.your_share)}</p>
                      <p className="text-xs text-slate-400">of {fmtINR(sp.total_amount)}</p>
                    </div>
                  </div>
                  {sp.notes && <p className="text-xs text-slate-400 mb-2">📝 {sp.notes}</p>}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${sp.status === 'settled' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {sp.status === 'settled' ? '✅ Settled' : '⏳ Pending'}
                    </span>
                    <div className="flex gap-2">
                      {sp.status === 'pending' && <button onClick={() => settleSplit(sp.id)} className="btn-green py-1.5 px-3 text-xs">Settle</button>}
                      <button onClick={() => deleteSplit(sp.id)} className="btn-danger py-1.5 px-2 text-xs"><Trash2 size={12} /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* EMI Modal */}
      <AnimatePresence>
        {modal === 'emi' && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="bottom-sheet z-50 w-full max-w-lg">
              <div className="bottom-sheet-handle" />
              <div className="px-5 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Add EMI</h3>
                  <button onClick={() => setModal(null)} className="btn-icon"><X size={17} /></button>
                </div>
                <form onSubmit={saveEmi} className="space-y-4">
                  <input type="text" required value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="EMI name (e.g. iPhone 15, Bike)" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Monthly EMI (₹)</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input type="number" min="1" required value={form.monthly_emi || ''} onChange={e => setForm(f => ({ ...f, monthly_emi: e.target.value }))} className="input pl-7" placeholder="3000" /></div>
                    </div>
                    <div>
                      <label className="label">Total Months</label>
                      <input type="number" min="1" required value={form.total_months || ''} onChange={e => setForm(f => ({ ...f, total_months: e.target.value }))} className="input" placeholder="12" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Due Date (1-31)</label>
                      <input type="number" min="1" max="31" value={form.due_date || '5'} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="input" placeholder="5" />
                    </div>
                    <div>
                      <label className="label">Bank / Lender</label>
                      <input type="text" value={form.bank || ''} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))} className="input" placeholder="HDFC, Bajaj..." />
                    </div>
                  </div>
                  <button type="submit" disabled={saving} className="btn-primary w-full py-4">{saving ? 'Adding...' : 'Add EMI 📅'}</button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Split Modal */}
      <AnimatePresence>
        {modal === 'split' && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="bottom-sheet z-50 w-full max-w-lg">
              <div className="bottom-sheet-handle" />
              <div className="px-5 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Add Bill Split</h3>
                  <button onClick={() => setModal(null)} className="btn-icon"><X size={17} /></button>
                </div>
                <form onSubmit={saveSplit} className="space-y-4">
                  <input type="text" required value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="Title (e.g. Rent, Goa Trip, Dinner)" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Total Amount (₹)</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input type="number" min="1" required value={form.total_amount || ''} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} className="input pl-7" placeholder="5000" /></div>
                    </div>
                    <div>
                      <label className="label">Your Share (₹)</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input type="number" min="1" required value={form.your_share || ''} onChange={e => setForm(f => ({ ...f, your_share: e.target.value }))} className="input pl-7" placeholder="2500" /></div>
                    </div>
                  </div>
                  <div>
                    <label className="label">Split With (comma separated)</label>
                    <input type="text" value={form.split_with_text || ''} onChange={e => setForm(f => ({ ...f, split_with_text: e.target.value }))} className="input" placeholder="Rahul, Priya, Kiran" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Date</label>
                      <input type="date" value={form.date || ''} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input" />
                    </div>
                    <div>
                      <label className="label">Note</label>
                      <input type="text" value={form.note || ''} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="input" placeholder="Optional" />
                    </div>
                  </div>
                  <button type="submit" disabled={saving} className="btn-primary w-full py-4">{saving ? 'Adding...' : 'Add Split 🤝'}</button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
