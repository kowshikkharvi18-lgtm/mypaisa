import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ChevronLeft } from 'lucide-react';
import api from '../lib/api';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('login'); // login | forgot | reset
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPwd, setNewPwd] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}! 🙏`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: forgotEmail });
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setStep('reset');
        toast.success('Enter your new password below');
      } else {
        toast.success(data.message);
      }
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPwd.length < 6) return toast.error('Min 6 characters');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword: newPwd });
      toast.success('Password reset! Login now 🎉');
      setStep('login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* Left panel — branding (visible on lg+, top strip on mobile) */}
      <div className="lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16"
        style={{ background: 'linear-gradient(160deg, #0A0A14 0%, #1a0a2e 50%, #0d1a0d 100%)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm">
          <div className="text-6xl mb-4">💰</div>
          <h1 className="text-4xl font-black text-white mb-2">MyPaisa</h1>
          <p className="text-orange-300 font-medium mb-2">ನಿಮ್ಮ ಹಣದ ಸ್ನೇಹಿತ</p>
          <p className="text-white/50 text-sm">Your Money Friend</p>

          {/* Features */}
          <div className="mt-8 space-y-3 text-left hidden lg:block">
            {[
              { icon: '📊', text: 'Track income & expenses in ₹ INR' },
              { icon: '🎯', text: 'Set savings goals — SIP, Gold, Emergency' },
              { icon: '🎉', text: 'Plan for Diwali, Holi, Onam & more' },
              { icon: '🤝', text: 'Split bills with roommates & friends' },
              { icon: '📅', text: 'Track EMIs — phone, bike, laptop' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-white/70 text-sm">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Indian flag strip */}
          <div className="flex mt-8 rounded-full overflow-hidden opacity-50 mx-auto w-24">
            <div className="flex-1 h-1.5 bg-orange-500" />
            <div className="flex-1 h-1.5 bg-white" />
            <div className="flex-1 h-1.5 bg-green-600" />
          </div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-16 bg-orange-50 dark:bg-[#0A0A14]">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="w-full max-w-md">

          <AnimatePresence mode="wait">

            {/* ── LOGIN ── */}
            {step === 'login' && (
              <motion.div key="login" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">Welcome back 👋</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Sign in to your MyPaisa account</p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="label">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="email" required value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="input pl-9" placeholder="you@example.com" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label mb-0">Password</label>
                      <button type="button" onClick={() => setStep('forgot')}
                        className="text-xs text-orange-500 font-bold hover:text-orange-600">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type={show ? 'text' : 'password'} required value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        className="input pl-9 pr-10" placeholder="Your password" />
                      <button type="button" onClick={() => setShow(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-4 rounded-2xl font-extrabold text-white flex items-center justify-center gap-2 mt-2 transition-opacity disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#FF9933,#FF6600)', boxShadow: '0 4px 20px rgba(255,153,51,0.35)' }}>
                    {loading ? 'Signing in...' : <><span>Sign In</span><ArrowRight size={16} /></>}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    New to MyPaisa?{' '}
                    <Link to="/register" className="text-orange-500 font-bold hover:text-orange-600">
                      Create free account
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {step === 'forgot' && (
              <motion.div key="forgot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <button onClick={() => setStep('login')}
                  className="flex items-center gap-1 text-orange-500 font-bold text-sm mb-6 hover:text-orange-600">
                  <ChevronLeft size={16} /> Back to login
                </button>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">Forgot Password?</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Enter your email to get a reset token</p>

                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="label">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="email" required value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        className="input pl-9" placeholder="you@example.com" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-4 rounded-2xl font-extrabold text-white transition-opacity disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#FF9933,#FF6600)', boxShadow: '0 4px 20px rgba(255,153,51,0.35)' }}>
                    {loading ? 'Sending...' : 'Send Reset Token'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── RESET PASSWORD ── */}
            {step === 'reset' && (
              <motion.div key="reset" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">Set New Password</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Choose a strong new password</p>

                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="label">New Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type={show ? 'text' : 'password'} required value={newPwd}
                        onChange={e => setNewPwd(e.target.value)}
                        className="input pl-9 pr-10" placeholder="Min 6 characters" />
                      <button type="button" onClick={() => setShow(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-4 rounded-2xl font-extrabold text-white transition-opacity disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#FF9933,#FF6600)', boxShadow: '0 4px 20px rgba(255,153,51,0.35)' }}>
                    {loading ? 'Resetting...' : 'Reset Password 🔐'}
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
