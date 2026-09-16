import React from 'react';
import { Home, Calculator, Wallet, ShoppingBag, User } from 'lucide-react';
import { useAppStore } from '@/store/AppContext';
import type { Page } from '@/types';

const BottomNav: React.FC = () => {
  const currentPage = useAppStore(s => s.currentPage);
  const setPage = useAppStore(s => s.setPage);

  const tabs: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Home', icon: <Home size={22} /> },
    { id: 'interest-calc', label: 'Interest Calc', icon: <Calculator size={22} /> },
    { id: 'salary', label: 'Income', icon: <Wallet size={22} /> },
    { id: 'expenses', label: 'Expenses', icon: <ShoppingBag size={22} /> },
    { id: 'profile', label: 'Profile', icon: <User size={22} /> },
  ];

  const isActive = (id: Page) => currentPage === id;
  const subPages: Record<string, Page[]> = {
    salary: ['salary'],
    expenses: ['expenses', 'trips'],
  };
  const subPageGroups: Page[] = ['sip', 'insurance', 'savings', 'loans', 'handy', 'trips'];

  const getActive = (id: Page) => {
    if (isActive(id)) return true;
    if (subPages[id]?.includes(currentPage)) return true;
    if (id === 'dashboard' && subPageGroups.includes(currentPage)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-slate-200 dark:border-slate-700 safe-bottom">
      <div className="flex items-stretch justify-around max-w-md mx-auto px-1 pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setPage(tab.id)}
            className={`flex flex-col items-center gap-0.5 py-2 px-2 flex-1 transition-colors ${
              getActive(tab.id) ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <span className={`transition-transform ${isActive(tab.id) ? 'scale-110' : ''}`}>{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
