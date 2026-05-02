import { useState } from 'react';
import { Moon, Sun, LogOut, Save, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import useStore from '../store/useStore';
import { fmtINR } from '../lib/utils';
import { useT } from '../i18n/translations';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, updateUser, logout, isDark, toggleTheme, setLang, lang } = useStore();
  const t = useT(lang);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:           user?.name           || '',
    monthly_salary: user?.monthly_salary || '',
    salary_date:    user?.salary_date    || 1,
    savings_pct:    user?.savings_pct    || 20,
    language:       user?.language       || 'en',
    city:           user?.city           || '',
    company:        user?.company        || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newSalary = parseFloat(form.monthly_salary) || 0;
      const payload = {
        name:           form.name,
        monthly_salary: newSalary,
        salary_date:    parseInt(form.salary_date) || 1,
        savings_pct:    parseInt(form.savings_pct) || 20,
        language:       form.language,
        city:           form.city,
        company:        form.company,
      };
      const res = await api.patch('/auth/profile', payload);
      updateUser(res.data);
      setLang(form.language);
      toast.success('Profile saved! ✅');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out 👋');
  };

  const salary     = parseFloat(user?.monthly_salary || 0);
  const savingsPct = parseInt(form.savings_pct || 20);
  const needsPct   = 50;
  const wantsPct   = Math.max(100 - needsPct - savingsPct, 0);

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">

      {/* ── Avatar Card ── */}
      <div className="payday-card p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black flex-shrink-0 bg-white/20">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-extrabold text-white truncate">{user?.name}</p>
            <p className="text-orange-100 text-sm truncate">{user?.email}</p>
            {user?.city && <p className="text-orange-200 text-xs mt-0.5">📍 {user.city}</p>}
          </div>
        </div>
        {salary > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-3">
            {[
              { label: 'Needs 50%',   amount: salary * needsPct   / 100, color: '#fca5a5' },
              { label: `Wants ${wantsPct}%`,  amount: salary * wantsPct   / 100, color: '#fdba74' },
              { label: `Savings ${savingsPct}%`, amount: salary * savingsPct / 100, color: '#6ee7b7' },
            ].map(row => (
              <div key={row.label} className="text-center">
                <p className="text-white font-extrabold text-sm">{fmtINR(row.amount)}</p>
                <p className="text-[10px] font-bold mt-0.5" style={{ color: row.color }}>{row.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4">

        {/* ── Personal Info ── */}
        <div className="card p-4 space-y-3">
          <p className="section-title">Personal Info</p>
          <div>
            <label className="label">Full Name</label>
            <input type="text" value={form.name} onChange={set('name')} className="input" placeholder="Your name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">City</label>
              <input type="text" value={form.city} onChange={set('city')} className="input" placeholder="Bangalore..." />
            </div>
            <div>
              <label className="label">Company</label>
              <input type="text" value={form.company} onChange={set('company')} className="input" placeholder="Company..." />
            </div>
          </div>
        </div>

        {/* ── Salary Settings ── */}
        <div className="card p-4 space-y-4">
          <p className="section-title">Salary Settings</p>
          <div>
            <label className="label">Monthly In-Hand Salary (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input type="number" min="0" value={form.monthly_salary} onChange={set('monthly_salary')}
                className="input pl-7 text-lg font-bold" placeholder="35000" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Used for budget split calculation only. Add income monthly from Home page.</p>
          </div>

          <div>
            <label className="label">Salary Date (day of month)</label>
            <div className="flex flex-wrap gap-2">
              {[1,5,7,10,15,20,25,28,30,31].map(d => (
                <button key={d} type="button"
                  onClick={() => setForm(f => ({ ...f, salary_date: d }))}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${
                    parseInt(form.salary_date) === d
                      ? 'text-white g-saffron'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">
              Savings Target: <span className="text-orange-500 font-extrabold">{form.savings_pct}%</span>
            </label>
            <input type="range" min="5" max="50" step="5"
              value={form.savings_pct} onChange={set('savings_pct')}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-orange-500" />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>5%</span>
              <span className="text-orange-500 font-bold">{form.savings_pct}%</span>
              <span>50%</span>
            </div>
          </div>
        </div>

        {/* ── Preferences ── */}
        <div className="card p-4 space-y-4">
          <p className="section-title">Preferences</p>

          <div>
            <label className="label">Language / ಭಾಷೆ</label>
            <div className="grid grid-cols-2 gap-3">
              {[{ v: 'en', l: '🇬🇧 English' }, { v: 'kn', l: '🇮🇳 ಕನ್ನಡ' }].map(lg => (
                <button key={lg.v} type="button"
                  onClick={() => setForm(f => ({ ...f, language: lg.v }))}
                  className={`py-3 rounded-xl font-bold text-sm transition-colors ${
                    form.language === lg.v ? 'text-white g-saffron' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}>
                  {lg.l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.05]">
            <div className="flex items-center gap-3">
              {isDark ? <Moon size={18} className="text-violet-400" /> : <Sun size={18} className="text-amber-500" />}
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                <p className="text-xs text-slate-400">Tap to switch</p>
              </div>
            </div>
            <button type="button" onClick={toggleTheme}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${isDark ? 'bg-violet-500' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 block ${isDark ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-4 rounded-2xl font-extrabold text-white text-base flex items-center justify-center gap-2 g-saffron disabled:opacity-60"
          style={{ boxShadow: '0 4px 16px rgba(255,153,51,0.4)' }}>
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* ── Other Actions ── */}
      <div className="card divide-y divide-slate-100 dark:divide-white/[0.06]">
        <button type="button" onClick={async () => {
          try {
            const res = await api.post('/auth/seed');
            toast.success(res.data.message || 'Categories updated!');
          } catch { toast.error('Failed'); }
        }} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔄</span>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Restore Default Categories</p>
              <p className="text-xs text-slate-400">Add any missing default categories</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400" />
        </button>

        <button type="button" onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
          <div className="flex items-center gap-3">
            <LogOut size={18} className="text-red-500" />
            <p className="text-sm font-bold text-red-500">Logout</p>
          </div>
          <ChevronRight size={16} className="text-red-400" />
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 pb-6">MyPaisa v1.0 · Made with ❤️ for India 🇮🇳</p>
    </div>
  );
}
