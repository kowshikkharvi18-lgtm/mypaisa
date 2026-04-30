import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import BottomNav from './components/BottomNav';
import AddExpenseSheet from './components/AddExpenseSheet';
import Home from './pages/Home';
import Expenses from './pages/Expenses';
import Savings from './pages/Savings';
import Tools from './pages/Tools';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';

function AppLayout() {
  const [fabOpen, setFabOpen] = useState(false);
  const [tick, setTick] = useState(0);
  return (
    <div className="min-h-screen pb-nav">
      <Routes>
        <Route path="/"         element={<Home key={tick} />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/savings"  element={<Savings />} />
        <Route path="/tools"    element={<Tools />} />
        <Route path="/profile"  element={<Profile />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
      {/* FAB */}
      <button
        onClick={() => setFabOpen(true)}
        className="fab pulse-ring no-print"
        aria-label="Add expense"
      >
        <span className="text-white text-3xl font-black leading-none">+</span>
      </button>
      <BottomNav />
      <AddExpenseSheet
        open={fabOpen}
        onClose={() => setFabOpen(false)}
        onSaved={() => { setFabOpen(false); setTick(t => t + 1); }}
      />
    </div>
  );
}

export default function App() {
  const { token } = useStore();

  if (!token) {
    return (
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*"         element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/*"          element={<AppLayout />} />
    </Routes>
  );
}
