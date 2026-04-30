import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, User, Mail, Lock, MapPin, IndianRupee } from 'lucide-react';
import api from '../lib/api';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', monthly_salary: '', city: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const s = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        ...form,
        monthly_salary: parseFloat(form.monthly_salary) || 0,
      });
      setAuth(data.user, data.token);
      toast.success(`Welcome to MyPaisa, ${data.user.name}! 🎉`);
      navigate('/onboarding');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* Left panel — branding */}
      <div className="lg:w-2/5 flex flex-col items-center justify-center p-8 lg:p-16"
        style={{ background: 'linear-gradient(160deg, #0A0A14 0%, #1a0a2e 50%, #0d1a0d 100%)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center">
          <div className="text-5xl mb-3">💰</div>
          <h1 className="text-3xl font-black text-white mb-1">MyPaisa</h1>
          <p className="text-orange-300 text-sm font-medium">ನಿಮ್ಮ ಹಣದ ಸ್ನೇಹಿತ</p>
          <p className="text-white/40 text-xs mt-1">Your Money Friend</p>

          <div className="mt-8 hidden lg:block">
            <div className="bg-white/5 rounded-2xl p-5 text-left space-y-3">
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">What you get</p>
              {['25+ expense categories', 'Festival savings planner', 'EMI & bill split tracker', 'English + ಕನ್ನಡ support', 'Dark & light mode'].map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                  <span className="text-white/70 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex mt-6 rounded-full overflow-hidden opacity-50 mx-auto w-20">
            <div className="flex-1 h-1.5 bg-orange-500" />
            <div className="flex-1 h-1.5 bg-white" />
            <div className="flex-1 h-1.5 bg-green-600" />
          </div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="lg:w-3/5 flex items-center justify-center p-6 lg:p-16 bg-orange-50 dark:bg-[#0A0A14]">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="w-full max-w-md">

          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">Create Account 🚀</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Start your financial journey — free forever</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" required value={form.name} onChange={s('name')}
                  className="input pl-9" placeholder="Rahul Sharma" />
              </div>
            </div>

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" required value={form.email} onChange={s('email')}
                  className="input pl-9" placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={show ? 'text' : 'password'} required value={form.password} onChange={s('password')}
                  className="input pl-9 pr-10" placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShow(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Monthly Salary (₹)</label>
                <div className="relative">
                  <IndianRupee size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" value={form.monthly_salary} onChange={s('monthly_salary')}
                    className="input pl-9" placeholder="35000" />
                </div>
              </div>
              <div>
                <label className="label">City</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={form.city} onChange={s('city')}
                    className="input pl-9" placeholder="Bangalore" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl font-extrabold text-white flex items-center justify-center gap-2 mt-2 transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#FF9933,#FF6600)', boxShadow: '0 4px 20px rgba(255,153,51,0.35)' }}>
              {loading ? 'Creating account...' : <><span>Create Account</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-500 font-bold hover:text-orange-600">
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            By creating an account, you agree to track your finances responsibly 🇮🇳
          </p>
        </motion.div>
      </div>
    </div>
  );
}
