import React, { useState, useMemo } from 'react';
import { useAppStore, fmt, CURRENCY_SYMBOLS } from '@/store/AppContext';
import { useAuth } from '@/store/AuthContext';
import { useThemeStore } from '@/store/ThemeContext';
import Modal from '@/components/Modal';
import TransactionHistory from '@/components/TransactionHistory';
import { User as UserIcon, Mail, LogOut, Target, Globe, Check, Sun, Moon, Monitor, Bell, LogIn, UserPlus, X, Menu, Info, Settings, Wifi, Trash2, MailCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CurrencyCode, ThemeMode } from '@/types';

const STRONG_PW_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function pwChecks(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

const ProfilePage: React.FC = () => {
  const store = useAppStore();
  const { user, signIn, signUp, signOut } = useAuth();
  const themeMode = useThemeStore(s => s.mode);
  const setThemeMode = useThemeStore(s => s.setMode);
  const [editOpen, setEditOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const email = user?.email ?? '';
  const displayName = store.prefs.fullName || (user ? (user.user_metadata?.display_name as string || email.split('@')[0]) : 'Guest User');
  const initials = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const isMember = !!user;

  const totalIncome = store.incomeLogs.reduce((s, e) => s + e.amount, 0);
  const totalLiabilities = store.liabilities.reduce((s, l) => s + l.amount, 0);
  const totalExpenses = store.expenses.filter(e => e.category !== 'Budget').reduce((s, e) => s + e.amount, 0);

  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const upcomingPayments = useMemo(() => {
    const now = new Date();
    const twoDaysLater = new Date();
    twoDaysLater.setDate(now.getDate() + 2);
    const result: { title: string; amount: number; dueDay: number }[] = [];

    store.liabilities.forEach(l => {
      if (l.status === 'UNPAID' && l.due_day != null) {
        const dueThisMonth = new Date(now.getFullYear(), now.getMonth(), l.due_day);
        if (dueThisMonth >= now && dueThisMonth <= twoDaysLater) {
          result.push({ title: l.title, amount: l.amount, dueDay: l.due_day });
        }
      }
      if (l.status === 'UNPAID' && l.category === 'SIP' && l.sip_date != null) {
        const dueThisMonth = new Date(now.getFullYear(), now.getMonth(), l.sip_date);
        if (dueThisMonth >= now && dueThisMonth <= twoDaysLater) {
          result.push({ title: l.title, amount: l.amount, dueDay: l.sip_date });
        }
      }
    });

    store.handyLoans.forEach(h => {
      if (h.status === 'UNPAID' && h.due_date) {
        const due = new Date(h.due_date);
        if (due >= now && due <= twoDaysLater) {
          result.push({ title: h.person_name, amount: h.amount, dueDay: due.getDate() });
        }
      }
    });

    return result;
  }, [store.liabilities, store.handyLoans]);

  const currencies: CurrencyCode[] = ['INR', 'USD', 'EUR'];
  const themeOptions: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: 'Light', icon: <Sun size={16} /> },
    { id: 'dark', label: 'Dark', icon: <Moon size={16} /> },
    { id: 'system', label: 'System', icon: <Monitor size={16} /> },
  ];

  // Shared hover class for water-glow effect on drawer items
  const waterHover = 'hover:bg-sky-500/10 hover:border-sky-300 transition-all duration-300 rounded-xl';

  return (
    <div className="space-y-5 page-enter pb-24">
      {/* Profile header with hamburger */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white relative">
        <button
          onClick={() => setDrawerOpen(true)}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-slate-700/50 flex items-center justify-center active:scale-95 transition-transform"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-4 pr-12">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-900 font-bold text-xl">
            {initials || <UserIcon size={28} />}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg truncate">{displayName}</h2>
            <p className="text-sm text-slate-400 truncate flex items-center gap-1">
              <Mail size={12} /> {email || 'Not signed in (Guest)'}
            </p>
            <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${isMember ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
              {isMember ? <><Check size={10} /> Member</> : 'Guest Mode'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-slate-400 uppercase">Income</p>
            <p className="font-bold text-emerald-400 text-sm mt-1">{fmt(totalIncome, store.prefs.currency)}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-slate-400 uppercase">Obligations</p>
            <p className="font-bold text-rose-400 text-sm mt-1">{fmt(totalLiabilities, store.prefs.currency)}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-slate-400 uppercase">Expenses</p>
            <p className="font-bold text-orange-400 text-sm mt-1">{fmt(totalExpenses, store.prefs.currency)}</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setNotifOpen(true)}
          className="w-full flex items-center gap-3 p-4 text-left active:bg-slate-50 dark:active:bg-slate-800"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center relative">
            <Bell size={16} />
            {upcomingPayments.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                {upcomingPayments.length}
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-900 text-sm">Payment Reminders</p>
            <p className="text-xs text-slate-500">
              {upcomingPayments.length > 0 ? `${upcomingPayments.length} payment(s) due in 2 days` : 'No upcoming payments'}
            </p>
          </div>
        </button>
      </div>

      {/* Quick preferences */}
      <div className="glass-card rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-900 text-sm">Quick Preferences</h3>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-700">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Globe size={16} /></div>
              <p className="font-medium text-slate-900 text-sm">Currency</p>
            </div>
            <div className="flex gap-1">
              {currencies.map(c => (
                <button
                  key={c}
                  onClick={() => store.setPrefs({ currency: c })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${store.prefs.currency === c ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700'}`}
                >
                  {CURRENCY_SYMBOLS[c]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 flex items-center justify-center">
                {themeMode === 'light' ? <Sun size={16} /> : themeMode === 'dark' ? <Moon size={16} /> : <Monitor size={16} />}
              </div>
              <p className="font-medium text-slate-900 text-sm">Theme</p>
            </div>
            <div className="flex gap-1">
              {themeOptions.map(t => (
                <button
                  key={t.id}
                  onClick={() => setThemeMode(t.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${themeMode === t.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700'}`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile button */}
      <button
        onClick={() => setEditOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-3.5 rounded-2xl font-semibold text-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-transform"
      >
        <UserIcon size={16} /> Edit Profile
      </button>

      {/* Transaction History */}
      <TransactionHistory />

      {toast && (
        <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
          toast.type === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-700' :
          'bg-rose-50 border border-rose-200 text-rose-700'
        }`}>
          {toast.type === 'info' ? <MailCheck size={16} /> : <Check size={16} />} {toast.msg}
        </div>
      )}

      <div className="text-center text-xs text-slate-400 pb-4">
        WealthFlow Engine · Offline-capable · v3.2
      </div>

      {/* Hamburger Drawer — light ash, curved top, starts below header */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-16 right-0 bottom-0 w-80 max-w-[85vw] bg-slate-100 dark:bg-slate-800 z-50 safe-bottom overflow-y-auto app-scroll shadow-2xl rounded-t-3xl border-t border-slate-200 dark:border-slate-700"
            >
              <div className="sticky top-0 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-md px-5 py-4 border-b border-slate-200 dark:border-slate-700 rounded-t-3xl z-10">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Menu</h3>
                  <button onClick={() => setDrawerOpen(false)} className={`text-slate-400 p-1 ${waterHover}`}><X size={20} /></button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {/* User Identity Card */}
                <div className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 ${waterHover}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-900 font-bold text-lg">
                      {initials || <UserIcon size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{displayName}</p>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1"><Mail size={10} /> {email || 'Guest'}</p>
                      <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isMember ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                        {isMember ? <><Check size={8} /> Member</> : 'Guest'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Auth section */}
                {user ? (
                  <button
                    onClick={async () => { await signOut(); store.clearUserData(); setDrawerOpen(false); showToast('Signed out successfully'); }}
                    className={`w-full flex items-center gap-3 p-3 border border-transparent text-rose-600 ${waterHover} text-sm font-medium`}
                  >
                    <LogOut size={18} /> Sign Out
                  </button>
                ) : (
                  <div className="space-y-1">
                    <button
                      onClick={() => { setAuthMode('login'); setAuthOpen(true); setDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3 p-3 border border-transparent text-emerald-600 ${waterHover} text-sm font-medium`}
                    >
                      <LogIn size={18} /> Sign In
                    </button>
                    <button
                      onClick={() => { setAuthMode('signup'); setAuthOpen(true); setDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3 p-3 border border-transparent text-slate-700 dark:text-slate-200 ${waterHover} text-sm font-medium`}
                    >
                      <UserPlus size={18} /> Sign Up
                    </button>
                  </div>
                )}

                <div className="border-t border-slate-200 dark:border-slate-700" />

                {/* About */}
                <div className="p-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-sm mb-2">
                    <Info size={16} /> About WealthFlow
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    WealthFlow Engine is your personal finance execution engine. Track income, expenses, loans, savings, and investments — all offline-capable.
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-xs">
                    <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                      <Wifi size={12} /> Offline Ready
                    </span>
                    <span className="text-slate-400">v3.2</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700" />

                {/* App Preferences */}
                <div className="p-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-sm mb-3">
                    <Settings size={16} /> App Preferences
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">Default Currency</p>
                      <div className="flex gap-1">
                        {currencies.map(c => (
                          <button
                            key={c}
                            onClick={() => store.setPrefs({ currency: c })}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${store.prefs.currency === c ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'}`}
                          >
                            {CURRENCY_SYMBOLS[c]} {c}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">Theme Mode</p>
                      <div className="flex gap-1">
                        {themeOptions.map(t => (
                          <button
                            key={t.id}
                            onClick={() => setThemeMode(t.id)}
                            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-colors ${themeMode === t.id ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'}`}
                          >
                            {t.icon} {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700" />

                {/* Income Benchmark */}
                <button
                  onClick={() => { setEditOpen(true); setDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 border border-transparent text-slate-700 dark:text-slate-200 ${waterHover} text-sm font-medium`}
                >
                  <Target size={18} /> Set Income Benchmark
                </button>

                {/* Offline Data Reset */}
                <button
                  onClick={() => { setResetConfirmOpen(true); setDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 border border-transparent text-rose-500 ${waterHover} text-sm font-medium`}
                >
                  <Trash2 size={18} /> Reset Offline Data
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <EditProfileForm onClose={() => setEditOpen(false)} />
      </Modal>

      {/* Auth Modal */}
      <Modal open={authOpen} onClose={() => setAuthOpen(false)} title={authMode === 'login' ? 'Sign In' : 'Create Account'}>
        <AuthForm
          mode={authMode}
          onSwitch={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
          onSuccess={() => { setAuthOpen(false); showToast('Signed in successfully'); }}
          onEmailConfirm={() => { setAuthOpen(false); showToast('Verification email sent! Please check your inbox and confirm your email to sign in.', 'info'); }}
          signIn={signIn}
          signUp={signUp}
        />
      </Modal>

      {/* Notifications Modal */}
      <Modal open={notifOpen} onClose={() => setNotifOpen(false)} title="Upcoming Payments">
        <div className="space-y-3">
          {upcomingPayments.length > 0 ? (
            upcomingPayments.map((p, i) => (
              <div key={i} className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center"><Bell size={16} /></div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{p.title}</p>
                  <p className="text-xs text-slate-500">Due on the {p.dueDay}{p.dueDay === 1 ? 'st' : p.dueDay === 2 ? 'nd' : p.dueDay === 3 ? 'rd' : 'th'} of this month</p>
                </div>
                <span className="font-bold text-rose-500 text-sm">{fmt(p.amount, store.prefs.currency)}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              <Bell size={24} className="mx-auto mb-2 opacity-40" />
              No payments due in the next 2 days
            </div>
          )}
        </div>
      </Modal>

      {/* Reset Data Confirmation */}
      <Modal open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} title="Reset All Offline Data?">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">This will permanently delete all your offline data including income logs, expenses, liabilities, handy loans, and documents. This action cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setResetConfirmOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm">Cancel</button>
            <button
              onClick={() => { store.clearUserData(); setResetConfirmOpen(false); showToast('All offline data has been reset'); }}
              className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-semibold text-sm"
            >
              Reset Everything
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/* ---------- Edit Profile Form ---------- */
const EditProfileForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const prefs = useAppStore(s => s.prefs);
  const setPrefs = useAppStore(s => s.setPrefs);
  const [name, setName] = useState(prefs.fullName);
  const [benchmark, setBenchmark] = useState(String(prefs.monthlyIncomeBenchmark));

  const save = () => {
    setPrefs({ fullName: name, monthlyIncomeBenchmark: Number(benchmark) || 0 });
    onClose();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
      </div>
      <div>
        <label className="text-sm font-medium text-sslate-700 dark:text-slate-300">Monthly Income Benchmark</label>
        <input type="number" value={benchmark} onFocus={e => e.target.select()} onChange={e => setBenchmark(e.target.value)} placeholder="85000" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
      </div>
      <button onClick={save} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 active:scale-95 transition-transform">Save Changes</button>
    </div>
  );
};

/* ---------- Auth Form ---------- */
interface AuthFormProps {
  mode: 'login' | 'signup';
  onSwitch: () => void;
  onSuccess: () => void;
  onEmailConfirm: () => void;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, rememberMe: boolean) => Promise<{ error: string | null; needsConfirmation: boolean }>;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSwitch, onSuccess, onEmailConfirm, signIn, signUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const checks = pwChecks(password);
  const showChecks = mode === 'signup' && password.length > 0;
  const isStrong = STRONG_PW_RE.test(password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    if (mode === 'signup' && !isStrong) {
      setError('Password must be at least 8 characters with uppercase, lowercase, a number, and a special character.');
      return;
    }
    setBusy(true);
    if (mode === 'login') {
      const { error } = await signIn(email, password, rememberMe);
      setBusy(false);
      if (error) setError(error);
      else onSuccess();
    } else {
      const { error, needsConfirmation } = await signUp(email, password, rememberMe);
      setBusy(false);
      if (error) setError(error);
      else if (needsConfirmation) onEmailConfirm();
      else onSuccess();
    }
  };

  const CheckItem: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
    <div className={`flex items-center gap-1.5 text-xs ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
      {ok ? <Check size={12} /> : <X size={12} />} {label}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
        <div className="relative mt-1">
          <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoCapitalize="none" className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
        <div className="relative mt-1">
          <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">{showPw ? 'Hide' : 'Show'}</button>
        </div>
      </div>
      {showChecks && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 grid grid-cols-2 gap-1.5">
          <CheckItem ok={checks.length} label="8+ characters" />
          <CheckItem ok={checks.upper} label="Uppercase" />
          <CheckItem ok={checks.lower} label="Lowercase" />
          <CheckItem ok={checks.number} label="Number" />
          <CheckItem ok={checks.special} label="Special char" />
        </div>
      )}
      {/* Remember Me checkbox */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <button
          type="button"
          onClick={() => setRememberMe(!rememberMe)}
          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${rememberMe ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600'}`}
        >
          {rememberMe && <Check size={14} />}
        </button>
        <span className="text-sm text-slate-700 dark:text-slate-300">Remember Me</span>
        <span className="text-xs text-slate-400 ml-auto">Keep me signed in</span>
      </label>
      {error && <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-600">{error}</div>}
      <button type="submit" disabled={busy} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 active:scale-95 transition-transform">
        {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
      </button>
      <div className="text-center">
        <button type="button" onClick={onSwitch} className="text-sm text-slate-500 hover:text-emerald-600">
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </form>
  );
};

export default ProfilePage;
