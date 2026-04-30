import { create } from 'zustand';

const applyTheme = (t) => {
  if (t === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Read saved theme on startup
const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);

const useStore = create((set, get) => ({
  user:  JSON.parse(localStorage.getItem('user')  || 'null'),
  token: localStorage.getItem('token') || null,
  lang:  localStorage.getItem('lang')  || 'en',
  isDark: savedTheme === 'dark',
  selectedMonth: new Date().toISOString().slice(0, 7),

  setAuth: (user, token) => {
    localStorage.setItem('user',  JSON.stringify(user));
    localStorage.setItem('token', token);
    localStorage.setItem('lang',  user.language || 'en');
    set({ user, token, lang: user.language || 'en' });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  updateUser: (u) => {
    const updated = { ...get().user, ...u };
    localStorage.setItem('user', JSON.stringify(updated));
    if (u.language) localStorage.setItem('lang', u.language);
    set({ user: updated, lang: u.language || get().lang });
  },

  toggleTheme: () => {
    const isDark = !get().isDark;
    set({ isDark });
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    applyTheme(isDark ? 'dark' : 'light');
  },

  setLang: (lang) => {
    localStorage.setItem('lang', lang);
    set({ lang });
  },

  setSelectedMonth: (m) => set({ selectedMonth: m }),
}));

export default useStore;
