import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, TrendingDown, PiggyBank, Wrench, User } from 'lucide-react';
import useStore from '../store/useStore';
import { useT } from '../i18n/translations';

const TABS = [
  { to: '/',        icon: Home,         key: 'home'     },
  { to: '/expenses',icon: TrendingDown, key: 'expenses' },
  { to: '/savings', icon: PiggyBank,    key: 'savings'  },
  { to: '/tools',   icon: Wrench,       key: 'tools'    },
  { to: '/profile', icon: User,         key: 'profile'  },
];

export default function BottomNav() {
  const { lang } = useStore();
  const t = useT(lang);
  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-2 py-1">
        {TABS.map(({ to, icon: Icon, key }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `nav-tab ${isActive ? 'nav-tab-active' : 'nav-tab-inactive'}`}>
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-orange-100 dark:bg-orange-900/30' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px] font-bold">{t(key)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
