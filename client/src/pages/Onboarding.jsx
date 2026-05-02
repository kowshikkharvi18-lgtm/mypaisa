import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 'salary',   title: 'Monthly Salary 💰',    sub: 'Enter your in-hand salary' },
  { id: 'date',     title: 'Salary Date 📅',        sub: 'Which day do you get paid?' },
  { id: 'savings',  title: 'Savings Goal 🎯',       sub: 'How much % do you want to save?' },
  { id: 'language', title: 'Language / ಭಾಷೆ 🌐',   sub: 'Choose your preferred language' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useStore();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ monthly_salary: user?.monthly_salary || '', salary_date: user?.salary_date || 1, savings_pct: 20, language: 'en' });
  const [loading, setLoading] = useState(false);

  const finish = async () => {
    setLoading(true);
    try {
      const res = await api.patch('/auth/profile', { ...data, setup_done: true });
      updateUser(res.data);
      toast.success('All set! Let\'s go 🚀');
      navigate('/');
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const next = () => { if (step < STEPS.length - 1) setStep(s => s + 1); else finish(); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-[#0A0A14] dark:to-[#1a0a2e] flex flex-col items-center justify-center p-5">
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-orange-500 w-8' : 'bg-slate-200 dark:bg-slate-700 w-4'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
          className="w-full max-w-sm">
          <div className="card p-7 text-center">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">{STEPS[step].title}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{STEPS[step].sub}</p>

            {step === 0 && (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-orange-500">₹</span>
                <input type="number" value={data.monthly_salary} onChange={e => setData(d => ({ ...d, monthly_salary: e.target.value }))}
                  className="input pl-10 text-2xl font-black text-center" placeholder="35000" />
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-5 gap-2">
                {[1,5,10,15,20,25,28,30,31].map(d => (
                  <button key={d} onClick={() => setData(dd => ({ ...dd, salary_date: d }))}
                    className={`py-3 rounded-xl font-bold text-sm transition-all ${data.salary_date === d ? 'text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}
                    style={data.salary_date === d ? { background: 'linear-gradient(135deg,#FF9933,#FF6600)' } : {}}>
                    {d}
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                {[10, 20, 30, 40].map(pct => (
                  <button key={pct} onClick={() => setData(d => ({ ...d, savings_pct: pct }))}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-between px-5 ${data.savings_pct === pct ? 'text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300'}`}
                    style={data.savings_pct === pct ? { background: 'linear-gradient(135deg,#FF9933,#FF6600)' } : {}}>
                    <span>{pct}% Savings</span>
                    <span className="text-xs opacity-70">
                      {pct === 10 ? 'Starter' : pct === 20 ? '50-30-20 Rule ⭐' : pct === 30 ? 'Aggressive' : 'FIRE Mode 🔥'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                {[{ v: 'en', label: 'English', sub: 'English interface' }].map(lang => (
                  <button key={lang.v} onClick={() => setData(d => ({ ...d, language: lang.v }))}
                    className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-between px-5 ${data.language === lang.v ? 'text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300'}`}
                    style={data.language === lang.v ? { background: 'linear-gradient(135deg,#FF9933,#FF6600)' } : {}}>
                    <span className="text-lg">{lang.label}</span>
                    <span className="text-xs opacity-70">{lang.sub}</span>
                  </button>
                ))}
              </div>
            )}

            <button onClick={next} disabled={loading}
              className="btn-primary w-full mt-6 py-4 text-base">
              {loading ? 'Setting up...' : step === STEPS.length - 1 ? "Let's Go! 🚀" : 'Next →'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
