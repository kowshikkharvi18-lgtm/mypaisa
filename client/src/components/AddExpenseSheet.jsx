import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Delete, ChevronLeft } from 'lucide-react';
import api from '../lib/api';
import useStore from '../store/useStore';
import { PAYMENT_METHODS } from '../lib/utils';
import { useT } from '../i18n/translations';
import toast from 'react-hot-toast';

export default function AddExpenseSheet({ open, onClose, onSaved, editData = null }) {
  const { lang, isDark } = useStore();
  const t = useT(lang);
  const [step, setStep] = useState('amount');
  const [amount, setAmount] = useState('');
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category_id:'', date: new Date().toISOString().split('T')[0], payment_method:'upi', note:'', is_split:false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([api.get('/categories?type=need'), api.get('/categories?type=want')])
      .then(([r1, r2]) => setCategories([...r1.data, ...r2.data]))
      .catch(() => toast.error('Could not load categories'));
    if (editData) {
      setAmount(String(editData.amount));
      setForm({ category_id: String(editData.category_id), date: editData.date, payment_method: editData.payment_method || 'upi', note: editData.notes || '', is_split: !!editData.is_split });
      setStep('category');
    } else {
      setAmount(''); setForm({ category_id:'', date: new Date().toISOString().split('T')[0], payment_method:'upi', note:'', is_split:false }); setStep('amount');
    }
  }, [open]);

  const tap = (v) => {
    if (v === 'del') { setAmount(a => a.slice(0,-1)); return; }
    if (v === '.' && amount.includes('.')) return;
    if (amount.replace('.','').length >= 7) return;
    setAmount(a => a + v);
  };

  const submit = async () => {
    if (!form.category_id) return toast.error('Select a category');
    if (!amount || parseFloat(amount) <= 0) return toast.error('Enter amount');
    setSaving(true);
    try {
      // Map 'note' field to 'notes' to match DB column
      const payload = {
        category_id:    form.category_id,
        date:           form.date,
        payment_method: form.payment_method,
        notes:          form.note || null,
        is_split:       form.is_split,
        amount:         parseFloat(amount),
      };
      if (editData) { await api.patch(`/expenses/${editData.id}`, payload); toast.success('Updated! ✅'); }
      else { await api.post('/expenses', payload); toast.success('Added! 💸'); }
      onSaved?.(); onClose();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const bg = isDark ? '#12121F' : '#fff';
  const txt = isDark ? '#f8fafc' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const ibg = isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc';
  const iborder = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-40" style={{ background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)' }}
            onClick={onClose} />
          <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
            transition={{ type:'spring', damping:32, stiffness:320 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl"
            style={{ background:bg, boxShadow:'0 -8px 40px rgba(0,0,0,0.2)', maxHeight:'92vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>

            <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0' }} />

            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="text-lg font-extrabold" style={{ color:txt }}>{editData ? 'Edit Expense' : 'Add Expense'}</h2>
              <button type="button" onClick={onClose} className="p-2 rounded-xl" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
                <X size={18} style={{ color:muted }} />
              </button>
            </div>

            {step === 'amount' && (
              <div className="px-5 pb-8">
                <div className="text-center py-5">
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:muted }}>Enter Amount</p>
                  <div className="text-5xl font-black" style={{ color:txt, fontFamily:'Poppins,sans-serif' }}>₹{amount || '0'}</div>
                  {amount && parseFloat(amount) > 0 && (
                    <p className="text-sm mt-1" style={{ color:muted }}>
                      {new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(parseFloat(amount))}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {['1','2','3','4','5','6','7','8','9','.','0','del'].map(k => (
                    <button key={k} type="button" onClick={() => tap(k)}
                      className="flex items-center justify-center h-14 rounded-2xl text-xl font-bold transition-colors"
                      style={{ background: k==='del' ? (isDark?'rgba(239,68,68,0.15)':'#fef2f2') : ibg, color: k==='del'?'#ef4444':txt }}>
                      {k === 'del' ? <Delete size={20} /> : k}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => { if (parseFloat(amount) > 0) setStep('category'); else toast.error('Enter amount first'); }}
                  className="w-full py-4 rounded-2xl font-extrabold text-white text-base"
                  style={{ background:'linear-gradient(135deg,#FF9933,#FF6600)', boxShadow:'0 4px 16px rgba(255,153,51,0.4)' }}>
                  Next — Choose Category →
                </button>
              </div>
            )}

            {step === 'category' && (
              <div className="px-5 pb-8">
                <div className="flex items-center justify-between mb-4">
                  <button type="button" onClick={() => setStep('amount')} className="flex items-center gap-1 text-sm font-bold text-orange-500">
                    <ChevronLeft size={16} /> ₹{amount}
                  </button>
                  <p className="text-sm font-bold" style={{ color:muted }}>Select Category</p>
                </div>
                {categories.length === 0 ? (
                  <div className="text-center py-8" style={{ color:muted }}><p className="text-4xl mb-2">🏷️</p><p>Loading...</p></div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto pb-2">
                    {categories.map(cat => {
                      const sel = form.category_id === String(cat.id);
                      return (
                        <button key={cat.id} type="button"
                          onClick={() => { setForm(f => ({ ...f, category_id: String(cat.id) })); setStep('details'); }}
                          className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border-2 transition-colors"
                          style={{ borderColor: sel?'#FF9933':'transparent', background: sel?'rgba(255,153,51,0.1)':ibg }}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold" style={{ background:cat.color }}>
                            {cat.name_en[0]}
                          </div>
                          <span className="text-[10px] font-bold text-center leading-tight" style={{ color: sel?'#FF9933':muted }}>
                            {lang==='kn' ? cat.name_kn : cat.name_en}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {step === 'details' && (
              <div className="px-5 pb-8 space-y-4">
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setStep('category')} className="flex items-center gap-1 text-sm font-bold text-orange-500">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <p className="text-sm font-bold" style={{ color:muted }}>
                    ₹{amount} · {categories.find(c => String(c.id)===form.category_id)?.[lang==='kn'?'name_kn':'name_en']}
                  </p>
                </div>

                <div>
                  <label className="label">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date:e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ background:ibg, border:`1.5px solid ${iborder}`, color:txt }} />
                </div>

                <div>
                  <label className="label">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_METHODS.map(pm => {
                      const sel = form.payment_method === pm.value;
                      return (
                        <button key={pm.value} type="button" onClick={() => setForm(f => ({ ...f, payment_method:pm.value }))}
                          className="flex items-center gap-1.5 px-2 py-2.5 rounded-xl border-2 text-xs font-bold transition-colors"
                          style={{ borderColor: sel?'#FF9933':iborder, background: sel?'rgba(255,153,51,0.1)':ibg, color: sel?'#FF9933':muted }}>
                          <span>{pm.emoji}</span> {pm.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="label">Note (optional)</label>
                  <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note:e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ background:ibg, border:`1.5px solid ${iborder}`, color:txt }}
                    placeholder="e.g. Swiggy, Ola, Grocery..." />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background:ibg }}>
                  <span className="text-sm font-bold" style={{ color:txt }}>🤝 Split this bill?</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, is_split:!f.is_split }))}
                    className="relative flex-shrink-0" style={{ width:44, height:24 }}>
                    <div className="absolute inset-0 rounded-full transition-colors" style={{ background: form.is_split?'#FF9933':'#d1d5db' }} />
                    <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform"
                      style={{ transform: form.is_split?'translateX(20px)':'translateX(2px)' }} />
                  </button>
                </div>

                <button type="button" onClick={submit} disabled={saving}
                  className="w-full py-4 rounded-2xl font-extrabold text-white text-base transition-opacity"
                  style={{ background:'linear-gradient(135deg,#FF9933,#FF6600)', boxShadow:'0 4px 16px rgba(255,153,51,0.4)', opacity: saving?0.7:1 }}>
                  {saving ? 'Saving...' : editData ? 'Update ✅' : `Add ₹${amount} 💸`}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
