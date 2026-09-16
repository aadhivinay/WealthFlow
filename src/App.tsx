import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/store/AuthContext';
import { useAppStore, fmt, computeBalance } from '@/store/AppContext';
import { useThemeStore, applyTheme, initTheme } from '@/store/ThemeContext';

import Splash from '@/components/Splash';
import BottomNav from '@/components/BottomNav';
import Dashboard from '@/pages/Dashboard';
import SalaryPage from '@/pages/SalaryPage';
import SIPPage from '@/pages/SIPPage';
import InsurancePage from '@/pages/InsurancePage';
import SavingsPage from '@/pages/SavingsPage';
import ExpensesPage from '@/pages/ExpensesPage';
import LoansPage from '@/pages/LoansPage';
import HandyLoansPage from '@/pages/HandyLoansPage';
import TripsPage from '@/pages/TripsPage';
import ProfilePage from '@/pages/ProfilePage';
import InterestCalcPage from '@/pages/InterestCalcPage';
import type { Page } from '@/types';

const pageTitles: Record<Page, string> = {
  dashboard: 'WealthFlow',
  salary: 'Salary & Income',
  sip: 'SIP & Investments',
  insurance: 'Parental Insurance',
  savings: 'Savings Goals',
  expenses: 'Personal Expenses',
  loans: 'Loans & Liabilities',
  handy: 'Friends Handy Loans',
  trips: 'Trip Expenses',
  profile: 'Profile',
  'interest-calc': 'Interest Calculator',
};

function getDisplayName(user: { email?: string; user_metadata?: Record<string, unknown> } | null, prefsFullName: string): string {
  if (prefsFullName) return `Welcome, ${prefsFullName}`;
  if (!user) return 'Welcome, Guest';
  const meta = user.user_metadata ?? {};
  const name = (meta.full_name as string) || (meta.name as string) || (meta.display_name as string);
  if (name) return `Welcome, ${name}`;
  const email = user.email ?? '';
  const handle = email.split('@')[0];
  return handle ? `Welcome, ${handle}` : 'Welcome';
}

function useBackButton() {
  const currentPage = useAppStore(s => s.currentPage);
  const setPage = useAppStore(s => s.setPage);

  useEffect(() => {
    let listener: { remove: () => void } | null = null;

    const setupBackButton = async () => {
      try {
        const { App: CapacitorApp } = await import('@capacitor/app');
        listener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          const subPages: Page[] = ['sip', 'insurance', 'savings', 'loans', 'handy', 'trips', 'interest-calc', 'salary', 'expenses'];
          if (subPages.includes(currentPage)) {
            setPage('dashboard');
          } else if (currentPage === 'profile') {
            setPage('dashboard');
          } else if (canGoBack) {
            window.history.back();
          } else {
            CapacitorApp.exitApp();
          }
        });
      } catch {
        // Not on native platform — no-op
      }
    };

    setupBackButton();

    return () => {
      if (listener) listener.remove();
    };
  }, [currentPage, setPage]);
}

function AppShell() {
  const currentPage = useAppStore(s => s.currentPage);
  const setPage = useAppStore(s => s.setPage);
  const startingBalance = useAppStore(s => s.startingBalance);
  const incomeLogs = useAppStore(s => s.incomeLogs);
  const liabilities = useAppStore(s => s.liabilities);
  const expenses = useAppStore(s => s.expenses);
  const handyLoans = useAppStore(s => s.handyLoans);
  const prefs = useAppStore(s => s.prefs);
  const loadFromSupabase = useAppStore(s => s.loadFromSupabase);
  const clearUserData = useAppStore(s => s.clearUserData);
  const { user, signOut } = useAuth();
  const displayName = getDisplayName(user, prefs.fullName);
  const balance = computeBalance(startingBalance, incomeLogs, liabilities, expenses, handyLoans);

  useBackButton();

  useEffect(() => {
    if (user) loadFromSupabase(user.id);
  }, [user, loadFromSupabase]);

  const handleSignOut = async () => {
    await signOut();
    clearUserData();
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'salary': return <SalaryPage />;
      case 'sip': return <SIPPage />;
      case 'insurance': return <InsurancePage />;
      case 'savings': return <SavingsPage />;
      case 'expenses': return <ExpensesPage />;
      case 'loans': return <LoansPage />;
      case 'handy': return <HandyLoansPage />;
      case 'trips': return <TripsPage />;
      case 'profile': return <ProfilePage />;
      case 'interest-calc': return <InterestCalcPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-shell bg-slate-50 dark:bg-slate-950 flex flex-col max-w-md mx-auto relative">
      <header className="glass-header text-white px-4 py-3 safe-top flex items-center justify-between sticky top-0 z-30">
        <div className="min-w-0">
          <h1 className="font-bold text-base leading-tight">{pageTitles[currentPage]}</h1>
          <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{displayName}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Live Balance</p>
          <p className={`font-bold text-lg leading-tight ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(balance, prefs.currency)}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto app-scroll px-4 py-4 pb-32 page-enter">
        {renderPage()}
      </main>

      <BottomNav />
    </div>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const themeMode = useThemeStore(s => s.mode);

  useEffect(() => {
    initTheme();
  }, []);

  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  if (showSplash) {
    return (
      <AuthProvider>
        <Splash onComplete={() => setShowSplash(false)} />
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
