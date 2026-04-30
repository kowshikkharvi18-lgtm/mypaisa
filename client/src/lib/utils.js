export const fmtINR = (n) => {
  const num = parseFloat(n) || 0;
  if (num >= 10000000) return `₹${(num/10000000).toFixed(1)}Cr`;
  if (num >= 100000)   return `₹${(num/100000).toFixed(1)}L`;
  if (num >= 1000)     return `₹${(num/1000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
};

export const fmtFull = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(parseFloat(n) || 0);

export const fmtDate = (d) => {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const fmtDateShort = (d) => {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const monthOptions = (n = 12) => {
  const opts = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    opts.push({
      value: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    });
  }
  return opts;
};

export const PAYMENT_METHODS = [
  { value: 'upi',        label: 'UPI',         emoji: '📱', color: '#7c3aed' },
  { value: 'cash',       label: 'Cash',        emoji: '💵', color: '#059669' },
  { value: 'card',       label: 'Card',        emoji: '💳', color: '#2563eb' },
  { value: 'netbanking', label: 'Net Banking', emoji: '🏦', color: '#0891b2' },
  { value: 'wallet',     label: 'Wallet',      emoji: '👛', color: '#d97706' },
  { value: 'emi',        label: 'EMI',         emoji: '📅', color: '#dc2626' },
];

export const SAVINGS_TYPES = [
  { value: 'sip',       label: 'SIP / Mutual Fund', emoji: '📈', color: '#10b981' },
  { value: 'gold',      label: 'Gold',              emoji: '🥇', color: '#f59e0b' },
  { value: 'emergency', label: 'Emergency Fund',    emoji: '🛡️', color: '#3b82f6' },
  { value: 'fd',        label: 'Fixed Deposit',     emoji: '🏦', color: '#8b5cf6' },
  { value: 'ppf',       label: 'PPF / NPS',         emoji: '📋', color: '#06b6d4' },
  { value: 'other',     label: 'Other',             emoji: '💰', color: '#64748b' },
];

export const FESTIVALS = [
  { name: 'Diwali',            name_kn: 'ದೀಪಾವಳಿ',        color: '#f59e0b', emoji: '🪔' },
  { name: 'Holi',              name_kn: 'ಹೋಳಿ',            color: '#ec4899', emoji: '🎨' },
  { name: 'Onam',              name_kn: 'ಓಣಂ',             color: '#10b981', emoji: '🌸' },
  { name: 'Pongal',            name_kn: 'ಪೊಂಗಲ್',          color: '#f97316', emoji: '🌾' },
  { name: 'Durga Puja',        name_kn: 'ದುರ್ಗಾ ಪೂಜೆ',     color: '#ef4444', emoji: '🙏' },
  { name: 'Ugadi',             name_kn: 'ಯುಗಾದಿ',          color: '#84cc16', emoji: '🌿' },
  { name: 'Ganesh Chaturthi',  name_kn: 'ಗಣೇಶ ಚತುರ್ಥಿ',    color: '#f59e0b', emoji: '🐘' },
  { name: 'Christmas',         name_kn: 'ಕ್ರಿಸ್ಮಸ್',        color: '#dc2626', emoji: '🎄' },
  { name: 'Eid',               name_kn: 'ಈದ್',              color: '#059669', emoji: '🌙' },
  { name: 'Navratri',          name_kn: 'ನವರಾತ್ರಿ',         color: '#a855f7', emoji: '💃' },
  { name: 'Raksha Bandhan',    name_kn: 'ರಕ್ಷಾ ಬಂಧನ',       color: '#f472b6', emoji: '🎀' },
  { name: 'Makar Sankranti',   name_kn: 'ಮಕರ ಸಂಕ್ರಾಂತಿ',    color: '#eab308', emoji: '🪁' },
  { name: 'New Year',          name_kn: 'ಹೊಸ ವರ್ಷ',         color: '#6366f1', emoji: '🎆' },
  { name: 'Birthday',          name_kn: 'ಹುಟ್ಟುಹಬ್ಬ',        color: '#ec4899', emoji: '🎂' },
  { name: 'Anniversary',       name_kn: 'ವಾರ್ಷಿಕೋತ್ಸವ',     color: '#ef4444', emoji: '💝' },
];

export const COLORS = ['#FF9933','#10b981','#3b82f6','#f43f5e','#8b5cf6','#f59e0b','#06b6d4','#ec4899','#84cc16','#6366f1'];

export const TYPE_CONFIG = {
  need:   { label: 'Need',   label_kn: 'ಅಗತ್ಯ',  color: '#ef4444', bg: 'bg-red-100 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400'       },
  want:   { label: 'Want',   label_kn: 'ಬಯಕೆ',    color: '#f97316', bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400' },
  saving: { label: 'Saving', label_kn: 'ಉಳಿತಾಯ',  color: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400' },
  income: { label: 'Income', label_kn: 'ಆದಾಯ',    color: '#3b82f6', bg: 'bg-blue-100 dark:bg-blue-900/20',     text: 'text-blue-700 dark:text-blue-400'     },
};
